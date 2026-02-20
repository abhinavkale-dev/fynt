"use client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc/client";
import { ValidationMessage } from "../../shared";
interface NotionConfigProps {
    data: Record<string, any>;
    onSave: (data: Record<string, any>) => void;
}
type NotionOperation = "create" | "get" | "get_many" | "update";
type ArchivedState = "" | "true" | "false";
function hyphenateNotionId(compactId: string): string {
    return `${compactId.slice(0, 8)}-${compactId.slice(8, 12)}-${compactId.slice(12, 16)}-${compactId.slice(16, 20)}-${compactId.slice(20, 32)}`;
}
function parseNotionUrl(value: string): URL | null {
    try {
        return new URL(value);
    }
    catch {
        if (!/^https?:\/\//i.test(value) && /notion\.so/i.test(value)) {
            try {
                return new URL(`https://${value}`);
            }
            catch {
                return null;
            }
        }
        return null;
    }
}
function normalizeNotionIdentifier(value: string | undefined): string | undefined {
    if (!value)
        return undefined;
    const trimmed = value.trim();
    if (!trimmed)
        return undefined;
    const parsedUrl = parseNotionUrl(trimmed);
    if (parsedUrl) {
        const path = parsedUrl.pathname;
        const pathUuidMatches = path.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/ig);
        if (pathUuidMatches && pathUuidMatches.length > 0) {
            return pathUuidMatches[pathUuidMatches.length - 1]!.toLowerCase();
        }
        const pathCompactMatches = path.match(/[0-9a-f]{32}/ig);
        if (pathCompactMatches && pathCompactMatches.length > 0) {
            const last = pathCompactMatches[pathCompactMatches.length - 1]!;
            return hyphenateNotionId(last.toLowerCase());
        }
    }
    const uuidMatch = trimmed.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (uuidMatch?.[0])
        return uuidMatch[0].toLowerCase();
    const compactMatches = trimmed.match(/[0-9a-f]{32}/ig);
    if (compactMatches && compactMatches.length > 0) {
        const first = compactMatches[0]!;
        return hyphenateNotionId(first.toLowerCase());
    }
    return undefined;
}
function looksLikeTemplateExpression(value: string): boolean {
    return /\{[^{}]+\}/.test(value);
}
function isClearlyInvalidNotionId(value: string): boolean {
    const trimmed = value.trim();
    if (!trimmed)
        return true;
    if (/^0{8}-0{4}-0{4}-0{4}-0{12}$/i.test(trimmed))
        return true;
    if (/^x{16,}$/i.test(trimmed))
        return true;
    if (/^0{16,}$/i.test(trimmed))
        return true;
    if (trimmed === "change-this-secret")
        return true;
    return false;
}
export function NotionConfig({ data, onSave }: NotionConfigProps) {
    const [label, setLabel] = useState(data.label || "Notion");
    const [responseName, setResponseName] = useState(data.responseName || "notionResponse");
    const [credentialId, setCredentialId] = useState(data.credentialId || "");
    const [operation, setOperation] = useState<NotionOperation>(data.operation === "get" || data.operation === "get_many" || data.operation === "update"
        ? data.operation
        : "create");
    const [targetId, setTargetId] = useState(data.dataSourceId || data.databaseId || "");
    const [pageId, setPageId] = useState(data.pageId || "");
    const [propertiesTemplate, setPropertiesTemplate] = useState(data.propertiesTemplate ||
        '{"Name":{"title":[{"text":{"content":"Fynt entry"}}]}}');
    const [childrenTemplate, setChildrenTemplate] = useState(data.childrenTemplate || "");
    const [filterTemplate, setFilterTemplate] = useState(data.filterTemplate || "");
    const [sortsTemplate, setSortsTemplate] = useState(data.sortsTemplate || "");
    const [pageSize, setPageSize] = useState(typeof data.pageSize === "number" ? String(data.pageSize) : "25");
    const [startCursor, setStartCursor] = useState(data.startCursor || "");
    const [archived, setArchived] = useState<ArchivedState>(typeof data.archived === "boolean" ? String(data.archived) as ArchivedState : "");
    const targetIdIsTemplate = looksLikeTemplateExpression(targetId);
    const pageIdIsTemplate = looksLikeTemplateExpression(pageId);
    const normalizedTargetId = normalizeNotionIdentifier(targetId);
    const normalizedPageId = normalizeNotionIdentifier(pageId);
    const hasValidTargetId = targetIdIsTemplate ||
        (Boolean(normalizedTargetId) && !isClearlyInvalidNotionId(normalizedTargetId!));
    const hasValidPageId = pageIdIsTemplate ||
        (Boolean(normalizedPageId) && !isClearlyInvalidNotionId(normalizedPageId!));
    const credentialsQuery = trpc.credentials.getAll.useQuery(undefined, {
        refetchOnWindowFocus: false,
    });
    const notionCredentials = useMemo(() => (credentialsQuery.data ?? []).filter((credential) => credential.platform === "notion"), [credentialsQuery.data]);
    const missingFields: string[] = [];
    if (!label.trim())
        missingFields.push("Label");
    if (!responseName.trim())
        missingFields.push("Response Name");
    if (!credentialId)
        missingFields.push("Credential");
    if (operation === "create") {
        if (!targetId.trim())
            missingFields.push("Data Source ID or Database ID");
        else if (!hasValidTargetId)
            missingFields.push("Valid Data Source ID or Database ID");
        if (!propertiesTemplate.trim())
            missingFields.push("Properties Template");
    }
    if (operation === "get") {
        if (!pageId.trim())
            missingFields.push("Page ID");
        else if (!hasValidPageId)
            missingFields.push("Valid Page ID");
    }
    if (operation === "get_many") {
        if (!targetId.trim())
            missingFields.push("Data Source ID or Database ID");
        else if (!hasValidTargetId)
            missingFields.push("Valid Data Source ID or Database ID");
    }
    if (operation === "update") {
        if (!pageId.trim())
            missingFields.push("Page ID");
        else if (!hasValidPageId)
            missingFields.push("Valid Page ID");
        if (!propertiesTemplate.trim() && archived === "") {
            missingFields.push("Properties Template or Archived");
        }
    }
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let parsedPageSize: number | undefined;
        if (pageSize.trim()) {
            const n = Number.parseInt(pageSize, 10);
            if (Number.isFinite(n)) {
                parsedPageSize = Math.min(100, Math.max(1, n));
            }
        }
        onSave({
            label,
            responseName,
            credentialId,
            operation,
            dataSourceId: targetIdIsTemplate ? targetId.trim() : (normalizedTargetId ?? targetId.trim()),
            databaseId: targetIdIsTemplate ? targetId.trim() : (normalizedTargetId ?? targetId.trim()),
            pageId: pageIdIsTemplate ? pageId.trim() : (normalizedPageId ?? pageId.trim()),
            propertiesTemplate,
            childrenTemplate,
            filterTemplate,
            sortsTemplate,
            pageSize: parsedPageSize,
            startCursor,
            archived: archived === "" ? undefined : archived === "true",
        });
    };
    return (<form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-white/80">Node Label</Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Notion" className="bg-[#2D2D2E] border-[#444] text-white"/>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80">Response Name</Label>
        <Input value={responseName} onChange={(e) => setResponseName(e.target.value)} placeholder="notionResponse" className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30"/>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80">Credential</Label>
        <select value={credentialId} onChange={(e) => setCredentialId(e.target.value)} className="w-full h-9 rounded-md border border-[#444] bg-[#2D2D2E] px-3 text-sm text-white focus:outline-none">
          <option value="">Select a credential</option>
          {notionCredentials.map((credential) => (<option key={credential.id} value={credential.id}>
              {credential.title}
            </option>))}
        </select>
        <p className="text-xs text-white/40">
          No Notion credentials?{" "}
          <a href="/home/credentials" className="text-[#F04D26] hover:text-[#F04D26]/90 underline">
            Add one in Credentials page
          </a>
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80">Operation</Label>
        <select value={operation} onChange={(e) => setOperation(e.target.value as NotionOperation)} className="w-full h-9 rounded-md border border-[#444] bg-[#2D2D2E] px-3 text-sm text-white focus:outline-none">
          <option value="create">Create Database Page</option>
          <option value="get">Get Page</option>
          <option value="get_many">Get Many Data Source Pages</option>
          <option value="update">Update Page</option>
        </select>
        <p className="text-xs text-white/40">
          Quick setup: just paste a Notion link. Use a database link for Create/Get Many, and a page link for Get/Update.
        </p>
      </div>

      {(operation === "create" || operation === "get_many") && (<div className="space-y-2">
          <Label className="text-white/80">Notion Database Link</Label>
          <Input value={targetId} onChange={(e) => setTargetId(e.target.value)} placeholder="Paste Notion database link" className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30"/>
          <p className="text-xs text-white/40">
            Copy link from the database in Notion and paste it here. We auto-extract the ID. Raw ID also works.
          </p>
          <p className="text-xs text-white/40">
            For this operation, use a database link (not a regular page link).
          </p>
          {targetId.trim() && !hasValidTargetId && (<p className="text-xs text-amber-300">
              Could not parse a Notion database ID from this value. Paste a database link or valid ID.
            </p>)}
        </div>)}

      {(operation === "get" || operation === "update") && (<div className="space-y-2">
          <Label className="text-white/80">Notion Page Link</Label>
          <Input value={pageId} onChange={(e) => setPageId(e.target.value)} placeholder="Paste Notion page link" className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30"/>
          <p className="text-xs text-white/40">
            Copy link from the page in Notion and paste it here. We auto-extract the page ID. Raw ID also works.
          </p>
          {pageId.trim() && !hasValidPageId && (<p className="text-xs text-amber-300">
              Could not parse a Notion page ID from this value.
            </p>)}
        </div>)}

      {(operation === "create" || operation === "update") && (<div className="space-y-2">
          <Label className="text-white/80">Properties Template (JSON)</Label>
          <textarea value={propertiesTemplate} onChange={(e) => setPropertiesTemplate(e.target.value)} rows={5} className="w-full rounded-md border border-[#444] bg-[#2D2D2E] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none resize-none font-mono" placeholder='{"Name":{"title":[{"text":{"content":"Hello"}}]}}'/>
          <p className="text-xs text-white/40">
            Must resolve to a JSON object. Use {`{json variable.path}`} for objects/arrays.
          </p>
        </div>)}

      {operation === "create" && (<div className="space-y-2">
          <Label className="text-white/80" optional>Page Content Template (JSON Array)</Label>
          <textarea value={childrenTemplate} onChange={(e) => setChildrenTemplate(e.target.value)} rows={5} className="w-full rounded-md border border-[#444] bg-[#2D2D2E] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none resize-none font-mono" placeholder='[{"object":"block","type":"paragraph","paragraph":{"rich_text":[{"type":"text","text":{"content":"Entry details"}}]}}]'/>
          <p className="text-xs text-white/40">
            Optional Notion page blocks. Must resolve to a JSON array. Useful for AI summaries and report details.
          </p>
        </div>)}

      {operation === "get_many" && (<>
          <div className="space-y-2">
            <Label className="text-white/80" optional>Filter Template (JSON Object)</Label>
            <textarea value={filterTemplate} onChange={(e) => setFilterTemplate(e.target.value)} rows={4} className="w-full rounded-md border border-[#444] bg-[#2D2D2E] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none resize-none font-mono" placeholder='{"property":"Status","select":{"equals":"Todo"}}'/>
          </div>

          <div className="space-y-2">
            <Label className="text-white/80" optional>Sorts Template (JSON Array)</Label>
            <textarea value={sortsTemplate} onChange={(e) => setSortsTemplate(e.target.value)} rows={3} className="w-full rounded-md border border-[#444] bg-[#2D2D2E] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none resize-none font-mono" placeholder='[{"timestamp":"created_time","direction":"descending"}]'/>
          </div>

          <div className="space-y-2">
            <Label className="text-white/80" optional>Page Size (1-100)</Label>
            <Input type="number" min="1" max="100" value={pageSize} onChange={(e) => setPageSize(e.target.value)} placeholder="25" className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30"/>
          </div>

          <div className="space-y-2">
            <Label className="text-white/80" optional>Start Cursor</Label>
            <Input value={startCursor} onChange={(e) => setStartCursor(e.target.value)} placeholder="next_cursor from prior response" className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30"/>
          </div>
        </>)}

      {operation === "update" && (<div className="space-y-2">
          <Label className="text-white/80" optional>Archived</Label>
          <select value={archived} onChange={(e) => setArchived(e.target.value as ArchivedState)} className="w-full h-9 rounded-md border border-[#444] bg-[#2D2D2E] px-3 text-sm text-white focus:outline-none">
            <option value="">No change</option>
            <option value="true">Archive page</option>
            <option value="false">Unarchive page</option>
          </select>
        </div>)}

      <ValidationMessage missingFields={missingFields}/>

      <Button type="submit" disabled={missingFields.length > 0} className="w-full bg-[#F04D26] hover:bg-[#e04420] text-white disabled:bg-[#F04D26]/50 disabled:text-white/70">
        Save
      </Button>
    </form>);
}
