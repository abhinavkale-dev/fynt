

BEGIN;

DELETE FROM "Workflow" w
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements(
    CASE
      WHEN jsonb_typeof(w."nodes") = 'array' THEN w."nodes"
      ELSE '[]'::jsonb
    END
  ) AS node
  WHERE COALESCE(node->>'type', '') IN ('airtableNode', 'emailNode', 'email')
);

DELETE FROM "Credentials"
WHERE "platform"::text IN ('airtable', 'email');

CREATE TYPE "Platform_new" AS ENUM (
  'telegram',
  'slack',
  'openai',
  'discord',
  'anthropic',
  'gemini',
  'github',
  'google',
  'notion'
);

ALTER TABLE "Credentials"
ALTER COLUMN "platform" TYPE "Platform_new"
USING ("platform"::text::"Platform_new");

DROP TYPE "Platform";
ALTER TYPE "Platform_new" RENAME TO "Platform";

COMMIT;
