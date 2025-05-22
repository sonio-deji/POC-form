-- CreateTable
CREATE TABLE "Analytics" (
    "id" TEXT NOT NULL,
    "visitsByLocation" TEXT,
    "visitsByBrowser" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,

    CONSTRAINT "Analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Analytics_id_key" ON "Analytics"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Analytics_websiteId_key" ON "Analytics"("websiteId");

-- AddForeignKey
ALTER TABLE "Analytics" ADD CONSTRAINT "Analytics_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;
