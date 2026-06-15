# ============================================
# Cloud Run 部署配置
# 后端容器化并部署到 Google Cloud Run（免费额度内）
# ============================================

# 构建并推送
# gcloud builds submit --tag gcr.io/[PROJECT-ID]/civil-backend

# 部署
# gcloud run deploy civil-backend \
#   --image gcr.io/[PROJECT-ID]/civil-backend \
#   --platform managed \
#   --region asia-east1 \
#   --allow-unauthenticated \
#   --set-env-vars-file=.env.cloud \
#   --memory 512Mi \
#   --cpu 1 \
#   --max-instances 2
