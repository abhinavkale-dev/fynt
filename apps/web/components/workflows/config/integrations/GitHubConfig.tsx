"use client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc/client";
import { ValidationMessage } from "../../shared";
interface GitHubConfigProps {
    data: Record<string, any>;
    onSave: (data: Record<string, any>) => void;
}
type GitHubOperation = "create_issue" | "create_comment" | "get_issue";
export function GitHubConfig({ data, onSave }: GitHubConfigProps) {
    const [label, setLabel] = useState(data.label || "GitHub");
    const [responseName, setResponseName] = useState(data.responseName || "githubResponse");
    const [credentialId, setCredentialId] = useState(data.credentialId || "");
    const [operation, setOperation] = useState<GitHubOperation>(data.operation === "create_comment" || data.operation === "get_issue"
        ? data.operation
        : "create_issue");
    const [owner, setOwner] = useState(data.owner || "");
    const [repo, setRepo] = useState(data.repo || "");
    const [issueNumber, setIssueNumber] = useState(data.issueNumber || "");
    const [title, setTitle] = useState(data.title || "");
    const [body, setBody] = useState(data.body || "");
    const [labelsTemplate, setLabelsTemplate] = useState(data.labelsTemplate || "");
    const credentialsQuery = trpc.credentials.getAll.useQuery(undefined, {
        refetchOnWindowFocus: false,
    });
    const githubCredentials = useMemo(() => (credentialsQuery.data ?? []).filter((credential) => credential.platform === "github"), [credentialsQuery.data]);
    const missingFields: string[] = [];
    if (!label.trim())
        missingFields.push("Node Label");
    if (!responseName.trim())
        missingFields.push("Response Name");
    if (!credentialId)
        missingFields.push("Credential");
    if (!owner.trim())
        missingFields.push("Owner");
    if (!repo.trim())
        missingFields.push("Repository");
    if (operation === "create_issue") {
        if (!title.trim())
            missingFields.push("Issue Title");
    }
    if (operation === "create_comment" || operation === "get_issue") {
        if (!issueNumber.trim())
            missingFields.push("Issue Number");
    }
    if (operation === "create_comment" && !body.trim()) {
        missingFields.push("Comment Body");
    }
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            label,
            responseName,
            credentialId,
            operation,
            owner,
            repo,
            issueNumber,
            title,
            body,
            labelsTemplate,
        });
    };
    return (<form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-white/80">Node Label</Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="GitHub" className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30"/>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80">Response Name</Label>
        <Input value={responseName} onChange={(e) => setResponseName(e.target.value)} placeholder="githubResponse" className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30"/>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80">Credential</Label>
        <select value={credentialId} onChange={(e) => setCredentialId(e.target.value)} className="w-full h-9 rounded-md border border-[#444] bg-[#2D2D2E] px-3 text-sm text-white focus:outline-none">
          <option value="">Select a credential</option>
          {githubCredentials.map((credential) => (<option key={credential.id} value={credential.id}>
              {credential.title}
            </option>))}
        </select>
        <p className="text-xs text-white/40">
          No GitHub credentials?{" "}
          <a href="/home/credentials" className="text-[#F04D26] hover:text-[#F04D26]/90 underline">
            Add one in Credentials page
          </a>
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80">Operation</Label>
        <select value={operation} onChange={(e) => setOperation(e.target.value as GitHubOperation)} className="w-full h-9 rounded-md border border-[#444] bg-[#2D2D2E] px-3 text-sm text-white focus:outline-none">
          <option value="create_issue">Create Issue</option>
          <option value="create_comment">Create Issue Comment</option>
          <option value="get_issue">Get Issue</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-white/80">Owner</Label>
          <Input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="octocat" className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30"/>
        </div>
        <div className="space-y-2">
          <Label className="text-white/80">Repository</Label>
          <Input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="hello-world" className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30"/>
        </div>
      </div>

      {(operation === "create_comment" || operation === "get_issue") && (<div className="space-y-2">
          <Label className="text-white/80">Issue Number</Label>
          <Input value={issueNumber} onChange={(e) => setIssueNumber(e.target.value)} placeholder="123" className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30"/>
        </div>)}

      {operation === "create_issue" && (<>
          <div className="space-y-2">
            <Label className="text-white/80">Issue Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bug: API timeout in production" className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30"/>
          </div>
          <div className="space-y-2">
            <Label className="text-white/80" optional>Issue Body</Label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="w-full rounded-md border border-[#444] bg-[#2D2D2E] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none resize-none" placeholder="Issue details..."/>
          </div>
          <div className="space-y-2">
            <Label className="text-white/80" optional>Labels Template (JSON Array)</Label>
            <Input value={labelsTemplate} onChange={(e) => setLabelsTemplate(e.target.value)} placeholder='["bug","high-priority"]' className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30 font-mono"/>
          </div>
        </>)}

      {operation === "create_comment" && (<div className="space-y-2">
          <Label className="text-white/80">Comment Body</Label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="w-full rounded-md border border-[#444] bg-[#2D2D2E] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none resize-none" placeholder="Deployment completed successfully."/>
        </div>)}

      <ValidationMessage missingFields={missingFields}/>

      <Button type="submit" disabled={missingFields.length > 0} className="w-full bg-[#F04D26] hover:bg-[#e04420] text-white disabled:bg-[#F04D26]/50 disabled:text-white/70">
        Save
      </Button>
    </form>);
}
