#!/bin/bash
# OCI ARM 서버 배포 스크립트
# Usage: ./deploy.sh

set -e

SERVER_IP="134.185.117.58"
SSH_KEY="~/.ssh/oci_arm"
SSH_USER="ubuntu"
REMOTE_DIR="/opt/running-manager"
SSH_CMD="ssh -i $SSH_KEY $SSH_USER@$SERVER_IP"

echo "=== Deploying to $SERVER_IP ==="

# 1. 프로젝트 파일 전송
echo "[1/4] Syncing project files..."
rsync -avz --delete \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '__pycache__' \
    --exclude '.venv' \
    --exclude 'data' \
    --exclude 'terraform' \
    --exclude '.my-docs' \
    --exclude '*.db' \
    --exclude '.env.local' \
    --exclude '.DS_Store' \
    -e "ssh -i $SSH_KEY" \
    ./ $SSH_USER@$SERVER_IP:$REMOTE_DIR/

# 2. .env.prd → .env
echo "[2/4] Setting up environment..."
$SSH_CMD "cp $REMOTE_DIR/.env.prd $REMOTE_DIR/.env"

# 3. Docker Compose build & up
echo "[3/4] Building and starting containers..."
$SSH_CMD "cd $REMOTE_DIR && docker compose --env-file .env up --build -d"

# 4. 상태 확인
echo "[4/4] Checking status..."
sleep 10
$SSH_CMD "cd $REMOTE_DIR && docker compose ps"

echo ""
echo "=== Deploy complete ==="
echo "Frontend: http://$SERVER_IP:3000"
echo "Backend:  http://$SERVER_IP:8000/docs"
