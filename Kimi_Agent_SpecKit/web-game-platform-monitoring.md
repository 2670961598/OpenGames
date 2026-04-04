# Web游戏平台 - 监控与日志系统设计

## 1. 监控架构总览

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         统一监控与可观测性架构                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        数据采集层                                    │   │
│   │                                                                     │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │   │
│   │  │  Metrics    │  │    Logs     │  │   Traces    │  │   Events   │ │   │
│   │  │  (Prometheus)│  │  (Loki)     │  │  (Jaeger)   │  │  (Webhook) │ │   │
│   │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘ │   │
│   │         │                │                │               │        │   │
│   │         └────────────────┴────────────────┴───────────────┘        │   │
│   │                              │                                      │   │
│   │                              ▼                                      │   │
│   │  ┌─────────────────────────────────────────────────────────────┐   │   │
│   │  │                    OpenTelemetry Collector                    │   │   │
│   │  │         (统一采集、处理、转发)                                 │   │   │
│   │  └─────────────────────────────┬───────────────────────────────┘   │   │
│   └────────────────────────────────┼────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        存储与分析层                                  │   │
│   │                                                                     │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │   │
│   │  │  Prometheus │  │    Loki     │  │   Tempo     │  │ClickHouse │ │   │
│   │  │  (TSDB)     │  │  (Log Store)│  │  (Trace DB) │  │ (Events)  │ │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        可视化与告警层                                │   │
│   │                                                                     │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │   │
│   │  │   Grafana   │  │   AlertManager│  │  PagerDuty  │  │  Slack    │ │   │
│   │  │  (Dashboard)│  │  (Alerting) │  │  (Incident) │  │  (Notify) │ │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. 游戏性能监控指标

### 2.1 核心游戏指标

```yaml
# Prometheus游戏指标定义
game_metrics:
  # 玩家相关指标
  - name: game_active_players
    type: Gauge
    labels: [game_id, server_id, region]
    description: "当前活跃玩家数"
    
  - name: game_player_session_duration_seconds
    type: Histogram
    labels: [game_id]
    buckets: [60, 300, 600, 1800, 3600, 7200]
    description: "玩家会话时长分布"
    
  - name: game_player_actions_total
    type: Counter
    labels: [game_id, action_type]
    description: "玩家操作总数"
    
  # 性能指标
  - name: game_frame_time_seconds
    type: Histogram
    labels: [game_id, client_type]
    buckets: [0.016, 0.033, 0.05, 0.1, 0.2]  # 60fps, 30fps, 20fps, 10fps, 5fps
    description: "帧渲染时间"
    
  - name: game_latency_seconds
    type: Histogram
    labels: [game_id, region, connection_type]
    buckets: [0.01, 0.02, 0.05, 0.1, 0.2, 0.5]
    description: "网络延迟分布"
    
  - name: game_server_tick_rate
    type: Gauge
    labels: [game_id, server_id]
    description: "服务器tick率"
    
  # 错误指标
  - name: game_errors_total
    type: Counter
    labels: [game_id, error_type, severity]
    description: "游戏错误总数"
    
  - name: game_crashes_total
    type: Counter
    labels: [game_id, client_type, crash_reason]
    description: "游戏崩溃总数"
    
  # 资源指标
  - name: game_container_cpu_usage
    type: Gauge
    labels: [game_id, container_id]
    description: "容器CPU使用率"
    
  - name: game_container_memory_bytes
    type: Gauge
    labels: [game_id, container_id]
    description: "容器内存使用"
    
  - name: game_container_network_bytes
    type: Counter
    labels: [game_id, container_id, direction]
    description: "容器网络流量"
```

### 2.2 自定义游戏指标收集器

```go
// game_metrics.go - 游戏指标收集器
package metrics

import (
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"
)

var (
    // 活跃玩家数
    ActivePlayers = promauto.NewGaugeVec(prometheus.GaugeOpts{
        Name: "game_active_players",
        Help: "Number of active players",
    }, []string{"game_id", "server_id", "region"})
    
    // 帧时间
    FrameTime = promauto.NewHistogramVec(prometheus.HistogramOpts{
        Name:    "game_frame_time_seconds",
        Help:    "Frame render time",
        Buckets: []float64{0.016, 0.033, 0.05, 0.1, 0.2},
    }, []string{"game_id", "client_type"})
    
    // 网络延迟
    NetworkLatency = promauto.NewHistogramVec(prometheus.HistogramOpts{
        Name:    "game_latency_seconds",
        Help:    "Network latency",
        Buckets: []float64{0.01, 0.02, 0.05, 0.1, 0.2, 0.5},
    }, []string{"game_id", "region", "connection_type"})
    
    // 错误计数
    ErrorCounter = promauto.NewCounterVec(prometheus.CounterOpts{
        Name: "game_errors_total",
        Help: "Total game errors",
    }, []string{"game_id", "error_type", "severity"})
    
    // 玩家操作
    PlayerActions = promauto.NewCounterVec(prometheus.CounterOpts{
        Name: "game_player_actions_total",
        Help: "Total player actions",
    }, []string{"game_id", "action_type"})
)

// GameMetricsCollector 游戏指标收集器
type GameMetricsCollector struct {
    gameID string
}

func NewGameMetricsCollector(gameID string) *GameMetricsCollector {
    return &GameMetricsCollector{gameID: gameID}
}

// RecordFrameTime 记录帧时间
func (g *GameMetricsCollector) RecordFrameTime(clientType string, duration float64) {
    FrameTime.WithLabelValues(g.gameID, clientType).Observe(duration)
}

// RecordLatency 记录网络延迟
func (g *GameMetricsCollector) RecordLatency(region, connType string, latency float64) {
    NetworkLatency.WithLabelValues(g.gameID, region, connType).Observe(latency)
}

// RecordError 记录错误
func (g *GameMetricsCollector) RecordError(errorType, severity string) {
    ErrorCounter.WithLabelValues(g.gameID, errorType, severity).Inc()
}

// RecordPlayerAction 记录玩家操作
func (g *GameMetricsCollector) RecordPlayerAction(actionType string) {
    PlayerActions.WithLabelValues(g.gameID, actionType).Inc()
}

// UpdateActivePlayers 更新活跃玩家数
func (g *GameMetricsCollector) UpdateActivePlayers(serverID, region string, count float64) {
    ActivePlayers.WithLabelValues(g.gameID, serverID, region).Set(count)
}
```

## 3. 异常检测系统

### 3.1 基于规则的异常检测

```yaml
# Prometheus告警规则
groups:
  - name: game_alerts
    rules:
      # 高延迟告警
      - alert: GameHighLatency
        expr: |
          histogram_quantile(0.95, 
            sum(rate(game_latency_seconds_bucket[5m])) by (game_id, le)
          ) > 0.1
        for: 2m
        labels:
          severity: warning
          team: game-ops
        annotations:
          summary: "Game {{ $labels.game_id }} has high latency"
          description: "95th percentile latency is {{ $value }}s"
          
      # 帧率下降告警
      - alert: GameLowFrameRate
        expr: |
          histogram_quantile(0.5, 
            sum(rate(game_frame_time_seconds_bucket[5m])) by (game_id, le)
          ) > 0.05
        for: 1m
        labels:
          severity: critical
          team: game-ops
        annotations:
          summary: "Game {{ $labels.game_id }} frame rate degraded"
          description: "Median frame time is {{ $value }}s (below 20fps)"
          
      # 玩家大量掉线
      - alert: GameMassDisconnect
        expr: |
          (
            sum(rate(game_player_disconnects_total[5m])) by (game_id)
            /
            sum(rate(game_player_sessions_total[5m])) by (game_id)
          ) > 0.1
        for: 30s
        labels:
          severity: critical
          team: game-ops
        annotations:
          summary: "Mass player disconnect in {{ $labels.game_id }}"
          description: "Disconnect rate is {{ $value | humanizePercentage }}"
          
      # 错误率激增
      - alert: GameErrorSpike
        expr: |
          sum(rate(game_errors_total[5m])) by (game_id) > 10
        for: 1m
        labels:
          severity: warning
          team: game-dev
        annotations:
          summary: "Error spike in {{ $labels.game_id }}"
          description: "Error rate is {{ $value }}/s"
          
      # 容器资源告警
      - alert: GameContainerHighCPU
        expr: game_container_cpu_usage > 80
        for: 5m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: "Container high CPU usage"
          description: "Container CPU usage is {{ $value }}%"
          
      - alert: GameContainerOOMRisk
        expr: |
          game_container_memory_bytes / game_container_memory_limit_bytes > 0.9
        for: 1m
        labels:
          severity: critical
          team: platform
        annotations:
          summary: "Container near OOM"
          description: "Memory usage is {{ $value | humanizePercentage }}"
```

### 3.2 基于ML的异常检测

```python
# anomaly_detector.py - 基于机器学习的异常检测
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import pandas as pd
from prometheus_api_client import PrometheusConnect

class GameAnomalyDetector:
    def __init__(self, prometheus_url: str):
        self.prom = PrometheusConnect(url=prometheus_url)
        self.model = IsolationForest(contamination=0.05, random_state=42)
        self.scaler = StandardScaler()
        self.is_fitted = False
        
    def fetch_metrics(self, game_id: str, duration: str = "1h") -> pd.DataFrame:
        """从Prometheus获取游戏指标"""
        
        queries = {
            'latency_p95': f'''
                histogram_quantile(0.95, 
                    sum(rate(game_latency_seconds_bucket{{game_id="{game_id}"}}[{duration}])) by (le)
                )
            ''',
            'latency_p50': f'''
                histogram_quantile(0.50, 
                    sum(rate(game_latency_seconds_bucket{{game_id="{game_id}"}}[{duration}])) by (le)
                )
            ''',
            'frame_time': f'''
                histogram_quantile(0.95, 
                    sum(rate(game_frame_time_seconds_bucket{{game_id="{game_id}"}}[{duration}])) by (le)
                )
            ''',
            'error_rate': f'''
                sum(rate(game_errors_total{{game_id="{game_id}"}}[{duration}]))
            ''',
            'active_players': f'''
                game_active_players{{game_id="{game_id}"}}
            ''',
            'cpu_usage': f'''
                game_container_cpu_usage{{game_id="{game_id}"}}
            ''',
            'memory_usage': f'''
                game_container_memory_bytes{{game_id="{game_id}"}}
            '''
        }
        
        data = {}
        for metric_name, query in queries.items():
            result = self.prom.custom_query(query)
            if result:
                data[metric_name] = float(result[0]['value'][1])
            else:
                data[metric_name] = 0
                
        return pd.DataFrame([data])
    
    def train(self, game_id: str, historical_duration: str = "7d"):
        """训练异常检测模型"""
        
        # 获取历史数据
        query = f'''
            game_latency_seconds_bucket{{game_id="{game_id}"}}[{historical_duration}]
        '''
        
        # 这里简化处理，实际应该获取多个指标的时间序列
        # 并构建特征向量
        
        # 模拟训练数据
        np.random.seed(42)
        n_samples = 1000
        
        # 正常数据
        normal_data = np.random.multivariate_normal(
            mean=[0.02, 0.03, 5.0, 0.5, 100, 30, 200],
            cov=np.eye(7) * 0.1,
            size=n_samples
        )
        
        # 添加一些异常
        anomaly_indices = np.random.choice(n_samples, size=50, replace=False)
        normal_data[anomaly_indices] *= np.random.uniform(2, 5, size=(50, 7))
        
        # 标准化并训练
        X = self.scaler.fit_transform(normal_data)
        self.model.fit(X)
        self.is_fitted = True
        
    def detect(self, game_id: str) -> dict:
        """检测当前是否异常"""
        
        if not self.is_fitted:
            self.train(game_id)
            
        # 获取当前指标
        current_metrics = self.fetch_metrics(game_id, "5m")
        
        # 标准化
        X = self.scaler.transform(current_metrics.values)
        
        # 预测
        prediction = self.model.predict(X)[0]
        anomaly_score = self.model.score_samples(X)[0]
        
        is_anomaly = prediction == -1
        
        return {
            'game_id': game_id,
            'is_anomaly': is_anomaly,
            'anomaly_score': float(anomaly_score),
            'metrics': current_metrics.to_dict('records')[0],
            'timestamp': pd.Timestamp.now().isoformat()
        }
    
    def get_anomaly_explanation(self, detection_result: dict) -> list:
        """解释异常原因"""
        
        explanations = []
        metrics = detection_result['metrics']
        
        # 延迟检查
        if metrics.get('latency_p95', 0) > 0.1:
            explanations.append({
                'metric': 'latency_p95',
                'value': metrics['latency_p95'],
                'threshold': 0.1,
                'severity': 'high',
                'suggestion': 'Check network connectivity and server load'
            })
            
        # 帧率检查
        if metrics.get('frame_time', 0) > 0.05:
            explanations.append({
                'metric': 'frame_time',
                'value': metrics['frame_time'],
                'threshold': 0.05,
                'severity': 'high',
                'suggestion': 'Client performance issue or server overload'
            })
            
        # 错误率检查
        if metrics.get('error_rate', 0) > 10:
            explanations.append({
                'metric': 'error_rate',
                'value': metrics['error_rate'],
                'threshold': 10,
                'severity': 'medium',
                'suggestion': 'Review recent code changes and error logs'
            })
            
        return explanations

# 使用示例
if __name__ == "__main__":
    detector = GameAnomalyDetector("http://prometheus:9090")
    
    # 检测游戏异常
    result = detector.detect("game-123")
    
    if result['is_anomaly']:
        print(f"Anomaly detected in {result['game_id']}!")
        explanations = detector.get_anomaly_explanation(result)
        for exp in explanations:
            print(f"  - {exp['metric']}: {exp['value']:.3f} (threshold: {exp['threshold']})")
            print(f"    Suggestion: {exp['suggestion']}")
```

## 4. 日志收集系统

### 4.1 日志架构

```yaml
# Loki日志收集配置
auth_enabled: false

server:
  http_listen_port: 3100
  grpc_listen_port: 9096

common:
  path_prefix: /tmp/loki
  storage:
    filesystem:
      chunks_directory: /tmp/loki/chunks
      rules_directory: /tmp/loki/rules
  replication_factor: 1
  ring:
    instance_addr: 127.0.0.1
    kvstore:
      store: inmemory

query_range:
  results_cache:
    cache:
      embedded_cache:
        enabled: true
        max_size_mb: 100

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

# 游戏日志解析规则
ruler:
  alertmanager_url: http://alertmanager:9093
  rule_path: /tmp/loki/rules
  
  # 游戏特定告警规则
  rules:
    - name: game_log_alerts
      rules:
        - alert: GameErrorLogSpike
          expr: |
            sum(rate({job="game-logs"} |= "ERROR" [5m])) by (game_id) > 10
          for: 1m
          labels:
            severity: warning
          annotations:
            summary: "High error log rate in {{ $labels.game_id }}"
```

### 4.2 游戏日志收集器

```go
// game_logger.go - 游戏日志收集器
package logger

import (
    "encoding/json"
    "time"
    
    "github.com/sirupsen/logrus"
)

// GameLogEntry 游戏日志条目
type GameLogEntry struct {
    Timestamp   time.Time       `json:"timestamp"`
    Level       string          `json:"level"`
    GameID      string          `json:"game_id"`
    ServerID    string          `json:"server_id"`
    PlayerID    string          `json:"player_id,omitempty"`
    SessionID   string          `json:"session_id,omitempty"`
    EventType   string          `json:"event_type"`
    Message     string          `json:"message"`
    Data        json.RawMessage `json:"data,omitempty"`
    TraceID     string          `json:"trace_id,omitempty"`
    SpanID      string          `json:"span_id,omitempty"`
}

// GameLogger 游戏日志记录器
type GameLogger struct {
    gameID   string
    serverID string
    logger   *logrus.Logger
    lokiURL  string
}

// NewGameLogger 创建游戏日志记录器
func NewGameLogger(gameID, serverID, lokiURL string) *GameLogger {
    logger := logrus.New()
    logger.SetFormatter(&logrus.JSONFormatter{
        TimestampFormat: time.RFC3339Nano,
    })
    
    return &GameLogger{
        gameID:   gameID,
        serverID: serverID,
        logger:   logger,
        lokiURL:  lokiURL,
    }
}

// log 内部日志方法
func (g *GameLogger) log(level logrus.Level, eventType, message string, data interface{}) {
    entry := GameLogEntry{
        Timestamp: time.Now().UTC(),
        Level:     level.String(),
        GameID:    g.gameID,
        ServerID:  g.serverID,
        EventType: eventType,
        Message:   message,
    }
    
    if data != nil {
        jsonData, _ := json.Marshal(data)
        entry.Data = jsonData
    }
    
    // 输出到本地日志
    g.logger.WithFields(logrus.Fields{
        "game_id":    entry.GameID,
        "server_id":  entry.ServerID,
        "event_type": entry.EventType,
    }).Log(level, message)
    
    // 发送到Loki (异步)
    go g.sendToLoki(entry)
}

// sendToLoki 发送日志到Loki
func (g *GameLogger) sendToLoki(entry GameLogEntry) {
    // 实现Loki推送逻辑
    // 使用Loki的push API
}

// Info 记录信息日志
func (g *GameLogger) Info(eventType, message string, data interface{}) {
    g.log(logrus.InfoLevel, eventType, message, data)
}

// Warn 记录警告日志
func (g *GameLogger) Warn(eventType, message string, data interface{}) {
    g.log(logrus.WarnLevel, eventType, message, data)
}

// Error 记录错误日志
func (g *GameLogger) Error(eventType, message string, err error, data interface{}) {
    if data == nil {
        data = map[string]interface{}{}
    }
    dataMap := data.(map[string]interface{})
    if err != nil {
        dataMap["error"] = err.Error()
    }
    g.log(logrus.ErrorLevel, eventType, message, dataMap)
}

// PlayerEvent 记录玩家事件
func (g *GameLogger) PlayerEvent(playerID, sessionID, eventType string, data interface{}) {
    entry := GameLogEntry{
        Timestamp: time.Now().UTC(),
        Level:     "info",
        GameID:    g.gameID,
        ServerID:  g.serverID,
        PlayerID:  playerID,
        SessionID: sessionID,
        EventType: eventType,
        Message:   "Player event",
    }
    
    if data != nil {
        jsonData, _ := json.Marshal(data)
        entry.Data = jsonData
    }
    
    g.sendToLoki(entry)
}

// PerformanceLog 记录性能日志
func (g *GameLogger) PerformanceLog(metric string, value float64, labels map[string]string) {
    data := map[string]interface{}{
        "metric": metric,
        "value":  value,
        "labels": labels,
    }
    g.log(logrus.InfoLevel, "performance", "Performance metric", data)
}

// SecurityLog 记录安全日志
func (g *GameLogger) SecurityLog(eventType, playerID string, details map[string]interface{}) {
    data := map[string]interface{}{
        "player_id": playerID,
        "details":   details,
    }
    g.log(logrus.WarnLevel, "security_"+eventType, "Security event", data)
}

// 使用示例
func ExampleUsage() {
    logger := NewGameLogger("rpg-game", "server-001", "http://loki:3100")
    
    // 记录玩家登录
    logger.PlayerEvent("player-123", "session-456", "player_login", map[string]interface{}{
        "ip":       "192.168.1.1",
        "platform": "web",
        "version":  "1.2.3",
    })
    
    // 记录错误
    logger.Error("game_logic", "Failed to process player action", 
        fmt.Errorf("invalid action"), 
        map[string]interface{}{
            "action": "attack",
            "target": "monster-001",
        })
    
    // 记录性能
    logger.PerformanceLog("frame_time", 0.016, map[string]string{
        "client_type": "webgl",
    })
    
    // 记录安全事件
    logger.SecurityLog("suspicious_action", "player-123", map[string]interface{}{
        "action":      "rapid_clicks",
        "click_count": 1000,
        "time_window": "1s",
    })
}
```

## 5. 分布式追踪

### 5.1 OpenTelemetry配置

```yaml
# OpenTelemetry Collector配置
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 1s
    send_batch_size: 1024
    
  resource:
    attributes:
      - key: service.namespace
        value: game-platform
        action: upsert
        
  tail_sampling:
    decision_wait: 10s
    num_traces: 100
    expected_new_traces_per_sec: 10
    policies:
      - name: errors
        type: status_code
        status_code: {status_codes: [ERROR]}
      - name: latency
        type: latency
        latency: {threshold_ms: 100}

exporters:
  jaeger:
    endpoint: jaeger:14250
    tls:
      insecure: true
      
  prometheusremotewrite:
    endpoint: http://prometheus:9090/api/v1/write
    
  logging:
    loglevel: debug

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch, resource, tail_sampling]
      exporters: [jaeger]
      
    metrics:
      receivers: [otlp]
      processors: [batch, resource]
      exporters: [prometheusremotewrite]
```

### 5.2 游戏追踪实现

```go
// game_tracing.go - 游戏分布式追踪
tracing
package tracing

import (
    "context"
    
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/codes"
    "go.opentelemetry.io/otel/trace"
)

var tracer = otel.Tracer("game-platform")

// GameSpan 游戏追踪Span
type GameSpan struct {
    span      trace.Span
    ctx       context.Context
    gameID    string
    playerID  string
    sessionID string
}

// StartGameSpan 开始游戏追踪
func StartGameSpan(ctx context.Context, operation, gameID string) *GameSpan {
    ctx, span := tracer.Start(ctx, operation,
        trace.WithAttributes(
            attribute.String("game.id", gameID),
        ),
    )
    
    return &GameSpan{
        span:   span,
        ctx:    ctx,
        gameID: gameID,
    }
}

// SetPlayer 设置玩家信息
func (g *GameSpan) SetPlayer(playerID, sessionID string) {
    g.playerID = playerID
    g.sessionID = sessionID
    g.span.SetAttributes(
        attribute.String("player.id", playerID),
        attribute.String("session.id", sessionID),
    )
}

// AddEvent 添加事件
func (g *GameSpan) AddEvent(name string, attrs ...attribute.KeyValue) {
    g.span.AddEvent(name, trace.WithAttributes(attrs...))
}

// RecordError 记录错误
func (g *GameSpan) RecordError(err error) {
    g.span.RecordError(err)
    g.span.SetStatus(codes.Error, err.Error())
}

// End 结束追踪
func (g *GameSpan) End() {
    g.span.End()
}

// Context 获取上下文
func (g *GameSpan) Context() context.Context {
    return g.ctx
}

// 游戏特定追踪函数

// TracePlayerAction 追踪玩家操作
func TracePlayerAction(ctx context.Context, gameID, playerID, action string, duration float64) {
    ctx, span := tracer.Start(ctx, "player_action",
        trace.WithAttributes(
            attribute.String("game.id", gameID),
            attribute.String("player.id", playerID),
            attribute.String("action.type", action),
            attribute.Float64("action.duration_ms", duration),
        ),
    )
    defer span.End()
}

// TraceGameFrame 追踪游戏帧
func TraceGameFrame(ctx context.Context, gameID string, frameTime float64, playerCount int) {
    ctx, span := tracer.Start(ctx, "game_frame",
        trace.WithAttributes(
            attribute.String("game.id", gameID),
            attribute.Float64("frame.time_ms", frameTime),
            attribute.Int("player.count", playerCount),
        ),
    )
    defer span.End()
}

// TraceNetworkMessage 追踪网络消息
func TraceNetworkMessage(ctx context.Context, gameID, msgType string, size int, latency float64) {
    ctx, span := tracer.Start(ctx, "network_message",
        trace.WithAttributes(
            attribute.String("game.id", gameID),
            attribute.String("message.type", msgType),
            attribute.Int("message.size_bytes", size),
            attribute.Float64("network.latency_ms", latency),
        ),
    )
    defer span.End()
}

// TraceDatabaseQuery 追踪数据库查询
func TraceDatabaseQuery(ctx context.Context, gameID, queryType string, duration float64, rows int) {
    ctx, span := tracer.Start(ctx, "database_query",
        trace.WithAttributes(
            attribute.String("game.id", gameID),
            attribute.String("query.type", queryType),
            attribute.Float64("query.duration_ms", duration),
            attribute.Int("query.rows", rows),
        ),
    )
    defer span.End()
}
```

## 6. Grafana Dashboard配置

```json
{
  "dashboard": {
    "title": "Game Platform Monitoring",
    "panels": [
      {
        "title": "Active Players",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(game_active_players) by (game_id)",
            "legendFormat": "{{game_id}}"
          }
        ]
      },
      {
        "title": "Latency Distribution",
        "type": "heatmap",
        "targets": [
          {
            "expr": "sum(rate(game_latency_seconds_bucket[5m])) by (le)",
            "format": "heatmap"
          }
        ]
      },
      {
        "title": "Frame Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(game_frame_time_seconds_bucket[5m])) by (game_id, le))",
            "legendFormat": "P95 - {{game_id}}"
          },
          {
            "expr": "histogram_quantile(0.50, sum(rate(game_frame_time_seconds_bucket[5m])) by (game_id, le))",
            "legendFormat": "P50 - {{game_id}}"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(game_errors_total[5m])) by (game_id, error_type)",
            "legendFormat": "{{game_id}} - {{error_type}}"
          }
        ]
      },
      {
        "title": "Container Resource Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "avg(game_container_cpu_usage) by (game_id)",
            "legendFormat": "CPU - {{game_id}}"
          },
          {
            "expr": "avg(game_container_memory_bytes / 1024 / 1024) by (game_id)",
            "legendFormat": "Memory (MB) - {{game_id}}"
          }
        ]
      },
      {
        "title": "Player Actions",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(game_player_actions_total[5m])) by (game_id, action_type)",
            "legendFormat": "{{game_id}} - {{action_type}}"
          }
        ]
      }
    ]
  }
}
```

---

*监控与日志系统设计文档 v1.0*
