# 快速开始

## 🚀 一键部署（推荐）

```bash
# 在项目根目录执行
./deploy.sh

# 然后启动服务器
cd backend
npm start
```

访问: http://localhost:3000

## 📦 手动部署

### 1. 前端打包

```bash
cd frontend
npm install
npm run build
```

### 2. 后端编译

```bash
cd backend
npm install
npm run build
```

### 3. 启动服务器

```bash
npm start
```

## 🔧 开发模式

### 后端（端口 3000）

```bash
cd backend
npm install
npm run start:dev
```

### 前端（端口 5173）

```bash
cd frontend
npm install
npm run dev
```

## 🌐 访问地址

- **生产环境**: http://localhost:3000
- **开发环境**: http://localhost:5173
- **API 接口**: http://localhost:3000/api

## 📝 使用 PM2（推荐生产环境）

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
cd backend
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs activity-monitor

# 停止应用
pm2 stop activity-monitor

# 重启应用
pm2 restart activity-monitor
```

## 🎯 功能说明

1. **活动查询** - 搜索和查看商品活动
2. **价格监听** - 监听商品价格，达到目标价格时推送通知
3. **历史记录** - 查看每日成交价格记录
4. **价格提醒** - 通过 Bark API 推送到手机

## ⚙️ 配置说明

### 推送通知配置

编辑 `backend/src/monitor/monitor.service.ts`:

```typescript
private readonly NOTIFY_URL = 'https://api.day.app/YOUR_KEY';
```

将 `YOUR_KEY` 替换为你的 Bark API Key

## 📂 数据存储

监听任务数据保存在: `backend/data/monitor-tasks.json`

## 🔍 常见问题

### 端口被占用

修改 `backend/src/main.ts` 中的端口号:

```typescript
await app.listen(3000); // 改为其他端口
```

### 前端打包失败

确保 Node.js 版本 >= 16

### 无法推送通知

检查 Bark API Key 是否正确配置

## 📖 更多文档

- [部署说明](./DEPLOY.md)
- [后端文档](./backend/README.md)
