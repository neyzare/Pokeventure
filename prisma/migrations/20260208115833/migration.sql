-- CreateTable
CREATE TABLE "Combat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "playerPokemonId" INTEGER NOT NULL,
    "opponentPokemonId" INTEGER NOT NULL,
    "result" TEXT NOT NULL,
    "turns" INTEGER NOT NULL,
    "moneyGained" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Combat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Combat_userId_idx" ON "Combat"("userId");

-- AddForeignKey
ALTER TABLE "Combat" ADD CONSTRAINT "Combat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
