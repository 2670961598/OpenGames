#!/bin/bash
# ============================================
# Web游戏平台安全基础设施部署脚本
# ============================================

set -euo pipefail

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.security.yml"
ENV_FILE="$SCRIPT_DIR/.env"
BACKUP_DIR="$SCRIPT_DIR/backups/$(date +%Y%m%d_%H%M%S)"

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."
    
    local deps=("docker" "docker-compose" "openssl")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            log_error "缺少依赖: $dep"
            exit 1
        fi
    done
    
    # 检查Docker版本
    DOCKER_VERSION=$(docker --version | grep -oE '[0-9]+\.[0-9]+' | head -1)
    if [[ $(echo "$DOCKER_VERSION >= 20.10" | bc -l) -eq 0 ]]; then
        log_warning "Docker版本 $DOCKER_VERSION 可能过低，建议 >= 20.10"
    fi
    
    log_success "依赖检查通过"
}

# 检查环境文件
check_env_file() {
    log_info "检查环境配置文件..."
    
    if [[ ! -f "$ENV_FILE" ]]; then
        log_warning "环境文件不存在，从模板创建..."
        cp "$SCRIPT_DIR/.env.example" "$ENV_FILE"
        log_error "请编辑 $ENV_FILE 文件并填入实际值后再运行"
        exit 1
    fi
    
    # 检查关键配置
    source "$ENV_FILE"
    
    local required_vars=(
        "DATABASE_URL"
        "REDIS_PASSWORD"
        "JWT_PRIVATE_KEY"
        "JWT_PUBLIC_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log_error "缺少必要配置: $var"
            exit 1
        fi
    done
    
    log_success "环境配置检查通过"
}

# 生成密钥
generate_keys() {
    log_info "生成安全密钥..."
    
    local keys_dir="$SCRIPT_DIR/keys"
    mkdir -p "$keys_dir"
    
    # 生成JWT ES256密钥对
    if [[ ! -f "$keys_dir/jwt-private.pem" ]]; then
        log_info "生成JWT ES256密钥对..."
        openssl ecparam -genkey -name prime256v1 -noout -out "$keys_dir/jwt-private.pem"
        openssl ec -in "$keys_dir/jwt-private.pem" -pubout -out "$keys_dir/jwt-public.pem"
        chmod 600 "$keys_dir/jwt-private.pem"
        log_success "JWT密钥对已生成"
    fi
    
    # 生成API Key加密密钥
    if [[ ! -f "$keys_dir/api-key-encryption.key" ]]; then
        log_info "生成API Key加密密钥..."
        openssl rand -base64 32 > "$keys_dir/api-key-encryption.key"
        chmod 600 "$keys_dir/api-key-encryption.key"
        log_success "API Key加密密钥已生成"
    fi
    
    # 生成API Key HMAC密钥
    if [[ ! -f "$keys_dir/api-key-hmac.key" ]]; then
        log_info "生成API Key HMAC密钥..."
        openssl rand -base64 32 > "$keys_dir/api-key-hmac.key"
        chmod 600 "$keys_dir/api-key-hmac.key"
        log_success "API Key HMAC密钥已生成"
    fi
    
    log_success "密钥生成完成"
}

# 创建目录结构
create_directories() {
    log_info "创建目录结构..."
    
    local dirs=(
        "logs/kong"
        "logs/falco"
        "logs/elasticsearch"
        "data/redis"
        "data/vault"
        "data/elasticsearch"
        "data/prometheus"
        "data/grafana"
        "data/alertmanager"
        "firecracker/images"
        "firecracker/sockets"
        "backups"
    )
    
    for dir in "${dirs[@]}"; do
        mkdir -p "$SCRIPT_DIR/$dir"
    done
    
    # 设置权限
    chmod 700 "$SCRIPT_DIR/data/vault"
    chmod 755 "$SCRIPT_DIR/firecracker/sockets"
    
    log_success "目录结构创建完成"
}

# 初始化Vault
init_vault() {
    log_info "初始化Vault..."
    
    # 启动Vault
    docker-compose -f "$COMPOSE_FILE" up -d vault
    
    # 等待Vault启动
    sleep 5
    
    # 检查Vault状态
    local vault_status
    vault_status=$(docker-compose -f "$COMPOSE_FILE" exec -T vault vault status 2>&1 || true)
    
    if echo "$vault_status" | grep -q "Sealed.*true"; then
        log_info "Vault需要解封，正在初始化..."
        
        # 初始化Vault
        local init_output
        init_output=$(docker-compose -f "$COMPOSE_FILE" exec -T vault vault operator init -key-shares=5 -key-threshold=3 -format=json)
        
        # 保存解封密钥和根令牌
        echo "$init_output" | jq -r '.unseal_keys_b64[]' > "$SCRIPT_DIR/keys/vault-unseal-keys.txt"
        echo "$init_output" | jq -r '.root_token' > "$SCRIPT_DIR/keys/vault-root-token.txt"
        
        chmod 600 "$SCRIPT_DIR/keys/vault-unseal-keys.txt"
        chmod 600 "$SCRIPT_DIR/keys/vault-root-token.txt"
        
        # 使用密钥解封
        local unseal_keys
        mapfile -t unseal_keys < "$SCRIPT_DIR/keys/vault-unseal-keys.txt"
        
        for i in 0 1 2; do
            docker-compose -f "$COMPOSE_FILE" exec -T vault vault operator unseal "${unseal_keys[$i]}"
        done
        
        log_success "Vault已初始化和解封"
        log_warning "请妥善保管 keys/vault-unseal-keys.txt 和 keys/vault-root-token.txt"
    else
        log_success "Vault已处于活动状态"
    fi
}

# 配置Kong
setup_kong() {
    log_info "配置Kong API Gateway..."
    
    # 等待Kong启动
    local retries=30
    while [[ $retries -gt 0 ]]; do
        if curl -s http://localhost:8001/status > /dev/null 2>&1; then
            log_success "Kong已就绪"
            break
        fi
        sleep 2
        ((retries--))
    done
    
    if [[ $retries -eq 0 ]]; then
        log_error "Kong启动超时"
        exit 1
    fi
    
    # 加载配置
    # docker-compose -f "$COMPOSE_FILE" exec -T kong kong config db_import /kong/declarative/kong.yml
    
    log_success "Kong配置完成"
}

# 启动服务
start_services() {
    log_info "启动安全服务..."
    
    # 启动核心服务
    docker-compose -f "$COMPOSE_FILE" up -d \
        redis \
        elasticsearch \
        kibana \
        prometheus \
        grafana \
        alertmanager
    
    # 等待依赖服务就绪
    log_info "等待依赖服务就绪..."
    sleep 10
    
    # 启动应用服务
    docker-compose -f "$COMPOSE_FILE" up -d \
        api-gateway \
        firecracker-manager \
        content-moderation \
        anti-cheat \
        falco
    
    log_success "所有服务已启动"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    local services=(
        "api-gateway:8000"
        "redis:6379"
        "elasticsearch:9200"
        "kibana:5601"
        "grafana:3000"
        "prometheus:9090"
        "vault:8200"
    )
    
    local failed=0
    for service in "${services[@]}"; do
        local name="${service%%:*}"
        local port="${service##*:}"
        
        if nc -z localhost "$port" 2>/dev/null; then
            log_success "$name 健康"
        else
            log_error "$name 未响应"
            ((failed++))
        fi
    done
    
    if [[ $failed -gt 0 ]]; then
        log_warning "$failed 个服务未通过健康检查"
    else
        log_success "所有服务健康检查通过"
    fi
}

# 备份配置
backup_config() {
    log_info "备份配置..."
    
    mkdir -p "$BACKUP_DIR"
    
    # 备份环境文件
    cp "$ENV_FILE" "$BACKUP_DIR/"
    
    # 备份密钥
    if [[ -d "$SCRIPT_DIR/keys" ]]; then
        cp -r "$SCRIPT_DIR/keys" "$BACKUP_DIR/"
    fi
    
    # 备份配置
    cp -r "$SCRIPT_DIR/kong-config" "$BACKUP_DIR/"
    cp -r "$SCRIPT_DIR/falco-rules" "$BACKUP_DIR/"
    
    log_success "配置已备份到 $BACKUP_DIR"
}

# 显示状态
show_status() {
    log_info "服务状态:"
    docker-compose -f "$COMPOSE_FILE" ps
    
    echo ""
    log_info "访问地址:"
    echo "  API Gateway:     http://localhost:8000"
    echo "  Kong Admin:      http://localhost:8001"
    echo "  Kibana:          http://localhost:5601"
    echo "  Grafana:         http://localhost:3000"
    echo "  Prometheus:      http://localhost:9090"
    echo "  Vault:           http://localhost:8200"
    echo "  Alertmanager:    http://localhost:9093"
}

# 主函数
main() {
    log_info "开始部署Web游戏平台安全基础设施..."
    
    case "${1:-deploy}" in
        deploy)
            check_dependencies
            check_env_file
            generate_keys
            create_directories
            backup_config
            init_vault
            start_services
            setup_kong
            sleep 5
            health_check
            show_status
            log_success "部署完成!"
            ;;
        start)
            docker-compose -f "$COMPOSE_FILE" up -d
            show_status
            ;;
        stop)
            docker-compose -f "$COMPOSE_FILE" down
            log_info "服务已停止"
            ;;
        restart)
            docker-compose -f "$COMPOSE_FILE" restart
            show_status
            ;;
        status)
            show_status
            ;;
        logs)
            docker-compose -f "$COMPOSE_FILE" logs -f
            ;;
        backup)
            backup_config
            ;;
        update)
            docker-compose -f "$COMPOSE_FILE" pull
            docker-compose -f "$COMPOSE_FILE" up -d
            log_success "服务已更新"
            ;;
        clean)
            log_warning "这将删除所有数据!"
            read -p "确定要继续吗? (yes/no): " confirm
            if [[ "$confirm" == "yes" ]]; then
                docker-compose -f "$COMPOSE_FILE" down -v
                rm -rf "$SCRIPT_DIR/data"
                log_info "数据已清理"
            fi
            ;;
        *)
            echo "用法: $0 {deploy|start|stop|restart|status|logs|backup|update|clean}"
            exit 1
            ;;
    esac
}

main "$@"
