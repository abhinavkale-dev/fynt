"use client";
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
type PlaygroundConfigNodeType = "manualTrigger" | "triggerNode" | "openaiNode" | "conditionNode" | "slackNode" | "logNode";
interface PlaygroundNodeConfigDialogProps {
    open: boolean;
    nodeId: string | null;
    nodeType: string | null;
    nodeData: Record<string, unknown> | null;
    onOpenChange: (open: boolean) => void;
    onSave: (nodeId: string, data: Record<string, unknown>) => void;
}
const SUPPORTED_NODE_TYPES = new Set<PlaygroundConfigNodeType>([
    "manualTrigger",
    "triggerNode",
    "openaiNode",
    "conditionNode",
    "slackNode",
    "logNode",
]);
function getDefaultLabel(nodeType: string | null): string {
    switch (nodeType) {
        case "manualTrigger":
        case "triggerNode":
            return "Manual Trigger";
        case "openaiNode":
            return "AI Summary";
        case "conditionNode":
            return "Route by Risk";
        case "slackNode":
            return "Alert Team (Slack)";
        case "logNode":
            return "Archive Event";
        default:
            return "Node";
    }
}
function getDialogMeta(nodeType: string | null): {
    title: string;
    description: string;
} {
    switch (nodeType) {
        case "manualTrigger":
        case "triggerNode":
            return {
                title: "Manual Trigger Settings",
                description: "Customize the trigger label used in the playground demo.",
            };
        case "openaiNode":
            return {
                title: "AI Node Settings",
                description: "Adjust model and prompt for demo execution.",
            };
        case "conditionNode":
            return {
                title: "Condition Settings",
                description: "Choose which branch will run in demo workflow execution.",
            };
        case "slackNode":
            return {
                title: "Slack Node Settings",
                description: "Edit outgoing Slack message content for demo mode.",
            };
        case "logNode":
            return {
                title: "Log Node Settings",
                description: "Set log level and message for demo mode.",
            };
        default:
            return {
                title: "Node Settings",
                description: "This node does not have playground settings.",
            };
    }
}
export function PlaygroundNodeConfigDialog({ open, nodeId, nodeType, nodeData, onOpenChange, onSave, }: PlaygroundNodeConfigDialogProps) {
    const [label, setLabel] = useState("");
    const [model, setModel] = useState("");
    const [prompt, setPrompt] = useState("");
    const [demoRoute, setDemoRoute] = useState<"alert" | "log">("alert");
    const [subtitle, setSubtitle] = useState("");
    const [message, setMessage] = useState("");
    const [logLevel, setLogLevel] = useState<"debug" | "info" | "warn" | "error">("info");
    const meta = useMemo(() => getDialogMeta(nodeType), [nodeType]);
    const isSupportedType = nodeType ? SUPPORTED_NODE_TYPES.has(nodeType as PlaygroundConfigNodeType) : false;
    useEffect(() => {
        if (!open) {
            return;
        }
        const nextData = nodeData ?? {};
        const nextLabel = typeof nextData.label === "string" && nextData.label.trim().length > 0
            ? nextData.label
            : getDefaultLabel(nodeType);
        setLabel(nextLabel);
        setModel(typeof nextData.model === "string" ? nextData.model : "gpt-5-mini");
        setPrompt(typeof nextData.prompt === "string"
            ? nextData.prompt
            : "Summarize updates and classify risk level.");
        setDemoRoute(nextData.demoRoute === "log" ? "log" : "alert");
        setSubtitle(typeof nextData.subtitle === "string"
            ? nextData.subtitle
            : "Send message");
        setMessage(typeof nextData.message === "string"
            ? nextData.message
            : "High-risk update detected");
        setLogLevel(nextData.level === "debug" ||
            nextData.level === "warn" ||
            nextData.level === "error"
            ? nextData.level
            : "info");
    }, [nodeData, nodeType, open]);
    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!nodeId || !nodeType) {
            return;
        }
        const trimmedLabel = label.trim() || getDefaultLabel(nodeType);
        const payload: Record<string, unknown> = {
            label: trimmedLabel,
            isConfigured: true,
        };
        if (nodeType === "openaiNode") {
            payload.model = model.trim() || "gpt-5-mini";
            payload.prompt = prompt.trim() || "Summarize updates and classify risk level.";
            payload.credentialId = "landing-demo-openai";
        }
        else if (nodeType === "conditionNode") {
            payload.routes = ["alert", "log"];
            payload.demoRoute = demoRoute;
        }
        else if (nodeType === "slackNode") {
            payload.subtitle = subtitle.trim() || "Send message";
            payload.message = message.trim() || "High-risk update detected";
            payload.credentialId = "landing-demo-slack";
        }
        else if (nodeType === "logNode") {
            payload.level = logLevel;
            payload.message = message.trim() || "Low-risk update logged";
        }
        onSave(nodeId, payload);
        onOpenChange(false);
    };
    return (<Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{meta.title}</DialogTitle>
          <DialogDescription>{meta.description}</DialogDescription>
        </DialogHeader>

        {!isSupportedType ? (<div className="rounded-md border border-[#333] bg-[#151515] px-4 py-3 text-sm text-white/60">
            Playground settings are not available for this node type.
          </div>) : (<form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label className="text-white/80">Label</Label>
              <Input value={label} onChange={(event) => setLabel(event.target.value)} className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30" placeholder={getDefaultLabel(nodeType)}/>
            </div>

            {nodeType === "openaiNode" && (<>
                <div className="space-y-2">
                  <Label className="text-white/80">Model</Label>
                  <Input value={model} onChange={(event) => setModel(event.target.value)} className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30" placeholder="gpt-5-mini"/>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Prompt</Label>
                  <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={3} className="w-full rounded-md border border-[#444] bg-[#2D2D2E] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-ring resize-none" placeholder="Summarize updates and classify risk level."/>
                </div>
              </>)}

            {nodeType === "conditionNode" && (<div className="space-y-2">
                <Label className="text-white/80">Demo Route</Label>
                <select value={demoRoute} onChange={(event) => setDemoRoute(event.target.value === "log" ? "log" : "alert")} className="w-full h-9 rounded-md border border-[#444] bg-[#2D2D2E] px-3 text-sm text-white focus:outline-none">
                  <option value="alert">Alert</option>
                  <option value="log">Log</option>
                </select>
              </div>)}

            {nodeType === "slackNode" && (<>
                <div className="space-y-2">
                  <Label className="text-white/80">Subtitle</Label>
                  <Input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30" placeholder="Send message"/>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Message</Label>
                  <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={3} className="w-full rounded-md border border-[#444] bg-[#2D2D2E] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-ring resize-none" placeholder="High-risk update detected"/>
                </div>
              </>)}

            {nodeType === "logNode" && (<>
                <div className="space-y-2">
                  <Label className="text-white/80">Log Level</Label>
                  <select value={logLevel} onChange={(event) => setLogLevel(event.target.value === "debug" ||
                    event.target.value === "warn" ||
                    event.target.value === "error"
                    ? event.target.value
                    : "info")} className="w-full h-9 rounded-md border border-[#444] bg-[#2D2D2E] px-3 text-sm text-white focus:outline-none">
                    <option value="debug">Debug</option>
                    <option value="info">Info</option>
                    <option value="warn">Warn</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Message</Label>
                  <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={3} className="w-full rounded-md border border-[#444] bg-[#2D2D2E] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-ring resize-none" placeholder="Low-risk update logged"/>
                </div>
              </>)}

            <DialogFooter>
              <Button type="button" variant="outline" className="border-[#444] bg-[#2D2D2E] text-white hover:bg-[#3A3A3A]" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#F04D26] hover:bg-[#e04420] text-white">
                Save
              </Button>
            </DialogFooter>
          </form>)}
      </DialogContent>
    </Dialog>);
}
