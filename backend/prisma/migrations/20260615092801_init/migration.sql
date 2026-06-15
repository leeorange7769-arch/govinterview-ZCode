-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "nickname" TEXT,
    "avatarUrl" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "status" TEXT NOT NULL DEFAULT 'active',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "questions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "subtype" TEXT,
    "content" TEXT NOT NULL,
    "thinkingProcess" TEXT,
    "modelAnswer" TEXT,
    "scoringPoints" TEXT,
    "difficulty" INTEGER,
    "tags" TEXT,
    "sourceYear" INTEGER,
    "sourceRegion" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "practiceCount" INTEGER NOT NULL DEFAULT 0,
    "avgScore" REAL,
    "createdBy" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "questions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "exam_records" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "examType" TEXT NOT NULL,
    "title" TEXT,
    "totalScore" REAL,
    "maxScore" REAL,
    "timeSpent" INTEGER,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "exam_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "exam_details" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "examRecordId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "userAnswer" TEXT,
    "score" REAL,
    "maxScore" REAL,
    "timeSpent" INTEGER,
    CONSTRAINT "exam_details_examRecordId_fkey" FOREIGN KEY ("examRecordId") REFERENCES "exam_records" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "exam_details_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "practice_records" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "userAnswer" TEXT,
    "aiScore" REAL,
    "aiFeedback" TEXT,
    "timeSpent" INTEGER,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "userNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "practice_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "practice_records_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "learning_progress" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "questionType" TEXT NOT NULL,
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "completedQuestions" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "totalScore" REAL NOT NULL DEFAULT 0,
    "avgScore" REAL,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "lastPracticeDate" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "learning_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_analyses" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "analysisType" TEXT NOT NULL,
    "weaknessAreas" TEXT,
    "strengthAreas" TEXT,
    "recommendedPath" TEXT,
    "overallAssessment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_analyses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "questions_type_idx" ON "questions"("type");

-- CreateIndex
CREATE INDEX "questions_status_idx" ON "questions"("status");

-- CreateIndex
CREATE INDEX "questions_difficulty_idx" ON "questions"("difficulty");

-- CreateIndex
CREATE INDEX "exam_records_userId_idx" ON "exam_records"("userId");

-- CreateIndex
CREATE INDEX "exam_records_examType_idx" ON "exam_records"("examType");

-- CreateIndex
CREATE INDEX "exam_details_examRecordId_idx" ON "exam_details"("examRecordId");

-- CreateIndex
CREATE INDEX "practice_records_userId_idx" ON "practice_records"("userId");

-- CreateIndex
CREATE INDEX "practice_records_questionId_idx" ON "practice_records"("questionId");

-- CreateIndex
CREATE INDEX "practice_records_userId_createdAt_idx" ON "practice_records"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "learning_progress_userId_idx" ON "learning_progress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "learning_progress_userId_questionType_key" ON "learning_progress"("userId", "questionType");

-- CreateIndex
CREATE INDEX "ai_analyses_userId_idx" ON "ai_analyses"("userId");

-- CreateIndex
CREATE INDEX "ai_analyses_userId_createdAt_idx" ON "ai_analyses"("userId", "createdAt");
