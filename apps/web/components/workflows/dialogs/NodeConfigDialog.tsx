"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, } from "@/components/ui/dialog";
import { getNodeDef } from "@repo/shared";
import { AnthropicConfig, ConditionConfig, CronTriggerConfig, DelayConfig, DiscordConfig, FilterConfig, GeminiConfig, GitHubConfig, HTTPConfig, LogConfig, NotionConfig, OpenAIConfig, SlackConfig, TransformConfig, TriggerConfig, WebhookTriggerConfig, } from "../config";
interface NodeConfigDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    nodeId: string;
    nodeType: string;
    nodeData: Record<string, any>;
    onSave: (nodeId: string, data: Record<string, any>) => void | Promise<void>;
}
const FALLBACK_META = { title: "Node Configuration", subtitle: "Configure this node" };
const LEGACY_ALIASES: Record<string, string> = {
    aiNode: 'openaiNode',
    triggerNode: 'manualTrigger',
};
function getConfigMeta(nodeType: string) {
    const resolved = LEGACY_ALIASES[nodeType] ?? nodeType;
    return getNodeDef(resolved)?.configMeta ?? FALLBACK_META;
}
export function NodeConfigDialog({ open, onOpenChange, nodeId, nodeType, nodeData, onSave, }: NodeConfigDialogProps) {
    const meta = getConfigMeta(nodeType);
    const [isSaving, setIsSaving] = useState(false);
    const handleSave = async (data: Record<string, any>) => {
        if (isSaving)
            return;
        try {
            setIsSaving(true);
            const nextIsConfigured = typeof data.isConfigured === "boolean" ? data.isConfigured : true;
            await Promise.resolve(onSave(nodeId, { ...data, isConfigured: nextIsConfigured }));
            onOpenChange(false);
        }
        finally {
            setIsSaving(false);
        }
    };
    const renderConfig = () => {
        switch (nodeType) {
            case 'aiNode':
            case 'openaiNode':
                return <OpenAIConfig data={nodeData} onSave={handleSave}/>;
            case 'geminiNode':
                return <GeminiConfig data={nodeData} onSave={handleSave}/>;
            case 'anthropicNode':
                return <AnthropicConfig data={nodeData} onSave={handleSave}/>;
            case 'discordNode':
                return <DiscordConfig data={nodeData} onSave={handleSave}/>;
            case 'slackNode':
                return <SlackConfig data={nodeData} onSave={handleSave}/>;
            case 'httpTrigger':
                return <HTTPConfig data={nodeData} onSave={handleSave}/>;
            case 'githubNode':
                return <GitHubConfig data={nodeData} onSave={handleSave}/>;
            case 'notionNode':
                return <NotionConfig data={nodeData} onSave={handleSave}/>;
            case 'triggerNode':
            case 'manualTrigger':
                return <TriggerConfig data={nodeData} onSave={handleSave}/>;
            case 'webhookTrigger':
                return <WebhookTriggerConfig nodeId={nodeId} data={nodeData} onSave={handleSave}/>;
            case 'cronTrigger':
                return <CronTriggerConfig data={nodeData} onSave={handleSave}/>;
            case 'conditionNode':
                return <ConditionConfig data={nodeData} onSave={handleSave}/>;
            case 'delayNode':
                return <DelayConfig data={nodeData} onSave={handleSave}/>;
            case 'logNode':
                return <LogConfig data={nodeData} onSave={handleSave}/>;
            case 'transformNode':
                return <TransformConfig data={nodeData} onSave={handleSave}/>;
            case 'filterNode':
                return <FilterConfig data={nodeData} onSave={handleSave}/>;
            default:
                return <p className="text-white/50 text-sm">No configuration available for this node type.</p>;
        }
    };
    return (<Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{meta.title}</DialogTitle>
          <DialogDescription>{meta.subtitle}</DialogDescription>
        </DialogHeader>
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.15, ease: 'easeOut' }}>
          {renderConfig()}
        </motion.div>
      </DialogContent>
    </Dialog>);
}
