# 部署说明

## 项目结构

```
tantantang/
├── frontend/          # Vue 3 前端项目
├── backend/           # NestJS 后端项目
│   └── public/        # 前端打包文件部署目录（自动生成）
└── deploy.sh          # 一键部署脚本
```

## 开发模式

### 1. 启动后端（端口 3000）

```bash
cd backend
npm install
npm run start:dev
```

### 2. 启动前端（端口 5173）

```bash
cd frontend
npm install
npm run dev
```

访问: http://localhost:5173

## 生产部署

### 方式一：使用部署脚本（推荐）

```bash
# 在项目根目录执行
./deploy.sh
```

该脚本会自动：
1. 打包前端到 `backend/public/`
2. 编译后端代码

### 方式二：手动部署

```bash
# 1. 打包前端
cd frontend
npm run build

# 2. 编译后端
cd ../backend
npm run build

# 3. 启动后端
npm start
```

### 启动生产服务器

```bash
cd backend
npm start
```

访问: http://localhost:3000

## 架构说明

- **静态文件服务**: 后端 NestJS 提供静态文件服务，前端打包文件部署到 `backend/public/`
- **API 路由**: 所有 `/api/*` 路径由后端处理
- **SPA 路由**: 其他路径返回 `index.html`，由前端 Vue Router 处理

## 端口说明

- **开发模式**:
  - 后端: http://localhost:3000
  - 前端: http://localhost:5173
  
- **生产模式**:
  - 统一端口: http://localhost:3000

## 注意事项

1. 打包前端时会自动清空 `backend/public/` 目录
2. API 请求路径统一使用 `/api` 前缀
3. 确保 `backend/data/` 目录有写入权限（用于保存监听任务）
