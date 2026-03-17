#!/bin/bash
# Vercel 部署脚本 for Manus-style

echo "🚀 开始部署 Manus-style 到 Vercel..."

cd ~/projects/manus-style

# 检查 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "📦 安装 Vercel CLI..."
    npm install -g vercel
fi

# 登录（如需要）
# vercel login

# 部署
echo "🚀 部署中..."
vercel --prod

echo "✅ 部署完成！"
echo ""
echo "📝 下次部署只需运行: cd ~/projects/manus-style && vercel --prod"
