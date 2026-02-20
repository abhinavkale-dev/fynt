"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ReactFlow, useNodesState, useEdgesState, addEdge, useReactFlow, type Node, type Edge, type OnConnect, MiniMap, Panel, Background, BackgroundVariant, } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { EditorialLines } from "../hero/EditorialLines";
import { nodeTypes } from "@/lib/reactflow/nodeTypes";
import { edgeTypes } from "@/lib/reactflow/edgeTypes";
import { EditorProvider } from "@/contexts/EditorContext";
import { PlaygroundNodeConfigDialog } from "./PlaygroundNodeConfigDialog";
const DEMO_STEP_DURATION_MS = 1350;
const DEMO_NODE_RUNNING_MS = 1100;
function createPlaygroundNodes(): Node[] {
    return [
        {
            id: "n1",
            type: "manualTrigger",
            position: { x: 140, y: 260 },
            data: {
                label: "Manual Trigger",
                isConfigured: true,
            },
        },
        {
            id: "n2",
            type: "openaiNode",
            position: { x: 400, y: 260 },
            data: {
                label: "AI Summary",
                credentialId: "landing-demo-openai",
                model: "gpt-5-mini",
                prompt: "Summarize updates and classify risk level.",
            },
        },
        {
            id: "n3",
            type: "conditionNode",
            position: { x: 660, y: 260 },
            data: {
                label: "Route by Risk",
                isConfigured: true,
                routes: ["alert", "log"],
                demoRoute: "alert",
            },
        },
        {
            id: "n4",
            type: "slackNode",
            position: { x: 920, y: 170 },
            data: {
                label: "Alert Team (Slack)",
                subtitle: "Send message",
                credentialId: "landing-demo-slack",
                message: "High-risk update detected",
            },
        },
        {
            id: "n5",
            type: "logNode",
            position: { x: 920, y: 350 },
            data: {
                label: "Archive Event",
                level: "info",
                message: "Low-risk update logged",
            },
        },
    ];
}
function createPlaygroundEdges(): Edge[] {
    return [
        { id: "e1-2", source: "n1", target: "n2" },
        { id: "e2-3", source: "n2", target: "n3" },
        { id: "e3-4", source: "n3", sourceHandle: "alert", target: "n4", data: { route: "alert" } },
        { id: "e3-5", source: "n3", sourceHandle: "log", target: "n5", data: { route: "log" } },
    ];
}
function isNodeActive(node: Node | undefined): boolean {
    const nodeData = (node?.data ?? {}) as Record<string, unknown>;
    return nodeData.isActive !== false;
}
function ResetButton({ onReset }: {
    onReset: () => void;
}) {
    const { fitView } = useReactFlow();
    const handleClick = () => {
        onReset();
        setTimeout(() => {
            fitView({ duration: 250, padding: 0.25 });
        }, 40);
    };
    return (<button onClick={handleClick} className="px-4 py-2 bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#333333] hover:border-[#F04D26] text-[#E5E5E5] rounded-lg text-sm font-medium transition-all duration-150 ease-[cubic-bezier(0.25,0.1,0.25,1.0)]">
      Reset Playground
    </button>);
}
function ExecuteWorkflowButton({ onExecute, isExecuting, disabled, }: {
    onExecute: () => void;
    isExecuting: boolean;
    disabled: boolean;
}) {
    return (<button onClick={onExecute} disabled={disabled} className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-orange-500 hover:bg-orange-600">
      {isExecuting ? (<>
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Executing workflow...</span>
        </>) : (<>
          <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="15px" height="15px" viewBox="0 0 18 18">
            <path fillRule="evenodd" clipRule="evenodd" d="M13.4868 7.0974C13.4955 6.98275 13.5 6.8669 13.5 6.75C13.5 4.26472 11.4853 2.25 9 2.25C6.51472 2.25 4.5 4.26472 4.5 6.75C4.5 6.86689 4.50446 6.98275 4.51321 7.0974C2.89021 7.777 1.75 9.38035 1.75 11.25C1.75 13.7353 3.76472 15.75 6.25 15.75C7.28562 15.75 8.23953 15.4002 9 14.8122C9.76047 15.4002 10.7144 15.75 11.75 15.75C14.2353 15.75 16.25 13.7353 16.25 11.25C16.25 9.38035 15.1098 7.77701 13.4868 7.0974Z" fill="rgba(255, 255, 255, 1)" fillOpacity="0.3" data-color="color-2"></path>
            <path d="M10.496 9.757C10.66 10.224 10.75 10.727 10.75 11.25C10.75 13.735 8.735 15.75 6.25 15.75C3.765 15.75 1.75 13.735 1.75 11.25C1.75 10.339 2.021 9.491 2.486 8.783" stroke="rgba(255, 255, 255, 1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"></path>
            <path d="M11.511 15.745C12.042 15.773 12.587 15.707 13.123 15.536C15.49 14.778 16.794 12.245 16.036 9.878C15.278 7.511 12.745 6.207 10.378 6.965C9.50999 7.243 8.78599 7.759 8.25299 8.418" stroke="rgba(255, 255, 255, 1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"></path>
            <path d="M8.156 11.171C7.695 11.083 7.239 10.92 6.806 10.679C4.636 9.468 3.859 6.727 5.07 4.556C6.281 2.385 9.022 1.609 11.193 2.82C11.904 3.217 12.465 3.778 12.856 4.429" stroke="rgba(255, 255, 255, 1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"></path>
          </svg>
          <span>Execute workflow</span>
        </>)}
    </button>);
}
export function PlaygroundSection() {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>(createPlaygroundNodes());
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(createPlaygroundEdges());
    const [nodeStatuses, setNodeStatuses] = useState<Record<string, string>>({});
    const [isExecuting, setIsExecuting] = useState(false);
    const [configTarget, setConfigTarget] = useState<{
        nodeId: string;
        nodeType: string;
    } | null>(null);
    const executionTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
    const onConnect: OnConnect = useCallback((connection) => {
        setEdges((currentEdges) => addEdge(connection, currentEdges));
    }, [setEdges]);
    const clearExecutionTimers = useCallback(() => {
        executionTimersRef.current.forEach((timer) => clearTimeout(timer));
        executionTimersRef.current = [];
    }, []);
    useEffect(() => {
        return () => {
            clearExecutionTimers();
        };
    }, [clearExecutionTimers]);
    const updateNodeData = useCallback((nodeId: string, data: Record<string, unknown>) => {
        setNodes((currentNodes) => currentNodes.map((node) => node.id === nodeId
            ? {
                ...node,
                data: {
                    ...(node.data as Record<string, unknown>),
                    ...data,
                },
            }
            : node));
    }, [setNodes]);
    const deleteNode = useCallback((nodeId: string) => {
        setNodes((currentNodes) => currentNodes.filter((node) => node.id !== nodeId));
        setEdges((currentEdges) => currentEdges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
        setNodeStatuses((currentStatuses) => {
            const nextStatuses = { ...currentStatuses };
            delete nextStatuses[nodeId];
            return nextStatuses;
        });
        setConfigTarget((currentTarget) => currentTarget?.nodeId === nodeId ? null : currentTarget);
    }, [setEdges, setNodes]);
    const getNodeData = useCallback((nodeId: string) => nodes.find((node) => node.id === nodeId)?.data ?? {}, [nodes]);
    const handleOpenNodeConfig = useCallback((nodeId: string, nodeType: string) => {
        setConfigTarget({ nodeId, nodeType });
    }, []);
    const handleCloseNodeConfig = useCallback((open: boolean) => {
        if (!open) {
            setConfigTarget(null);
        }
    }, []);
    const activeConfigData = useMemo(() => {
        if (!configTarget) {
            return null;
        }
        return (getNodeData(configTarget.nodeId) as Record<string, unknown>) ?? null;
    }, [configTarget, getNodeData]);
    const isTriggerActive = useMemo(() => isNodeActive(nodes.find((node) => node.id === "n1")), [nodes]);
    const handleExecuteNodeDemo = useCallback((nodeId: string) => {
        if (isExecuting) {
            return;
        }
        const targetNode = nodes.find((node) => node.id === nodeId);
        if (!targetNode || !isNodeActive(targetNode)) {
            return;
        }
        clearExecutionTimers();
        setNodeStatuses((currentStatuses) => ({
            ...currentStatuses,
            [nodeId]: "Running",
        }));
        const successTimer = setTimeout(() => {
            setNodeStatuses((currentStatuses) => ({
                ...currentStatuses,
                [nodeId]: "Success",
            }));
        }, DEMO_NODE_RUNNING_MS);
        executionTimersRef.current.push(successTimer);
    }, [clearExecutionTimers, isExecuting, nodes]);
    const handleExecuteWorkflowDemo = useCallback(() => {
        if (isExecuting) {
            return;
        }
        const triggerNode = nodes.find((node) => node.id === "n1");
        if (!triggerNode || !isNodeActive(triggerNode)) {
            return;
        }
        clearExecutionTimers();
        setNodeStatuses({});
        setIsExecuting(true);
        const nodeById = new Map(nodes.map((node) => [node.id, node]));
        const conditionNodeData = (nodeById.get("n3")?.data ?? {}) as Record<string, unknown>;
        const preferredConditionRoute = conditionNodeData.demoRoute === "log" ? "log" : "alert";
        const executionOrder: string[] = [];
        const visited = new Set<string>();
        const queue: string[] = ["n1"];
        while (queue.length > 0) {
            const nodeId = queue.shift();
            if (!nodeId || visited.has(nodeId) || !nodeById.has(nodeId)) {
                continue;
            }
            visited.add(nodeId);
            executionOrder.push(nodeId);
            const currentNode = nodeById.get(nodeId);
            if (!currentNode) {
                continue;
            }
            const outgoingEdges = edges.filter((edge) => edge.source === nodeId && nodeById.has(edge.target));
            if (outgoingEdges.length === 0) {
                continue;
            }
            if (currentNode.type === "conditionNode") {
                const prioritizedEdges = [...outgoingEdges].sort((edgeA, edgeB) => {
                    const rank = (edge: Edge) => edge.sourceHandle === preferredConditionRoute ? 0 : 1;
                    return rank(edgeA) - rank(edgeB);
                });
                for (const edge of prioritizedEdges) {
                    if (!visited.has(edge.target) && !queue.includes(edge.target)) {
                        queue.push(edge.target);
                    }
                }
                continue;
            }
            for (const edge of outgoingEdges) {
                if (!visited.has(edge.target) && !queue.includes(edge.target)) {
                    queue.push(edge.target);
                }
            }
        }
        if (executionOrder.length === 0) {
            setIsExecuting(false);
            return;
        }
        let stepIndex = 0;
        for (const nodeId of executionOrder) {
            const node = nodeById.get(nodeId);
            if (!node) {
                continue;
            }
            const stepStartAt = stepIndex * DEMO_STEP_DURATION_MS;
            if (!isNodeActive(node)) {
                const skipTimer = setTimeout(() => {
                    setNodeStatuses((currentStatuses) => ({
                        ...currentStatuses,
                        [nodeId]: "Skipped",
                    }));
                }, stepStartAt);
                executionTimersRef.current.push(skipTimer);
                stepIndex += 1;
                continue;
            }
            const runningTimer = setTimeout(() => {
                setNodeStatuses((currentStatuses) => ({
                    ...currentStatuses,
                    [nodeId]: "Running",
                }));
            }, stepStartAt);
            const successTimer = setTimeout(() => {
                setNodeStatuses((currentStatuses) => ({
                    ...currentStatuses,
                    [nodeId]: "Success",
                }));
            }, stepStartAt + DEMO_NODE_RUNNING_MS);
            executionTimersRef.current.push(runningTimer, successTimer);
            stepIndex += 1;
        }
        const completionTimer = setTimeout(() => {
            setIsExecuting(false);
        }, Math.max(stepIndex, 1) * DEMO_STEP_DURATION_MS + 120);
        executionTimersRef.current.push(completionTimer);
    }, [clearExecutionTimers, edges, isExecuting, nodes]);
    const handleReset = useCallback(() => {
        clearExecutionTimers();
        setIsExecuting(false);
        setNodeStatuses({});
        setConfigTarget(null);
        setNodes(createPlaygroundNodes());
        setEdges(createPlaygroundEdges());
    }, [clearExecutionTimers, setEdges, setNodes]);
    return (<section id="playground" className="relative w-full min-h-screen flex flex-col items-center justify-center py-16 bg-[#151515] sm:py-24 snap-start overflow-x-hidden overflow-y-auto">
      <EditorialLines />

      <div className="relative z-10 w-[92%] md:w-[88%] lg:w-[90%] mx-auto">
        <div className="flex h-8 items-center gap-2 rounded-[11px] border border-[#F04D26] bg-[#F04D26]/5 px-2.5 text-xs font-medium text-white/75 shadow-[0_8px_24px_-14px_rgba(0,0,0,0.6)] mb-4 w-fit mx-auto">
          <svg aria-hidden="true" width="16px" height="16px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g>
              <path d="M17.4453 17C17.4453 18.6569 16.1022 20 14.4453 20C12.7885 20 11.4453 18.6569 11.4453 17C11.4453 15.3431 12.7885 14 14.4453 14C16.1022 14 17.4453 15.3431 17.4453 17Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"></path>
              <path d="M4.70307 7.13196L10.0104 11.5853L3.5 13.9549L4.70307 7.13196Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"></path>
              <path d="M14.0465 6.16481C14.4038 4.83115 15.7747 4.03969 17.1084 4.39705L18.0743 4.65587C19.4079 5.01322 20.1994 6.38406 19.842 7.71773L19.5832 8.68365C19.2259 10.0173 17.855 10.8088 16.5214 10.4514L15.5554 10.1926C14.2218 9.83525 13.4303 8.46441 13.7877 7.13074L14.0465 6.16481Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"></path>
            </g>
          </svg>
          <span>Playground</span>
        </div>

        <h2 className="font-serif italic text-[#7D7D87] text-center font-normal text-xl md:text-2xl leading-tight mb-12">
          See how it all comes together
        </h2>

        <div className="w-full rounded-[28px] bg-[#1A1A1A] ring-1 ring-white/10">
          <div className="flex items-center px-6 py-4">
            <div className="flex flex-1 gap-2">
              <div className="size-3 rounded-full" style={{
            background: "rgb(237, 106, 94)",
            boxShadow: "rgba(0, 0, 0, 0.16) 0px 0.75px 0.75px inset",
        }}/>
              <div className="size-3 rounded-full" style={{
            background: "rgb(244, 191, 78)",
            boxShadow: "rgba(0, 0, 0, 0.16) 0px 0.75px 0.75px inset",
        }}/>
              <div className="size-3 rounded-full" style={{
            background: "rgb(97, 198, 85)",
            boxShadow: "rgba(0, 0, 0, 0.16) 0px 0.75px 0.75px inset",
        }}/>
            </div>

            <div className="flex items-center gap-1 text-xs text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 15 14" className="size-3.5 text-gray-400">
                <path fill="currentColor" fillRule="evenodd" d="M7.5 1.313a2.917 2.917 0 0 0-2.917 2.916V5.25h-.146c-.885 0-1.604.718-1.604 1.604v4.375c0 .886.719 1.604 1.604 1.604h6.125c.886 0 1.605-.718 1.605-1.604V6.854c0-.886-.719-1.604-1.604-1.604h-.146V4.23A2.917 2.917 0 0 0 7.5 1.311ZM9.542 5.25V4.23a2.042 2.042 0 1 0-4.084 0v1.02z" clipRule="evenodd"/>
              </svg>
              fynt.com
            </div>

            <div className="flex flex-1 justify-end gap-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" className="size-[18px] text-gray-500" viewBox="0 0 18 18">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" d="M9 2.813v8.437m0-8.438 3.375 3.376M9 2.813 5.625 6.187m9.563 3.375v4.126a1.5 1.5 0 0 1-1.5 1.5H4.312a1.5 1.5 0 0 1-1.5-1.5V9.561"/>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18" className="size-[18px] text-gray-500">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.125" d="M9 2.813V9m0 0v6.188M9 9H2.813M9 9h6.188"/>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 19 18" className="size-[18px] text-gray-500">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" d="M12.073 6.563V3c0-.518-.443-.938-.99-.938H3.167c-.547 0-.99.42-.99.938v7.5c0 .518.443.938.99.938h3.76m.99-4.876h7.916c.547 0 .99.42.99.938V15c0 .518-.443.938-.99.938H7.917c-.547 0-.99-.42-.99-.938V7.5c0-.518.443-.938.99-.938"/>
              </svg>
            </div>
          </div>

          <div className="p-2.5">
            <div className="w-full h-[700px] rounded-2xl overflow-hidden relative" style={{ boxShadow: "rgba(0, 0, 0, 0.04) 0px 0.75px 0.75px inset" }}>
              <EditorProvider onUpdateNodeData={updateNodeData} onDeleteNode={deleteNode} getNodeData={getNodeData} nodeStatuses={nodeStatuses} onExecuteNode={handleExecuteNodeDemo} onExecuteWorkflow={handleExecuteWorkflowDemo} onOpenNodeConfig={handleOpenNodeConfig} canEditNodes={true}>
                <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} fitView fitViewOptions={{ padding: 0.22 }} defaultViewport={{ x: 0, y: 0, zoom: 0.72 }} nodesDraggable elementsSelectable preventScrolling={false} panOnDrag={false} panOnScroll={false} minZoom={0.72} maxZoom={0.72} zoomOnScroll={false} zoomOnPinch={false} zoomOnDoubleClick={false} proOptions={{ hideAttribution: true }} defaultEdgeOptions={{ type: "default" }} style={{ background: "#141414" }}>
                  <Panel position="bottom-center" className="mb-8">
                    <ExecuteWorkflowButton onExecute={handleExecuteWorkflowDemo} isExecuting={isExecuting} disabled={isExecuting || !isTriggerActive}/>
                  </Panel>

                  <Panel position="bottom-left" className="m-4">
                    <ResetButton onReset={handleReset}/>
                  </Panel>

                  <MiniMap nodeColor="#1E1E1E" nodeStrokeColor="#333333" nodeBorderRadius={8} maskColor="rgba(0, 0, 0, 0.6)" style={{
            backgroundColor: "#0A0A0A",
        }}/>
                  <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#303030"/>

                  <style>{`
                    .react-flow__attribution {
                      display: none !important;
                    }

                    .react-flow__controls {
                      background: transparent !important;
                      border: none !important;
                      box-shadow: none !important;
                    }

                    .react-flow__controls-button {
                      background: #1E1E1E !important;
                      border: 1px solid #333333 !important;
                      color: #E5E5E5 !important;
                      width: 32px !important;
                      height: 32px !important;
                      transition: all 0.15s ease !important;
                    }

                    .react-flow__controls-button:hover {
                      background: #2A2A2A !important;
                      border-color: #F04D26 !important;
                    }

                    .react-flow__controls-button svg {
                      fill: #E5E5E5 !important;
                    }

                    .react-flow__minimap {
                      background: #0A0A0A !important;
                      border: 1px solid #333333 !important;
                      border-radius: 8px !important;
                    }

                    .react-flow__minimap-mask {
                      fill: rgba(0, 0, 0, 0.6) !important;
                    }

                    .react-flow__pane {
                      cursor: default !important;
                    }

                    .react-flow__viewport {
                      cursor: default !important;
                    }
                  `}</style>
                </ReactFlow>
              </EditorProvider>
            </div>
          </div>
        </div>
      </div>

      <PlaygroundNodeConfigDialog open={Boolean(configTarget)} nodeId={configTarget?.nodeId ?? null} nodeType={configTarget?.nodeType ?? null} nodeData={activeConfigData} onOpenChange={handleCloseNodeConfig} onSave={updateNodeData}/>
    </section>);
}
