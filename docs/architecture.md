# ClawHub 项目架构文档

## 1. 项目概述

ClawHub 是一个面向 AI Agent 的**技能（Skill）公共注册中心**，类似于 npm 之于 Node.js 包。它提供基于文本的 Agent 技能（`SKILL.md` + 附属文件）的发布、搜索、下载、版本管理和社区互动功能。同时通过 `onlycrabs.ai` 域名承载 **SOUL.md** 注册中心（同一代码库，按站点模式切换 UI）。

**核心能力：**
- 技能（Skill）/ 灵魂（Soul）的发布、版本管理与浏览
- 向量 + 词法混合搜索
- GitHub OAuth 身份验证 + CLI API Token
- 社区功能（Star、评论、举报）
- 安全扫描（VirusTotal、静态分析、LLM 评估）
- 审核与管理后台
- OpenClaw 插件（Package）注册中心
- CLI 工具 (`clawhub` / `clawdhub`)

---

## 2. 技术栈

| 层级 | 技术 |
|------|------|
| **前端框架** | React 19 + TanStack Router + TanStack Start |
| **构建工具** | Vite 8 + Nitro (SSR/服务端路由) |
| **样式** | Tailwind CSS v4 + 自定义 CSS 设计系统 |
| **后端** | Convex（Serverless BaaS：查询/变更/动作/文件存储/定时任务/HTTP 路由） |
| **认证** | `@convex-dev/auth` + GitHub OAuth；CLI 通过 API Token 认证 |
| **搜索** | Convex 向量索引（embedding）+ 词法回退 + 热度评分 |
| **部署** | Vercel（Web 应用）+ Convex Cloud（API/数据） |
| **包管理** | Bun（monorepo + workspace） |
| **Monorepo 子包** | `packages/schema`（共享 ArkType 类型/路由常量）、`packages/clawdhub`（CLI） |
| **测试** | Vitest + Playwright（E2E） |
| **Lint** | Biome + oxlint（类型感知） |

---

## 3. 目录结构

```
clawhub/
├── src/                        # TanStack Start 前端应用
│   ├── routes/                 # 文件路由（TanStack Router）
│   ├── components/             # UI 组件（特性组件 + 基础 UI）
│   ├── lib/                    # 客户端工具库（认证、主题、上传、API 等）
│   ├── convex/                 # Convex 客户端实例（ReactClient + HttpClient）
│   ├── styles.css              # 全局样式（Tailwind v4 入口 + 自定义设计系统）
│   ├── router.tsx              # TanStack Router 创建
│   └── routeTree.gen.ts        # 自动生成的路由树
├── convex/                     # Convex 后端
│   ├── schema.ts               # 数据库 Schema（全部表定义）
│   ├── functions.ts            # Trigger 包装器（mutation/query 导出）
│   ├── auth.ts / auth.config.ts# 认证配置
│   ├── http.ts                 # HTTP 路由映射
│   ├── crons.ts                # 定时任务
│   ├── httpApiV1/              # v1 API 处理器
│   ├── lib/                    # 后端共享逻辑（发布、搜索、审核、安全等）
│   ├── _generated/             # Convex 自动生成的 API/类型
│   └── *.ts                    # 各领域函数（skills, users, search 等）
├── packages/
│   ├── schema/                 # clawhub-schema：共享 API 路由常量 + ArkType 类型
│   └── clawdhub/               # CLI 工具包
├── server/                     # Nitro/H3 服务端路由（OG 图片生成等）
├── docs/                       # 产品文档和规范
├── e2e/                        # E2E 测试
├── scripts/                    # 构建/验证脚本
├── public/                     # 静态资源
├── vite.config.ts              # Vite + TanStack Start + Tailwind 配置
├── vercel.json                 # Vercel 部署配置
└── package.json                # 依赖 + 脚本
```

---

## 4. 数据库 Schema

### 4.1 核心表

#### 用户与发布者

| 表 | 用途 | 关键字段 |
|----|------|----------|
| `users` | 用户资料 + 审核状态 | `handle`, `displayName`, `role`, `github*`, `trustedPublisher`, `banReason`, `deactivatedAt` |
| `publishers` | 发布者身份（个人/组织） | `kind`(user/org), `handle`, `displayName`, `linkedUserId`, `trustedPublisher` |
| `publisherMembers` | 组织成员关系 | `publisherId`, `userId`, `role` |

#### 技能（Skills）

| 表 | 用途 | 关键字段 |
|----|------|----------|
| `skills` | 技能注册中心主表 | `slug`, `ownerUserId`, `ownerPublisherId`, `latestVersionId`, `latestVersionSummary`, `tags`, `badges`, `stats`, 审核/安全字段 |
| `skillVersions` | 不可变版本记录 | `skillId`, `version`(semver), `files[]`, `parsed`, `vtAnalysis`, `llmAnalysis`, `staticScan` |
| `skillVersionFingerprints` | 版本指纹去重 | `skillId`, `versionId`, `fingerprint` |
| `skillSlugAliases` | Slug 别名映射 | `slug`, `skillId` |
| `skillBadges` | 技能徽章（规范化） | `skillId`, `kind`, `byUserId` |
| `skillEmbeddings` | 向量搜索索引 | `embedding[]`, `isLatest`, `isApproved`, `visibility` |
| `embeddingSkillMap` | 轻量 embedding→skill 映射 | `embeddingId`, `skillId` |
| `skillSearchDigest` | **反范式化**浏览/搜索投影 | 包含 skill + owner 的公共展示字段，避免跨表 join |

#### 灵魂（Souls）

| 表 | 用途 |
|----|------|
| `souls` | 灵魂注册中心主表（结构与 skills 类似） |
| `soulVersions` | 灵魂版本 |
| `soulVersionFingerprints` | 灵魂版本指纹 |
| `soulEmbeddings` | 灵魂向量搜索 |

#### 插件/包（Packages）

| 表 | 用途 |
|----|------|
| `packages` | 插件注册中心主表 |
| `packageReleases` | 插件版本/发布 |
| `packageSearchDigest` | 插件搜索投影 |
| `packageCapabilitySearchDigest` | 插件能力标签搜索 |

#### 社区与审核

| 表 | 用途 |
|----|------|
| `comments` / `soulComments` | 评论 |
| `commentReports` / `skillReports` | 举报 |
| `stars` / `soulStars` | 收藏 |
| `auditLogs` | 管理操作审计日志 |

#### 统计与排行

| 表 | 用途 |
|----|------|
| `skillDailyStats` | 每日下载/安装指标 |
| `skillLeaderboards` | 预计算热门排行榜 |
| `skillStatEvents` | 事件溯源统计增量 |
| `globalStats` | 全站计数器 |

#### 平台与运维

| 表 | 用途 |
|----|------|
| `apiTokens` | CLI/API 认证令牌 |
| `rateLimits` | HTTP 速率限制窗口 |
| `vtScanLogs` | VirusTotal 扫描日志 |
| `downloadDedupes` | 下载去重（每小时） |
| `reservedSlugs` / `reservedHandles` | 保留标识符 |
| `skillOwnershipTransfers` | 技能所有权转移 |
| `userSyncRoots` / `userSkillInstalls` | 遥测安装数据 |

---

## 5. 后端架构

### 5.1 函数导出与 Trigger 系统

所有 mutation 通过 `convex/functions.ts` 导出，该文件使用 `convex-helpers` 的 `Triggers` 包装数据库操作，实现**反范式化数据自动同步**：

```
convex/functions.ts
├── customMutation / internalMutation → triggers.wrapDB(ctx)
└── 注册的 Trigger：
    ├── skills 表变更 → 自动更新 skillSearchDigest
    ├── packages 表变更 → 自动更新 packageSearchDigest
    ├── packageReleases 变更 → 重新指向 latest / 同步 digest
    ├── users 字段变更 → 同步相关 package digest
    └── publishers 变更 → 调度 skill + package digest 同步
```

### 5.2 后端领域划分

```
convex/
├── 认证 (auth.ts, auth.config.ts)
│   ├── GitHub OAuth（@convex-dev/auth）
│   ├── 登录后回调：阻止已删除/封禁用户、确保 publisher、同步 GitHub 信息
│   └── API Token 认证（lib/apiTokenAuth.ts）
│
├── 用户 (users.ts)
│   ├── me / ensure / updateProfile / deleteAccount
│   ├── 角色管理 / 封禁 / 信任状态
│   └── Handle 管理 / GitHub 同步
│
├── 发布者 (publishers.ts)
│   ├── 个人/组织发布者 CRUD
│   └── 组织成员管理
│
├── 技能 (skills.ts + lib/skillPublish.ts)
│   ├── 读取：getBySlug / list / listPublicPage(V2-V4) / versions
│   ├── 发布：publishVersion (验证→解析→安全扫描→入库→同步)
│   ├── 审核：badges / 软删除 / 重命名 / 合并 / 所有权变更
│   └── 统计：下载数、安装数
│
├── 搜索 (search.ts)
│   ├── searchSkills action：embedding 向量搜索
│   ├── 词法回退（当向量结果不足时）
│   └── 混合评分（向量相似度 + 词法 + 热度）
│
├── 插件/包 (packages.ts)
│   ├── 插件 CRUD / 发布 / 版本管理
│   └── 安全扫描与 digest 同步
│
├── 灵魂 (souls.ts)
│   └── 与 skills 对称的 CRUD / 版本 / 搜索
│
├── 社区 (stars.ts, comments.ts, downloads.ts)
│   ├── Star 切换 / 评论 CRUD / 举报
│   └── 下载 ZIP 构建（带速率限制 + 审核门控）
│
├── 安全 (vt.ts, llmEval.ts, lib/staticPublishScan.ts)
│   ├── VirusTotal 扫描（发布时 + 定时补扫）
│   ├── LLM 安全评估
│   └── 静态代码扫描
│
├── 统计 (skillStatEvents.ts, statsMaintenance.ts, leaderboards.ts)
│   ├── 事件溯源 → 每日聚合
│   ├── 全局统计更新
│   └── 热门排行榜构建
│
├── GitHub 集成 (githubBackups*.ts, githubImport.ts)
│   ├── 技能备份到 GitHub（定时 + 发布触发）
│   └── 从 GitHub 导入技能
│
└── HTTP API (http.ts, httpApiV1/)
    ├── RESTful API 端点
    ├── CLI 专用路由
    └── CORS 预检处理
```

### 5.3 定时任务 (Cron Jobs)

| 任务 | 间隔 | 功能 |
|------|------|------|
| `github-backup-sync` | 30 分钟 | GitHub 备份增量同步 |
| `trending-leaderboard` | 60 分钟 | 重建热门排行榜 |
| `skill-stat-events` | 15 分钟 | 处理统计事件→每日聚合 |
| `skill-doc-stat-sync` | 6 小时 | 将统计回写到 skill 文档 |
| `skill-stats-backfill` | 6 小时 | 统计数据回填 |
| `global-stats-update` | 24 小时 | 全站统计更新 |
| `vt-pending-scans` | 5 分钟 | 轮询 VirusTotal 待扫描 |
| `vt-cache-backfill` | 30 分钟 | VT 缓存补填 |
| `vt-daily-rescan` | 每日 03:00 UTC | 活跃技能每日重扫 |
| `package-scan-backfill` | 30 分钟 | 插件安全扫描补填 |
| `download-dedupe-prune` | 24 小时 | 清理过期下载去重记录 |

### 5.4 HTTP API 端点

HTTP 路由在 `convex/http.ts` 中定义，映射 `clawhub-schema` 的 `ApiRoutes` 常量到 `httpApiV1/` 处理器：

- **技能 API**: GET/POST/DELETE `/api/v1/skills/*`（列表、详情、发布、删除）
- **搜索 API**: GET `/api/v1/search`
- **下载 API**: GET `/api/v1/skills/:slug/download`（ZIP 构建）
- **包/插件 API**: GET/POST `/api/v1/packages/*`
- **用户 API**: GET `/api/v1/users/*`、`/api/v1/whoami`
- **Star API**: POST/DELETE `/api/v1/stars/*`
- **转移 API**: `/api/v1/transfers/*`
- **CLI 专用**: `/api/v1/cli/*`（认证、上传 URL、发布、遥测同步）
- **OAuth**: `auth.addHttpRoutes(http)` 挂载认证路由

---

## 6. 前端架构

### 6.1 路由结构

前端使用 TanStack Router 基于文件系统的路由，所有路由为根路由的直接子路由：

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | 按站点模式切换：ClawHub（技能）或 SoulHub（灵魂） |
| `/skills` | 技能库 | URL 驱动的搜索/排序/筛选，分页浏览 |
| `/$owner/$slug` | 技能详情 | SSR loader 预取数据，canonical 重定向 |
| `/publish-skill` | 发布技能 | 文件上传 + 版本发布 |
| `/publish-plugin` | 发布插件 | OpenClaw 插件上传 |
| `/plugins` | 插件目录 | HTTP API 获取插件列表 |
| `/plugins/$name` | 插件详情 | 插件信息、版本、安全扫描 |
| `/souls` | 灵魂浏览 | Soul 列表 |
| `/souls/$slug` | 灵魂详情 | Soul 详情页 |
| `/u/$handle` | 用户主页 | 已发布技能、收藏、安装 |
| `/orgs/$handle` | 组织主页 | 组织成员 + 技能 |
| `/dashboard` | 控制台 | 已登录用户的发布者概览 |
| `/settings` | 设置 | 资料、API Token、组织管理 |
| `/stars` | 收藏列表 | 当前用户收藏的技能 |
| `/import` | GitHub 导入 | 从 GitHub 仓库导入技能 |
| `/management` | 管理后台 | 审核、徽章、审计日志 |
| `/cli/auth` | CLI 认证 | CLI 工具的 OAuth 流程 |
| `/search` | 搜索重定向 | 按模式重定向到 `/skills` 或 `/souls` |
| `/about` | 关于页 | 政策与说明 |

### 6.2 组件组织

```
src/components/
├── 应用壳 (App Shell)
│   ├── Header          # 导航栏（认证状态、主题切换、站点模式）
│   ├── Footer          # 页脚
│   ├── AppProviders    # Convex Auth + 全局 Provider
│   ├── ClientOnly      # 客户端渲染边界
│   └── DeploymentDriftBanner  # 部署版本不一致提示
│
├── 技能 (Skills)
│   ├── SkillDetailPage       # 技能详情页编排（标签页、Star、版本、评论）
│   ├── SkillCard             # 技能卡片
│   ├── SkillHeader           # 技能头部信息
│   ├── SkillInstallCard      # 安装指引卡片
│   ├── SkillFilesPanel       # 文件浏览面板
│   ├── SkillVersionsPanel    # 版本历史面板
│   ├── SkillCommentsPanel    # 评论面板
│   ├── SkillDiffCard         # 版本差异对比
│   ├── SkillReportDialog     # 举报对话框
│   └── SkillSecurityScanResults  # 安全扫描结果
│
├── 灵魂 (Souls)
│   ├── SoulCard / SoulDetailPage / SoulStats
│
├── 插件 (Packages)
│   ├── PackageSourceChooser  # 包源选择器
│   └── InstallSwitcher       # 安装方式切换
│
├── 用户 (User)
│   ├── UserBootstrap         # 登录后确保用户行存在
│   └── UserBadge             # 用户徽章
│
└── ui/                       # 基础 UI 原语（Radix 风格）
    ├── dropdown-menu
    └── toggle-group
```

### 6.3 状态管理

- **无全局状态库**（无 Redux/Zustand），使用 React 原生状态管理
- **服务端状态**: Convex hooks（`useQuery`, `useMutation`, `useAction`）
- **URL 即状态**: TanStack Router 的 `validateSearch` 驱动筛选和深度链接
- **瞬态 UI 状态**: `useState` / `useRef` + 自定义轻量 store（如 `useAuthError` 基于 `useSyncExternalStore`）

### 6.4 Convex 客户端使用模式

```
src/convex/client.ts
├── ConvexReactClient (convex)     # 响应式订阅（useQuery/useMutation/useAction）
│   └── 用于：需要实时更新的数据（认证状态、详情页、评论等）
│
└── ConvexHttpClient (convexHttp)  # 一次性查询（无订阅）
    └── 用于：公共列表/浏览页、SSR loader、搜索结果
        避免响应式查询带来的无效 invalidation 和带宽浪费
```

### 6.5 样式系统

- **单一全局样式文件** `src/styles.css`，入口 `@import "tailwindcss"`
- **自定义字体**: Bricolage Grotesque（标题）、Manrope（正文）、IBM Plex Mono（代码）
- **CSS 变量设计系统**: `:root` / `[data-theme="dark"]` 定义颜色、圆角、字体等语义变量
- **双重样式策略**: 语义化 class（`.navbar`, `.hero`, `.skill-card`）+ Tailwind 工具类
- **暗色模式**: `useThemeMode` hook 持久化到 `localStorage`，设置 `data-theme` 和 Tailwind `dark` class

---

## 7. 核心业务流程

### 7.1 技能发布流程

```
用户上传文件 (SKILL.md + 附属文件)
       │
       ▼
  generateUploadUrl（获取 Convex 文件存储 URL）
       │
       ▼
  publishVersion Action
       │
       ├─ 验证：semver 格式、slug 合法性、GitHub 账户年龄
       ├─ 解析：frontmatter、文件内容
       ├─ 质量门控：quality gate 检查
       ├─ 安全扫描：静态分析（同步）
       │
       ▼
  写入数据库
       ├─ 创建 skillVersion（不可变）
       ├─ 更新 skill（latestVersionId、summary、stats）
       ├─ 生成 embedding → 写入 skillEmbeddings
       ├─ 写入 fingerprint 去重记录
       ├─ Trigger 自动同步 skillSearchDigest
       │
       ▼
  异步后处理
       ├─ 调度 VirusTotal 扫描
       ├─ 调度 LLM 安全评估
       ├─ 触发 GitHub 备份
       └─ 发送 Discord Webhook 通知
```

### 7.2 搜索流程

```
用户输入搜索词
       │
       ▼
  searchSkills Action
       │
       ├─ 生成查询文本的 embedding
       ├─ 向量搜索 skillEmbeddings（Convex vector index）
       ├─ 通过 embeddingSkillMap 轻量映射到 skill
       ├─ 从 skillSearchDigest 读取展示数据（避免读 skills 全表）
       │
       ├─ 如果向量结果不足 → 词法回退搜索
       │
       ▼
  混合评分排序
       ├─ 向量相似度分数
       ├─ 词法匹配分数
       └─ 热度/下载量权重
       │
       ▼
  一次获取全部结果，客户端分页
```

### 7.3 认证流程

```
浏览器端：
  GitHub OAuth → @convex-dev/auth → ConvexAuthProvider
       │
       ├─ AuthCodeHandler 处理 OAuth 回调 code
       ├─ UserBootstrap 确保 users 行存在（ensure mutation）
       └─ afterUserCreatedOrUpdated 回调：
           ├─ 创建/关联个人 publisher
           ├─ 同步 GitHub 资料信息
           └─ 阻止已封禁/删除用户登录

CLI 端：
  clawhub login → /cli/auth 页面
       │
       ├─ 浏览器完成 GitHub OAuth
       ├─ 创建 apiToken（hash 存储）
       └─ Token 通过 URL hash 传回 CLI
       │
       ▼
  后续 API 调用：Bearer <token>
       │
       └─ lib/apiTokenAuth.ts：hash 比对 → 加载用户 → 校验状态
```

### 7.4 反范式化数据同步

```
写入操作触发 Trigger（convex/functions.ts）
       │
       ├─ skills 表变更 → 自动 upsert skillSearchDigest
       │   （包含 skill 展示字段 + owner 信息，供浏览页直接读取）
       │
       ├─ packages 表变更 → 自动更新 packageSearchDigest
       │
       ├─ users.handle 变更 → 同步所有相关 package digest
       │
       └─ publishers 变更 → 调度 skill + package digest 批量同步
       │
  所有 Trigger 包含变更检测 —— 字段未实际变化时跳过写入
```

---

## 8. 包结构（Monorepo）

### 8.1 `packages/schema` (clawhub-schema)

共享的 API 契约层：
- **API 路由常量** (`routes.ts`): 定义所有 HTTP API 路径
- **ArkType 校验 Schema**: 请求/响应的运行时类型验证
- 被前端（`src/`）和后端（`convex/`）共同引用

### 8.2 `packages/clawdhub` (CLI)

ClawHub 命令行工具：
- `clawhub login` — 浏览器 OAuth 认证
- `clawhub publish` — 发布技能版本
- `clawhub search` — 搜索技能
- `clawhub install` — 安装技能
- 遥测同步（可 opt-out）

### 8.3 `server/` (Nitro 服务端)

Nitro/H3 服务端路由：
- OG 图片生成（SVG → Resvg 渲染为 PNG）
- 用于社交分享预览

---

## 9. 部署架构

```
┌─────────────────────────────────────────────────┐
│                    Vercel                         │
│  ┌──────────────┐    ┌───────────────────────┐   │
│  │  TanStack     │    │  Nitro Server         │   │
│  │  Start App    │    │  (OG 图片等)          │   │
│  │  (SSR + SPA)  │    │                       │   │
│  └──────┬───────┘    └───────────────────────┘   │
│         │                                         │
│    /api/* rewrite ─────────────────┐              │
└─────────────────────────────────────┼─────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────┐
                    │        Convex Cloud          │
                    │  ┌───────┐ ┌──────────────┐  │
                    │  │ Query │ │  Mutation     │  │
                    │  │       │ │  (+ Triggers) │  │
                    │  └───────┘ └──────────────┘  │
                    │  ┌───────┐ ┌──────────────┐  │
                    │  │Action │ │  HTTP Routes  │  │
                    │  └───────┘ └──────────────┘  │
                    │  ┌───────┐ ┌──────────────┐  │
                    │  │ Cron  │ │ File Storage  │  │
                    │  └───────┘ └──────────────┘  │
                    │  ┌─────────────────────────┐ │
                    │  │   Vector Index (Search)  │ │
                    │  └─────────────────────────┘ │
                    └─────────────────────────────┘
```

**环境变量：**
- Vercel 侧：`VITE_CONVEX_URL` + `VITE_CONVEX_SITE_URL`
- Convex 侧：JWT 密钥、GitHub OAuth 凭据、VirusTotal API Key 等

---

## 10. 性能优化策略

| 策略 | 实现 |
|------|------|
| **一次性查询 vs 响应式订阅** | 公共列表页使用 `ConvexHttpClient.query()`（一次性），详情/个人页使用 `useQuery`（实时） |
| **反范式化 Digest 表** | `skillSearchDigest` / `packageSearchDigest` 避免跨表 join，减少响应式 invalidation 范围 |
| **复合索引** | 大量 `.withIndex()` 替代 `.filter()` 避免全表扫描 |
| **客户端分页** | 搜索结果一次获取、客户端分页，避免重复执行搜索管线 |
| **Trigger 变更检测** | 反范式化同步带有变更检测，未变字段跳过写入 |
| **批量 Backfill 节流** | 对响应式订阅表的回填操作使用 `delayMs` 防止雪崩 |

---

## 11. 安全体系

| 层级 | 措施 |
|------|------|
| **认证** | GitHub OAuth + 会话管理；API Token hash 存储 |
| **授权** | 角色系统（user/moderator/admin）；发布者成员权限 |
| **内容安全** | VirusTotal 扫描、静态代码分析、LLM 安全评估 |
| **速率限制** | HTTP API 速率限制窗口 + 下载去重 |
| **审核** | 人工审核标记、自动封禁、审计日志 |
| **评论安全** | LLM 驱动的诈骗/垃圾评论检测 |
| **保留标识符** | `reservedSlugs` / `reservedHandles` 防抢注 |
| **所有权转移** | 结构化的转移流程（请求→接受/拒绝） |

---

## 12. 开发指南

### 本地开发

```bash
bun install                  # 安装依赖
bunx convex dev              # 启动 Convex 开发环境 + 函数 watcher
bun run dev                  # 启动本地开发服务器 (http://localhost:3000)
```

### 常用命令

```bash
bun run build                # 生产构建
bun run lint                 # Biome + oxlint 检查
bun run test                 # Vitest 单元测试
bun run coverage             # 覆盖率（目标 >= 80%）
bunx convex dev --once       # 推送 Convex 函数（一次性）
bunx convex deploy           # 生产部署 Convex
```

### 代码规范

- TypeScript strict + ESM
- 2 空格缩进，单引号（Biome）
- Convex 函数命名：动词优先（`getBySlug`, `publishVersion`）
- 提交信息：Conventional Commits（`feat:`, `fix:`, `chore:` 等）
- 覆盖率阈值：80% 全局
