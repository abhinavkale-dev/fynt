"use client";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc/client";
import { EASE_OUT_QUAD } from "@/lib/animation/variants";
const PLATFORMS = [
    { value: "openai", label: "OpenAI", logo: "/logo/openai.svg", description: "GPT models for text generation" },
    { value: "anthropic", label: "Anthropic", logo: "/logo/anthropic.svg", description: "Claude models for AI tasks" },
    { value: "gemini", label: "Gemini", logo: "/logo/gemini.svg", description: "Google AI models" },
    { value: "github", label: "GitHub", logo: "/logo/github.svg", description: "Repository and issue automation" },
    { value: "notion", label: "Notion", logo: "/logo/notion.svg", description: "Notion database page operations" },
    { value: "slack", label: "Slack", logo: "/logo/slack.svg", description: "Send messages via webhook" },
    { value: "discord", label: "Discord", logo: "/logo/discord.svg", description: "Send messages via webhook" },
] as const;
type PlatformValue = (typeof PLATFORMS)[number]["value"];
type CredentialField = {
    key: string;
    label: string;
    placeholder: string;
    inputType?: "password" | "text";
    advanced?: boolean;
    helperText?: string;
};
function isPlatformValue(value: string | null): value is PlatformValue {
    return PLATFORMS.some((platform) => platform.value === value);
}
function getSafeReturnToPath(value: string | null): string | null {
    if (!value)
        return null;
    if (!value.startsWith("/") || value.startsWith("//"))
        return null;
    return value;
}
function getKeyFields(platform: PlatformValue): CredentialField[] {
    switch (platform) {
        case "openai":
            return [{ key: "apiKey", label: "API Key", placeholder: "sk-..." }];
        case "anthropic":
            return [{ key: "apiKey", label: "API Key", placeholder: "sk-ant-..." }];
        case "gemini":
            return [{ key: "apiKey", label: "API Key", placeholder: "AIza..." }];
        case "github":
            return [{ key: "accessToken", label: "Personal Access Token", placeholder: "ghp_..." }];
        case "notion":
            return [
                { key: "accessToken", label: "Integration Token", placeholder: "ntn_..." },
                {
                    key: "workspacePageUrl",
                    label: "Notion Page Link",
                    placeholder: "https://www.notion.so/your-page-id",
                    inputType: "text",
                    helperText: "Paste a shared Notion page or database link. You can reuse this when configuring Notion nodes.",
                },
            ];
        case "slack":
            return [{ key: "webhookUrl", label: "Webhook URL", placeholder: "https://hooks.slack.com/services/..." }];
        case "discord":
            return [{ key: "webhookUrl", label: "Webhook URL", placeholder: "https://discord.com/api/webhooks/..." }];
        default:
            return [{ key: "apiKey", label: "API Key", placeholder: "" }];
    }
}
function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}
function CredentialsPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const utils = trpc.useUtils();
    const { data: credentials = [], isLoading } = trpc.credentials.getAll.useQuery(undefined, {
        staleTime: 60000,
        refetchOnWindowFocus: false,
    });
    const createMutation = trpc.credentials.create.useMutation({
        onSuccess: () => utils.credentials.getAll.invalidate(),
    });
    const updateMutation = trpc.credentials.update.useMutation({
        onSuccess: () => utils.credentials.getAll.invalidate(),
    });
    const deleteMutation = trpc.credentials.delete.useMutation({
        onSuccess: () => utils.credentials.getAll.invalidate(),
    });
    const credentialsByPlatform = useMemo(() => {
        const map: Record<string, typeof credentials> = {};
        for (const c of credentials) {
            if (!map[c.platform])
                map[c.platform] = [];
            map[c.platform]!.push(c);
        }
        return map;
    }, [credentials]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [platform, setPlatform] = useState<PlatformValue>("openai");
    const [keys, setKeys] = useState<Record<string, string>>({});
    const [showAdvancedFields, setShowAdvancedFields] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [managePlatform, setManagePlatform] = useState<PlatformValue | null>(null);
    const queryPlatform = searchParams.get("platform");
    const requestedPlatform = isPlatformValue(queryPlatform) ? queryPlatform : null;
    const shouldOpenCreate = searchParams.get("openCreate") === "1";
    const returnToPath = getSafeReturnToPath(searchParams.get("returnTo"));
    const queryKey = searchParams.toString();
    const handledQueryKeyRef = useRef<string | null>(null);
    const openCreateForPlatform = useCallback((platformValue: PlatformValue) => {
        setEditingId(null);
        setTitle("");
        setPlatform(platformValue);
        setKeys({});
        setShowAdvancedFields(false);
        setDialogOpen(true);
    }, []);
    function openEditDialog(credential: {
        id: string;
        title: string;
        platform: string;
    }) {
        setEditingId(credential.id);
        setTitle(credential.title);
        setPlatform(credential.platform as PlatformValue);
        setKeys({});
        setShowAdvancedFields(false);
        setDialogOpen(true);
    }
    useEffect(() => {
        if (!queryKey || handledQueryKeyRef.current === queryKey || !requestedPlatform) {
            return;
        }
        handledQueryKeyRef.current = queryKey;
        if (shouldOpenCreate) {
            openCreateForPlatform(requestedPlatform);
            return;
        }
        setManagePlatform(requestedPlatform);
    }, [queryKey, requestedPlatform, shouldOpenCreate, openCreateForPlatform]);
    async function handleSave() {
        if (!title.trim())
            return;
        if (editingId) {
            const payload: {
                id: string;
                title?: string;
                keys?: Record<string, string>;
            } = {
                id: editingId,
                title: title.trim(),
            };
            const hasKeys = Object.values(keys).some((v) => v.trim() !== "");
            if (hasKeys)
                payload.keys = keys;
            await updateMutation.mutateAsync(payload);
        }
        else {
            await createMutation.mutateAsync({
                title: title.trim(),
                platform,
                keys,
            });
        }
        setDialogOpen(false);
    }
    async function handleDelete() {
        if (!deleteId)
            return;
        await deleteMutation.mutateAsync({ id: deleteId });
        setDeleteId(null);
    }
    const isSaving = createMutation.isPending || updateMutation.isPending;
    const dialogPlatformMeta = PLATFORMS.find((p) => p.value === platform);
    const keyFields = useMemo(() => getKeyFields(platform), [platform]);
    const basicKeyFields = useMemo(() => keyFields.filter((field) => !field.advanced), [keyFields]);
    const advancedKeyFields = useMemo(() => keyFields.filter((field) => field.advanced), [keyFields]);
    const missingRequiredBasicFields = useMemo(() => editingId
        ? []
        : basicKeyFields
            .filter((field) => !(keys[field.key] ?? "").trim())
            .map((field) => field.label), [basicKeyFields, editingId, keys]);
    const isSaveDisabled = isSaving || !title.trim() || missingRequiredBasicFields.length > 0;
    return (<div className="flex-1 flex flex-col">
      <motion.div className="mb-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: EASE_OUT_QUAD }}>
        <h1 className="text-2xl font-bold text-foreground">Credentials</h1>
        <p className="text-sm text-muted-foreground">
          Manage API keys and webhook URLs for your integrations
        </p>
      </motion.div>

      {returnToPath && (<motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: EASE_OUT_QUAD }} className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-amber-100">
              Add the missing credentials, then return to complete template setup.
            </p>
            <Button size="sm" variant="outline" onClick={() => router.push(returnToPath as never)} className="shrink-0 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
              Back to Template
            </Button>
          </div>
        </motion.div>)}

      {isLoading ? (<div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {PLATFORMS.map((platform) => (<Card key={platform.value} className="bg-card border border-[#333] overflow-hidden h-fit animate-pulse">
              <div className="flex items-center gap-3">
                <div className="p-3 flex items-center gap-3 w-full">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-[#2D2D2E]"/>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="h-3.5 w-20 rounded bg-white/10 mb-2"/>
                    <div className="h-3 w-full rounded bg-white/5"/>
                  </div>

                  <div className="shrink-0 h-8 w-8 rounded bg-white/5"/>
                </div>
              </div>
            </Card>))}
        </div>) : (<div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-start">
          {PLATFORMS.map((p, index) => {
                const platformCreds = credentialsByPlatform[p.value] ?? [];
                return (<Card key={p.value} className="bg-card border border-[#333] transition-colors animate-in fade-in-0 slide-in-from-bottom-1 duration-200 overflow-hidden h-fit" style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'both' }}>
                <div className="p-3 flex items-center gap-3">
                  
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-[#2D2D2E] flex items-center justify-center p-2">
                      <Image src={p.logo} alt={p.label} width={24} height={24}/>
                    </div>
                    {platformCreds.length > 0 && (<span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold bg-[#f04d26] text-white leading-none">
                        {platformCreds.length}
                      </span>)}
                  </div>
                  
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground mb-0.5">{p.label}</h3>
                    <p className="text-xs text-muted-foreground leading-tight">{p.description}</p>
                  </div>
                  
                  
                  <button onClick={() => setManagePlatform(p.value)} className="shrink-0 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors duration-150" title="Manage keys" aria-label="Manage keys">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
                      <path opacity="0.4" d="M9.433 8.25H12.1541C11.8135 6.8198 10.5328 5.75 9 5.75C8.6769 5.75 8.371 5.8118 8.0762 5.8999L9.433 8.25Z" fill="currentColor"></path>
                      <path opacity="0.4" d="M9.4331 9.75L8.0766 12.1001C8.3713 12.1882 8.6771 12.25 9.0001 12.25C10.5329 12.25 11.8135 11.1802 12.1542 9.75H9.4331Z" fill="currentColor"></path>
                      <path opacity="0.4" d="M6.77409 6.64429C6.14689 7.23729 5.75009 8.0708 5.75009 9C5.75009 9.9292 6.14709 10.7629 6.77439 11.356L8.13419 9L6.77409 6.64429Z" fill="currentColor"></path>
                      <path d="M16.2501 8.25H15.2007C15.1289 7.6531 14.976 7.08111 14.7476 6.54761L15.6539 6.02441C16.0128 5.81741 16.1353 5.3589 15.9283 5C15.7208 4.6401 15.2618 4.51859 14.9039 4.72559L13.9904 5.2529C13.636 4.7822 13.2179 4.364 12.7471 4.0097L13.2744 3.0961C13.4814 2.7372 13.3589 2.27869 13 2.07169C12.6426 1.86519 12.1821 1.9867 11.9756 2.3461L11.4523 3.25229C10.919 3.02399 10.3468 2.87119 9.75001 2.79919V1.74991C9.75001 1.33581 9.41411 0.999908 9.00001 0.999908C8.58591 0.999908 8.25001 1.33581 8.25001 1.74991V2.79919C7.65311 2.87119 7.08101 3.02409 6.54771 3.25229L6.02441 2.3461C5.81741 1.9867 5.35891 1.86509 5.00001 2.07169C4.64111 2.27869 4.51861 2.7372 4.72561 3.0961L5.25291 4.0097C4.78211 4.3639 4.36401 4.7822 4.00961 5.2529L3.09611 4.72559C2.73771 4.51859 2.27871 4.6402 2.07171 5C1.86471 5.3589 1.98721 5.81741 2.34611 6.02441L3.25241 6.54761C3.02401 7.08101 2.87121 7.6531 2.79931 8.25H1.74991C1.33581 8.25 0.999908 8.5859 0.999908 9C0.999908 9.4141 1.33581 9.75 1.74991 9.75H2.79931C2.87111 10.3469 3.02401 10.9189 3.25241 11.4524L2.34611 11.9756C1.98721 12.1826 1.86471 12.6411 2.07171 13C2.21041 13.2407 2.46281 13.375 2.72161 13.375C2.84901 13.375 2.97791 13.3428 3.09611 13.2744L4.00961 12.7471C4.36401 13.2178 4.78211 13.636 5.25291 13.9903L4.72561 14.9039C4.51861 15.2628 4.64111 15.7213 5.00001 15.9283C5.11821 15.9967 5.2471 16.0289 5.3745 16.0289C5.6333 16.0289 5.88571 15.8946 6.02441 15.6539L6.54771 14.7477C7.08101 14.976 7.65321 15.1288 8.25001 15.2008V16.2501C8.25001 16.6642 8.58591 17.0001 9.00001 17.0001C9.41411 17.0001 9.75001 16.6642 9.75001 16.2501V15.2008C10.3469 15.1288 10.919 14.9759 11.4523 14.7477L11.9756 15.6539C12.1143 15.8946 12.3667 16.0289 12.6255 16.0289C12.7529 16.0289 12.8818 15.9967 13 15.9283C13.3589 15.7213 13.4814 15.2628 13.2744 14.9039L12.7471 13.9903C13.2179 13.6361 13.636 13.2178 13.9904 12.7471L14.9039 13.2744C15.0221 13.3428 15.151 13.375 15.2784 13.375C15.5372 13.375 15.7896 13.2407 15.9283 13C16.1353 12.6411 16.0128 12.1826 15.6539 11.9756L14.7476 11.4524C14.976 10.919 15.1288 10.3469 15.2007 9.75H16.2501C16.6642 9.75 17.0001 9.4141 17.0001 9C17.0001 8.5859 16.6642 8.25 16.2501 8.25ZM9.00011 13.75C6.38101 13.75 4.25011 11.6191 4.25011 9C4.25011 6.3809 6.38101 4.25 9.00011 4.25C11.6192 4.25 13.7501 6.3809 13.7501 9C13.7501 11.6191 11.6192 13.75 9.00011 13.75Z" fill="currentColor"></path>
                    </svg>
                  </button>
                </div>
              </Card>);
            })}
        </div>)}

      
      <Dialog open={!!managePlatform} onOpenChange={(open) => !open && setManagePlatform(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              {managePlatform && PLATFORMS.find(p => p.value === managePlatform) && (<div className="w-8 h-8 rounded-lg bg-[#2D2D2E] flex items-center justify-center p-1.5">
                  <Image src={PLATFORMS.find(p => p.value === managePlatform)!.logo} alt={PLATFORMS.find(p => p.value === managePlatform)!.label} width={20} height={20}/>
                </div>)}
              <DialogTitle className="text-white">
                Manage {PLATFORMS.find(p => p.value === managePlatform)?.label} Keys
              </DialogTitle>
            </div>
            <DialogDescription className="text-white">
              Add, edit, or delete your {PLATFORMS.find(p => p.value === managePlatform)?.label} credentials.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {managePlatform && credentialsByPlatform[managePlatform] && credentialsByPlatform[managePlatform].length > 0 ? (<motion.div className="space-y-3" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } } }}>
                {credentialsByPlatform[managePlatform]!.map((cred) => (<motion.div key={cred.id} variants={{
                    hidden: { opacity: 0, y: 6 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.15, ease: EASE_OUT_QUAD } },
                }} className="flex items-center justify-between p-3 rounded-lg border border-[#333] bg-[#1a1a1a] group/item">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{cred.title}</p>
                      <p className="text-xs text-white/60">
                        Added {formatDate(cred.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-3 shrink-0">
                      <button onClick={() => {
                    openEditDialog(cred);
                    setManagePlatform(null);
                }} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors" title="Edit name" aria-label="Edit credential">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
                          <path d="M11.4097 2.84199L3.60066 10.651C2.73766 11.515 2.19966 14.057 2.00766 15.11C1.96366 15.352 2.04166 15.601 2.21566 15.775C2.35766 15.917 2.54866 15.995 2.74566 15.995C2.78966 15.995 2.83466 15.991 2.87966 15.983C3.93266 15.792 6.47466 15.254 7.33866 14.39L15.1477 6.58099C16.1777 5.54999 16.1777 3.87399 15.1477 2.84299C14.1497 1.84499 12.4077 1.84499 11.4097 2.84199Z" fill="currentColor" fillOpacity="0.4"/>
                          <path d="M9.09546 5.15618L13.0557 9.11633C13.5438 9.60444 13.5438 10.3956 13.0557 10.8837L11.4697 12.4697C11.1768 12.7626 11.1768 13.2374 11.4697 13.5303C11.7626 13.8232 12.2375 13.8232 12.5304 13.5303L14.1164 11.9443C15.1903 10.8704 15.1903 9.12956 14.1164 8.05567C12.7963 6.7356 11.4762 5.41559 10.1561 4.09552L9.09546 5.15618Z" fill="currentColor"/>
                        </svg>
                      </button>
                      <button onClick={() => {
                    setDeleteId(cred.id);
                    setManagePlatform(null);
                }} className="p-2 text-muted-foreground hover:text-white hover:bg-red-600 rounded transition-colors" title="Delete" aria-label="Delete credential">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
                          <path opacity="0.4" d="M3.40771 5L3.90253 14.3892C3.97873 15.8531 5.18472 17 6.64862 17H11.3527C12.8166 17 14.0226 15.853 14.0988 14.3896L14.5936 5H3.40771Z" fill="currentColor"/>
                          <path d="M15.25 4H12V2.75C12 1.7852 11.2148 1 10.25 1H7.75C6.7852 1 6 1.7852 6 2.75V4H2.75C2.3359 4 2 4.3359 2 4.75C2 5.1641 2.3359 5.5 2.75 5.5H15.25C15.6641 5.5 16 5.1641 16 4.75C16 4.3359 15.6641 4 15.25 4ZM7.5 2.75C7.5 2.6143 7.6143 2.5 7.75 2.5H10.25C10.3857 2.5 10.5 2.6143 10.5 2.75V4H7.5V2.75Z" fill="currentColor"/>
                        </svg>
                      </button>
                    </div>
                  </motion.div>))}
              </motion.div>) : (<motion.div className="text-center py-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.1 }}>
                <p className="text-sm text-white/60 mb-3">No credentials added yet</p>
              </motion.div>)}
          </div>

          <div className="flex justify-end pt-3 border-t border-[#333]">
            <Button onClick={() => {
            if (managePlatform) {
                openCreateForPlatform(managePlatform);
                setManagePlatform(null);
            }
        }} className="bg-[#F04D26] hover:bg-[#e04420] text-white">
              <Plus className="mr-1.5 h-4 w-4"/>
              Add New Key
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                {dialogPlatformMeta && (<div className="w-8 h-8 rounded-lg bg-[#2D2D2E] flex items-center justify-center p-1.5">
                  <Image src={dialogPlatformMeta.logo} alt={dialogPlatformMeta.label} width={20} height={20}/>
                </div>)}
              <DialogTitle>{editingId ? `Edit ${dialogPlatformMeta?.label ?? ""} Credential` : `Add ${dialogPlatformMeta?.label ?? ""} Credential`}</DialogTitle>
            </div>
            <DialogDescription>
              {editingId
            ? "Update the credential details. Leave the key field empty to keep the existing value."
            : `Add a new ${dialogPlatformMeta?.description?.toLowerCase() ?? "credential"}.`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => {
            e.preventDefault();
            handleSave();
        }} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white/80">Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`My ${dialogPlatformMeta?.label ?? ""} Key`} className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30"/>
            </div>

            {basicKeyFields.map((field) => (<div key={field.key} className="space-y-2">
                <Label className="text-white/80">{field.label}</Label>
                <Input type={field.inputType ?? "password"} value={keys[field.key] ?? ""} onChange={(e) => setKeys((prev) => ({ ...prev, [field.key]: e.target.value }))} placeholder={editingId ? "Leave empty to keep current" : field.placeholder} className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30"/>
                {field.helperText && (<p className="text-xs text-white/40">{field.helperText}</p>)}
              </div>))}

            {!editingId && missingRequiredBasicFields.length > 0 && (<p className="text-xs text-amber-300">
                Required before save: {missingRequiredBasicFields.join(", ")}
              </p>)}

            {advancedKeyFields.length > 0 && (<div className="space-y-3 rounded-md border border-white/10 bg-white/[0.02] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-white/60">
                    Optional advanced OAuth fields
                  </p>
                  <button type="button" onClick={() => setShowAdvancedFields((prev) => !prev)} className="text-xs text-[#F04D26] hover:text-[#ff6a47] transition-colors">
                    {showAdvancedFields ? "Hide" : "Show"}
                  </button>
                </div>

                {showAdvancedFields &&
                advancedKeyFields.map((field) => (<div key={field.key} className="space-y-2">
                      <Label className="text-white/80">{field.label}</Label>
                      <Input type="password" value={keys[field.key] ?? ""} onChange={(e) => setKeys((prev) => ({ ...prev, [field.key]: e.target.value }))} placeholder={editingId ? "Leave empty to keep current" : field.placeholder} className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30"/>
                    </div>))}
              </div>)}

            <Button type="submit" disabled={isSaveDisabled} className="w-full bg-[#F04D26] hover:bg-[#e04420] text-white disabled:bg-[#F04D26]/50 disabled:text-white/70">
              {isSaving ? "Saving..." : editingId ? "Update" : "Save"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Credential</DialogTitle>
            <DialogDescription>
              Are you sure? This action cannot be undone. Any workflow nodes using this credential will stop working.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="text-grey-500 hover:text-black hover:bg-white/80">
              Cancel
            </Button>
            <Button onClick={handleDelete} disabled={deleteMutation.isPending} className="bg-red-600 hover:bg-red-700 text-white">
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>);
}
export default function CredentialsPage() {
    return (<Suspense fallback={<div className="flex-1"/>}>
      <CredentialsPageContent />
    </Suspense>);
}
