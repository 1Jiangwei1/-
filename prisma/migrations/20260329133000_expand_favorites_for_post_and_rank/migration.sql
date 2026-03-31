ALTER TABLE "Favorite" ADD COLUMN "postId" TEXT;
ALTER TABLE "Favorite" ADD COLUMN "rankItemId" TEXT;

ALTER TABLE "Favorite"
ADD CONSTRAINT "Favorite_postId_fkey"
FOREIGN KEY ("postId") REFERENCES "Post"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Favorite"
ADD CONSTRAINT "Favorite_rankItemId_fkey"
FOREIGN KEY ("rankItemId") REFERENCES "RankItem"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Favorite_userId_loreEntryId_key" ON "Favorite"("userId", "loreEntryId");
CREATE UNIQUE INDEX "Favorite_userId_postId_key" ON "Favorite"("userId", "postId");
CREATE UNIQUE INDEX "Favorite_userId_rankItemId_key" ON "Favorite"("userId", "rankItemId");
