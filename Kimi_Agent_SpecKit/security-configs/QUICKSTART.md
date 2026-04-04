# Web游戏平台安全基础设施 - 快速启动指南

## 目录
1. [系统要求](#系统要求)
2. [快速部署](#快速部署)
3. [配置说明](#配置说明)
4. [验证部署](#验证部署)
5. [常见问题](#常见问题)

---

## 系统要求

### 最低配置
- **CPU**: 4核
- **内存**: 16GB RAM
- **磁盘**: 100GB SSD
- **网络**: 100Mbps
- **OS**: Ubuntu 20.04 LTS / CentOS 8 / Debian 11

### 推荐配置
- **CPU**: 8核+
- **内存**: 32GB RAM
- **磁盘**: 500GB NVMe SSD
- **网络**: 1Gbps
- **虚拟化**: KVM支持（用于Firecracker）

### 依赖安装
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y docker.io docker-compose openssl jq bc netcat

# CentOS/RHEL
sudo yum install -y docker docker-compose openssl jq bc nc

# 启动Docker
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
```

---

## 快速部署

### 1. 克隆配置
```bash
git clone <repository-url>
cd security-configs
```

### 2. 配置环境变量
```bash
# 复制环境模板
cp .env.example .env

# 编辑配置文件
nano .env
```

### 3. 生成密钥
```bash
# 自动生成所有密钥
./deploy.sh

# 或手动生成
mkdir -p keys

# JWT ES256密钥
openssl ecparam -genkey -name prime256v1 -noout -out keys/jwt-private.pem
openssl ec -in keys/jwt-private.pem -pubout -out keys/jwt-public.pem

# API Key密钥
openssl rand -base64 32 > keys/api-key-encryption.key
openssl rand -base64 32 > keys/api-key-hmac.key

chmod 600 keys/*
```

### 4. 部署服务
```bash
# 完整部署
./deploy.sh deploy

# 仅启动服务
./deploy.sh start
```

---

## 配置说明

### 核心配置项

| 配置项 | 说明 | 示例 |
|-------|------|------|
| `DATABASE_URL` | 数据库连接字符串 | `postgresql://user:pass@host:5432/db` |
| `REDIS_PASSWORD` | Redis密码 | `SecureRedisPass123!` |
| `JWT_PRIVATE_KEY` | JWT签名私钥 | PEM格式 |
| `JWT_PUBLIC_KEY` | JWT验证公钥 | PEM格式 |
| `ELASTIC_PASSWORD` | Elasticsearch密码 | `ElasticPass123!` |

### Kong网关配置

```yaml
# kong-config/kong.yml
services:
  - name: game-service
    url: http://game-service:8080
    plugins:
      - name: rate-limiting
        config:
          minute: 60
      - name: jwt
        config:
          claims_to_verify:
            - exp
```

### 限流配置

| 服务 | 限流策略 | 值 |
|-----|---------|-----|
| 游戏服务 | 每分钟 | 60请求 |
| 分数提交 | 每分钟 | 10请求 |
| 登录 | 每小时 | 20请求 |
| 开发者API | 每小时 | 1000请求 |

---

## 验证部署

### 1. 检查服务状态
```bash
./deploy.sh status
```

### 2. 测试API网关
```bash
# 健康检查
curl http://localhost:8000/health

# 测试认证
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### 3. 验证监控
```bash
# 访问Kibana
curl http://localhost:5601

# 访问Grafana
curl http://localhost:3000

# 访问Prometheus
curl http://localhost:9090
```

### 4. 检查日志
```bash
# 查看所有日志
./deploy.sh logs

# 查看特定服务日志
docker-compose logs -f api-gateway
docker-compose logs -f falco
```

---

## 安全配置检查清单

### 部署前检查

- [ ] 所有密码已更改为强密码
- [ ] JWT密钥已生成并妥善保管
- [ ] API Key密钥已生成
- [ ] 环境变量文件权限设置为600
- [ ] 密钥文件权限设置为600
- [ ] 生产环境关闭DEBUG模式
- [ ] 配置HTTPS证书

### 部署后检查

- [ ] 所有服务正常运行
- [ ] 防火墙规则已配置
- [ ] 日志收集正常工作
- [ ] 告警通知已配置
- [ ] 备份策略已配置
- [ ] 安全扫描无高危漏洞

---

## 常用命令

### 服务管理
```bash
# 启动服务
./deploy.sh start

# 停止服务
./deploy.sh stop

# 重启服务
./deploy.sh restart

# 查看状态
./deploy.sh status

# 查看日志
./deploy.sh logs
```

### 更新服务
```bash
# 更新镜像
./deploy.sh update

# 重新部署
./deploy.sh deploy
```

### 备份和恢复
```bash
# 备份配置
./deploy.sh backup

# 手动备份数据
docker-compose exec elasticsearch curl -X PUT localhost:9200/_snapshot/backup
```

---

## 常见问题

### Q1: Firecracker无法启动
**问题**: Firecracker需要KVM支持
```bash
# 检查KVM支持
ls -la /dev/kvm

# 如果没有，启用KVM
sudo modprobe kvm
sudo modprobe kvm_intel  # Intel
sudo modprobe kvm_amd    # AMD

# 添加用户到kvm组
sudo usermod -aG kvm $USER
```

### Q2: Vault无法解封
**问题**: Vault需要手动解封
```bash
# 解封Vault
docker-compose exec vault vault operator unseal <unseal-key-1>
docker-compose exec vault vault operator unseal <unseal-key-2>
docker-compose exec vault vault operator unseal <unseal-key-3>
```

### Q3: Elasticsearch内存不足
**问题**: 默认配置需要2GB内存
```bash
# 修改docker-compose.yml
# 减少ES_JAVA_OPTS值
- "ES_JAVA_OPTS=-Xms1g -Xmx1g"
```

### Q4: 端口冲突
**问题**: 默认端口被占用
```bash
# 修改docker-compose.yml中的端口映射
ports:
  - "8080:8000"  # 使用8080代替8000
```

### Q5: 权限错误
**问题**: 文件权限问题
```bash
# 修复权限
sudo chown -R $USER:$USER .
chmod 600 .env
chmod 600 keys/*
chmod +x deploy.sh
```

---

## 监控告警配置

### 配置Slack告警
```bash
# 编辑.env文件
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXX/YYY/ZZZ
```

### 配置PagerDuty
```bash
# 编辑.env文件
PAGERDUTY_SERVICE_KEY=your-service-key
```

### 自定义告警规则
```yaml
# alertmanager-config/alertmanager.yml
groups:
  - name: security-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
```

---

## 性能优化

### Redis优化
```bash
# 增加连接数限制
docker-compose exec redis redis-cli CONFIG SET maxclients 10000
```

### Kong优化
```bash
# 增加工作进程数
docker-compose exec kong kong reload --nginx-conf /custom/nginx.conf
```

### Elasticsearch优化
```bash
# 调整分片数量
curl -X PUT localhost:9200/_template/default -H 'Content-Type: application/json' -d '{
  "index_patterns": ["*"],
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0
  }
}'
```

---

## 安全加固

### 1. 启用TLS
```bash
# 生成自签名证书（开发环境）
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout keys/tls.key -out keys/tls.crt

# 或使用Let's Encrypt（生产环境）
certbot certonly --standalone -d yourdomain.com
```

### 2. 配置防火墙
```bash
# 仅开放必要端口
sudo ufw default deny incoming
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 8000/tcp  # API Gateway
sudo ufw enable
```

### 3. 启用SELinux/AppArmor
```bash
# Ubuntu - AppArmor
sudo aa-enforce /etc/apparmor.d/docker

# CentOS - SELinux
sudo setenforce 1
```

---

## 联系支持

如有问题，请联系：
- 安全团队: security@yourdomain.com
- 技术支持: support@yourdomain.com
- 紧急事件: incident@yourdomain.com

---

*最后更新: 2024年*
*版本: 1.0*
