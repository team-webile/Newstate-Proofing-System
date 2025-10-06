-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "canvas_height" DOUBLE PRECISION,
ADD COLUMN     "canvas_width" DOUBLE PRECISION,
ADD COLUMN     "canvas_x" DOUBLE PRECISION,
ADD COLUMN     "canvas_y" DOUBLE PRECISION,
ADD COLUMN     "image_height" DOUBLE PRECISION,
ADD COLUMN     "image_width" DOUBLE PRECISION;
