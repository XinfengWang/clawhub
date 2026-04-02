# 快速部署命令速查表 (Node.js + pnpm)

## 一键部署 (推荐 - Ubuntu/Debian)

### 前置条件
- Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- 2GB+ RAM，10GB+ 磁盘空间
- `curl` 和 `git` 已安装

### 完整一键部署脚本

```bash
#!/bin/bash
# 保存为 deploy.sh，然后运行: bash deploy.sh

set -e

echo "🚀 开始部署 LearningHub..."

# 1. 系统更新
echo "🔧 [1/9] 系统准备..."
sudo apt-get update
sudo apt-get upgrade -y

# 2. 安装 Node.js 20
echo "🔧 [2/9] 安装 Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. 安装 pnpm
echo "🔧 [3/9] 安装 pnpm..."
npm install -g pnpm
pnpm --version

# 4. 克隆项目
echo "📥 [4/9] 克隆项目..."
git clone https://github.com/XinfengWang/clawhub.git /opt/learninghub
cd /opt/learninghub

# 5. 安装依赖
echo "📦 [5/9] 安装依赖..."
pnpm install

# 6. 配置环境变量
echo "⚙️  [6/9] 配置环境变量..."
cat > .env.local << 'EOF'
VITE_CONVEX_URL=https://your-project.convex.cloud
VITE_SITE_MODE=skills
SITE_URL=https://your-domain.com
CONVEX_SITE_URL=https://your-project.convex.cloud
EOF

echo "⚠️  请编辑 /opt/learninghub/.env.local 并设置正确的 VITE_CONVEX_URL"

# 7. 构建
echo "🔨 [7/9] 构建项目..."
pnpm run build

# 8. 安装 PM2 和 Nginx
echo "⚙️  [8/9] 安装 PM2 和 Nginx..."
sudo npm install -g pm2
sudo apt-get install -y nginx

# 9. 配置 PM2
echo "⚙️  [9/9] 配置 PM2..."
pm2 start "pnpm run preview" --name "learninghub" --cwd /opt/learninghub
pm2 save
sudo pm2 startup -u $USER

# 10. 配置 Nginx
echo "🌐 配置 Nginx..."
sudo tee /etc/nginx/sites-available/learninghub > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

    # 反向代理到 Node.js 应用
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
EOF

sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/learninghub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

echo ""
echo "✅ 部署完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 后续步骤："
echo ""
echo "1️⃣  编辑环境变量:"
echo "   nano /opt/learninghub/.env.local"
echo "   # 设置 VITE_CONVEX_URL 为你的 Convex 部署 URL"
echo ""
echo "2️⃣  部署 Convex 后端:"
echo "   cd /opt/learninghub"
echo "   npx convex login"
echo "   npx convex deploy --prod"
echo ""
echo "3️⃣  重新构建并重启:"
echo "   pnpm run build"
echo "   pm2 restart learninghub"
echo ""
echo "4️⃣  查看应用状态:"
echo "   pm2 logs learninghub"
echo "   pm2 monit"
echo ""
echo "📊 访问地址: http://$(hostname -I | awk '{print $1}')"
echo "🆘 遇到问题? 查看文档: DEPLOYMENT.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

## 分步命令 (Node.js + pnpm)

### 开发环境

```bash
# 1. 安装依赖
pnpm install

# 2. 启动开发服务器 (终端 1)
pnpm run dev
# 访问 http://localhost:3001

# 3. 启动 Convex 后端 (终端 2)
npx convex dev
```

### 构建命令

```bash
# 构建生产版本
pnpm run build

# 预览构建结果 (本地测试)
pnpm run preview
# 访问 http://localhost:4173

# 查看构建输出大小
du -sh dist/
du -sh .output/

# 清除构建缓存并重新构建
rm -rf dist/ .output/ node_modules
pnpm install
pnpm run build
```

### 后端部署 (Convex)

```bash
# 首次登录 Convex (交互式)
npx convex login

# 查看当前部署状态
npx convex status

# 部署函数到生产环境
npx convex deploy --prod

# 部署到生产环境 (跳过类型检查，加快速度)
npx convex deploy --prod --typecheck=disable

# 导出数据备份
npx convex export > convex-backup-$(date +%Y%m%d).zip

# 导入数据恢复
npx convex import backup.zip

# 查看部署历史
npx convex deployment list
```

### 服务器运行方式

#### 方式 1: 直接前台运行 (测试/开发)

```bash
cd /opt/learninghub
pnpm run preview
# 访问 http://localhost:4173 (或 http://localhost:3000 通过 Nginx)
# Ctrl+C 停止
```

#### 方式 2: 使用 PM2 (推荐生产)

```bash
# 启动应用
pm2 start "pnpm run preview" --name "learninghub" --cwd /opt/learninghub

# 查看所有应用
pm2 list

# 查看应用日志
pm2 logs learninghub

# 实时监控
pm2 monit

# 停止应用
pm2 stop learninghub

# 重启应用
pm2 restart learninghub

# 删除应用
pm2 delete learninghub

# 设置开机自启
pm2 save
sudo pm2 startup -u $USER

# 清除开机自启
pm2 unstartup
```

#### 方式 3: 使用 systemd 服务

```bash
# 创建 systemd 服务文件
sudo tee /etc/systemd/system/learninghub.service > /dev/null << 'EOF'
[Unit]
Description=LearningHub Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/learninghub
ExecStart=/usr/local/bin/pnpm run preview
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 启用服务
sudo systemctl daemon-reload
sudo systemctl enable learninghub
sudo systemctl start learninghub

# 查看状态
sudo systemctl status learninghub

# 查看日志
sudo journalctl -u learninghub -f
```

### Docker 部署 (Node.js 20 + pnpm)

#### 本地构建测试

```bash
# 构建 Docker 镜像
docker build -t learninghub:latest .

# 运行容器 (前台，便于调试)
docker run -it --rm \
  -p 3000:3000 \
  -e VITE_CONVEX_URL=https://your-convex-url.convex.cloud \
  -e VITE_SITE_MODE=skills \
  learninghub:latest

# 运行容器 (后台)
docker run -d \
  -p 3000:3000 \
  -e VITE_CONVEX_URL=https://your-convex-url.convex.cloud \
  -e VITE_SITE_MODE=skills \
  --name learninghub \
  learninghub:latest

# 查看容器日志
docker logs -f learninghub

# 进入容器调试
docker exec -it learninghub sh

# 停止容器
docker stop learninghub

# 启动容器
docker start learninghub

# 删除容器
docker rm learninghub
```

#### Docker Compose 部署 (推荐)

```bash
# 创建 docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  learninghub:
    build: .
    ports:
      - "3000:3000"
    environment:
      VITE_CONVEX_URL: https://your-project.convex.cloud
      VITE_SITE_MODE: skills
      SITE_URL: https://your-domain.com
      NODE_ENV: production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - learninghub-network

  # 可选: Nginx 反向代理
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - learninghub
    restart: unless-stopped
    networks:
      - learninghub-network

networks:
  learninghub-network:
    driver: bridge
EOF

# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f learninghub

# 停止服务
docker-compose stop

# 重启服务
docker-compose restart

# 完全删除 (包括数据卷)
docker-compose down -v

# 重新构建镜像
docker-compose up -d --build
```

#### 推送到容器仓库

```bash
# 登录 Docker Hub
docker login

# 标记镜像
docker tag learninghub:latest your-username/learninghub:latest
docker tag learninghub:latest your-username/learninghub:v1.0.0

# 推送到 Docker Hub
docker push your-username/learninghub:latest
docker push your-username/learninghub:v1.0.0

# 在服务器上拉取并运行
docker run -d \
  -p 3000:3000 \
  -e VITE_CONVEX_URL=https://your-convex-url.convex.cloud \
  your-username/learninghub:latest
```

### 监控和维护

```bash
# 查看磁盘使用
df -h
du -sh /opt/clawhub

# 查看内存使用
free -h

# 查看进程
ps aux | grep clawhub

# 查看网络连接
netstat -tlnp | grep 3000

# 更新系统
sudo apt update && sudo apt upgrade -y

# 重启服务器
sudo reboot
```

### 故障排查

#### 常见问题

```bash
# 1. 检查端口是否被占用
sudo lsof -i :3000
sudo lsof -i :80

# 2. 停止占用端口的进程
sudo kill -9 <PID>

# 3. 检查 Nginx 配置是否正确
sudo nginx -t

# 4. 重启 Nginx
sudo systemctl restart nginx

# 5. 查看 Nginx 错误日志
sudo tail -100 /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# 6. 查看应用错误日志
pm2 logs learninghub --err
pm2 logs learninghub | grep -i error

# 7. 检查磁盘空间是否足够
df -h

# 8. 检查内存使用
free -h
pm2 monit

# 9. 完全重新构建
cd /opt/learninghub
rm -rf node_modules dist .output pnpm-lock.yaml
pnpm install
pnpm run build
pm2 restart learninghub
```

#### 应用启动失败

```bash
# 检查错误信息
pm2 logs learninghub

# 验证环境变量
cat .env.local

# 手动运行查看错误
cd /opt/learninghub
pnpm run preview

# 检查 Node.js 版本
node --version  # 应该是 v20+

# 检查 pnpm 是否正确安装
pnpm --version
which pnpm
```

#### 构建失败

```bash
# 清除缓存并重新安装
cd /opt/learninghub
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 强制安装
pnpm install --force

# 检查磁盘空间
df -h

# 检查是否有权限问题
ls -la /opt/learninghub
```

#### 访问页面 503 错误

```bash
# 检查应用是否在运行
pm2 list
curl -I http://localhost:3000

# 检查应用日志
pm2 logs learninghub

# 重启应用
pm2 restart learninghub

# 检查 Nginx 代理配置
sudo cat /etc/nginx/sites-enabled/learninghub

# 测试代理连接
curl http://localhost:3000
curl http://localhost
```

#### 内存不足

```bash
# 检查内存使用
pm2 monit
free -h

# 增加 Node.js 堆内存限制
export NODE_OPTIONS=--max_old_space_size=2048
pm2 restart learninghub

# 或在 PM2 启动配置中设置
pm2 start "pnpm run preview" \
  --name "learninghub" \
  --node-args="--max_old_space_size=2048"

# 配置系统 swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 环境变量配置

```bash
# .env.local 文件模板
VITE_CONVEX_URL=https://your-project.convex.cloud
VITE_CONVEX_SITE_URL=https://your-domain.com
VITE_SITE_MODE=skills
SITE_URL=https://your-domain.com
CONVEX_SITE_URL=https://your-project.convex.cloud
OPENAI_API_KEY=sk-...  # 可选
```

## 性能检查

```bash
# 检查构建大小
du -sh .output/
du -sh dist/ 2>/dev/null || echo "dist 目录不存在"

# 查看构建时间
time pnpm run build

# 测试应用响应
curl http://localhost:3000
curl -I http://localhost:3000  # 只查看 headers

# 压力测试 (需要 Apache Bench)
ab -n 1000 -c 10 http://localhost:3000/
```

## 常用部署场景

### 场景 1: 更新代码并部署新版本

```bash
cd /opt/learninghub

# 拉取最新代码
git pull origin main

# 安装新的依赖
pnpm install

# 构建
pnpm run build

# 部署后端 (如果 Convex 函数有变化)
npx convex deploy --prod --typecheck=disable

# 重启应用
pm2 restart learninghub

# 验证
pm2 logs learninghub
curl http://localhost
```

### 场景 2: 修改环境变量

```bash
cd /opt/learninghub

# 编辑环境变量
nano .env.local
# 修改 VITE_CONVEX_URL、SITE_URL 等

# 重新构建 (环境变量在构建时被编入)
pnpm run build

# 重启应用
pm2 restart learninghub

# 验证
pm2 logs learninghub
```

### 场景 3: 监控应用运行状态

```bash
# 查看进程列表
pm2 list

# 实时监控 CPU、内存使用
pm2 monit

# 查看详细日志
pm2 logs learninghub

# 查看最后 100 行日志
pm2 logs learninghub --lines 100

# 只查看错误日志
pm2 logs learninghub --err

# 查看特定时间的日志
pm2 logs learninghub | grep "2024-04"
```

### 场景 4: 紧急回滚到上一版本

```bash
cd /opt/learninghub

# 查看提交历史
git log --oneline -10

# 回滚到上一个提交
git revert HEAD
# 或直接回到某个提交
git reset --hard <commit-hash>

# 重新安装依赖
pnpm install

# 重新构建
pnpm run build

# 部署后端
npx convex deploy --prod --typecheck=disable

# 重启
pm2 restart learninghub
```

### 场景 5: 数据备份和恢复

```bash
# 备份项目文件
tar -czf learninghub-backup-$(date +%Y%m%d-%H%M%S).tar.gz /opt/learninghub

# 备份 Convex 数据库
cd /opt/learninghub
npx convex export > convex-backup-$(date +%Y%m%d-%H%M%S).zip

# 存储到云端 (使用 scp/sftp)
scp learninghub-backup-*.tar.gz user@backup-server:/backups/
scp convex-backup-*.zip user@backup-server:/backups/

# 恢复项目文件
tar -xzf learninghub-backup-YYYYMMDD-HHMMSS.tar.gz -C /

# 恢复 Convex 数据
npx convex import convex-backup-YYYYMMDD-HHMMSS.zip
```

### 场景 6: 配置定时备份

```bash
# 创建备份脚本
cat > /home/$USER/backup-learninghub.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/learninghub"
mkdir -p $BACKUP_DIR

# 备份项目
tar -czf $BACKUP_DIR/project-$(date +%Y%m%d-%H%M%S).tar.gz /opt/learninghub

# 备份数据库
cd /opt/learninghub
npx convex export > $BACKUP_DIR/convex-$(date +%Y%m%d-%H%M%S).zip

# 只保留最近 7 天的备份
find $BACKUP_DIR -mtime +7 -delete
EOF

# 添加可执行权限
chmod +x /home/$USER/backup-learninghub.sh

# 添加到 crontab (每天凌晨 2 点执行)
crontab -e
# 添加这一行:
# 0 2 * * * /home/$USER/backup-learninghub.sh
```

### 场景 7: 从 Docker 切换到 PM2

```bash
# 1. 停止 Docker 容器
docker stop learninghub
docker rm learninghub

# 2. 克隆项目
git clone https://github.com/XinfengWang/clawhub.git /opt/learninghub
cd /opt/learninghub

# 3. 安装依赖
pnpm install

# 4. 构建
pnpm run build

# 5. 使用 PM2 启动
pm2 start "pnpm run preview" --name "learninghub" --cwd /opt/learninghub
pm2 save
sudo pm2 startup
```

### 场景 8: 从 PM2 切换到 Docker

```bash
# 1. 停止 PM2 应用
pm2 stop learninghub
pm2 delete learninghub
pm2 save

# 2. 构建 Docker 镜像
cd /opt/learninghub
docker build -t learninghub:latest .

# 3. 运行容器
docker run -d \
  -p 3000:3000 \
  -e VITE_CONVEX_URL=https://your-convex-url.convex.cloud \
  --name learninghub \
  learninghub:latest

# 4. 验证
docker logs -f learninghub
```

## 性能优化清单

- [ ] **启用 Gzip 压缩** - 在 Nginx 配置中启用
  ```nginx
  gzip on;
  gzip_types text/plain text/css application/json application/javascript;
  gzip_min_length 1000;
  ```

- [ ] **配置静态资源缓存** - 提高重复访问速度
  ```nginx
  location ~* \.(js|css|png|jpg|gif|ico|woff|woff2)$ {
      expires 1y;
      add_header Cache-Control "public, immutable";
  }
  ```

- [ ] **启用 HTTP/2** - 在 Nginx 启用
  ```bash
  sudo apt install -y certbot
  sudo certbot certonly --nginx -d your-domain.com
  # 在 Nginx 配置中: listen 443 ssl http2;
  ```

- [ ] **设置 SSL 证书** - 使用 Let's Encrypt
  ```bash
  sudo certbot renew --dry-run  # 测试
  sudo certbot renew  # 实际更新
  ```

- [ ] **配置内存限制** - 防止 OOM
  ```bash
  export NODE_OPTIONS=--max_old_space_size=2048
  ```

- [ ] **使用 CDN** - Cloudflare 或 Alicdn
  - 配置 DNS 解析到 CDN
  - 启用缓存规则

- [ ] **监控和告警** - 使用 PM2 Plus 或其他服务
  ```bash
  pm2 plus  # 订阅 PM2 Plus 获得监控
  ```

- [ ] **定期备份** - 每天自动备份
  - 使用 cron 定时任务
  - 上传到云存储 (S3, OSS 等)

- [ ] **日志轮转** - 防止日志文件过大
  ```bash
  pm2 install pm2-logrotate
  pm2 set pm2-logrotate:max_size 10M
  ```

- [ ] **数据库优化** - Convex 查询优化
  - 使用复合索引
  - 避免 N+1 查询
  - 使用分页查询

## 急救指南

| 问题 | 诊断 | 解决方案 |
|------|------|--------|
| 🔴 应用崩溃 | `pm2 logs learninghub` | `pm2 restart learninghub` 或检查错误日志 |
| 🔴 503 错误 | `curl http://localhost:3000` | `pm2 monit` 查看内存/CPU, 或重启 Nginx |
| 🟠 端口被占用 | `sudo lsof -i :3000` | `sudo kill -9 <PID>` 或改用其他端口 |
| 🟠 构建失败 | `pnpm run build 2>&1` | 清缓存: `rm -rf node_modules dist .output && pnpm install` |
| 🟠 内存不足 | `free -h` 或 `pm2 monit` | 增加 swap 或服务器内存 |
| 🟡 页面加载慢 | `curl -I http://localhost` | 检查 Nginx 日志, 启用 Gzip, 使用 CDN |
| 🟡 数据库连接失败 | `npx convex status` | 检查 VITE_CONVEX_URL 环境变量 |
| 🔵 Nginx 不工作 | `sudo nginx -t` | `sudo systemctl restart nginx` 或查看 `/var/log/nginx/error.log` |
| 🔵 SSL 证书过期 | `sudo certbot certificates` | `sudo certbot renew` 更新证书 |
| 💜 找不到 pnpm | `which pnpm` | `npm install -g pnpm@9.0.0` 重新安装 |

## 快速健康检查

```bash
# 一键检查系统状态
echo "=== 系统信息 ==="
uname -a
echo ""
echo "=== 磁盘空间 ==="
df -h / /opt/learninghub
echo ""
echo "=== 内存使用 ==="
free -h
echo ""
echo "=== Node.js 版本 ==="
node --version && pnpm --version
echo ""
echo "=== PM2 状态 ==="
pm2 list
echo ""
echo "=== 应用日志 (最后 20 行) ==="
pm2 logs learninghub --lines 20
echo ""
echo "=== 网络连接 ==="
netstat -tlnp | grep -E ':3000|:80|:443'
echo ""
echo "=== Nginx 状态 ==="
sudo systemctl status nginx --no-pager
echo ""
echo "✅ 检查完成"
```
