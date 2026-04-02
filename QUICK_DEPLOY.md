# 快速部署命令速查表

## 一键部署 (推荐)

### 前置条件
- Ubuntu 20.04+ / Debian 11+
- `curl` 和 `git` 已安装

### 快速部署脚本

```bash
#!/bin/bash
# 保存为 deploy.sh，然后运行: bash deploy.sh

set -e

# 1. 系统准备
echo "🔧 系统准备..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get update
sudo apt-get install -y nodejs nginx

# 2. 安装 Bun
curl -fsSL https://bun.sh/install | bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# 3. 克隆项目
echo "📥 克隆项目..."
git clone <your-repo-url> /opt/clawhub
cd /opt/clawhub

# 4. 安装依赖
echo "📦 安装依赖..."
bun install

# 5. 配置环境变量
echo "⚙️ 配置环境..."
cat > .env.local << EOF
VITE_CONVEX_URL=https://your-convex-url.convex.cloud
VITE_SITE_MODE=skills
SITE_URL=https://your-domain.com
CONVEX_SITE_URL=https://your-convex-url.convex.cloud
EOF

# 6. 构建
echo "🔨 构建..."
bun run build

# 7. 部署后端
echo "☁️ 部署 Convex..."
npx convex deploy --prod

# 8. 设置 PM2
echo "⚙️ 设置 PM2..."
sudo npm install -g pm2
pm2 start "bun run preview" --name "clawhub"
pm2 save
pm2 startup

# 9. Nginx 配置
echo "🌐 配置 Nginx..."
sudo tee /etc/nginx/sites-available/clawhub > /dev/null << EOF
server {
    listen 80;
    server_name _;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/clawhub /etc/nginx/sites-enabled/
sudo systemctl restart nginx

echo "✅ 部署完成！访问 http://your-server-ip"
```

## 分步命令

### 开发环境

```bash
# 1. 安装依赖
bun install

# 2. 启动开发服务器
bun run dev
# 访问 http://localhost:3000

# 3. 启动 Convex 后端
npx convex dev
```

### 构建命令

```bash
# 构建生产版本
bun run build

# 预览构建结果
bun run preview

# 检查构建大小
ls -lah dist/

# 清除构建缓存
rm -rf dist/
bun run build
```

### 后端部署

```bash
# 登录 Convex (首次)
npx convex login

# 查看部署状态
npx convex status

# 部署到生产环境
npx convex deploy --prod

# 部署到生产环境 (不类型检查)
npx convex deploy --prod --typecheck=disable

# 导入备份数据
npx convex import backup.zip

# 导出数据
npx convex export > backup.zip
```

### 服务器运行

```bash
# 方式 1: 直接运行
bun run preview

# 方式 2: 使用 PM2
pm2 start "bun run preview" --name "clawhub"
pm2 save
pm2 startup
pm2 monit

# 查看日志
pm2 logs clawhub

# 停止应用
pm2 stop clawhub

# 重启应用
pm2 restart clawhub

# 删除应用
pm2 delete clawhub
```

### Docker 部署

```bash
# 构建镜像
docker build -t clawhub:latest .

# 运行容器
docker run -d \
  -p 3000:3000 \
  -e VITE_CONVEX_URL=https://your-convex.convex.cloud \
  -e VITE_SITE_MODE=skills \
  --name clawhub \
  clawhub:latest

# 查看容器日志
docker logs -f clawhub

# 停止容器
docker stop clawhub

# 启动容器
docker start clawhub

# 删除容器
docker rm clawhub
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

```bash
# 检查端口是否被占用
sudo lsof -i :3000

# 停止占用端口的进程
sudo kill -9 <PID>

# 检查 Nginx 配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 查看应用运行错误
pm2 logs clawhub --err

# 重新启动并清除缓存
rm -rf node_modules dist
bun install
bun run build
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
du -sh dist/
du -sh dist/client/
du -sh dist/server/

# 查看构建时间
time bun run build

# 测试应用响应
curl http://localhost:3000
curl -I http://localhost:3000  # 只查看 headers

# 压力测试 (需要 Apache Bench)
ab -n 1000 -c 10 http://localhost:3000/
```

## 常用场景

### 场景 1: 更新代码并重新部署

```bash
cd /opt/clawhub
git pull origin main
bun install
bun run build
npx convex deploy --prod
pm2 restart clawhub
```

### 场景 2: 添加新环境变量

```bash
nano .env.local  # 编辑文件
bun run build    # 重新构建
pm2 restart clawhub
```

### 场景 3: 查看应用状态

```bash
pm2 status
pm2 logs clawhub
pm2 monit
```

### 场景 4: 紧急回滚到上一版本

```bash
cd /opt/clawhub
git revert HEAD
bun run build
npx convex deploy --prod
pm2 restart clawhub
```

### 场景 5: 备份和恢复

```bash
# 备份
tar -czf clawhub-backup-$(date +%Y%m%d).tar.gz /opt/clawhub
npx convex export > convex-backup-$(date +%Y%m%d).zip

# 恢复
tar -xzf clawhub-backup-YYYYMMDD.tar.gz
npx convex import convex-backup-YYYYMMDD.zip
```

## 性能优化快速清单

- [ ] 启用 Gzip 压缩 (Nginx)
- [ ] 配置缓存策略 (静态资源 1y, 动态 0)
- [ ] 使用 CDN (Cloudflare)
- [ ] 启用 HTTP/2
- [ ] 设置 SSL 证书 (Let's Encrypt)
- [ ] 配置内存限制: `NODE_OPTIONS=--max_old_space_size=2048`
- [ ] 监控应用日志和性能
- [ ] 定期备份数据

## 急救电话

| 问题 | 解决方案 |
|------|--------|
| 应用崩溃 | `pm2 restart clawhub` |
| 503 错误 | 检查 `pm2 logs clawhub` 和 `pm2 monit` |
| 端口被占用 | `sudo lsof -i :3000` 和 `sudo kill -9 <PID>` |
| 构建失败 | `rm -rf node_modules && bun install && bun run build` |
| 内存不足 | 增加服务器内存或配置 swap |
| Nginx 不工作 | `sudo nginx -t` 和 `sudo systemctl restart nginx` |
