-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('food', 'toy', 'accessory', 'beds', 'furniture');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "category" "ProductCategory",
ADD COLUMN     "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "reviews" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shortDescription" TEXT,
ADD COLUMN     "specifications" JSONB;
