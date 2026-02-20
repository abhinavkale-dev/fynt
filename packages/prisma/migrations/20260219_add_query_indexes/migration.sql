

CREATE INDEX IF NOT EXISTS "Workflow_userId_updatedAt_idx"
  ON "Workflow" ("userId", "updatedAt");

CREATE INDEX IF NOT EXISTS "Credentials_userId_platform_updatedAt_idx"
  ON "Credentials" ("userId", "platform", "updatedAt");

CREATE INDEX IF NOT EXISTS "WorkflowRun_workflowId_createdAt_idx"
  ON "WorkflowRun" ("workflowId", "createdAt");

CREATE INDEX IF NOT EXISTS "WorkflowRun_workflowId_status_createdAt_idx"
  ON "WorkflowRun" ("workflowId", "status", "createdAt");

CREATE INDEX IF NOT EXISTS "WorkflowRun_status_workflowId_idx"
  ON "WorkflowRun" ("status", "workflowId");

CREATE INDEX IF NOT EXISTS "NodeRun_workflowRunId_startedAt_idx"
  ON "NodeRun" ("workflowRunId", "startedAt");
