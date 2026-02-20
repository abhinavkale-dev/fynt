"use client";
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ValidationMessage } from '../../shared';
const SCHEDULES = [
    { value: 'every_5_minutes', label: 'Every 5 minutes' },
    { value: 'hourly', label: 'Hourly' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
];
interface CronTriggerConfigProps {
    data: Record<string, any>;
    onSave: (data: Record<string, any>) => void;
}
export function CronTriggerConfig({ data, onSave }: CronTriggerConfigProps) {
    const [label, setLabel] = useState(data.label || 'Cron Trigger');
    const [schedule, setSchedule] = useState(data.schedule || 'daily');
    const [hour, setHour] = useState(String(data.hour ?? 9));
    const [minute, setMinute] = useState(String(data.minute ?? 0));
    const [dayOfWeek, setDayOfWeek] = useState(String(data.dayOfWeek ?? 1));
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            label,
            schedule,
            hour: Number(hour),
            minute: Number(minute),
            dayOfWeek: Number(dayOfWeek),
            timezone: 'UTC',
        });
    };
    const missingFields: string[] = [];
    if (!label.trim())
        missingFields.push('Label');
    return (<form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-white/80">Trigger Label</Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Cron Trigger" className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30"/>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80" optional>Schedule</Label>
        <select value={schedule} onChange={(e) => setSchedule(e.target.value)} className="w-full h-9 rounded-md border border-[#444] bg-[#2D2D2E] px-3 text-sm text-white focus:outline-none">
          {SCHEDULES.map((item) => (<option key={item.value} value={item.value}>{item.label}</option>))}
        </select>
      </div>

      {schedule !== 'every_5_minutes' && (<div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-white/80" optional>Hour (UTC)</Label>
            <Input type="number" min="0" max="23" value={hour} onChange={(e) => setHour(e.target.value)} className="bg-[#2D2D2E] border-[#444] text-white"/>
          </div>
          <div className="space-y-2">
            <Label className="text-white/80" optional>Minute</Label>
            <Input type="number" min="0" max="59" value={minute} onChange={(e) => setMinute(e.target.value)} className="bg-[#2D2D2E] border-[#444] text-white"/>
          </div>
        </div>)}

      {schedule === 'weekly' && (<div className="space-y-2">
          <Label className="text-white/80" optional>Day of Week (0-6, Sunday=0)</Label>
          <Input type="number" min="0" max="6" value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} className="bg-[#2D2D2E] border-[#444] text-white"/>
        </div>)}

      <div className="space-y-2">
        <Label className="text-white/80" optional>Timezone</Label>
        <div className="h-9 rounded-md border border-[#444] bg-[#2D2D2E] px-3 flex items-center text-sm text-white/40 select-none">
          UTC
        </div>
      </div>

      <ValidationMessage missingFields={missingFields}/>

      <Button type="submit" className="w-full bg-[#F04D26] hover:bg-[#e04420] text-white">
        Save
      </Button>
    </form>);
}
