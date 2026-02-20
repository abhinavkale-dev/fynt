"use client";
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ValidationMessage } from '../../shared';
interface LogConfigProps {
    data: Record<string, any>;
    onSave: (data: Record<string, any>) => void;
}
export function LogConfig({ data, onSave }: LogConfigProps) {
    const [label, setLabel] = useState(data.label || 'Log');
    const [level, setLevel] = useState(data.level || 'info');
    const [message, setMessage] = useState(data.message || '');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            label,
            level,
            message,
        });
    };
    const missingFields: string[] = [];
    if (!label.trim())
        missingFields.push('Label');
    if (!message.trim())
        missingFields.push('Message');
    return (<form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-white/80">Node Label</Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Log" className="bg-[#2D2D2E] border-[#444] text-white"/>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80" optional>Level</Label>
        <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full h-9 rounded-md border border-[#444] bg-[#2D2D2E] px-3 text-sm text-white focus:outline-none">
          <option value="debug">Debug</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80">Message</Label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Event received: {webhook.payload}" className="w-full rounded-md border border-[#444] bg-[#2D2D2E] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none resize-none"/>
      </div>

      <ValidationMessage missingFields={missingFields}/>

      <Button type="submit" disabled={!label.trim() || !message.trim()} className="w-full bg-[#F04D26] hover:bg-[#e04420] text-white disabled:bg-[#F04D26]/50">
        Save
      </Button>
    </form>);
}
