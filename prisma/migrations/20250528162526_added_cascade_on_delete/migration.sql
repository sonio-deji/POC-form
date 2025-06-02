-- DropForeignKey
ALTER TABLE "VisitsByBrowser" DROP CONSTRAINT "VisitsByBrowser_analyticsId_fkey";

-- DropForeignKey
ALTER TABLE "VisitsByLocation" DROP CONSTRAINT "VisitsByLocation_analyticsId_fkey";

-- AddForeignKey
ALTER TABLE "VisitsByBrowser" ADD CONSTRAINT "VisitsByBrowser_analyticsId_fkey" FOREIGN KEY ("analyticsId") REFERENCES "Analytics"("websiteId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitsByLocation" ADD CONSTRAINT "VisitsByLocation_analyticsId_fkey" FOREIGN KEY ("analyticsId") REFERENCES "Analytics"("websiteId") ON DELETE CASCADE ON UPDATE CASCADE;
