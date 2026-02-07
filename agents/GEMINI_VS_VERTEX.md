# Gemini API vs Vertex AI - 快速对比

## 📊 应该选择哪个？

| 场景 | 推荐方案 | 原因 |
|:-----|:---------|:-----|
| **本地开发/测试** | Direct Gemini API | 设置简单，5分钟搞定 |
| **小规模生产（<1000用户）** | Direct Gemini API | 免费额度足够 |
| **大规模生产（>1000用户）** | Vertex AI | 更高配额，更好监控 |
| **企业环境** | Vertex AI | 统一账单，SLA保证 |
| **需要数据区域控制** | Vertex AI | 可选择亚洲/欧洲区域 |

---

## 🔍 详细对比

### 1️⃣ Direct Gemini API

**优点** ✅:
- ✅ 设置超简单（只需一个 API Key）
- ✅ 5分钟即可开始测试
- ✅ 免费额度：60 请求/分钟
- ✅ 无需 GCP 项目
- ✅ 适合快速原型开发

**缺点** ❌:
- ❌ 配额较低（免费版）
- ❌ 无企业级监控
- ❌ 无 SLA 保证
- ❌ 数据位置不可控

**设置步骤**:
```bash
# 1. 获取 API Key
# 访问: https://makersuite.google.com/app/apikey

# 2. 配置 .env
echo "GEMINI_API_KEY=AIzaSy..." >> .env
echo "USE_VERTEX_AI=false" >> .env

# 3. 完成！
```

**适合**:
- 个人开发者
- MVP/Demo 项目
- 小规模应用（<100 日活跃用户）

---

### 2️⃣ Vertex AI

**优点** ✅:
- ✅ 更高配额（根据 GCP 项目）
- ✅ 企业级监控（Cloud Monitoring）
- ✅ 99.9% SLA（付费计划）
- ✅ 可选数据区域（亚洲、欧洲等）
- ✅ 统一到 GCP 账单
- ✅ 支持 Private Network（VPC）

**缺点** ❌:
- ❌ 设置复杂（需要 GCP 项目、Service Account）
- ❌ 需要 10-15 分钟设置
- ❌ 需要管理 Service Account 密钥

**设置步骤**:
```bash
# 1. 创建 GCP 项目
gcloud projects create timelog-prod --name="TimeLog Production"

# 2. 启用 Vertex AI API
gcloud services enable aiplatform.googleapis.com --project=timelog-prod

# 3. 创建 Service Account
gcloud iam service-accounts create timelog-agent \
  --project=timelog-prod

# 4. 授权
gcloud projects add-iam-policy-binding timelog-prod \
  --member="serviceAccount:timelog-agent@timelog-prod.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# 5. 创建密钥
gcloud iam service-accounts keys create sa-key.json \
  --iam-account=timelog-agent@timelog-prod.iam.gserviceaccount.com

# 6. 配置 .env
echo "USE_VERTEX_AI=true" >> .env
echo "VERTEX_PROJECT_ID=timelog-prod" >> .env
echo "VERTEX_LOCATION=asia-southeast1" >> .env
echo "GOOGLE_APPLICATION_CREDENTIALS=$(pwd)/sa-key.json" >> .env
```

**适合**:
- 生产环境
- 企业应用
- 需要高可用性
- 需要监控和审计

---

## 💰 成本对比

### Direct Gemini API

**免费额度**:
- 60 请求/分钟
- 无限制（在合理使用范围内）

**付费**:
- 暂无官方付费计划（截至2026年1月）

### Vertex AI

**定价**（Gemini 2.0 Flash）:
| 输入 | 输出 |
|:-----|:-----|
| $0.075 / 1M tokens | $0.30 / 1M tokens |

**实际使用例子**:
```
假设：每天 1000 次对话，每次 10 轮
输入：1000 × 10 × 50 tokens = 500k tokens/天
输出：1000 × 10 × 100 tokens = 1M tokens/天

月成本：
输入：500k × 30 × $0.075 / 1M = $1.13
输出：1M × 30 × $0.30 / 1M = $9.00
总计：~$10/月
```

**非常便宜！** 即使每天 1000 次对话，月成本也只有 $10 左右。

---

## 🔄 迁移路径

### 从 Direct API 迁移到 Vertex AI

**Zero Downtime 迁移**:

```bash
# 1. 设置 Vertex AI（不影响现有系统）
# 按照 VERTEX_AI_SETUP.md 操作

# 2. 更新 .env（保留 GEMINI_API_KEY 作为备用）
USE_VERTEX_AI=true
GEMINI_API_KEY=your-old-key  # 保留作为 fallback
VERTEX_PROJECT_ID=your-project
VERTEX_LOCATION=asia-southeast1
GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa-key.json

# 3. 测试（先在开发环境）
python story_agent.py start

# 4. 观察日志
# 应该看到: "Using Vertex AI: project=..."

# 5. 生产部署
# 成功后，可以删除 GEMINI_API_KEY
```

**Rollback Plan**:
```bash
# 如果 Vertex AI 有问题，立即回滚
USE_VERTEX_AI=false
# Agent 会自动使用 GEMINI_API_KEY
```

---

## 🎯 推荐配置

### 开发环境
```bash
USE_VERTEX_AI=false
GEMINI_API_KEY=AIzaSy...
```

### 生产环境
```bash
USE_VERTEX_AI=true
VERTEX_PROJECT_ID=timelog-prod-123456
VERTEX_LOCATION=asia-southeast1  # 更靠近泰国用户
GOOGLE_APPLICATION_CREDENTIALS=/app/sa-key.json
```

### 混合环境（最安全）
```bash
# 主要使用 Vertex AI
USE_VERTEX_AI=true
VERTEX_PROJECT_ID=timelog-prod-123456

# 保留 Direct API 作为 fallback
GEMINI_API_KEY=AIzaSy...
```

**Agent 代码可以添加自动 fallback**:
```python
try:
    # 尝试 Vertex AI
    response = vertex_model.generate_content(prompt)
except Exception as e:
    logger.warning(f"Vertex AI failed: {e}, falling back to Direct API")
    response = gemini_model.generate_content(prompt)
```

---

## 📚 更多资源

- [Vertex AI 完整设置指南](VERTEX_AI_SETUP.md)
- [Vertex AI 定价计算器](https://cloud.google.com/products/calculator)
- [Gemini API 文档](https://ai.google.dev/docs)
- [Vertex AI 文档](https://cloud.google.com/vertex-ai/docs)

---

**我的建议**：
1. **现在**：用 Direct API 快速开始开发
2. **MVP 阶段**：继续用 Direct API
3. **正式上线前**：迁移到 Vertex AI
4. **长期**：使用 Vertex AI + Direct API fallback（最稳定）

需要帮助？查看 [VERTEX_AI_SETUP.md](VERTEX_AI_SETUP.md) 获取详细步骤！ 🚀
