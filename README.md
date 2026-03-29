# 玄鉴仙族社区（第一阶段）

## 技术栈
- Next.js App Router + TypeScript
- Tailwind CSS（深色移动端优先）
- Prisma + PostgreSQL
- zod + bcrypt

## 目录
- `app/(public)` 前台页面
- `app/admin` 后台页面
- `app/api` API 路由
- `lib/auth` 登录注册与会话
- `lib/lore` 世界观权限与标准化
- `prisma` 数据模型
- `scripts` 导入脚本

## 启动
1. 安装依赖：
   ```bash
   npm install
   ```
2. 配置环境变量：
   ```bash
   cp .env.example .env
   ```
3. 迁移数据库并生成 Prisma Client：
   ```bash
   npm run prisma:generate
   npm run prisma:migrate -- --name init
   ```
4. 导入内置世界观数据：
   ```bash
   npm run db:seed
   ```
5. 启动开发：
   ```bash
   npm run dev
   ```

## 导入流程
- `scripts/importLore.ts`
  1. raw import 到 `RawLoreRecord`
  2. normalize 去重并写入 `LoreEntry`
  3. build relations 将 `children` 结构写入 `LoreRelation`
