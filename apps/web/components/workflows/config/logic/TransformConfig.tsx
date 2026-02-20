"use client";
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ValidationMessage } from '../../shared';
interface TransformConfigProps {
    data: Record<string, any>;
    onSave: (data: Record<string, any>) => void;
}
export function TransformConfig({ data, onSave }: TransformConfigProps) {
    const [label, setLabel] = useState(data.label || 'Transform');
    const [expression, setExpression] = useState(data.expression || '');
    const [responseName, setResponseName] = useState(data.responseName || '');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            label,
            expression,
            responseName: responseName || undefined,
        });
    };
    const missingFields: string[] = [];
    if (!expression.trim())
        missingFields.push('Expression');
    return (<form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-white/80">Node Label</Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Transform" className="bg-[#2D2D2E] border-[#444] text-white"/>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80" optional>Output Variable Name</Label>
        <Input value={responseName} onChange={(e) => setResponseName(e.target.value)} placeholder="e.g. transformed" className="bg-[#2D2D2E] border-[#444] text-white"/>
        <p className="text-[11px] text-white/40">
          Reference this output in later nodes as {'{'}transformed.data{'}'}
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80">Template Expression</Label>
        <textarea value={expression} onChange={(e) => setExpression(e.target.value)} rows={6} placeholder={'{"name": "{webhook.payload.name}", "email": "{webhook.payload.email}"}'} className="w-full rounded-md border border-[#444] bg-[#2D2D2E] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none resize-none font-mono"/>
        <p className="text-[11px] text-white/40">
          Use {'{'}variable.path{'}'} syntax to reference data from previous nodes. The result will be parsed as JSON if valid.
        </p>
      </div>

      <ValidationMessage missingFields={missingFields}/>

      <Button type="submit" disabled={!label.trim() || !expression.trim()} className="w-full bg-[#F04D26] hover:bg-[#e04420] text-white disabled:bg-[#F04D26]/50">
        Save
      </Button>
    </form>);
}
