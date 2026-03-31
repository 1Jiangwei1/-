-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'MODERATOR', 'USER');

-- CreateEnum
CREATE TYPE "LorePermissionLevel" AS ENUM ('VIEW', 'SUGGEST', 'EDIT', 'REVIEW', 'ADMIN');

-- CreateEnum
CREATE TYPE "LorePermissionScope" AS ENUM ('GLOBAL', 'CATEGORY', 'ENTRY');

-- CreateEnum
CREATE TYPE "ChangeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LoreRelationType" AS ENUM ('CHILD', 'RELATED', 'REFERENCES');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoreEntry" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT,
    "category" TEXT NOT NULL,
    "externalId" TEXT,
    "rawJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoreEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoreMeta" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "LoreMeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoreRelation" (
    "id" TEXT NOT NULL,
    "fromEntryId" TEXT NOT NULL,
    "toEntryId" TEXT NOT NULL,
    "type" "LoreRelationType" NOT NULL DEFAULT 'CHILD',

    CONSTRAINT "LoreRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawLoreRecord" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'builtin',
    "payload" JSONB NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RawLoreRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoreEditorPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scopeType" "LorePermissionScope" NOT NULL,
    "scopeValue" TEXT,
    "level" "LorePermissionLevel" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoreEditorPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoreEntryVersion" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoreEntryVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoreChangeRequest" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "patch" JSONB NOT NULL,
    "status" "ChangeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "LoreChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "loreEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankBoard" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RankBoard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankItem" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "loreEntryId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RankItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankVote" (
    "id" TEXT NOT NULL,
    "rankItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "RankVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankComment" (
    "id" TEXT NOT NULL,
    "rankItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RankComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFollow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFollow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "LoreEntry_slug_key" ON "LoreEntry"("slug");

-- CreateIndex
CREATE INDEX "LoreMeta_entryId_key_idx" ON "LoreMeta"("entryId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "LoreRelation_fromEntryId_toEntryId_type_key" ON "LoreRelation"("fromEntryId", "toEntryId", "type");

-- CreateIndex
CREATE INDEX "RawLoreRecord_externalId_idx" ON "RawLoreRecord"("externalId");

-- CreateIndex
CREATE INDEX "LoreEditorPermission_userId_scopeType_idx" ON "LoreEditorPermission"("userId", "scopeType");

-- CreateIndex
CREATE INDEX "LoreEntryVersion_entryId_createdAt_idx" ON "LoreEntryVersion"("entryId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RankVote_rankItemId_userId_key" ON "RankVote"("rankItemId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFollow_followerId_followingId_key" ON "UserFollow"("followerId", "followingId");

-- AddForeignKey
ALTER TABLE "LoreMeta" ADD CONSTRAINT "LoreMeta_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "LoreEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoreRelation" ADD CONSTRAINT "LoreRelation_fromEntryId_fkey" FOREIGN KEY ("fromEntryId") REFERENCES "LoreEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoreRelation" ADD CONSTRAINT "LoreRelation_toEntryId_fkey" FOREIGN KEY ("toEntryId") REFERENCES "LoreEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoreEditorPermission" ADD CONSTRAINT "LoreEditorPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoreEntryVersion" ADD CONSTRAINT "LoreEntryVersion_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "LoreEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoreChangeRequest" ADD CONSTRAINT "LoreChangeRequest_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "LoreEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoreChangeRequest" ADD CONSTRAINT "LoreChangeRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoreChangeRequest" ADD CONSTRAINT "LoreChangeRequest_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_loreEntryId_fkey" FOREIGN KEY ("loreEntryId") REFERENCES "LoreEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankItem" ADD CONSTRAINT "RankItem_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "RankBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankItem" ADD CONSTRAINT "RankItem_loreEntryId_fkey" FOREIGN KEY ("loreEntryId") REFERENCES "LoreEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankVote" ADD CONSTRAINT "RankVote_rankItemId_fkey" FOREIGN KEY ("rankItemId") REFERENCES "RankItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankComment" ADD CONSTRAINT "RankComment_rankItemId_fkey" FOREIGN KEY ("rankItemId") REFERENCES "RankItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
