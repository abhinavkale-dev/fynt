"use client";
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ValidationMessage } from '../../shared';
interface FilterConfigProps {
    data: Record<string, any>;
    onSave: (data: Record<string, any>) => void;
}
export function FilterConfig({ data, onSave }: FilterConfigProps) {
    const [label, setLabel] = useState(data.label || 'Filter');
    const [expression, setExpression] = useState(data.expression || '');
    const [operator, setOperator] = useState(data.operator || 'equals');
    const [value, setValue] = useState(data.value || '');
    const [responseName, setResponseName] = useState(data.responseName || '');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            label,
            expression,
            operator,
            value: operator === 'exists' ? undefined : value,
            responseName: responseName || undefined,
        });
    };
    const missingFields: string[] = [];
    if (!expression.trim())
        missingFields.push('Expression');
    return (<form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-white/80">Node Label</Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Filter" className="bg-[#2D2D2E] border-[#444] text-white"/>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80">Expression</Label>
        <Input value={expression} onChange={(e) => setExpression(e.target.value)} placeholder="{webhook.payload.status}" className="bg-[#2D2D2E] border-[#444] text-white font-mono"/>
        <p className="text-[11px] text-white/40">
          The value to evaluate using {'{'}variable.path{'}'} syntax.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80" optional>Operator</Label>
        <select value={operator} onChange={(e) => setOperator(e.target.value)} className="w-full h-9 rounded-md border border-[#444] bg-[#2D2D2E] px-3 text-sm text-white focus:outline-none">
          <option value="equals">Equals</option>
          <option value="not_equals">Not Equals</option>
          <option value="contains">Contains</option>
          <option value="exists">Exists (non-empty)</option>
        </select>
      </div>

      {operator !== 'exists' && (<div className="space-y-2">
          <Label className="text-white/80" optional>Value</Label>
          <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="active" className="bg-[#2D2D2E] border-[#444] text-white"/>
        </div>)}

      <div className="space-y-2">
        <Label className="text-white/80" optional>Output Variable Name</Label>
        <Input value={responseName} onChange={(e) => setResponseName(e.target.value)} placeholder="e.g. filtered" className="bg-[#2D2D2E] border-[#444] text-white"/>
      </div>

      <ValidationMessage missingFields={missingFields}/>

      <Button type="submit" disabled={!label.trim() || !expression.trim()} className="w-full bg-[#F04D26] hover:bg-[#e04420] text-white disabled:bg-[#F04D26]/50">
        Save
      </Button>
    </form>);
}
