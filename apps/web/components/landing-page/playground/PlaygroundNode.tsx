"use client";
import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
export type PlaygroundNodeData = {
    icon: React.ReactNode;
    color: string;
    name: string;
    fields: Array<{
        label: string;
        value: string;
    }>;
    hideTargetHandle?: boolean;
    hideSourceHandle?: boolean;
};
function PlaygroundNodeComponent({ data, }: {
    data: PlaygroundNodeData;
}) {
    const { icon, color, name, fields, hideTargetHandle, hideSourceHandle } = data;
    return (<div className="relative cursor-grab active:cursor-grabbing">
      
      {!hideTargetHandle && (<Handle type="target" position={Position.Left} className="nodrag nopan" style={{
                width: "7px",
                height: "20px",
                background: "#555555",
                border: "none",
                borderRadius: "2px 0 0 2px",
                top: "20px",
                left: "-7px",
                transform: "translateY(-50%)",
                zIndex: 10,
            }}/>)}

      
      {!hideSourceHandle && (<Handle type="source" position={Position.Right} className="nodrag nopan" style={{
                width: "7px",
                height: "20px",
                background: "#555555",
                border: "none",
                borderRadius: "0 2px 2px 0",
                top: "20px",
                right: "-7px",
                transform: "translateY(-50%)",
                zIndex: 10,
            }}/>)}

      <div className="landing-node-animated" style={{
            opacity: 1,
            transform: "translateY(0px) scale(1)",
            transition: "opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1), transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
            willChange: "transform, opacity",
        }}>
        <div className="z-10 flex w-[250px] flex-col rounded-[8px] border border-[#333333] bg-[#1E1E1E]">
          
          <div className="flex items-center justify-between p-[8px] border-[#333333] border-b">
            <div className="flex min-w-0 flex-1 items-center gap-[10px]">
              <div className="flex h-[24px] w-[24px] flex-shrink-0 items-center justify-center rounded-[6px]" style={{ background: color }}>
                <div className="text-white">{icon}</div>
              </div>
              <span className="truncate font-medium text-[#E5E5E5] text-[16px]" title={name}>
                {name}
              </span>
            </div>
          </div>

          
          <div className="flex flex-col gap-[8px] p-[8px]">
            {fields?.map((field, index) => (<div key={index} className="flex items-center gap-[8px]">
                <span className="min-w-0 truncate text-[#777777] text-[14px] capitalize" title={field.label}>
                  {field.label}
                </span>
                <span className="flex-1 truncate text-right text-[#E5E5E5] text-[14px]" title={field.value}>
                  {field.value}
                </span>
              </div>))}
          </div>
        </div>
      </div>
    </div>);
}
export const PlaygroundNode = memo(PlaygroundNodeComponent);
