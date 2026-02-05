-- Rename departments table to divisions
ALTER TABLE "departments" RENAME TO "divisions";

-- Rename department column in users table to division
ALTER TABLE "users" RENAME COLUMN "department" TO "division";

-- Rename department_id column in correspondence table to division_id
ALTER TABLE "correspondence" RENAME COLUMN "department_id" TO "division_id";

-- Rename department_id column in sla_rules table to division_id
ALTER TABLE "sla_rules" RENAME COLUMN "department_id" TO "division_id";
