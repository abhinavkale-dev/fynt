"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ValidationMessage } from "../../shared";
interface TriggerConfigProps {
    data: Record<string, any>;
    onSave: (data: Record<string, any>) => void;
}
export function TriggerConfig({ data, onSave }: TriggerConfigProps) {
    const [triggerName, setTriggerName] = useState(data.triggerName || data.label || "");
    const [description, setDescription] = useState(data.description || "");
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            triggerName,
            label: triggerName,
            description,
        });
    };
    const missingFields: string[] = [];
    if (!triggerName.trim())
        missingFields.push('Trigger Name');
    return (<form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-white/80">Trigger Name</Label>
        <Input value={triggerName} onChange={(e) => setTriggerName(e.target.value)} placeholder="Manual Trigger" className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30"/>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80" optional>Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Triggers when clicking 'Execute workflow'" className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30"/>
      </div>

      <ValidationMessage missingFields={missingFields}/>

      <Button type="submit" className="w-full bg-[#F04D26] hover:bg-[#e04420] text-white">
        Save
      </Button>
    </form>);
}
