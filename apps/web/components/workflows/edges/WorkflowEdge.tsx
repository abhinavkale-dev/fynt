"use client";
import React, { memo } from "react";
import { EdgeLabelRenderer, getSmoothStepPath, type EdgeProps, } from "@xyflow/react";
function WorkflowEdgeComponent({ id, sourceX, sourceY, targetX, targetY, data, }: EdgeProps) {
    const edgeLabel = typeof (data as {
        route?: unknown;
    } | undefined)?.route === "string"
        ? (data as {
            route: string;
        }).route
        : "";
    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
    });
    return (<>
      <g style={{ zIndex: 1 }}>
        <EdgeLabelRenderer>
          <style>{`
            @keyframes workflow-edge-dash-${id} {
              from {
                stroke-dashoffset: 0;
              }
              to {
                stroke-dashoffset: -12;
              }
            }
          `}</style>
        </EdgeLabelRenderer>

        <path id={id} d={edgePath} fill="none" className="react-flow__edge-path" style={{
            stroke: "#555555",
            strokeWidth: 2,
            strokeDasharray: "6, 6",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            pointerEvents: "none",
            animation: `workflow-edge-dash-${id} 1s linear infinite`,
            willChange: "stroke-dashoffset",
        }}/>

        {edgeLabel ? (<foreignObject width={90} height={24} x={labelX - 45} y={labelY - 12} requiredExtensions="http://www.w3.org/1999/xhtml" style={{ overflow: "visible" }}>
            <div className="flex items-center justify-center">
              <span className="px-2 py-0.5 rounded-md border border-white/20 bg-black/60 text-[10px] uppercase tracking-wide text-white/70 animate-in fade-in-0 zoom-in-95 duration-200">
                {edgeLabel}
              </span>
            </div>
          </foreignObject>) : null}
      </g>
    </>);
}
export const WorkflowEdge = memo(WorkflowEdgeComponent);
