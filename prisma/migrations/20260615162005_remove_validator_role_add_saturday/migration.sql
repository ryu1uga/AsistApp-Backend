-- Remove "validator" from UserRole enum
-- (Postgres requires recreating the type and migrating dependent columns)
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM ('admin', 'trainee');

ALTER TABLE "users"
  ALTER COLUMN "role" TYPE "UserRole" USING ("role"::text::"UserRole");

DROP TYPE "UserRole_old";

-- Add "saturday" to DayOfWeek enum
ALTER TYPE "DayOfWeek" ADD VALUE 'saturday';
