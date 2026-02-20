"use client";
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ValidationMessage } from '../../shared';
interface DelayConfigProps {
    data: Record<string, any>;
    onSave: (data: Record<string, any>) => void;
}
export function DelayConfig({ data, onSave }: DelayConfigProps) {
    const [label, setLabel] = useState(data.label || 'Delay');
    const [durationMs, setDurationMs] = useState(String(data.durationMs ?? 60000));
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            label,
            durationMs: Math.max(0, Number(durationMs) || 0),
        });
    };
    const missingFields: string[] = [];
    if (!durationMs || Number(durationMs) <= 0)
        missingFields.push('Duration');
    return (<form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-white/80">Node Label</Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Delay" className="bg-[#2D2D2E] border-[#444] text-white"/>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80">Duration (ms)</Label>
        <Input type="number" min="0" value={durationMs} onChange={(e) => setDurationMs(e.target.value)} placeholder="60000" className="bg-[#2D2D2E] border-[#444] text-white"/>
        <p className="text-xs text-white/40">Example: 60000 = 1 minute, 86400000 = 1 day</p>
      </div>

      <ValidationMessage missingFields={missingFields}/>

      <Button type="submit" disabled={!label.trim()} className="w-full bg-[#F04D26] hover:bg-[#e04420] text-white disabled:bg-[#F04D26]/50">
        Save
      </Button>
    </form>);
}
