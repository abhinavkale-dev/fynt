"use client";
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ValidationMessage } from '../../shared';
interface ConditionConfigProps {
    data: Record<string, any>;
    onSave: (data: Record<string, any>) => void;
}
export function ConditionConfig({ data, onSave }: ConditionConfigProps) {
    const [label, setLabel] = useState(data.label || 'Condition');
    const [expression, setExpression] = useState(data.expression || '');
    const [routes, setRoutes] = useState(Array.isArray(data.routes) && data.routes.length > 0 ? data.routes.join(', ') : 'true, false, default');
    const [defaultRoute, setDefaultRoute] = useState(data.defaultRoute || 'default');
    const [rulesJson, setRulesJson] = useState(data.rulesJson || JSON.stringify([{ route: 'true', operator: 'equals', value: 'true' }], null, 2));
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            label,
            expression,
            defaultRoute,
            routes: routes.split(',').map((item: string) => item.trim()).filter(Boolean),
            rulesJson,
        });
    };
    const missingFields: string[] = [];
    if (!expression.trim())
        missingFields.push('Expression');
    if (!routes.trim())
        missingFields.push('Routes');
    return (<form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-white/80">Node Label</Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Condition" className="bg-[#2D2D2E] border-[#444] text-white"/>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80">Expression</Label>
        <Input value={expression} onChange={(e) => setExpression(e.target.value)} placeholder="{webhook.payload.priority}" className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30"/>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80">Routes (comma separated)</Label>
        <Input value={routes} onChange={(e) => setRoutes(e.target.value)} placeholder="high, medium, low" className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30"/>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80" optional>Default Route</Label>
        <Input value={defaultRoute} onChange={(e) => setDefaultRoute(e.target.value)} placeholder="default" className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30"/>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80">Rules JSON</Label>
        <textarea value={rulesJson} onChange={(e) => setRulesJson(e.target.value)} rows={7} className="w-full rounded-md border border-[#444] bg-[#2D2D2E] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none resize-none font-mono" placeholder='[{"route":"high","operator":"equals","value":"high"}]'/>
        <p className="text-xs text-white/40">Format: [{`{ route, operator: equals|contains|not_equals, value }`}]</p>
      </div>

      <ValidationMessage missingFields={missingFields}/>

      <Button type="submit" disabled={!label.trim() || !expression.trim()} className="w-full bg-[#F04D26] hover:bg-[#e04420] text-white disabled:bg-[#F04D26]/50">
        Save
      </Button>
    </form>);
}
