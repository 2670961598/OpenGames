# Web游戏平台安全架构方案

## 目录
1. [执行摘要](#执行摘要)
2. [威胁模型分析](#威胁模型分析)
3. [沙箱安全方案](#沙箱安全方案)
4. [内容审核系统](#内容审核系统)
5. [身份认证与访问管理](#身份认证与访问管理)
6. [数据保护与隐私合规](#数据保护与隐私合规)
7. [防作弊机制](#防作弊机制)
8. [安全审计与监控](#安全审计与监控)
9. [安全事件响应](#安全事件响应)
10. [合规检查清单](#合规检查清单)

---

## 执行摘要

本安全架构方案针对开放式Web游戏平台设计，核心目标是：
- **零信任执行环境**：所有上传的游戏代码在隔离沙箱中运行
- **多层防护**：浏览器层 + 应用层 + 基础设施层三重防护
- **合规优先**：满足GDPR、CCPA等国际隐私法规要求
- **持续监控**：实时威胁检测和响应机制

**推荐架构概览**：
```
┌─────────────────────────────────────────────────────────────────┐
│                        用户浏览器层                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  iframe隔离  │  │   CSP策略   │  │   Service Worker监控    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      应用服务层 (API Gateway)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  WAF防护    │  │  限流/熔断   │  │   JWT/OAuth2验证        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      游戏执行沙箱层                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Firecracker MicroVM (每个游戏实例独立VM)                  │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │    │
│  │  │  QuickJS VM │  │  WASM沙箱   │  │  资源限制(cgroups)│  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      数据存储层                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ 加密数据库   │  │ 对象存储    │  │   审计日志系统           │  │
│  │ (AES-256)   │  │ (SSE-S3)    │  │   (不可篡改)             │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 威胁模型分析

### 威胁参与者

| 威胁参与者 | 动机 | 能力 | 风险等级 |
|-----------|------|------|---------|
| 恶意游戏开发者 | 窃取用户数据、传播恶意软件 | 可上传任意代码 | 🔴 极高 |
| 作弊玩家 | 篡改游戏分数、获取不当优势 | 使用外挂、逆向工程 | 🟠 高 |
| 外部攻击者 | DDoS、数据窃取、服务破坏 | 网络攻击、漏洞利用 | 🟠 高 |
| 内部人员 | 数据泄露、权限滥用 | 系统访问权限 | 🟡 中 |
| 竞争对手 | 破坏平台声誉、商业间谍 | 资源充足 | 🟡 中 |

### 攻击向量分析

```
┌─────────────────────────────────────────────────────────────────┐
│                        攻击向量矩阵                              │
├─────────────────┬───────────────────────────────────────────────┤
│ 攻击类型        │ 具体威胁                                      │
├─────────────────┼───────────────────────────────────────────────┤
│ 代码执行        │ XSS、RCE、沙箱逃逸、原型链污染                │
│ 数据攻击        │ SQL注入、NoSQL注入、数据泄露、会话劫持        │
│ 网络攻击        │ DDoS、MITM、DNS劫持、WebSocket滥用            │
│ 认证攻击        │ 凭证 stuffing、JWT伪造、OAuth滥用             │
│ 资源滥用        │ 加密货币挖矿、垃圾邮件、带宽滥用              │
│ 内容风险        │ 恶意图片、钓鱼链接、不当内容                  │
│ 游戏作弊        │ 内存修改、网络包篡改、自动化脚本              │
└─────────────────┴───────────────────────────────────────────────┘
```

### 风险评级矩阵

| 威胁 | 影响 | 可能性 | 风险等级 | 优先级 |
|------|------|--------|---------|--------|
| 沙箱逃逸 | 极高 | 中 | 🔴 极高 | P0 |
| 用户数据泄露 | 极高 | 中 | 🔴 极高 | P0 |
| 游戏作弊 | 高 | 高 | 🟠 高 | P1 |
| DDoS攻击 | 高 | 中 | 🟠 高 | P1 |
| 恶意内容传播 | 高 | 中 | 🟠 高 | P1 |
| API滥用 | 中 | 高 | 🟡 中 | P2 |
| 内部威胁 | 高 | 低 | 🟡 中 | P2 |

---

## 沙箱安全方案

### 方案对比分析

| 方案 | 隔离级别 | 启动时间 | 内存开销 | 兼容性 | 适用场景 |
|------|---------|---------|---------|--------|---------|
| **iframe + CSP** | 低 | 即时 | ~10MB | 极高 | 第一层防护 |
| **WebAssembly** | 中 | <10ms | ~5MB | 高 | 计算密集型游戏 |
| **QuickJS/Duktape** | 中-高 | 1-5ms | ~2MB | 中 | 轻量级脚本 |
| **gVisor** | 高 | 50-100ms | ~30MB | 中 | 多租户容器 |
| **Firecracker** | **极高** | ~125ms | ~5MB+内核 | 高 | **推荐主方案** |
| **Kata Containers** | 极高 | 150-300ms | ~10MB+内核 | 高 | K8s集成 |

### 推荐架构：多层沙箱防护

```
┌─────────────────────────────────────────────────────────────────┐
│                    第一层：浏览器沙箱                            │
├─────────────────────────────────────────────────────────────────┤
│  目的：防止游戏代码直接影响主页面和其他游戏                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  <iframe sandbox="allow-scripts allow-same-origin">     │   │
│  │    src="https://game-sandbox.platform.com/game/123"     │   │
│  │    csp="default-src 'none'; script-src 'self'">         │   │
│  │  </iframe>                                               │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    第二层：Firecracker MicroVM                   │
├─────────────────────────────────────────────────────────────────┤
│  目的：硬件级隔离，每个游戏运行在独立VM中                          │
│                                                                 │
│  特性：                                                          │
│  • 独立Linux内核（不可与宿主机共享）                              │
│  • KVM硬件虚拟化隔离                                             │
│  • 仅5个virtio设备（网络、块存储、vsock、串口、键盘）             │
│  • 50K行Rust代码（内存安全）                                     │
│  • 启动时间 ~125ms                                               │
│                                                                 │
│  资源限制：                                                      │
│  • CPU: 0.5-2 vCPU                                               │
│  • 内存: 128MB-1GB                                               │
│  • 磁盘: 100MB-1GB (tmpfs)                                       │
│  • 网络: 仅允许出站，禁止入站                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    第三层：应用沙箱 (QuickJS)                     │
├─────────────────────────────────────────────────────────────────┤
│  目的：限制游戏代码的系统调用和API访问                            │
│                                                                 │
│  特性：                                                          │
│  • 禁用危险API (eval, Function, XMLHttpRequest)                  │
│  • 自定义游戏API沙箱                                             │
│  • 内存使用限制                                                  │
│  • 执行时间限制                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Firecracker 配置示例

```json
{
  "boot-source": {
    "kernel_image_path": "/opt/firecracker/vmlinux-5.10",
    "boot_args": "console=ttyS0 reboot=k panic=1 pci=off nomodules",
    "initrd_path": null
  },
  "drives": [
    {
      "drive_id": "rootfs",
      "path_on_host": "/var/lib/firecracker/rootfs/game-base.ext4",
      "is_root_device": true,
      "is_read_only": true
    },
    {
      "drive_id": "game-data",
      "path_on_host": "/var/lib/firecker/games/game-123.squashfs",
      "is_root_device": false,
      "is_read_only": true
    }
  ],
  "machine-config": {
    "vcpu_count": 1,
    "mem_size_mib": 256,
    "smt": false,
    "track_dirty_pages": false
  },
  "network-interfaces": [
    {
      "iface_id": "eth0",
      "guest_mac": "AA:FC:00:00:00:01",
      "host_dev_name": "tap0"
    }
  ],
  "vsock": {
    "guest_cid": 3,
    "uds_path": "/var/run/firecracker/game-123.vsock"
  },
  "balloon": {
    "amount_mib": 0,
    "deflate_on_oom": true,
    "stats_polling_interval_s": 0
  },
  "logger": {
    "log_path": "/var/log/firecracker/game-123.log",
    "level": "Warn",
    "show_level": true,
    "show_log_origin": false
  },
  "metrics": {
    "metrics_path": "/var/log/firecracker/game-123.metrics"
  },
  "mmds-config": {
    "version": "V2",
    "ipv4_address": "169.254.169.250"
  }
}
```

### QuickJS 沙箱配置

```javascript
// sandbox-config.js
import { VM } from 'quickjs-emscripten';

class GameSandbox {
  constructor(options = {}) {
    this.vm = new VM({
      // 内存限制：最大128MB
      memoryLimit: options.memoryLimit || 128 * 1024 * 1024,
      // 执行时间限制：最大30秒
      maxExecutionTime: options.maxExecutionTime || 30000,
    });
    
    this.setupSandbox();
  }

  setupSandbox() {
    // 暴露安全的游戏API
    const safeAPIs = {
      // 游戏渲染API
      render: {
        clear: this.createWrappedFunction('render.clear'),
        drawImage: this.createWrappedFunction('render.drawImage'),
        drawRect: this.createWrappedFunction('render.drawRect'),
        drawText: this.createWrappedFunction('render.drawText'),
      },
      
      // 音频API（限制频率防止恶意使用）
      audio: {
        play: this.createRateLimitedFunction('audio.play', 10), // 每秒最多10次
        stop: this.createWrappedFunction('audio.stop'),
      },
      
      // 输入API
      input: {
        onKeyDown: this.createWrappedFunction('input.onKeyDown'),
        onKeyUp: this.createWrappedFunction('input.onKeyUp'),
        onMouseMove: this.createWrappedFunction('input.onMouseMove'),
        onClick: this.createWrappedFunction('input.onClick'),
      },
      
      // 存储API（仅允许访问游戏专属存储）
      storage: {
        getItem: this.createStorageWrapper('get'),
        setItem: this.createStorageWrapper('set'),
        removeItem: this.createStorageWrapper('remove'),
      },
      
      // 网络API（仅允许访问平台API）
      network: {
        submitScore: this.createWrappedFunction('network.submitScore'),
        getLeaderboard: this.createWrappedFunction('network.getLeaderboard'),
      },
      
      // 数学和工具函数（安全）
      Math: this.createSafeMath(),
      console: this.createSafeConsole(),
    };

    // 注入到VM全局
    Object.entries(safeAPIs).forEach(([name, api]) => {
      this.vm.setProp(this.vm.global, name, this.vm.wrap(api));
    });

    // 禁用危险功能
    this.disableDangerousFeatures();
  }

  disableDangerousFeatures() {
    const dangerousGlobals = [
      'eval', 'Function', 'setTimeout', 'setInterval',
      'fetch', 'XMLHttpRequest', 'WebSocket',
      'localStorage', 'sessionStorage', 'indexedDB',
      'document', 'window', 'parent', 'top',
      'importScripts', 'Worker', 'SharedArrayBuffer'
    ];

    dangerousGlobals.forEach(name => {
      this.vm.setProp(this.vm.global, name, this.vm.undefined);
    });
  }

  createRateLimitedFunction(name, maxCallsPerSecond) {
    const calls = [];
    return (...args) => {
      const now = Date.now();
      // 清理过期调用记录
      while (calls.length > 0 && calls[0] < now - 1000) {
        calls.shift();
      }
      // 检查频率限制
      if (calls.length >= maxCallsPerSecond) {
        throw new Error(`Rate limit exceeded for ${name}`);
      }
      calls.push(now);
      return this.callHostFunction(name, args);
    };
  }

  async executeGameCode(code) {
    try {
      // 代码静态分析
      const analysis = this.analyzeCode(code);
      if (analysis.dangerousPatterns.length > 0) {
        throw new Error(`Dangerous patterns detected: ${analysis.dangerousPatterns.join(', ')}`);
      }

      // 执行代码
      const result = await this.vm.evalCode(code, {
        timeout: this.options.maxExecutionTime,
      });

      return result;
    } catch (error) {
      this.logSecurityEvent('CODE_EXECUTION_ERROR', { error: error.message });
      throw error;
    }
  }

  analyzeCode(code) {
    const dangerousPatterns = [
      /eval\s*\(/gi,
      /new\s+Function\s*\(/gi,
      /document\.[a-z]+/gi,
      /window\.[a-z]+/gi,
      /parent\.[a-z]+/gi,
      /top\.[a-z]+/gi,
      /__proto__/gi,
      /constructor\s*\[\s*"prototype"\s*\]/gi,
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /data:text\/html/gi,
    ];

    const found = [];
    dangerousPatterns.forEach((pattern, index) => {
      if (pattern.test(code)) {
        found.push(['eval', 'Function', 'document', 'window', 'parent', 'top', 
                    '__proto__', 'prototype', 'script tag', 'javascript:', 'data URI'][index]);
      }
    });

    return { dangerousPatterns: found };
  }
}

export default GameSandbox;
```

### CSP (Content Security Policy) 配置

```http
Content-Security-Policy: 
  default-src 'none';
  script-src 'self' 'unsafe-inline' blob:;
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://cdn.platform.com;
  font-src 'self' https://fonts.platform.com;
  connect-src 'self' https://api.platform.com;
  media-src 'self' blob:;
  object-src 'none';
  frame-src 'self' https://game-sandbox.platform.com;
  worker-src 'self' blob:;
  manifest-src 'self';
  base-uri 'self';
  form-action 'none';
  upgrade-insecure-requests;
  block-all-mixed-content;
  sandbox allow-scripts allow-same-origin;
```

---

## 内容审核系统

### 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      内容审核流水线                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  上传 ──► 预处理 ──► 自动审核 ──► 决策路由 ──► 发布/人工审核      │
│            │           │            │                          │
│            ▼           ▼            ▼                          │
│      ┌─────────┐  ┌─────────┐  ┌─────────┐                     │
│      │ 格式验证 │  │ AI模型  │  │ 规则引擎 │                     │
│      │ 病毒扫描 │  │ 多模态  │  │ 风险评分 │                     │
│      │ 元数据  │  │ 检测    │  │         │                     │
│      └─────────┘  └─────────┘  └─────────┘                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 审核类型与策略

| 内容类型 | 审核方式 | 检测内容 | 处理策略 |
|---------|---------|---------|---------|
| 游戏代码 | 静态分析 + 动态沙箱 | 恶意代码、漏洞、危险API | 阻断/标记/放行 |
| 图片资源 | AI视觉 + 哈希比对 | 色情、暴力、侵权 | 阻断/模糊/放行 |
| 音频资源 | AI音频识别 | 版权、不当内容 | 阻断/标记/放行 |
| 文本内容 | NLP模型 + 关键词 | 辱骂、广告、敏感信息 | 阻断/替换/放行 |
| 元数据 | 规则引擎 | 虚假信息、诱导链接 | 阻断/修正/放行 |

### 自动化审核实现

```javascript
// content-moderation-service.js
class ContentModerationService {
  constructor() {
    this.analyzers = {
      code: new CodeAnalyzer(),
      image: new ImageAnalyzer(),
      audio: new AudioAnalyzer(),
      text: new TextAnalyzer(),
    };
    this.ruleEngine = new RuleEngine();
    this.riskScorer = new RiskScorer();
  }

  async moderateContent(content) {
    const results = {
      contentId: generateUUID(),
      timestamp: new Date().toISOString(),
      checks: {},
      overallRisk: 0,
      decision: null,
      reasons: [],
    };

    // 1. 格式和基础验证
    const validation = await this.validateFormat(content);
    if (!validation.valid) {
      return this.createRejectionResult(validation.errors);
    }

    // 2. 病毒/恶意软件扫描
    const securityScan = await this.scanForMalware(content);
    results.checks.security = securityScan;
    if (securityScan.threatsFound > 0) {
      return this.createRejectionResult(['Malware detected']);
    }

    // 3. 根据内容类型进行专项审核
    switch (content.type) {
      case 'game_code':
        results.checks.code = await this.analyzers.code.analyze(content);
        break;
      case 'image':
        results.checks.image = await this.analyzers.image.analyze(content);
        break;
      case 'audio':
        results.checks.audio = await this.analyzers.audio.analyze(content);
        break;
      case 'text':
        results.checks.text = await this.analyzers.text.analyze(content);
        break;
    }

    // 4. 规则引擎评估
    results.checks.rules = await this.ruleEngine.evaluate(content, results.checks);

    // 5. 风险评分
    results.overallRisk = this.riskScorer.calculate(results.checks);

    // 6. 决策路由
    results.decision = this.makeDecision(results);

    // 7. 记录审核日志
    await this.logModerationResult(results);

    return results;
  }

  makeDecision(results) {
    const { overallRisk, checks } = results;

    // 高风险：直接拒绝
    if (overallRisk >= 80 || checks.security?.threatsFound > 0) {
      return {
        action: 'REJECT',
        reason: 'High risk content detected',
        requiresHumanReview: false,
      };
    }

    // 中风险：需要人工审核
    if (overallRisk >= 40 || checks.code?.dangerousPatterns?.length > 0) {
      return {
        action: 'HOLD_FOR_REVIEW',
        reason: 'Requires human verification',
        requiresHumanReview: true,
        priority: overallRisk >= 60 ? 'HIGH' : 'NORMAL',
      };
    }

    // 低风险：自动放行
    return {
      action: 'APPROVE',
      reason: 'Passed automated checks',
      requiresHumanReview: false,
    };
  }
}

// 代码分析器
class CodeAnalyzer {
  async analyze(content) {
    const results = {
      dangerousPatterns: [],
      suspiciousImports: [],
      networkActivity: [],
      obfuscationLevel: 0,
      entropy: 0,
    };

    const code = content.data;

    // 静态分析
    const staticAnalysis = this.performStaticAnalysis(code);
    results.dangerousPatterns = staticAnalysis.patterns;
    results.suspiciousImports = staticAnalysis.imports;

    // 熵分析（检测混淆）
    results.entropy = this.calculateEntropy(code);
    results.obfuscationLevel = this.detectObfuscation(code);

    // 动态沙箱测试
    const sandboxResults = await this.runInSandbox(code);
    results.networkActivity = sandboxResults.networkCalls;
    results.fileSystemActivity = sandboxResults.fileOps;
    results.processActivity = sandboxResults.processOps;

    return results;
  }

  performStaticAnalysis(code) {
    const patterns = [];
    const imports = [];

    // 危险模式检测
    const dangerousPatterns = [
      { pattern: /eval\s*\(/, severity: 'high', desc: 'Dynamic code execution' },
      { pattern: /new\s+Function\s*\(/, severity: 'high', desc: 'Function constructor' },
      { pattern: /document\.write/, severity: 'high', desc: 'DOM manipulation' },
      { pattern: /innerHTML\s*=/, severity: 'medium', desc: 'HTML injection risk' },
      { pattern: /fetch\s*\(/, severity: 'low', desc: 'Network request' },
      { pattern: /XMLHttpRequest/, severity: 'low', desc: 'Network request' },
      { pattern: /WebSocket/, severity: 'low', desc: 'WebSocket connection' },
      { pattern: /localStorage/, severity: 'low', desc: 'Storage access' },
      { pattern: /indexedDB/, severity: 'low', desc: 'Database access' },
      { pattern: /postMessage/, severity: 'medium', desc: 'Cross-window messaging' },
      { pattern: /__proto__/, severity: 'high', desc: 'Prototype pollution' },
      { pattern: /constructor\.prototype/, severity: 'high', desc: 'Prototype access' },
    ];

    dangerousPatterns.forEach(({ pattern, severity, desc }) => {
      if (pattern.test(code)) {
        patterns.push({ severity, description: desc });
      }
    });

    // 导入分析
    const importMatches = code.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g) || [];
    importMatches.forEach(imp => {
      const match = imp.match(/from\s+['"]([^'"]+)['"]/);
      if (match) {
        imports.push(match[1]);
      }
    });

    return { patterns, imports };
  }

  calculateEntropy(code) {
    const frequencies = {};
    for (const char of code) {
      frequencies[char] = (frequencies[char] || 0) + 1;
    }
    
    let entropy = 0;
    const len = code.length;
    for (const char in frequencies) {
      const p = frequencies[char] / len;
      entropy -= p * Math.log2(p);
    }
    
    return entropy;
  }

  detectObfuscation(code) {
    let score = 0;
    
    // 检测常见混淆特征
    if (/\b[_$a-zA-Z]\w{20,}\b/.test(code)) score += 20; // 长变量名
    if (/['"]\\x[0-9a-f]{2}/i.test(code)) score += 15; // 十六进制编码
    if (/String\.fromCharCode/.test(code)) score += 10; // 字符编码
    if (/\[\s*['"]\w+['"]\s*\]/.test(code)) score += 10; // 括号表示法
    if (this.calculateEntropy(code) > 5) score += 15; // 高熵
    
    return Math.min(score, 100);
  }
}
```

### 用户举报系统

```javascript
// report-system.js
class ReportSystem {
  constructor() {
    this.reportThresholds = {
      AUTO_HIDE: 5,      // 5次举报自动隐藏
      AUTO_REVIEW: 3,    // 3次举报进入优先审核
      NOTIFY_ADMIN: 10,  // 10次举报通知管理员
    };
  }

  async submitReport(userId, contentId, contentType, reason, details = {}) {
    // 验证用户是否可以举报（防止滥用）
    const canReport = await this.checkReportQuota(userId);
    if (!canReport.allowed) {
      throw new Error(`Report quota exceeded. Try again in ${canReport.retryAfter} minutes`);
    }

    // 创建举报记录
    const report = await this.createReport({
      reporterId: userId,
      contentId,
      contentType,
      reason,
      details,
      status: 'PENDING',
      createdAt: new Date(),
    });

    // 更新内容举报计数
    await this.updateContentReportCount(contentId);

    // 检查是否触发自动处理
    await this.checkAutoActions(contentId);

    // 发送确认通知
    await this.notifyReporter(userId, report.id);

    return report;
  }

  async checkAutoActions(contentId) {
    const content = await this.getContentReportStats(contentId);
    
    if (content.reportCount >= this.reportThresholds.AUTO_HIDE) {
      await this.autoHideContent(contentId);
      await this.createPriorityReviewTask(contentId, 'HIGH');
    } else if (content.reportCount >= this.reportThresholds.AUTO_REVIEW) {
      await this.createPriorityReviewTask(contentId, 'NORMAL');
    }
  }

  async checkReportQuota(userId) {
    const recentReports = await this.getRecentReports(userId, { hours: 24 });
    
    // 限制：24小时内最多10次举报
    if (recentReports.length >= 10) {
      const oldestReport = recentReports[recentReports.length - 1];
      const retryAfter = Math.ceil((24 * 60 * 60 * 1000 - 
        (Date.now() - oldestReport.createdAt)) / 60000);
      
      return { allowed: false, retryAfter };
    }

    // 检查是否有恶意举报行为
    const falseReports = recentReports.filter(r => r.resolution === 'FALSE_REPORT');
    if (falseReports.length >= 3) {
      return { allowed: false, retryAfter: 60 }; // 暂停1小时
    }

    return { allowed: true };
  }
}
```

---

## 身份认证与访问管理

### OAuth2.0 + JWT 架构设计

```
┌─────────────────────────────────────────────────────────────────┐
│                    认证架构                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   用户 ──► 平台登录 ──► OAuth2.0 Provider                        │
│              │              │                                   │
│              │              ▼                                   │
│              │        ┌─────────┐                               │
│              │        │ 授权码   │                               │
│              │        │ 交换令牌 │                               │
│              │        └────┬────┘                               │
│              │             │                                    │
│              ▼             ▼                                    │
│        ┌─────────────────────────┐                              │
│        │      JWT令牌生成         │                              │
│        │  • Access Token (15min) │                              │
│        │  • Refresh Token (7day) │                              │
│        │  • ID Token             │                              │
│        └─────────────────────────┘                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### JWT 令牌设计

```javascript
// jwt-config.js
const JWT_CONFIG = {
  accessToken: {
    algorithm: 'ES256',  // ECDSA with P-256
    expiresIn: '15m',
    issuer: 'game-platform',
    audience: 'game-api',
  },
  refreshToken: {
    algorithm: 'HS256',
    expiresIn: '7d',
    issuer: 'game-platform',
  },
  idToken: {
    algorithm: 'ES256',
    expiresIn: '1h',
    issuer: 'game-platform',
  },
};

// Access Token Payload
const accessTokenPayload = {
  sub: 'user_12345',           // 用户ID
  iss: 'game-platform',        // 签发者
  aud: 'game-api',             // 受众
  iat: 1699999999,             // 签发时间
  exp: 1700000899,             // 过期时间
  jti: 'unique-token-id',      // 令牌唯一标识
  
  // 自定义声明
  scope: 'game:play game:submit_score user:read',
  permissions: ['play_games', 'submit_scores', 'view_profile'],
  roles: ['player'],
  sessionId: 'sess_abc123',
  deviceId: 'dev_xyz789',
};

// Refresh Token Payload
const refreshTokenPayload = {
  sub: 'user_12345',
  iss: 'game-platform',
  iat: 1699999999,
  exp: 1700604799,
  jti: 'refresh-unique-id',
  tokenVersion: 1,             // 用于令牌撤销
};
```

### RBAC 权限模型

```
┌─────────────────────────────────────────────────────────────────┐
│                    RBAC 权限模型                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  用户 ──► 角色 ──► 权限 ──► 资源                                │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │   玩家      │───►│ player      │───►│ game:play           │ │
│  │   (Player)  │    │             │    │ game:submit_score   │ │
│  └─────────────┘    │             │    │ user:read_own       │ │
│                     │             │    │ user:update_own     │ │
│  ┌─────────────┐    └─────────────┘    └─────────────────────┘ │
│  │   开发者    │    ┌─────────────┐    ┌─────────────────────┐ │
│  │  (Developer)│───►│ developer   │───►│ game:upload         │ │
│  └─────────────┘    │             │    │ game:update_own     │ │
│                     │             │    │ game:delete_own     │ │
│  ┌─────────────┐    │             │    │ analytics:read_own  │ │
│  │   管理员    │    └─────────────┘    └─────────────────────┘ │
│  │   (Admin)   │    ┌─────────────┐    ┌─────────────────────┐ │
│  └─────────────┘───►│ admin       │───►│ *:* (所有权限)       │ │
│                     │             │    │ user:manage         │ │
│                     │             │    │ game:manage_all     │ │
│                     │             │    │ system:configure    │ │
│                     └─────────────┘    └─────────────────────┘ │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │   审核员    │───►│ moderator   │───►│ content:review      │ │
│  │ (Moderator) │    │             │    │ content:hide        │ │
│  └─────────────┘    │             │    │ user:warn           │ │
│                     │             │    │ user:suspend        │ │
│                     └─────────────┘    └─────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### API Key 管理

```javascript
// api-key-manager.js
class APIKeyManager {
  constructor() {
    this.keyPrefix = 'gp_';  // game-platform
  this.keyLength = 48;       // 总长度
  this.scopes = {
    READ: 'read',
    WRITE: 'write',
    ADMIN: 'admin',
  };
  this.rateLimits = {
    [this.scopes.READ]: { requests: 1000, window: 3600 },   // 1000/小时
    [this.scopes.WRITE]: { requests: 100, window: 3600 },    // 100/小时
    [this.scopes.ADMIN]: { requests: 50, window: 3600 },     // 50/小时
  };
  this.encryptionKey = process.env.API_KEY_ENCRYPTION_KEY;
  this.hmacKey = process.env.API_KEY_HMAC_KEY;
  this.db = new Database();
  this.cache = new Redis();
  this.rateLimiter = new RateLimiter();
  this.auditLogger = new AuditLogger();
  this.metrics = new MetricsCollector();
  this.notificationService = new NotificationService();
    this.keyRotationDays = 90;
    this.maxKeysPerUser = 10;
    this.allowedIPs = [];
    this.allowedDomains = [];
    this.requireMFA = false;
    this.allowedEnvironments = ['production', 'staging', 'development'];
    this.ipWhitelist = [];
    this.ipBlacklist = [];
    this.geoRestrictions = [];
    this.timeRestrictions = [];
    this.usageAlerts = [];
    this.quotaAlerts = [];
    this.securityAlerts = [];
    this.auditLogRetention = 365;
    this.metricsRetention = 90;
  }

  async generateKey(userId, name, scopes, options = {}) {
    // 检查用户API Key数量限制
    const existingKeys = await this.getUserKeys(userId);
    if (existingKeys.length >= this.maxKeysPerUser) {
      throw new Error(`Maximum ${this.maxKeysPerUser} API keys allowed per user`);
    }

    // 生成密钥
    const rawKey = this.generateSecureKey();
    const keyId = this.generateKeyId();
    const hashedKey = await this.hashKey(rawKey);

    // 创建密钥记录
    const keyRecord = {
      id: keyId,
      userId,
      name,
      hashedKey,
      scopes,
      status: 'ACTIVE',
      createdAt: new Date(),
      expiresAt: options.expiresAt || this.calculateExpiry(),
      lastUsedAt: null,
      usageCount: 0,
      rateLimitConfig: this.rateLimits[scopes[0]] || this.rateLimits.READ,
      ipWhitelist: options.allowedIPs || [],
      metadata: {
        description: options.description,
        environment: options.environment || 'production',
      },
    };

    await this.db.apiKeys.create(keyRecord);

    // 记录审计日志
    await this.auditLogger.log({
      action: 'API_KEY_CREATED',
      userId,
      keyId,
      scopes,
      timestamp: new Date(),
    });

    // 返回原始密钥（仅显示一次）
    return {
      id: keyId,
      key: `${this.keyPrefix}${rawKey}`,
      name,
      scopes,
      expiresAt: keyRecord.expiresAt,
    };
  }

  generateSecureKey() {
    // 使用加密安全的随机数生成器
    const randomBytes = crypto.randomBytes(32);
    return randomBytes.toString('base64url');
  }

  async validateKey(apiKey, requestContext) {
    // 解析密钥
    if (!apiKey.startsWith(this.keyPrefix)) {
      throw new AuthenticationError('Invalid API key format');
    }

    const rawKey = apiKey.slice(this.keyPrefix.length);
    const hashedKey = await this.hashKey(rawKey);

    // 从缓存或数据库获取密钥记录
    let keyRecord = await this.cache.get(`apikey:${hashedKey}`);
    if (!keyRecord) {
      keyRecord = await this.db.apiKeys.findByHash(hashedKey);
      if (keyRecord) {
        await this.cache.set(`apikey:${hashedKey}`, keyRecord, 300); // 5分钟缓存
      }
    }

    if (!keyRecord) {
      throw new AuthenticationError('Invalid API key');
    }

    // 验证状态
    if (keyRecord.status !== 'ACTIVE') {
      throw new AuthenticationError(`API key is ${keyRecord.status.toLowerCase()}`);
    }

    // 验证过期
    if (new Date() > new Date(keyRecord.expiresAt)) {
      await this.revokeKey(keyRecord.id, 'EXPIRED');
      throw new AuthenticationError('API key has expired');
    }

    // 验证IP白名单
    if (keyRecord.ipWhitelist.length > 0) {
      if (!keyRecord.ipWhitelist.includes(requestContext.ip)) {
        throw new AuthorizationError('IP not in whitelist');
      }
    }

    // 速率限制检查
    const rateLimitKey = `ratelimit:${keyRecord.id}`;
    const allowed = await this.rateLimiter.check(
      rateLimitKey,
      keyRecord.rateLimitConfig
    );
    if (!allowed) {
      throw new RateLimitError('API rate limit exceeded');
    }

    // 更新使用统计
    await this.updateKeyUsage(keyRecord.id);

    return {
      keyId: keyRecord.id,
      userId: keyRecord.userId,
      scopes: keyRecord.scopes,
    };
  }

  async revokeKey(keyId, reason) {
    await this.db.apiKeys.update(keyId, {
      status: 'REVOKED',
      revokedAt: new Date(),
      revokeReason: reason,
    });

    // 清除缓存
    await this.cache.del(`apikey:${keyId}`);

    // 记录审计日志
    await this.auditLogger.log({
      action: 'API_KEY_REVOKED',
      keyId,
      reason,
      timestamp: new Date(),
    });
  }

  async hashKey(rawKey) {
    return crypto.createHmac('sha256', this.hmacKey)
      .update(rawKey)
      .digest('hex');
  }
}
```

### API 限流配置

```javascript
// rate-limiter.js
class RateLimiter {
  constructor() {
    this.redis = new Redis();
    this.strategies = {
      // 基于用户ID的限流
      user: {
        windowMs: 60 * 1000,      // 1分钟
        maxRequests: 100,          // 100请求/分钟
      },
      // 基于IP的限流
      ip: {
        windowMs: 60 * 1000,
        maxRequests: 60,
      },
      // 基于API Key的限流
      apiKey: {
        windowMs: 60 * 60 * 1000,  // 1小时
        maxRequests: 1000,
      },
      // 游戏分数提交的严格限流
      scoreSubmit: {
        windowMs: 60 * 1000,
        maxRequests: 10,           // 10次/分钟
        burstAllowance: 3,         // 允许3次突发
      },
      // 登录尝试限流
      login: {
        windowMs: 15 * 60 * 1000,  // 15分钟
        maxRequests: 5,            // 5次/15分钟
      },
    };
  }

  async check(key, config) {
    const windowKey = `${key}:${Math.floor(Date.now() / config.windowMs)}`;
    const current = await this.redis.incr(windowKey);
    
    if (current === 1) {
      await this.redis.expire(windowKey, Math.ceil(config.windowMs / 1000));
    }

    return current <= config.maxRequests;
  }

  async checkWithBurst(key, config) {
    const burstKey = `${key}:burst`;
    const windowKey = `${key}:${Math.floor(Date.now() / config.windowMs)}`;
    
    // 检查突发令牌
    const burstTokens = await this.redis.get(burstKey);
    if (burstTokens && parseInt(burstTokens) > 0) {
      await this.redis.decr(burstKey);
      return true;
    }

    // 正常窗口限流
    return this.check(key, config);
  }
}

// Express中间件
const rateLimitMiddleware = (strategy) => {
  return async (req, res, next) => {
    const limiter = new RateLimiter();
    let key;

    switch (strategy) {
      case 'user':
        key = `user:${req.user?.id || 'anonymous'}`;
        break;
      case 'ip':
        key = `ip:${req.ip}`;
        break;
      case 'apiKey':
        key = `apikey:${req.apiKey?.id}`;
        break;
      default:
        key = `default:${req.ip}`;
    }

    const allowed = await limiter.check(key, limiter.strategies[strategy]);
    
    if (!allowed) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil(limiter.strategies[strategy].windowMs / 1000),
      });
    }

    next();
  };
};
```

---

## 数据保护与隐私合规

### 数据分类与处理

| 数据类型 | 分类 | 存储要求 | 传输要求 | 保留期限 |
|---------|------|---------|---------|---------|
| 用户密码 | 极高敏感 | Argon2id哈希 | N/A | 永久（仅哈希） |
| 邮箱地址 | 高敏感 | AES-256-GCM加密 | TLS 1.3 | 账户存在期间 |
| 游戏数据 | 中敏感 | 数据库加密 | TLS 1.3 | 2年 |
| 日志数据 | 中敏感 | 不可篡改存储 | TLS 1.3 | 1年 |
| 分析数据 | 低敏感 | 聚合存储 | TLS 1.3 | 匿名化后永久 |

### 加密策略

```javascript
// encryption-service.js
class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32;
    this.ivLength = 16;
    this.tagLength = 16;
    this.masterKey = this.loadMasterKey();
    this.kms = new AWS.KMS(); // 或 HashiCorp Vault
  }

  // 数据加密（用于数据库字段）
  async encrypt(plaintext, context = {}) {
    // 从KMS获取数据密钥
    const dataKey = await this.generateDataKey();
    
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, dataKey.plaintext, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // 安全清除明文密钥
    dataKey.plaintext.fill(0);
    
    return {
      ciphertext: encrypted,
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      encryptedDataKey: dataKey.ciphertext.toString('base64'),
      context: this.serializeContext(context),
    };
  }

  // 数据解密
  async decrypt(encryptedData) {
    // 从KMS解密数据密钥
    const dataKey = await this.decryptDataKey(
      Buffer.from(encryptedData.encryptedDataKey, 'base64')
    );
    
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const tag = Buffer.from(encryptedData.tag, 'base64');
    
    const decipher = crypto.createDecipheriv(this.algorithm, dataKey, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedData.ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    // 安全清除密钥
    dataKey.fill(0);
    
    return decrypted;
  }

  // 密码哈希（Argon2id）
  async hashPassword(password) {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,    // 64 MB
      timeCost: 3,          // 3 iterations
      parallelism: 4,       // 4 parallel threads
      hashLength: 32,
      salt: crypto.randomBytes(16),
    });
  }

  // 密码验证
  async verifyPassword(hash, password) {
    return argon2.verify(hash, password);
  }

  // 字段级加密（数据库）
  async encryptField(fieldName, value, entityId) {
    const context = {
      field: fieldName,
      entity: entityId,
      timestamp: Date.now(),
    };
    return this.encrypt(String(value), context);
  }
}
```

### GDPR 合规实现

```javascript
// gdpr-service.js
class GDPRService {
  constructor() {
    this.db = new Database();
    this.storage = new ObjectStorage();
    this.anonymizer = new DataAnonymizer();
    this.auditLogger = new AuditLogger();
  }

  // 导出用户数据（数据可携带权）
  async exportUserData(userId) {
    const user = await this.db.users.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const data = {
      personalInfo: {
        email: user.email,
        username: user.username,
        profile: user.profile,
        createdAt: user.createdAt,
      },
      gameData: await this.db.gameData.findByUserId(userId),
      scores: await this.db.scores.findByUserId(userId),
      sessions: await this.db.sessions.findByUserId(userId),
      payments: await this.db.payments.findByUserId(userId),
      settings: user.settings,
    };

    // 生成导出文件
    const exportFile = await this.createExportFile(userId, data);

    // 记录审计日志
    await this.auditLogger.log({
      action: 'DATA_EXPORT',
      userId,
      timestamp: new Date(),
    });

    return exportFile;
  }

  // 删除用户数据（被遗忘权）
  async deleteUserData(userId, options = {}) {
    const { softDelete = false, retentionDays = 30 } = options;

    // 1. 匿名化可保留的聚合数据
    await this.anonymizeAggregatedData(userId);

    // 2. 删除个人数据
    await this.deletePersonalData(userId);

    // 3. 删除游戏数据
    await this.deleteGameData(userId);

    // 4. 删除文件存储
    await this.deleteUserFiles(userId);

    // 5. 删除或匿名化日志中的用户标识
    await this.anonymizeLogs(userId);

    // 6. 通知第三方（如果有数据共享）
    await this.notifyDataDeletion(userId);

    // 7. 记录审计日志
    await this.auditLogger.log({
      action: 'DATA_DELETION',
      userId,
      method: softDelete ? 'SOFT' : 'HARD',
      timestamp: new Date(),
    });

    return { success: true, deletedAt: new Date() };
  }

  // 匿名化聚合数据
  async anonymizeAggregatedData(userId) {
    // 保留统计数据但移除个人标识
    await this.db.scores.updateMany(
      { userId },
      { 
        $set: { 
          userId: `anonymized_${hashUserId(userId)}`,
          anonymizedAt: new Date(),
        },
        $unset: { username: 1 }
      }
    );
  }

  // 处理数据主体请求（DSR）
  async processDSR(request) {
    const { type, userId, details } = request;

    switch (type) {
      case 'ACCESS':
        return this.exportUserData(userId);
      case 'DELETION':
        return this.deleteUserData(userId, details);
      case 'RECTIFICATION':
        return this.updateUserData(userId, details);
      case 'PORTABILITY':
        return this.exportInStandardFormat(userId);
      case 'RESTRICTION':
        return this.restrictProcessing(userId, details);
      case 'OBJECTION':
        return this.objectToProcessing(userId, details);
      default:
        throw new Error(`Unknown DSR type: ${type}`);
    }
  }
}
```

---

## 防作弊机制

### 服务端验证架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    防作弊验证流程                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  客户端 ──► 游戏事件 ──► 加密传输 ──► 服务端验证 ──► 存储        │
│              │            │            │                        │
│              ▼            ▼            ▼                        │
│        ┌─────────┐  ┌─────────┐  ┌─────────┐                    │
│        │ 事件签名 │  │ TLS 1.3 │  │ 规则引擎 │                    │
│        │ 时间戳  │  │ 证书固定 │  │ 异常检测 │                    │
│        │ 序列号  │  │         │  │ 统计分析 │                    │
│        └─────────┘  └─────────┘  └─────────┘                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 游戏分数验证

```javascript
// anti-cheat-service.js
class AntiCheatService {
  constructor() {
    this.rules = new CheatDetectionRules();
    this.mlModel = new AnomalyDetectionModel();
    this.reputationSystem = new PlayerReputationSystem();
    this.auditLogger = new AuditLogger();
  }

  async validateScoreSubmission(submission) {
    const { userId, gameId, score, gameplayData, timestamp, signature } = submission;

    // 1. 验证签名
    const isValidSignature = await this.verifySignature(submission);
    if (!isValidSignature) {
      await this.flagSuspicious(userId, 'INVALID_SIGNATURE');
      return { valid: false, reason: 'Invalid signature' };
    }

    // 2. 时间合理性检查
    const timeCheck = this.validateTimestamp(timestamp);
    if (!timeCheck.valid) {
      await this.flagSuspicious(userId, 'TIMESTAMP_ANOMALY', timeCheck);
      return { valid: false, reason: 'Timestamp anomaly' };
    }

    // 3. 分数合理性检查
    const scoreCheck = await this.validateScore(gameId, score, gameplayData);
    if (!scoreCheck.valid) {
      await this.flagSuspicious(userId, 'IMPOSSIBLE_SCORE', scoreCheck);
      return { valid: false, reason: 'Impossible score' };
    }

    // 4. 游戏数据完整性检查
    const dataCheck = this.validateGameplayData(gameplayData);
    if (!dataCheck.valid) {
      await this.flagSuspicious(userId, 'INVALID_GAMEPLAY_DATA', dataCheck);
      return { valid: false, reason: 'Invalid gameplay data' };
    }

    // 5. 行为模式分析
    const behaviorCheck = await this.analyzeBehavior(userId, gameplayData);
    if (behaviorCheck.risk > 0.8) {
      await this.flagSuspicious(userId, 'SUSPICIOUS_BEHAVIOR', behaviorCheck);
      return { valid: false, reason: 'Suspicious behavior detected' };
    }

    // 6. 速率限制检查
    const rateCheck = await this.checkSubmissionRate(userId, gameId);
    if (!rateCheck.allowed) {
      return { valid: false, reason: 'Rate limit exceeded' };
    }

    // 7. 机器学习异常检测
    const mlCheck = await this.mlModel.predict(submission);
    if (mlCheck.anomalyScore > 0.9) {
      await this.flagSuspicious(userId, 'ML_ANOMALY', mlCheck);
      // 不直接拒绝，标记为待审核
    }

    // 8. 更新玩家信誉
    await this.reputationSystem.updateReputation(userId, { valid: true });

    return { valid: true, confidence: mlCheck.confidence };
  }

  // 分数合理性验证
  validateScore(gameId, score, gameplayData) {
    const gameConfig = this.getGameConfig(gameId);
    const { duration, actions, randomSeed } = gameplayData;

    // 理论最大分数计算
    const theoreticalMax = this.calculateTheoreticalMax(gameConfig, duration);
    
    if (score > theoreticalMax * 1.1) { // 允许10%误差
      return { 
        valid: false, 
        reason: 'Score exceeds theoretical maximum',
        details: { score, theoreticalMax }
      };
    }

    // 分数增长率检查
    const scoreRate = score / duration;
    if (scoreRate > gameConfig.maxScoreRate) {
      return {
        valid: false,
        reason: 'Score rate too high',
        details: { scoreRate, maxRate: gameConfig.maxScoreRate }
      };
    }

    // 验证随机种子一致性
    if (randomSeed) {
      const seedValidation = this.validateRandomSeed(gameId, randomSeed, gameplayData);
      if (!seedValidation.valid) {
        return seedValidation;
      }
    }

    return { valid: true };
  }

  // 行为模式分析
  async analyzeBehavior(userId, gameplayData) {
    const { actions, timestamps, inputs } = gameplayData;

    const patterns = {
      // 输入规律性检查（自动化脚本通常过于规律）
      inputRegularity: this.calculateInputRegularity(inputs),
      
      // 反应时间分析（人类反应时间有波动）
      reactionTimeVariance: this.calculateReactionVariance(actions),
      
      // 操作序列异常
      actionSequence: this.analyzeActionSequence(actions),
      
      // 鼠标/触摸轨迹分析
      movementPattern: this.analyzeMovementPattern(inputs),
    };

    // 综合风险评分
    const risk = this.calculateBehaviorRisk(patterns);

    return { patterns, risk };
  }

  calculateInputRegularity(inputs) {
    if (inputs.length < 2) return 0;

    const intervals = [];
    for (let i = 1; i < inputs.length; i++) {
      intervals.push(inputs[i].timestamp - inputs[i-1].timestamp);
    }

    // 计算间隔的标准差
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // 标准差越小，规律性越高（越可疑）
    const coefficientOfVariation = stdDev / mean;
    return Math.max(0, 1 - coefficientOfVariation);
  }

  // 标记可疑行为
  async flagSuspicious(userId, reason, details) {
    await this.db.suspiciousActivity.create({
      userId,
      reason,
      details,
      timestamp: new Date(),
      status: 'PENDING_REVIEW',
    });

    // 更新玩家信誉
    await this.reputationSystem.updateReputation(userId, { 
      valid: false, 
      reason 
    });

    // 如果信誉过低，临时限制
    const reputation = await this.reputationSystem.getReputation(userId);
    if (reputation.score < 30) {
      await this.restrictUser(userId, 'LOW_REPUTATION');
    }

    // 记录审计日志
    await this.auditLogger.log({
      action: 'SUSPICIOUS_ACTIVITY',
      userId,
      reason,
      timestamp: new Date(),
    });
  }
}
```

### 排行榜保护

```javascript
// leaderboard-protection.js
class LeaderboardProtection {
  constructor() {
    this.antiCheat = new AntiCheatService();
    this.cache = new Redis();
    this.db = new Database();
  }

  async submitScore(userId, gameId, score, gameplayData) {
    // 验证分数
    const validation = await this.antiCheat.validateScoreSubmission({
      userId,
      gameId,
      score,
      gameplayData,
      timestamp: Date.now(),
    });

    if (!validation.valid) {
      throw new Error(`Score validation failed: ${validation.reason}`);
    }

    // 检查是否是新纪录
    const currentBest = await this.getUserBestScore(userId, gameId);
    
    if (!currentBest || score > currentBest.score) {
      // 更新个人最佳
      await this.updatePersonalBest(userId, gameId, score, gameplayData);
    }

    // 检查是否进入排行榜
    const leaderboardRank = await this.calculateRank(gameId, score);
    
    if (leaderboardRank <= 100) { // 前100名
      await this.updateLeaderboard(gameId, {
        userId,
        score,
        timestamp: new Date(),
        gameplayHash: this.hashGameplayData(gameplayData),
        rank: leaderboardRank,
      });

      // 发送通知
      await this.notifyRankChange(userId, gameId, leaderboardRank);
    }

    return { 
      success: true, 
      rank: leaderboardRank,
      isPersonalBest: !currentBest || score > currentBest.score,
    };
  }

  async getLeaderboard(gameId, options = {}) {
    const { page = 1, limit = 20, period = 'all' } = options;

    const cacheKey = `leaderboard:${gameId}:${period}:page${page}`;
    let leaderboard = await this.cache.get(cacheKey);

    if (!leaderboard) {
      // 从数据库获取
      leaderboard = await this.db.leaderboard
        .find({ gameId, period })
        .sort({ score: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('userId score rank timestamp -_id');

      // 缓存结果
      await this.cache.set(cacheKey, leaderboard, 60); // 1分钟缓存
    }

    // 脱敏处理
    return leaderboard.map(entry => ({
      rank: entry.rank,
      username: this.maskUsername(entry.userId),
      score: entry.score,
      timestamp: entry.timestamp,
    }));
  }

  maskUsername(userId) {
    // 返回匿名化的用户名
    return `Player_${userId.slice(-6)}`;
  }
}
```

---

## 安全审计与监控

### 审计日志系统

```javascript
// audit-logger.js
class AuditLogger {
  constructor() {
    this.storage = new ImmutableLogStorage(); // 不可篡改存储
    this.indexer = new LogIndexer();
    this.alertManager = new AlertManager();
    this.retentionDays = 365;
  }

  async log(event) {
    const logEntry = {
      id: generateUUID(),
      timestamp: new Date().toISOString(),
      severity: event.severity || 'INFO',
      category: event.category || 'GENERAL',
      action: event.action,
      actor: {
        type: event.actorType || 'user', // user, system, api
        id: event.actorId,
        ip: event.ip,
        userAgent: event.userAgent,
      },
      target: {
        type: event.targetType,
        id: event.targetId,
      },
      details: event.details,
      result: event.result || 'SUCCESS',
      metadata: {
        requestId: event.requestId,
        sessionId: event.sessionId,
        correlationId: event.correlationId,
      },
    };

    // 计算哈希（用于完整性验证）
    logEntry.hash = this.calculateHash(logEntry);

    // 存储到不可篡改存储
    await this.storage.append(logEntry);

    // 索引关键字段
    await this.indexer.index(logEntry);

    // 检查是否需要告警
    if (this.isAlertWorthy(logEntry)) {
      await this.alertManager.sendAlert(logEntry);
    }

    return logEntry.id;
  }

  calculateHash(logEntry) {
    const data = JSON.stringify({
      timestamp: logEntry.timestamp,
      action: logEntry.action,
      actor: logEntry.actor,
      target: logEntry.target,
      details: logEntry.details,
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  isAlertWorthy(logEntry) {
    const alertRules = [
      // 多次登录失败
      { 
        condition: (e) => e.action === 'LOGIN_FAILED' && e.count > 5,
        severity: 'HIGH'
      },
      // 权限提升
      {
        condition: (e) => e.action === 'PRIVILEGE_ESCALATION',
        severity: 'CRITICAL'
      },
      // 数据导出
      {
        condition: (e) => e.action === 'DATA_EXPORT' && e.details.size > '1GB',
        severity: 'MEDIUM'
      },
      // 管理员操作
      {
        condition: (e) => e.actor.type === 'admin' && e.action.includes('DELETE'),
        severity: 'MEDIUM'
      },
    ];

    return alertRules.some(rule => rule.condition(logEntry));
  }

  // 查询审计日志
  async query(filters) {
    const { 
      startTime, 
      endTime, 
      actorId, 
      action, 
      severity,
      page = 1,
      limit = 100 
    } = filters;

    return this.indexer.search({
      timestamp: { $gte: startTime, $lte: endTime },
      ...(actorId && { 'actor.id': actorId }),
      ...(action && { action }),
      ...(severity && { severity }),
    }, { skip: (page - 1) * limit, limit });
  }
}
```

### 入侵检测系统 (IDS)

```javascript
// intrusion-detection.js
class IntrusionDetectionSystem {
  constructor() {
    this.rules = this.loadDetectionRules();
    this.mlModel = new AnomalyDetectionModel();
    this.baseline = new BehaviorBaseline();
    this.alertManager = new AlertManager();
  }

  async analyze(event) {
    const detections = [];

    // 1. 基于规则的检测
    const ruleMatches = await this.checkRules(event);
    detections.push(...ruleMatches);

    // 2. 异常行为检测
    const anomaly = await this.detectAnomaly(event);
    if (anomaly.score > 0.8) {
      detections.push({
        type: 'ANOMALY',
        severity: anomaly.score > 0.95 ? 'CRITICAL' : 'HIGH',
        details: anomaly,
      });
    }

    // 3. 威胁情报匹配
    const threatIntel = await this.checkThreatIntel(event);
    if (threatIntel.found) {
      detections.push({
        type: 'THREAT_INTEL',
        severity: 'CRITICAL',
        details: threatIntel,
      });
    }

    // 4. 关联分析
    const correlation = await this.correlationAnalysis(event);
    if (correlation.suspicious) {
      detections.push({
        type: 'CORRELATION',
        severity: 'HIGH',
        details: correlation,
      });
    }

    // 处理检测结果
    for (const detection of detections) {
      await this.handleDetection(event, detection);
    }

    return detections;
  }

  async checkRules(event) {
    const matches = [];

    for (const rule of this.rules) {
      if (rule.matches(event)) {
        matches.push({
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          description: rule.description,
        });
      }
    }

    return matches;
  }

  async detectAnomaly(event) {
    // 获取用户行为基线
    const userBaseline = await this.baseline.getUserBaseline(event.actor.id);
    
    // 计算异常分数
    const features = this.extractFeatures(event);
    const prediction = await this.mlModel.predict(features);

    return {
      score: prediction.anomalyScore,
      features,
      baseline: userBaseline,
    };
  }

  async handleDetection(event, detection) {
    // 记录检测事件
    await this.logDetection(event, detection);

    // 根据严重程度处理
    switch (detection.severity) {
      case 'CRITICAL':
        await this.blockActor(event.actor.id);
        await this.alertManager.sendImmediateAlert(detection);
        break;
      case 'HIGH':
        await this.increaseMonitoring(event.actor.id);
        await this.alertManager.sendAlert(detection);
        break;
      case 'MEDIUM':
        await this.logForReview(detection);
        break;
    }
  }
}

// 检测规则示例
const detectionRules = [
  {
    id: 'RULE-001',
    name: 'Multiple Failed Logins',
    description: 'More than 5 failed login attempts in 5 minutes',
    severity: 'HIGH',
    matches: (event) => {
      return event.action === 'LOGIN_FAILED' && 
             event.count > 5 && 
             event.timeWindow === '5m';
    },
  },
  {
    id: 'RULE-002',
    name: 'Privilege Escalation Attempt',
    description: 'Attempt to access admin functions without authorization',
    severity: 'CRITICAL',
    matches: (event) => {
      return event.action === 'ACCESS_DENIED' && 
             event.target.type === 'admin_resource';
    },
  },
  {
    id: 'RULE-003',
    name: 'Unusual Data Access Pattern',
    description: 'Accessing large amounts of data in short time',
    severity: 'MEDIUM',
    matches: (event) => {
      return event.action === 'DATA_ACCESS' && 
             event.details.recordCount > 1000 &&
             event.details.duration < 60000;
    },
  },
  {
    id: 'RULE-004',
    name: 'Suspicious API Usage',
    description: 'API calls from unusual location or device',
    severity: 'HIGH',
    matches: (event) => {
      return event.action === 'API_CALL' && 
             (event.actor.location.isUnusual || 
              event.actor.device.isNew);
    },
  },
];
```

---

## 安全事件响应

### 事件响应流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    安全事件响应流程                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  检测 ──► 分类 ──► 遏制 ──► 根除 ──► 恢复 ──► 复盘              │
│    │       │       │       │       │       │                    │
│    ▼       ▼       ▼       ▼       ▼       ▼                    │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐              │
│  │SIEM │ │P0-4 │ │隔离  │ │清除  │ │恢复  │ │报告  │              │
│  │告警 │ │分级 │ │阻断  │ │漏洞  │ │服务  │ │改进  │              │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 事件分级

| 级别 | 名称 | 响应时间 | 示例 | 处理团队 |
|-----|------|---------|------|---------|
| P0 | 紧急 | 15分钟 | 数据泄露、服务中断 | 安全团队+高管 |
| P1 | 严重 | 1小时 | 沙箱逃逸、大规模作弊 | 安全团队+开发 |
| P2 | 高 | 4小时 | API滥用、可疑登录 | 安全团队 |
| P3 | 中 | 24小时 | 低频率攻击尝试 | 运维团队 |
| P4 | 低 | 72小时 | 扫描探测 | 定期审查 |

### 应急响应脚本

```javascript
// incident-response.js
class IncidentResponse {
  constructor() {
    this.playbooks = this.loadPlaybooks();
    this.notificationService = new NotificationService();
    this.automation = new ResponseAutomation();
  }

  async handleIncident(incident) {
    // 1. 创建事件记录
    const incidentRecord = await this.createIncident(incident);

    // 2. 确定优先级
    const priority = this.assessPriority(incident);
    incidentRecord.priority = priority;

    // 3. 通知相关人员
    await this.notifyTeam(incidentRecord);

    // 4. 执行自动化响应
    await this.executeAutomatedResponse(incidentRecord);

    // 5. 启动对应剧本
    const playbook = this.playbooks[incident.type];
    if (playbook) {
      await this.runPlaybook(playbook, incidentRecord);
    }

    return incidentRecord;
  }

  async executeAutomatedResponse(incident) {
    const responses = {
      'SANDBOX_ESCAPE': async () => {
        // 立即隔离受影响的游戏
        await this.automation.isolateGame(incident.target.id);
        // 暂停相关用户账户
        await this.automation.suspendUser(incident.actor.id);
        // 收集取证数据
        await this.automation.collectForensics(incident);
      },
      'DATA_BREACH': async () => {
        // 立即撤销受影响令牌
        await this.automation.revokeTokens(incident.affectedUsers);
        // 强制密码重置
        await this.automation.forcePasswordReset(incident.affectedUsers);
        // 启动审计
        await this.automation.startAudit(incident);
      },
      'DDOS_ATTACK': async () => {
        // 启用DDoS防护
        await this.automation.enableDDoSProtection();
        // 扩展容量
        await this.automation.scaleInfrastructure();
        // 通知ISP
        await this.automation.notifyISP(incident);
      },
      'CHEATING_DETECTION': async () => {
        // 标记可疑分数
        await this.automation.flagScores(incident.affectedScores);
        // 临时限制用户
        await this.automation.restrictUser(incident.actor.id);
        // 启动调查
        await this.automation.startInvestigation(incident);
      },
    };

    const response = responses[incident.type];
    if (response) {
      await response();
    }
  }

  assessPriority(incident) {
    const factors = {
      impact: incident.impact, // 影响范围
      urgency: incident.urgency, // 紧急程度
      dataSensitivity: incident.dataSensitivity, // 数据敏感度
      publicExposure: incident.publicExposure, // 公开暴露程度
    };

    // 评分矩阵
    if (factors.impact === 'CRITICAL' && factors.dataSensitivity === 'HIGH') {
      return 'P0';
    } else if (factors.impact === 'HIGH' || factors.urgency === 'IMMEDIATE') {
      return 'P1';
    } else if (factors.impact === 'MEDIUM') {
      return 'P2';
    } else if (factors.impact === 'LOW') {
      return 'P3';
    }
    return 'P4';
  }
}
```

---

## 合规检查清单

### GDPR 合规检查清单

| 要求 | 实现状态 | 验证方法 | 责任人 |
|-----|---------|---------|--------|
| 数据最小化 | ⬜ | 审查数据收集范围 | 数据保护官 |
| 目的限制 | ⬜ | 检查数据处理目的 | 数据保护官 |
| 存储限制 | ⬜ | 验证数据保留策略 | 数据保护官 |
| 数据准确性 | ⬜ | 实现数据更正机制 | 开发团队 |
| 数据可携带权 | ⬜ | 提供数据导出功能 | 开发团队 |
| 被遗忘权 | ⬜ | 实现数据删除功能 | 开发团队 |
| 隐私设计 | ⬜ | 安全架构审查 | 安全团队 |
| 隐私影响评估 | ⬜ | 定期DPIA评估 | 数据保护官 |
| 数据泄露通知 | ⬜ | 72小时通知流程 | 安全团队 |
| 处理记录 | ⬜ | 维护处理活动记录 | 合规团队 |

### CCPA 合规检查清单

| 要求 | 实现状态 | 验证方法 | 责任人 |
|-----|---------|---------|--------|
| 知情权 | ⬜ | 隐私政策披露 | 法务团队 |
| 删除权 | ⬜ | 数据删除功能 | 开发团队 |
| 选择退出权 | ⬜ | 退出销售机制 | 开发团队 |
| 非歧视 | ⬜ | 服务一致性验证 | 产品团队 |
| 数据销售披露 | ⬜ | 第三方披露清单 | 法务团队 |
| 未成年人保护 | ⬜ | 年龄验证机制 | 开发团队 |

### 安全合规检查清单

| 类别 | 检查项 | 状态 | 备注 |
|-----|-------|-----|------|
| **认证** | 强密码策略 | ⬜ | 最小12字符，复杂度要求 |
| | MFA支持 | ⬜ | TOTP/WebAuthn |
| | 会话管理 | ⬜ | 15分钟超时，安全Cookie |
| | 密码哈希 | ⬜ | Argon2id |
| **授权** | RBAC实现 | ⬜ | 最小权限原则 |
| | API权限控制 | ⬜ | 基于令牌的范围限制 |
| | 权限审计 | ⬜ | 定期访问审查 |
| **加密** | 传输加密 | ⬜ | TLS 1.3 |
| | 存储加密 | ⬜ | AES-256-GCM |
| | 密钥管理 | ⬜ | KMS/Vault |
| **审计** | 访问日志 | ⬜ | 不可篡改存储 |
| | 安全事件日志 | ⬜ | SIEM集成 |
| | 日志保留 | ⬜ | 1年保留期 |
| **基础设施** | 网络隔离 | ⬜ | VPC/安全组 |
| | DDoS防护 | ⬜ | WAF/CDN |
| | 漏洞管理 | ⬜ | 定期扫描 |
| **应用安全** | 输入验证 | ⬜ | 白名单验证 |
| | 输出编码 | ⬜ | 上下文感知编码 |
| | 依赖扫描 | ⬜ | SCA工具集成 |

---

## 总结

本安全架构方案为开放式Web游戏平台提供了全面的安全保障：

### 核心安全策略

1. **零信任沙箱**：采用Firecracker MicroVM + QuickJS双层隔离，确保恶意代码无法逃逸
2. **多层内容审核**：自动化AI审核 + 人工审核 + 用户举报，全方位内容保护
3. **强身份认证**：OAuth2.0 + JWT + RBAC，细粒度权限控制
4. **隐私优先设计**：端到端加密 + GDPR/CCPA合规，保护用户数据
5. **智能防作弊**：服务端验证 + 行为分析 + 机器学习，维护游戏公平性
6. **持续监控**：实时审计日志 + 入侵检测 + 自动化响应

### 技术选型建议

| 组件 | 推荐方案 | 备选方案 |
|-----|---------|---------|
| 沙箱执行 | Firecracker + QuickJS | gVisor + Duktape |
| 身份认证 | OAuth2.0 + JWT (ES256) | Auth0 / Keycloak |
| API网关 | Kong / AWS API Gateway | Nginx + Lua |
| WAF | AWS WAF / Cloudflare | ModSecurity |
| 审计日志 | ELK Stack + S3 Glacier | Splunk |
| 密钥管理 | HashiCorp Vault | AWS KMS |

### 实施路线图

| 阶段 | 时间 | 重点 |
|-----|-----|-----|
| Phase 1 | 1-2月 | 基础沙箱、认证系统、加密 |
| Phase 2 | 3-4月 | 内容审核、API安全、审计日志 |
| Phase 3 | 5-6月 | 防作弊、IDS、事件响应 |
| Phase 4 | 持续 | 监控优化、合规审计、安全培训 |

---

*文档版本：1.0*
*最后更新：2024年*
*分类：机密 - 仅限内部使用*
