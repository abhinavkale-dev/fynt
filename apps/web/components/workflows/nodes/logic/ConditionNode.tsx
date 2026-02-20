"use client";
import { GitBranch } from 'lucide-react';
import BaseNode from '../BaseNode';
interface ConditionNodeData {
    label?: string;
    isConfigured?: boolean;
    routes?: string[];
}
export default function ConditionNode({ data, id, selected }: {
    data: ConditionNodeData;
    id: string;
    selected?: boolean;
}) {
    const routes = Array.isArray(data.routes) && data.routes.length > 0
        ? data.routes
        : ['true', 'false', 'default'];
    const handles = routes.map((route, index) => {
        const total = routes.length;
        const step = 100 / (total + 1);
        return {
            id: route,
            label: route,
            top: `${Math.round(step * (index + 1))}%`,
        };
    });
    return (<BaseNode id={id} selected={selected} nodeType="conditionNode" icon={<GitBranch size={38} className="text-[#D4B7FF]"/>} label={data.label || 'Condition'} subtitle={data.isConfigured ? 'Route by condition' : 'Not configured'} isConfigured={data.isConfigured} hideDefaultSourceHandle={true} sourceHandles={handles}/>);
}
