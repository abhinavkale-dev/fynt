"use client";
import { Filter } from 'lucide-react';
import BaseNode from '../BaseNode';
interface FilterNodeData {
    label?: string;
    isConfigured?: boolean;
    operator?: string;
}
export default function FilterNode({ data, id, selected }: {
    data: FilterNodeData;
    id: string;
    selected?: boolean;
}) {
    return (<BaseNode id={id} selected={selected} nodeType="filterNode" icon={<Filter size={38} className="text-[#FDA4AF]"/>} label={data.label || 'Filter'} subtitle={data.isConfigured ? `Operator: ${data.operator || 'equals'}` : 'Configure filter'} isConfigured={data.isConfigured}/>);
}
