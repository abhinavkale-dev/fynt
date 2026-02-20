"use client";
import React, { memo } from "react";
import { EdgeLabelRenderer, getSmoothStepPath, type EdgeProps, } from "@xyflow/react";
function PlaygroundEdgeComponent({ id, sourceX, sourceY, targetX, targetY, }: EdgeProps) {
    const [edgePath] = getSmoothStepPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
    });
    return (<>
      <g style={{ zIndex: 1 }}>
        <EdgeLabelRenderer>
          <style>{`
            @keyframes landing-edge-dash-${id} {
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
            animation: `landing-edge-dash-${id} 1s linear infinite`,
            willChange: "stroke-dashoffset",
        }}/>
      </g>
    </>);
}
export const PlaygroundEdge = memo(PlaygroundEdgeComponent);
