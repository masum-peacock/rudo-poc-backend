-- CreateTable
CREATE TABLE "tbl_auth_user" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" TEXT NOT NULL,
    "username" TEXT,
    "email" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "loggin_attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tbl_user_profile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "thumbnail" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_auth_user_user_id_key" ON "tbl_auth_user"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_auth_user_username_key" ON "tbl_auth_user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_auth_user_email_key" ON "tbl_auth_user"("email");
