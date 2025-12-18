#!/bin/bash

echo "🚀 开始部署前端到后端..."

# 进入前端目录
cd frontend

# 安装依赖（如果需要）
# npm install

# 打包前端
echo "📦 正在打包前端..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ 前端打包成功！"
  echo "📁 文件已输出到: backend/public/"
  
  # 返回根目录
  cd ..
  
  # 进入后端目录
  cd backend
  
  # 编译后端（如果需要）
  echo "🔨 正在编译后端..."
  npm run build
  
  if [ $? -eq 0 ]; then
    echo "✅ 后端编译成功！"
    echo ""
    echo "🎉 部署完成！"
    echo "启动服务器: cd backend && npm start"
    echo "访问地址: http://localhost:3000"
  else
    echo "❌ 后端编译失败！"
    exit 1
  fi
else
  echo "❌ 前端打包失败！"
  exit 1
fi
