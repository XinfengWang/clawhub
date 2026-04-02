# Bun → Node+pnpm 迁移指南

## 📋 迁移内容

本项目已从 **Bun** 包管理器迁移到 **Node.js + pnpm**，以支持更广泛的容器服务和生产环境。

### ✅ 已完成的改动

1. **package.json**
   - 删除所有 `bun --bun` 前缀
   - 删除 `bunx` 命令调用
   - 更新 preinstall 脚本以强制使用 pnpm
   - 添加 `packageManager` 字段指定 pnpm@9.0.0

2. **工作流配置**
   - 创建 `pnpm-workspace.yaml` 替代 package.json 中的 workspaces 字段
   - 修复工作区包名称 (learninghub-schema → clawhub-schema)

3. **Docker 支持**
   - 创建 `Dockerfile` 用于容器部署
   - 创建 `.dockerignore` 排除不必要文件
   - 支持多阶段构建优化镜像大小

4. **文档更新**
   - 更新 QUICK_DEPLOY.md 所有命令

## 🔄 命令对照表

| 功能 | Bun | pnpm |
|------|-----|------|
| 安装依赖 | `bun install` | `pnpm install` |
| 开发模式 | `bun run dev` | `pnpm run dev` |
| 生产构建 | `bun run build` | `pnpm run build` |
| 预览构建 | `bun run preview` | `pnpm run preview` |
| 运行脚本 | `bun run <script>` | `pnpm run <script>` |
| 部署后端 | `bunx convex deploy` | `convex deploy` |

## 🚀 快速开始

### 本地开发

```bash
# 1. 安装 pnpm（如果未安装）
npm install -g pnpm

# 2. 验证版本
pnpm --version  # 应该是 >= 9.0.0

# 3. 安装依赖
pnpm install

# 4. 启动开发服务器
pnpm run dev

# 5. 另一个终端启动后端
npx convex dev
```

### 生产部署

#### 方法 1: Docker 容器

```bash
# 构建镜像
docker build -t learninghub:latest .

# 运行容器
docker run -d \
  -p 3000:3000 \
  -e VITE_CONVEX_URL=https://your-convex.convex.cloud \
  -e VITE_SITE_MODE=skills \
  --name learninghub \
  learninghub:latest
```

#### 方法 2: 直接部署

```bash
# 安装依赖
pnpm install

# 构建
pnpm run build

# 启动
pnpm run preview

# 或使用 PM2
pm2 start "pnpm run preview" --name "learninghub"
```

## 📦 pnpm 特点

- ✨ **快速**: 磁盘 I/O 更少
- 💾 **节省空间**: 使用符号链接共享依赖
- 🔒 **严格**: 改进的包依赖管理
- 🎯 **准确**: 支持 monorepo workspaces
- 📈 **可靠**: 更好的错误处理

## ⚠️ 重要注意事项

1. **不要混用包管理器**
   ```bash
   # ❌ 错误
   npm install
   yarn install
   bun install

   # ✅ 正确
   pnpm install
   ```

2. **CI/CD 环境**
   ```bash
   # 在 CI 中使用 --frozen-lockfile 确保版本一致
   pnpm install --frozen-lockfile
   ```

3. **Monorepo 工作区**
   - 所有包必须在 `packages/` 目录下
   - 使用 `pnpm-workspace.yaml` 而非 package.json workspaces

## 🐛 故障排除

### 错误：找不到 pnpm

```bash
npm install -g pnpm
```

### 错误：构建失败

```bash
# 清除缓存并重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm run build
```

### Docker 构建失败

```bash
# 重建镜像，不使用缓存
docker build --no-cache -t learninghub:latest .
```

## 📚 参考资源

- [pnpm 官方文档](https://pnpm.io/)
- [Docker 最佳实践](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Node.js 最佳实践](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

## 🔄 版本信息

- **Node.js**: 20+ (推荐)
- **pnpm**: 9.0.0+
- **Docker**: 20.10+ (如果使用容器部署)

---

如有问题或需要帮助，请参考 QUICK_DEPLOY.md 或项目文档。
