"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { ValidationMessage } from "../../shared";
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
interface HeaderRow {
    key: string;
    value: string;
}
interface HTTPConfigProps {
    data: Record<string, any>;
    onSave: (data: Record<string, any>) => void;
}
export function HTTPConfig({ data, onSave }: HTTPConfigProps) {
    const [responseName, setResponseName] = useState(data.responseName || "httpResponse");
    const [url, setUrl] = useState(data.url || "");
    const [method, setMethod] = useState(data.method || "GET");
    const [headers, setHeaders] = useState<HeaderRow[]>(data.headers && Array.isArray(data.headers) ? data.headers : [{ key: "", value: "" }]);
    const [body, setBody] = useState(data.body || "");
    const [timeout, setTimeout] = useState(data.timeout || "");
    const showBody = ["POST", "PUT", "PATCH"].includes(method);
    const addHeader = () => {
        setHeaders([...headers, { key: "", value: "" }]);
    };
    const removeHeader = (index: number) => {
        setHeaders(headers.filter((_, i) => i !== index));
    };
    const updateHeader = (index: number, field: "key" | "value", val: string) => {
        const updated = [...headers];
        updated[index] = { ...updated[index]!, [field]: val };
        setHeaders(updated);
    };
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanHeaders = headers.filter((h) => h.key.trim() !== "");
        let validTimeout: number | undefined = undefined;
        if (timeout) {
            const parsedTimeout = parseInt(timeout, 10);
            validTimeout = parsedTimeout >= 1000 ? parsedTimeout : 1000;
        }
        onSave({
            responseName,
            url,
            method,
            headers: cleanHeaders,
            body: showBody ? body : undefined,
            timeout: validTimeout,
        });
    };
    const missingFields: string[] = [];
    if (!responseName.trim())
        missingFields.push('Response Name');
    if (!url.trim())
        missingFields.push('URL');
    return (<form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-white/80">Response Name</Label>
        <Input value={responseName} onChange={(e) => setResponseName(e.target.value)} placeholder="httpResponse" className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30"/>
        <p className="text-xs text-white/40">
          Use this name to reference the response in the other nodes: {`{{${responseName}.data}}`}
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80" optional>Method</Label>
        <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full h-9 rounded-md border border-[#444] bg-[#2D2D2E] px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-ring">
          {METHODS.map((m) => (<option key={m} value={m}>
              {m}
            </option>))}
        </select>
        <p className="text-xs text-white/40">
          The HTTP method to use for the request.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80">URL</Label>
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://api.example.com/endpoint" className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30"/>
        <p className="text-xs text-white/40">
          {"Static URL or use {{variables}} for simple values or {{json variables}} to stringify objects."}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-white/80" optional>Headers</Label>
          <button type="button" onClick={addHeader} className="flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors">
            <Plus size={12}/>
            Add
          </button>
        </div>
        <div className="space-y-2">
          {headers.map((header, index) => (<div key={index} className="flex gap-2 items-center">
              <Input value={header.key} onChange={(e) => updateHeader(index, "key", e.target.value)} placeholder="Key" className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30 flex-1"/>
              <Input value={header.value} onChange={(e) => updateHeader(index, "value", e.target.value)} placeholder="Value" className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30 flex-1"/>
              <button type="button" onClick={() => removeHeader(index)} className="text-white/30 hover:text-red-400 transition-colors shrink-0">
                <Trash2 size={14}/>
              </button>
            </div>))}
        </div>
      </div>

      {showBody && (<div className="space-y-2">
          <Label className="text-white/80" optional>Body</Label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder='{"key": "value"}' rows={4} className="w-full rounded-md border border-[#444] bg-[#2D2D2E] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-ring resize-none font-mono"/>
          <p className="text-xs text-white/40">
            Use {`{{variables}}`} for dynamic values.
          </p>
        </div>)}

      <div className="space-y-2">
        <Label className="text-white/80" optional>Timeout (ms)</Label>
        <Input type="number" min="1000" value={timeout} onChange={(e) => setTimeout(e.target.value)} placeholder="30000" className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"/>
        <p className="text-xs text-white/40">
          Minimum 1000ms (1 second). Leave empty for no timeout.
        </p>
      </div>

      <ValidationMessage missingFields={missingFields}/>

      <Button type="submit" disabled={!url.trim()} className="w-full bg-[#F04D26] hover:bg-[#e04420] text-white disabled:bg-[#F04D26]/50 disabled:text-white/70">
        Save
      </Button>
    </form>);
}
