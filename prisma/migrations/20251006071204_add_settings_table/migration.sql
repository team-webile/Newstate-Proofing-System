-- CreateTable
CREATE TABLE "settings" (
    "id" SERIAL NOT NULL,
    "site_name" TEXT NOT NULL DEFAULT 'Proofing System',
    "site_description" TEXT,
    "admin_email" TEXT,
    "logo_url" TEXT DEFAULT '/images/nsb-logo.png',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);
