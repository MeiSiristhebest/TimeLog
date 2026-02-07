# Vertex AI 配置指南

## 🎯 为什么使用 Vertex AI？

| 特性 | Direct Gemini API | Vertex AI |
|:-----|:------------------|:----------|
| **配额** | 60 请求/分钟（免费） | 更高（根据 GCP 项目） |
| **监控** | 基础 | 企业级（Cloud Monitoring） |
| **计费** | 按使用量 | 统一到 GCP 账单 |
| **SLA** | 无 | 99.9%（付费计划） |
| **数据位置** | 全球 | 可选区域（us-central1, asia-southeast1 等） |
| **适用场景** | 开发/测试 | 生产环境 |

**推荐**：开发用 Direct API，生产用 Vertex AI

---

## 🚀 快速设置（5 分钟）

### 步骤 1: 创建 GCP 项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com)
2. 点击项目下拉菜单 → "新建项目"
3. 项目名称：`timelog-production`
4. 点击"创建"
5. **记住项目 ID**（例如：`timelog-prod-123456`）

### 步骤 2: 启用 Vertex AI API

```bash
# 安装 gcloud CLI (如果还没有)
# macOS:
brew install google-cloud-sdk

# Windows:
# 下载 https://cloud.google.com/sdk/docs/install

# 启用 Vertex AI API
gcloud services enable aiplatform.googleapis.com --project=timelog-prod-123456
```

**或通过 Web Console**：
1. 进入 [API Library](https://console.cloud.google.com/apis/library)
2. 搜索 "Vertex AI API"
3. 点击"启用"

### 步骤 3: 创建 Service Account

```bash
# 创建 Service Account
gcloud iam service-accounts create timelog-agent \
  --display-name="TimeLog Agent" \
  --project=timelog-prod-123456

# 授予权限
gcloud projects add-iam-policy-binding timelog-prod-123456 \
  --member="serviceAccount:timelog-agent@timelog-prod-123456.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# 创建密钥文件
gcloud iam service-accounts keys create ~/timelog-sa-key.json \
  --iam-account=timelog-agent@timelog-prod-123456.iam.gserviceaccount.com
```

### 步骤 4: 配置环境变量

编辑 `agents/.env`:

```bash
# Option 2: Vertex AI (Recommended for production)
USE_VERTEX_AI=true
VERTEX_PROJECT_ID=timelog-prod-123456
VERTEX_LOCATION=us-central1  # 或 asia-southeast1 (更靠近泰国)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/timelog-sa-key.json
```

**可选区域**：
- `us-central1`: 美国中部（通用）
- `asia-southeast1`: 新加坡（亚洲最近）
- `europe-west1`: 比利时（欧洲）

### 步骤 5: 测试连接

```bash
cd agents
source venv/bin/activate
python -c "
import vertexai
from vertexai.preview.generative_models import GenerativeModel

vertexai.init(project='timelog-prod-123456', location='us-central1')
model = GenerativeModel('gemini-2.0-flash-exp')
response = model.generate_content('Hello')
print(response.text)
"
```

**预期输出**：
```
Hello! How can I help you today?
```

✅ **如果看到这个，说明 Vertex AI 配置成功！**

---

## 🔧 环境变量完整示例

### Option 1: Direct Gemini API（开发环境）

```bash
# LiveKit
LIVEKIT_URL=wss://time-log-wuk3kw5e.livekit.cloud
LIVEKIT_API_KEY=API5pvKHSbvamGw
LIVEKIT_API_SECRET=your-secret

# Deepgram
DEEPGRAM_API_KEY=your-deepgram-key

# Gemini - Direct API
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX
USE_VERTEX_AI=false
```

### Option 2: Vertex AI（生产环境）

```bash
# LiveKit
LIVEKIT_URL=wss://time-log-wuk3kw5e.livekit.cloud
LIVEKIT_API_KEY=API5pvKHSbvamGw
LIVEKIT_API_SECRET=your-secret

# Deepgram
DEEPGRAM_API_KEY=your-deepgram-key

# Gemini - Vertex AI
USE_VERTEX_AI=true
VERTEX_PROJECT_ID=timelog-prod-123456
VERTEX_LOCATION=asia-southeast1
GOOGLE_APPLICATION_CREDENTIALS=/home/agent/timelog-sa-key.json
```

---

## 🐳 Docker 部署（Vertex AI）

### Dockerfile 修改

在 `agents/Dockerfile` 中添加 Service Account 密钥：

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY story_agent.py .
COPY prompts.py .

# Copy Service Account key
COPY timelog-sa-key.json /app/timelog-sa-key.json

ENV PYTHONUNBUFFERED=1
ENV GOOGLE_APPLICATION_CREDENTIALS=/app/timelog-sa-key.json

CMD ["python", "story_agent.py", "start"]
```

### 构建和运行

```bash
# 复制 Service Account 密钥到 agents 目录
cp ~/timelog-sa-key.json agents/

# 构建镜像
docker build -t timelog-agent:vertex-ai .

# 运行容器
docker run \
  --env-file .env \
  -e USE_VERTEX_AI=true \
  -e VERTEX_PROJECT_ID=timelog-prod-123456 \
  -e VERTEX_LOCATION=asia-southeast1 \
  timelog-agent:vertex-ai
```

---

## 📊 监控和日志

### Cloud Logging

在 GCP Console 查看 Agent 调用日志：

1. 进入 [Logs Explorer](https://console.cloud.google.com/logs)
2. 过滤器：
```
resource.type="aiplatform.googleapis.com/Endpoint"
resource.labels.model_id="gemini-2.0-flash-exp"
```

### Cloud Monitoring

查看 API 使用量和延迟：

1. 进入 [Monitoring](https://console.cloud.google.com/monitoring)
2. 创建 Dashboard
3. 添加图表：
   - API 调用次数
   - 延迟（P50, P95, P99）
   - 错误率

---

## 💰 成本估算

### Vertex AI Gemini 定价（2026年1月）

| 模型 | 输入 | 输出 |
|:-----|:-----|:-----|
| Gemini 2.0 Flash | $0.075 / 1M tokens | $0.30 / 1M tokens |

### 实际使用估算

**假设**：
- 每次对话 10 轮
- 每轮输入 50 tokens，输出 100 tokens
- 每天 100 次对话

**每月成本**：
```
输入: 100 对话 × 10 轮 × 50 tokens × 30 天 = 1.5M tokens
     1.5M × $0.075 = $0.11

输出: 100 对话 × 10 轮 × 100 tokens × 30 天 = 3M tokens
     3M × $0.30 = $0.90

总计: $1.01/月
```

**非常便宜！** 🎉

---

## 🔐 安全最佳实践

### 1. 限制 Service Account 权限

```bash
# 只授予必要的权限（而不是 roles/owner）
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:SA_EMAIL" \
  --role="roles/aiplatform.user"  # 只能使用 AI Platform
```

### 2. 使用 Secret Manager（生产环境）

```bash
# 启用 Secret Manager
gcloud services enable secretmanager.googleapis.com

# 存储 Service Account 密钥
gcloud secrets create timelog-sa-key \
  --data-file=timelog-sa-key.json

# Agent 运行时从 Secret Manager 读取
```

### 3. 定期轮换密钥

```bash
# 每 90 天轮换一次
gcloud iam service-accounts keys create NEW-KEY.json \
  --iam-account=SA_EMAIL

# 删除旧密钥
gcloud iam service-accounts keys delete OLD-KEY-ID \
  --iam-account=SA_EMAIL
```

### 4. 限制网络访问

在 GCP 中设置 VPC Service Controls，限制 Vertex AI 只能从特定 IP 访问。

---

## 🐛 常见问题

### Q: `Permission denied` 错误

**错误**:
```
google.api_core.exceptions.PermissionDenied: 403 Permission denied on resource project timelog-prod-123456
```

**解决**:
```bash
# 检查 Service Account 权限
gcloud projects get-iam-policy PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:SA_EMAIL"

# 添加权限
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:SA_EMAIL" \
  --role="roles/aiplatform.user"
```

### Q: `API not enabled` 错误

**错误**:
```
google.api_core.exceptions.FailedPrecondition: 400 Vertex AI API has not been used in project...
```

**解决**:
```bash
gcloud services enable aiplatform.googleapis.com --project=PROJECT_ID
```

### Q: Service Account 密钥文件找不到

**错误**:
```
google.auth.exceptions.DefaultCredentialsError: File /path/to/key.json does not exist
```

**解决**:
1. 检查路径是否正确：`ls -l /path/to/key.json`
2. 检查 `GOOGLE_APPLICATION_CREDENTIALS` 环境变量
3. Docker 容器内确保密钥已复制

### Q: 延迟太高

**问题**: Vertex AI 响应时间 > 3 秒

**解决**:
1. 选择更近的区域（例如：`asia-southeast1` 而不是 `us-central1`）
2. 使用更快的模型（`gemini-2.0-flash-exp` 已经是最快的）
3. 检查网络连接

---

## 📚 参考资源

- [Vertex AI 文档](https://cloud.google.com/vertex-ai/docs)
- [Gemini API 参考](https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini)
- [Service Account 最佳实践](https://cloud.google.com/iam/docs/best-practices-service-accounts)
- [定价计算器](https://cloud.google.com/products/calculator)

---

**准备好了吗？运行 `bash setup.sh` 并选择 Vertex AI 模式！** 🚀
