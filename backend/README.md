# Backend 使用说明

## 开发模式

```bash
npm install
npm run start:dev
```

## 生产部署

### 1. 完整部署（包含前端）

```bash
# 在 backend 目录执行
npm run deploy

# 或者在项目根目录执行部署脚本
cd ..
./deploy.sh
```

### 2. 仅编译后端

```bash
npm run build
```

### 3. 启动生产服务器

```bash
npm start
```

访问: http://localhost:3000

## 目录结构

```
backend/
├── src/                # 源代码
│   ├── activity/      # 活动查询模块
│   ├── monitor/       # 价格监听模块
│   ├── app.controller.ts   # 静态文件服务
│   ├── app.module.ts
│   └── main.ts
├── data/              # 数据存储
│   └── monitor-tasks.json   # 监听任务数据
├── public/            # 前端打包文件（由 frontend 构建生成）
└── dist/              # 后端编译输出
```

## API 文档

### 活动查询

- `POST /api/activity/query` - 查询活动列表
- `POST /api/activity/detail` - 获取活动详情

### 监听任务

- `POST /api/monitor/task` - 创建监听任务
- `GET /api/monitor/tasks` - 获取所有任务
- `GET /api/monitor/task/:id` - 获取单个任务
- `DELETE /api/monitor/task/:id` - 删除任务
- `POST /api/monitor/task/:id/stop` - 停止任务
- `PATCH /api/monitor/task/:id/price` - 修改目标价格
- `GET /api/monitor/historical/:activityId` - 获取历史成交数据

## 环境要求

- Node.js >= 16
- npm >= 8

## 注意事项

1. 确保 `data` 目录有写入权限
2. 推送通知需要配置 Bark API Key（在 `monitor.service.ts` 中）
3. 生产环境建议使用 PM2 管理进程
