# LearningHub 云服务器部署指南

## 项目概述

- **前端框架**: TanStack Start (React 19 + SSR)
- **后端服务**: Convex (云数据库)
- **包管理器**: Bun
- **构建工具**: Vite
- **部署方式**: Node.js 应用

## 环境要求

### 云服务器最低配置

- **OS**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **Node.js**: v18+ (建议 v20+)
- **Bun**: 最新版本 (或使用 npm/yarn)
- **内存**: 2GB 最低 (4GB+ 建议)
- **磁盘**: 10GB+ 自由空间

## 完整部署步骤

### 第1步：服务器初始化

```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 安装 Node.js (以 Ubuntu 为例)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 Bun (可选，但项目推荐使用)
curl -fsSL https://bun.sh/install | bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# 验证安装
node --version
bun --version
```

### 第2步：克隆项目并安装依赖

```bash
# 克隆项目
git clone <your-repository-url> clawhub
cd clawhub

# 安装依赖 (使用 Bun)
bun install

# 或使用 npm (如果未安装 Bun)
npm install
```

### 第3步：环境配置

```bash
# 复制环境文件模板
cp .env.local.example .env.local

# 编辑 .env.local，配置以下变量
nano .env.local
```

**必需的环境变量**:

```env
# Frontend
VITE_CONVEX_URL=https://your-convex-deployment.convex.cloud
VITE_CONVEX_SITE_URL=https://your-site.com
VITE_SITE_MODE=skills  # 或 souls

# Convex 部署 URL
CONVEX_SITE_URL=https://your-convex-deployment.convex.cloud

# 生产环境 URL
SITE_URL=https://your-site.com

# (可选) Embeddings API 密钥
OPENAI_API_KEY=your-openai-api-key
```

### 第4步：Convex 后端配置

```bash
# 登录 Convex
npx convex login

# 初始化 Convex 项目 (或关联现有项目)
npx convex env prod

# 部署后端函数到生产环境
npx convex deploy --prod
```

### 第5步：构建前端

```bash
# 使用 Bun 构建
bun run build

# 或使用 npm
npm run build

# 构建输出将在 dist/ 目录中
```

### 第6步：启动应用

#### 选项 A: 直接运行 (开发/测试)

```bash
# 使用 Bun
bun run preview

# 或使用 npm
npm run preview
```

#### 选项 B: 使用 PM2 管理后台进程 (推荐生产环境)

```bash
# 全局安装 PM2
sudo npm install -g pm2

# 创建启动脚本
cat > server.js << 'EOF'
import { build } from 'vite';
import { createServer } from 'http';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// 提供静态文件
app.use(express.static('dist/client'));

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
EOF

# 使用 PM2 启动
pm2 start server.js --name "clawhub"
pm2 save
pm2 startup

# 查看日志
pm2 logs clawhub
```

#### 选项 C: Docker 容器化 (推荐)

创建 `Dockerfile`:

```dockerfile
FROM node:20-slim

WORKDIR /app

# 安装 Bun
RUN npm install -g bun

# 复制项目文件
COPY package.json bun.lockb ./
COPY packages ./packages
COPY src ./src
COPY convex ./convex
COPY public ./public
COPY vite.config.ts tsconfig.json ./
COPY scripts ./scripts

# 安装依赖
RUN bun install --frozen-lockfile

# 构建
RUN bun run build

# 暴露端口
EXPOSE 3000

# 启动
CMD ["bun", "run", "preview"]
```

构建和运行 Docker 镜像:

```bash
# 构建镜像
docker build -t clawhub:latest .

# 运行容器
docker run -p 3000:3000 \
  -e VITE_CONVEX_URL=https://your-convex.convex.cloud \
  -e VITE_SITE_MODE=skills \
  --name clawhub \
  clawhub:latest

# 后台运行
docker run -d -p 3000:3000 \
  -e VITE_CONVEX_URL=https://your-convex.convex.cloud \
  --name clawhub \
  clawhub:latest
```

### 第7步：配置反向代理 (Nginx)

```bash
# 安装 Nginx
sudo apt install -y nginx

# 创建配置文件
sudo nano /etc/nginx/sites-available/clawhub
```

配置内容:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL 证书配置 (使用 Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # 反向代理
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置:

```bash
sudo ln -s /etc/nginx/sites-available/clawhub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 安装 SSL 证书 (Let's Encrypt)
sudo apt install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com
```

### 第8步：监控和维护

```bash
# 查看应用日志
pm2 logs clawhub

# 查看资源使用
pm2 monit

# 设置自动重启
pm2 restart clawhub --cron "0 3 * * *"  # 每天凌晨3点重启

# 导出 PM2 启动配置
pm2 save
pm2 startup
```

## 部署脚本自动化

创建 `deploy.sh`:

```bash
#!/bin/bash

set -e

echo "🚀 开始部署 ClawHub..."

# 1. 更新代码
echo "📥 更新代码..."
git pull origin main

# 2. 安装依赖
echo "📦 安装依赖..."
bun install

# 3. 构建
echo "🔨 构建项目..."
bun run build

# 4. 部署后端
echo "☁️  部署 Convex 后端..."
npx convex deploy --prod

# 5. 重启应用
echo "🔄 重启应用..."
pm2 restart clawhub

echo "✅ 部署完成！"
```

运行部署脚本:

```bash
chmod +x deploy.sh
./deploy.sh
```

## 性能优化建议

### 1. 启用 Gzip 压缩

在 Nginx 配置中添加:

```nginx
gzip on;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript;
gzip_min_length 1000;
```

### 2. 缓存静态资源

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. 内存优化

```bash
# 增加 Node.js 堆内存限制
NODE_OPTIONS=--max_old_space_size=2048 pm2 start server.js
```

## 故障排查

### 问题：构建失败

```bash
# 清除缓存并重新安装
rm -rf node_modules
rm bun.lockb
bun install
bun run build
```

### 问题：端口被占用

```bash
# 查找并停止占用端口的进程
sudo lsof -i :3000
sudo kill -9 <PID>
```

### 问题：环境变量未生效

```bash
# 检查 .env.local 是否正确加载
# 确保在构建前设置环境变量
export VITE_CONVEX_URL=...
bun run build
```

## 性能监控

```bash
# 使用 New Relic 或类似服务
# 1. 安装 agent
npm install newrelic

# 2. 在应用启动前引入
# require('newrelic')

# 3. 配置 newrelic.js
# 并设置许可证密钥
```

## 备份和恢复

```bash
# 备份 Convex 数据
npx convex export > backup.zip

# 恢复数据
npx convex import backup.zip
```

## 成本估算 (2024年参考)


| 服务               | 预计月成本       |
| ---------------- | ----------- |
| VPS (2GB, 2核)    | $5-15       |
| Convex (免费层)     | $0          |
| Convex (付费)      | $50-200+    |
| CDN (Cloudflare) | $0-20       |
| **总计**           | **$5-235+** |


## 参考资源

- [Vite 构建指南](https://vitejs.dev/guide/build.html)
- [TanStack Start 部署](https://tanstack.com/start/latest/docs/guide/deployment)
- [Convex 部署](https://docs.convex.dev/production)
- [Nginx 配置指南](https://nginx.org/en/docs/)
- [PM2 文档](https://pm2.keymetrics.io/docs/usage/pm2-doc-single-page/)

