"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc/client";
import { ValidationMessage } from "../../shared";
const MODELS = [
    { value: "gemini-3-pro-preview", label: "Gemini 3 Pro" },
    { value: "gemini-3-flash-preview", label: "Gemini 3 Flash" },
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
];
const GEMINI_JSON_PLACEHOLDER = `{
  "contents": [
    {
      "role": "user",
      "parts": [{ "text": "Summarize this payload: {json sourcePayload}" }]
    }
  ]
}`;
interface GeminiConfigProps {
    data: Record<string, any>;
    onSave: (data: Record<string, any>) => void;
}
export function GeminiConfig({ data, onSave }: GeminiConfigProps) {
    const [responseName, setResponseName] = useState(data.responseName || "geminiResponse");
    const [credentialId, setCredentialId] = useState(data.credentialId || "");
    const [model, setModel] = useState(data.model || "");
    const [systemPrompt, setSystemPrompt] = useState(data.systemPrompt || "");
    const [inputMode, setInputMode] = useState<"prompt" | "json">(data.inputMode === "json" ? "json" : "prompt");
    const [prompt, setPrompt] = useState(data.prompt || "");
    const [requestJson, setRequestJson] = useState(data.requestJson || "");
    const [temperature, setTemperature] = useState(data.temperature ?? 0.7);
    const [maxTokens, setMaxTokens] = useState(data.maxTokens || "");
    const credentialsQuery = trpc.credentials.getAll.useQuery(undefined, {
        refetchOnWindowFocus: false,
    });
    const geminiCredentials = (credentialsQuery.data ?? []).filter((credential) => credential.platform === 'gemini');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            responseName,
            credentialId,
            model,
            systemPrompt,
            inputMode,
            prompt,
            requestJson,
            temperature,
            maxTokens: maxTokens ? parseInt(maxTokens, 10) : undefined,
        });
    };
    const inputMissing = inputMode === "json" ? !requestJson.trim() : !prompt.trim();
    const isSaveDisabled = !responseName.trim() || !credentialId || !model.trim() || inputMissing;
    const missingFields: string[] = [];
    if (!responseName.trim())
        missingFields.push('Response Name');
    if (!credentialId)
        missingFields.push('Credential');
    if (!model.trim())
        missingFields.push('Model');
    if (inputMode === "json") {
        if (!requestJson.trim())
            missingFields.push('JSON Input');
    }
    else if (!prompt.trim()) {
        missingFields.push('Prompt');
    }
    return (<form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-white/80">Response Name</Label>
        <Input value={responseName} onChange={(e) => setResponseName(e.target.value)} placeholder="geminiResponse" className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30"/>
        <p className="text-xs text-white/40">
          Use this name to reference the response in other nodes: {`{{${responseName}.data}}`}
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80">Credential</Label>
        <select value={credentialId} onChange={(e) => setCredentialId(e.target.value)} className="w-full h-9 rounded-md border border-[#444] bg-[#2D2D2E] px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-ring">
          <option value="">Select a credential</option>
          {geminiCredentials.map((credential) => (<option key={credential.id} value={credential.id}>
              {credential.title}
            </option>))}
        </select>
        <p className="text-xs text-white/40">
          No credentials?{" "}
          <a href="/home/credentials" className="text-[#F04D26] hover:text-[#F04D26]/90 underline">
            Add one in Credentials page
          </a>
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80">Model</Label>
        <Input value={model} onChange={(e) => setModel(e.target.value)} list="gemini-model-options" placeholder="e.g. gemini-2.5-pro" className="w-full h-9 rounded-md border border-[#444] bg-[#2D2D2E] px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-ring">
        </Input>
        <datalist id="gemini-model-options">
          {MODELS.map((m) => (<option key={m.value} value={m.value}>
              {m.label}
            </option>))}
        </datalist>
        <p className="text-xs text-white/40">
          You can type any Gemini model id, including newer releases.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80" optional>System Prompt</Label>
        <textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} placeholder="You are a helpful assistant." rows={3} className="w-full rounded-md border border-[#444] bg-[#2D2D2E] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-ring resize-none"/>
        <p className="text-xs text-white/40">
          Sets the behavior of the AI model. Use {`{{variables}}`} for simple values or {`{{json variables}}`} to stringify objects.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80">Input Mode</Label>
        <select value={inputMode} onChange={(e) => setInputMode(e.target.value as "prompt" | "json")} className="w-full h-9 rounded-md border border-[#444] bg-[#2D2D2E] px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-ring">
          <option value="prompt">Prompt Template</option>
          <option value="json">JSON Request</option>
        </select>
        <p className="text-xs text-white/40">
          Prompt mode sends one prompt. JSON mode expects Gemini contents[] with parts[] text blocks.
        </p>
      </div>

      {inputMode === "prompt" ? (<div className="space-y-2">
          <Label className="text-white/80">Prompt</Label>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="What is the capital of France?" rows={3} className="w-full rounded-md border border-[#444] bg-[#2D2D2E] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-ring resize-none"/>
          <p className="text-xs text-white/40">
            The prompt to send to the AI model. Use {`{{variables}}`} for simple values or {`{{json variables}}`} to stringify objects.
          </p>
        </div>) : (<div className="space-y-2">
          <Label className="text-white/80">JSON Input</Label>
          <textarea value={requestJson} onChange={(e) => setRequestJson(e.target.value)} placeholder={GEMINI_JSON_PLACEHOLDER} rows={8} className="w-full rounded-md border border-[#444] bg-[#2D2D2E] px-3 py-2 font-mono text-xs text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-ring resize-y"/>
          <p className="text-xs text-white/40">
            Gemini JSON mode requires contents[] entries with parts[] and at least one text part.
          </p>
        </div>)}

      <div className="space-y-2">
        <Label className="text-white/80" optional>Temperature: {temperature}</Label>
        <input type="range" min="0" max="2" step="0.1" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} className="w-full accent-white"/>
        <div className="flex justify-between text-xs text-white/30">
          <span>Precise (0)</span>
          <span>Creative (2)</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80" optional>Max Tokens</Label>
        <Input type="number" value={maxTokens} onChange={(e) => setMaxTokens(e.target.value)} placeholder="Default (model max)" className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30"/>
      </div>

      <ValidationMessage missingFields={missingFields}/>

      <Button type="submit" disabled={isSaveDisabled} className="w-full bg-[#F04D26] hover:bg-[#e04420] text-white disabled:bg-[#F04D26]/50 disabled:text-white/70">
        Save
      </Button>
    </form>);
}
