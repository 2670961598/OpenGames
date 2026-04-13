# 2026-04-13 03:16 - Fix history timezone check in Actions

## 提交信息
```
Commit: <待生成>
Author: Ye QingXin
Date: 2026-04-13 03:16:00 -0700
Branch: fix/history-timezone-check
```

## 变更概述
修复 GitHub Actions 中 history 文档时间检查的时区问题。原脚本通过解析文件名时间进行判断，在本地（PDT）与 GitHub Actions（UTC）环境下产生 7 小时偏差，导致合法的 history 文件被误判为过期。

## 修改文件

### CI/CD 配置
- `.github/workflows/scope-check.yml`
  - 将文件名解析时间改为 `git log --format=%ct` 获取文件 commit 时间
  - 统一使用 `date -u` 确保 UTC 时间比较
  - 更新错误提示信息，明确使用 UTC 时间

## 问题分析

### 失败原因
- 文件名时间 `2026-04-13_0311` 按 PDT 生成
- GitHub Actions 运行在 UTC 环境
- `date -d "2026-04-13 03:11"` 被解析为 UTC 03:11，比实际时间早 7 小时
- 结果超出 `three_hours_ago` 阈值，检查失败

### 修复方案
使用 `git log --format=%ct` 直接获取文件最后一次 commit 的 Unix 时间戳，与当前 UTC 时间比较，避免时区差异问题。

## 关联任务
- [FIX-002] 修复 history 时间检查的时区偏差
