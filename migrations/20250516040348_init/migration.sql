-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ManualCrashResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isWin" BOOLEAN NOT NULL,
    "multiplier" REAL NOT NULL,
    CONSTRAINT "ManualCrashResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiLearnedPattern" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patternSequence" TEXT NOT NULL,
    "nextResultWinRate" REAL NOT NULL,
    "totalOccurrences" INTEGER NOT NULL DEFAULT 0,
    "winOccurrences" INTEGER NOT NULL DEFAULT 0,
    "lastSeen" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserIdentifiedPattern" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "patternSequence" TEXT NOT NULL,
    "expectedResult" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "isMarked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserIdentifiedPattern_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiSuggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "triggeringPattern" TEXT NOT NULL,
    "suggestedOutcome" TEXT NOT NULL,
    "confidence" REAL,
    "targetMultiplier" REAL,
    "actualOutcome" TEXT,
    "aiLearnedPatternId" TEXT,
    CONSTRAINT "AiSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AiSuggestion_aiLearnedPatternId_fkey" FOREIGN KEY ("aiLearnedPatternId") REFERENCES "AiLearnedPattern" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BankSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "initialBankroll" REAL NOT NULL DEFAULT 0,
    "profitTarget" REAL NOT NULL DEFAULT 0,
    "initialCycleStake" REAL NOT NULL DEFAULT 0,
    "stopLossPercentage" REAL NOT NULL DEFAULT 0,
    "defaultMultiplier" REAL NOT NULL DEFAULT 2.0,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "currentBankroll" REAL,
    "cycleProfitTarget" REAL,
    "currentStake" REAL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BankSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "AiLearnedPattern_patternSequence_key" ON "AiLearnedPattern"("patternSequence");

-- CreateIndex
CREATE UNIQUE INDEX "UserIdentifiedPattern_userId_patternSequence_source_key" ON "UserIdentifiedPattern"("userId", "patternSequence", "source");

-- CreateIndex
CREATE UNIQUE INDEX "BankSetting_userId_key" ON "BankSetting"("userId");
