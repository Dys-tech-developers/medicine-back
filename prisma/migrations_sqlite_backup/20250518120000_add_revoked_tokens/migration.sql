-- CreateTable
CREATE TABLE "revoked_tokens" (
    "jti" TEXT NOT NULL PRIMARY KEY,
    "expires_at" DATETIME NOT NULL,
    "revoked_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "revoked_tokens_expires_at_idx" ON "revoked_tokens"("expires_at");
