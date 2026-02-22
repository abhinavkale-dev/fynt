"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ReactFlow, MiniMap, Node, Edge, OnNodesChange, OnEdgesChange, Connection, Background, BackgroundVariant, Panel, useReactFlow, } from "@xyflow/react";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuShortcut, ContextMenuTrigger, } from "@/components/ui/context-menu";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { validateWorkflow } from "@repo/shared";
import { nodeTypes } from "@/lib/reactflow/nodeTypes";
import { edgeTypes } from "@/lib/reactflow/edgeTypes";
import { computeTidyLayout } from "@/lib/workflow/tidyLayout";
import "@xyflow/react/dist/style.css";
interface WorkflowCanvasProps {
    nodes: Node[];
    edges: Edge[];
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: (connection: Connection) => void;
    onExecute?: () => void;
    onExecuteTriggerNow?: (source: 'cron' | 'webhook', triggerNodeId: string) => void;
    isExecuting?: boolean;
    isCronTriggerRunning?: boolean;
    onOpenDrawer?: () => void;
    onTidyUp?: (layoutedNodes: Node[]) => void;
}
interface CustomControlsProps {
    isInteractive: boolean;
    setIsInteractive: (value: boolean) => void;
    hasNodes: boolean;
    onTidyUp: () => void;
}
function CustomControls({ isInteractive, setIsInteractive, hasNodes, onTidyUp }: CustomControlsProps) {
    const { zoomIn, zoomOut, fitView } = useReactFlow();
    return (<Panel position="bottom-left" className="m-4">
      <div className="flex flex-col gap-1">
        <button onClick={() => zoomIn()} className="w-8 h-8 bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#333333] hover:border-[#F04D26] rounded flex items-center justify-center transition-[background-color,border-color] duration-150 ease group" title="Zoom In">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" className="transition-opacity duration-150">
            <path opacity="0.4" d="M14.7501 9.75H3.25009C2.83599 9.75 2.50009 9.4141 2.50009 9C2.50009 8.5859 2.83599 8.25 3.25009 8.25H14.7501C15.1642 8.25 15.5001 8.5859 15.5001 9C15.5001 9.4141 15.1642 9.75 14.7501 9.75Z" fill="rgba(255, 255, 255, 0.5)" className="group-hover:fill-white transition-colors duration-150"></path>
            <path d="M9.00009 15.5C8.58599 15.5 8.25009 15.1641 8.25009 14.75V3.25C8.25009 2.8359 8.58599 2.5 9.00009 2.5C9.41419 2.5 9.75009 2.8359 9.75009 3.25V14.75C9.75009 15.1641 9.41419 15.5 9.00009 15.5Z" fill="rgba(255, 255, 255, 0.5)" className="group-hover:fill-white transition-colors duration-150"></path>
          </svg>
        </button>
        <button onClick={() => zoomOut()} className="w-8 h-8 bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#333333] hover:border-[#F04D26] rounded flex items-center justify-center transition-[background-color,border-color] duration-150 ease group" title="Zoom Out">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
            <path d="M14.7501 9.75H3.25012C2.83602 9.75 2.50012 9.4141 2.50012 9C2.50012 8.5859 2.83602 8.25 3.25012 8.25H14.7501C15.1642 8.25 15.5001 8.5859 15.5001 9C15.5001 9.4141 15.1642 9.75 14.7501 9.75Z" fill="rgba(255, 255, 255, 0.5)" className="group-hover:fill-white transition-colors duration-150"></path>
          </svg>
        </button>
        <button onClick={() => fitView({ duration: 300, padding: 0.2 })} className="w-8 h-8 bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#333333] hover:border-[#F04D26] rounded flex items-center justify-center transition-[background-color,border-color] duration-150 ease group" title="Fit View">
          <svg height="18" width="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <g fill="rgba(255, 255, 255, 0.5)" className="group-hover:fill-white transition-colors duration-150">
              <path d="M3.14182 7.76057C3.96563 6.58466 5.86467 4.5 9 4.5C12.1353 4.5 14.0344 6.58466 14.8582 7.76057C15.3812 8.50694 15.3812 9.49308 14.8582 10.2394C14.0344 11.4153 12.1353 13.5 9 13.5C5.86467 13.5 3.96555 11.4152 3.14174 10.2393C2.61877 9.49298 2.61885 8.5069 3.14182 7.76057Z" fillOpacity="0.4"></path>
              <path d="M9 11C10.105 11 11 10.1046 11 9C11 7.8954 10.105 7 9 7C7.895 7 7 7.8954 7 9C7 10.1046 7.895 11 9 11Z"></path>
              <path d="M4.25 3C3.55921 3 3 3.55921 3 4.25V5.75C3 6.16421 2.66421 6.5 2.25 6.5C1.83579 6.5 1.5 6.16421 1.5 5.75V4.25C1.5 2.73079 2.73079 1.5 4.25 1.5H5.75C6.16421 1.5 6.5 1.83579 6.5 2.25C6.5 2.66421 6.16421 3 5.75 3H4.25Z" fillRule="evenodd"></path>
              <path d="M11.5 2.25C11.5 1.83579 11.8358 1.5 12.25 1.5H13.75C15.2692 1.5 16.5 2.73079 16.5 4.25V5.75C16.5 6.16421 16.1642 6.5 15.75 6.5C15.3358 6.5 15 6.16421 15 5.75V4.25C15 3.55921 14.4408 3 13.75 3H12.25C11.8358 3 11.5 2.66421 11.5 2.25Z" fillRule="evenodd"></path>
              <path d="M15.75 11.5C16.1642 11.5 16.5 11.8358 16.5 12.25V13.75C16.5 15.2692 15.2692 16.5 13.75 16.5H12.25C11.8358 16.5 11.5 16.1642 11.5 15.75C11.5 15.3358 11.8358 15 12.25 15H13.75C14.4408 15 15 14.4408 15 13.75V12.25C15 11.8358 15.3358 11.5 15.75 11.5Z" fillRule="evenodd"></path>
              <path d="M2.25 11.5C2.66421 11.5 3 11.8358 3 12.25V13.75C3 14.4408 3.55921 15 4.25 15H5.75C6.16421 15 6.5 15.3358 6.5 15.75C6.5 16.1642 6.16421 16.5 5.75 16.5H4.25C2.73079 16.5 1.5 15.2692 1.5 13.75V12.25C1.5 11.8358 1.83579 11.5 2.25 11.5Z" fillRule="evenodd"></path>
            </g>
          </svg>
        </button>
        <button onClick={() => setIsInteractive(!isInteractive)} className="w-8 h-8 bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#333333] hover:border-[#F04D26] rounded flex items-center justify-center transition-[background-color,border-color] duration-150 ease group" title={isInteractive ? "Lock Canvas" : "Unlock Canvas"}>
          {isInteractive ? (<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 18 18">
              <path fillRule="evenodd" clipRule="evenodd" d="M3 10.25C3 8.73128 4.23069 7.5 5.75 7.5H13.25C14.7693 7.5 16 8.73128 16 10.25V14.25C16 15.7687 14.7693 17 13.25 17H5.75C4.23069 17 3 15.7687 3 14.25V10.25Z" fill="rgba(255, 255, 255, 0.5)" fillOpacity="0.4" className="group-hover:fill-white transition-colors duration-150"></path>
              <path fillRule="evenodd" clipRule="evenodd" d="M9.5 11C9.91421 11 10.25 11.3358 10.25 11.75V12.75C10.25 13.1642 9.91421 13.5 9.5 13.5C9.08579 13.5 8.75 13.1642 8.75 12.75V11.75C8.75 11.3358 9.08579 11 9.5 11Z" fill="rgba(255, 255, 255, 0.5)" className="group-hover:fill-white transition-colors duration-150"></path>
              <path d="M4 1C1.79079 1 0 2.79079 0 5V6.25C0 6.66421 0.335786 7 0.75 7C1.16421 7 1.5 6.66421 1.5 6.25V5C1.5 3.61921 2.61921 2.5 4 2.5C5.38079 2.5 6.5 3.61921 6.5 5V7.5H8V5C8 2.79079 6.20921 1 4 1Z" fill="rgba(255, 255, 255, 0.5)" className="group-hover:fill-white transition-colors duration-150"></path>
            </svg>) : (<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 18 18">
              <path fillRule="evenodd" clipRule="evenodd" d="M2.5 10.25C2.5 8.73119 3.73119 7.5 5.25 7.5H12.75C14.2688 7.5 15.5 8.73119 15.5 10.25V14.25C15.5 15.7688 14.2688 17 12.75 17H5.25C3.73119 17 2.5 15.7688 2.5 14.25V10.25Z" fill="rgba(255, 255, 255, 0.5)" fillOpacity="0.4" className="group-hover:fill-white transition-colors duration-150"></path>
              <path fillRule="evenodd" clipRule="evenodd" d="M9 11C9.41421 11 9.75 11.3358 9.75 11.75V12.75C9.75 13.1642 9.41421 13.5 9 13.5C8.58579 13.5 8.25 13.1642 8.25 12.75V11.75C8.25 11.3358 8.58579 11 9 11Z" fill="rgba(255, 255, 255, 0.5)" className="group-hover:fill-white transition-colors duration-150"></path>
              <path d="M6.5 5C6.5 3.61921 7.61921 2.5 9 2.5C10.3808 2.5 11.5 3.61921 11.5 5V7.5H12.75C12.8343 7.5 12.9177 7.50379 13 7.51121V5C13 2.79079 11.2092 1 9 1C6.79079 1 5 2.79079 5 5V7.51121C5.08234 7.50379 5.16573 7.5 5.25 7.5H6.5V5Z" fill="rgba(255, 255, 255, 0.5)" className="group-hover:fill-white transition-colors duration-150"></path>
            </svg>)}
        </button>
        <button onClick={onTidyUp} disabled={!hasNodes} className="w-8 h-8 bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#333333] hover:border-[#F04D26] rounded flex items-center justify-center transition-[background-color,border-color,opacity] duration-150 ease group disabled:opacity-50 disabled:cursor-not-allowed" title="Tidy workflow">
          <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="16px" height="16px" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M16.318 1.931C15.528 1.142 14.152 1.141 13.361 1.931L5.948 9.344C6.621 9.594 7.242 9.975 7.765 10.5C8.29 11.027 8.662 11.645 8.905 12.302L16.319 4.888C17.134 4.073 17.134 2.746 16.319 1.93L16.318 1.931Z" fill="rgba(255, 255, 255, 0.5)" fillOpacity="0.4" className="group-hover:fill-white transition-colors duration-150"></path>
            <path fillRule="evenodd" clipRule="evenodd" d="M3.98984 9.29252C5.37713 7.89005 7.60017 7.9142 8.97054 9.29091C10.3418 10.6685 10.343 12.8997 8.97295 14.2777C7.95219 15.3213 6.79225 15.8394 5.51026 15.9674C4.25618 16.0927 2.92172 15.8411 1.53421 15.4243C1.24453 15.3373 1.03547 15.0848 1.00405 14.7839C0.972619 14.4831 1.12497 14.1928 1.39041 14.0478C1.9391 13.7481 2.21442 13.462 2.37386 13.2082C2.53795 12.9471 2.61815 12.661 2.68975 12.2759C2.70535 12.192 2.72019 12.1036 2.73569 12.0114C2.86109 11.265 3.02947 10.2632 3.98984 9.29252Z" fill="rgba(255, 255, 255, 0.5)" className="group-hover:fill-white transition-colors duration-150"></path>
          </svg>
        </button>
      </div>
    </Panel>);
}
const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ nodes, edges, onNodesChange, onEdgesChange, onConnect, onExecute, onExecuteTriggerNow, isExecuting, isCronTriggerRunning = false, onOpenDrawer, onTidyUp, }) => {
    const memoizedNodeTypes = useMemo(() => nodeTypes, []);
    const [isInteractive, setIsInteractive] = useState(true);
    const hasNodes = nodes.length > 0;
    const hasSelectedNodes = nodes.some(n => n.selected);
    const hasActiveManualTrigger = useMemo(() => nodes.some((node) => {
        if (node.type !== 'manualTrigger' && node.type !== 'triggerNode') {
            return false;
        }
        const nodeData = node.data && typeof node.data === 'object'
            ? (node.data as Record<string, unknown>)
            : null;
        return nodeData?.isActive !== false;
    }), [nodes]);
    const runNowCandidate = useMemo<{
        source: 'cron' | 'webhook';
        nodeId: string;
    } | null>(() => {
        if (hasActiveManualTrigger) {
            return null;
        }
        const isRunnableTriggerNode = (node: Node): boolean => {
            const nodeData = node.data && typeof node.data === 'object'
                ? (node.data as Record<string, unknown>)
                : null;
            return nodeData?.isActive !== false && nodeData?.isConfigured === true;
        };
        const activeCron = nodes.find((node) => node.type === 'cronTrigger' && isRunnableTriggerNode(node));
        if (activeCron) {
            return { source: 'cron', nodeId: activeCron.id };
        }
        const activeWebhook = nodes.find((node) => node.type === 'webhookTrigger' && isRunnableTriggerNode(node));
        if (activeWebhook) {
            return { source: 'webhook', nodeId: activeWebhook.id };
        }
        return null;
    }, [nodes, hasActiveManualTrigger]);
    const canRunNowViaTrigger = Boolean(runNowCandidate && onExecuteTriggerNow);
    const disableManualExecute = !hasActiveManualTrigger && canRunNowViaTrigger;
    const isCronRunButton = runNowCandidate?.source === 'cron';
    const isCronRunButtonActive = isCronRunButton && isCronTriggerRunning;
    const handleRunNowViaTrigger = useCallback(() => {
        if (!runNowCandidate || !onExecuteTriggerNow) {
            return;
        }
        if (runNowCandidate.source === 'cron') {
            return;
        }
        onExecuteTriggerNow(runNowCandidate.source, runNowCandidate.nodeId);
    }, [runNowCandidate, onExecuteTriggerNow]);
    const validation = useMemo(() => {
        return validateWorkflow(nodes.filter(n => n.type).map(n => ({ id: n.id, type: n.type!, data: n.data })), edges.map(e => ({ source: e.source, target: e.target, sourceHandle: e.sourceHandle })));
    }, [nodes, edges]);
    const hasValidationErrors = validation.issues.some(i => i.type === 'error');
    const isRunNowButtonDisabled = isExecuting || hasValidationErrors || isCronRunButton;
    const hasValidationWarnings = validation.issues.some(i => i.type === 'warning');
    const { fitView, setNodes: rfSetNodes, getNodes } = useReactFlow();
    const handleSelectAll = useCallback(() => {
        rfSetNodes(getNodes().map(n => ({ ...n, selected: true })));
    }, [rfSetNodes, getNodes]);
    const handleClearSelection = useCallback(() => {
        rfSetNodes(getNodes().map(n => ({ ...n, selected: false })));
    }, [rfSetNodes, getNodes]);
    const handleTidyUpInternal = useCallback(() => {
        const layouted = computeTidyLayout(nodes, edges);
        onTidyUp?.(layouted);
        setTimeout(() => fitView({ duration: 400, padding: 0.2 }), 50);
    }, [nodes, edges, onTidyUp, fitView]);
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable)
                return;
            if (e.key === 'Tab' && !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                onOpenDrawer?.();
            }
            else if (e.key === 'T' && e.shiftKey && e.altKey) {
                e.preventDefault();
                handleTidyUpInternal();
            }
            else if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
                e.preventDefault();
                handleSelectAll();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onOpenDrawer, handleTidyUpInternal, handleSelectAll]);
    return (<ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="w-full h-full rounded-b-lg overflow-hidden">
          <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} nodeTypes={memoizedNodeTypes} edgeTypes={edgeTypes} fitView={false} className="w-full h-full" minZoom={0.2} maxZoom={2} panOnScroll={hasNodes && isInteractive} panOnScrollSpeed={0.5} panOnDrag={hasNodes && isInteractive} zoomOnScroll={hasNodes} zoomOnPinch={hasNodes} zoomOnDoubleClick={hasNodes} nodesDraggable={hasNodes && isInteractive} nodesConnectable={hasNodes && isInteractive} elementsSelectable={hasNodes && isInteractive} colorMode="dark" proOptions={{ hideAttribution: true }}>
            {hasNodes && <MiniMap />}
            {hasNodes && (<CustomControls isInteractive={isInteractive} setIsInteractive={setIsInteractive} hasNodes={hasNodes} onTidyUp={handleTidyUpInternal}/>)}
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#4a4a4a"/>
            {hasNodes && (<Panel position="bottom-center" className="mb-8">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <button onClick={onExecute} disabled={isExecuting || hasValidationErrors || disableManualExecute} className={`flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${hasValidationErrors || disableManualExecute
                ? 'bg-gray-600 cursor-not-allowed'
                : hasValidationWarnings
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-orange-500 hover:bg-orange-600'}`}>
                          {isExecuting ? (<>
                              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Executing workflow...</span>
                            </>) : hasValidationErrors ? (<>
                              <AlertCircle className="size-4"/>
                              <span>Cannot Execute</span>
                            </>) : hasValidationWarnings ? (<>
                              <AlertTriangle className="size-4"/>
                              <span>Execute (with warnings)</span>
                            </>) : (<>
                              <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="15px" height="15px" viewBox="0 0 18 18">
                                <path fillRule="evenodd" clipRule="evenodd" d="M13.4868 7.0974C13.4955 6.98275 13.5 6.8669 13.5 6.75C13.5 4.26472 11.4853 2.25 9 2.25C6.51472 2.25 4.5 4.26472 4.5 6.75C4.5 6.86689 4.50446 6.98275 4.51321 7.0974C2.89021 7.777 1.75 9.38035 1.75 11.25C1.75 13.7353 3.76472 15.75 6.25 15.75C7.28562 15.75 8.23953 15.4002 9 14.8122C9.76047 15.4002 10.7144 15.75 11.75 15.75C14.2353 15.75 16.25 13.7353 16.25 11.25C16.25 9.38035 15.1098 7.77701 13.4868 7.0974Z" fill="rgba(255, 255, 255, 1)" fillOpacity="0.3" data-color="color-2"></path>
                                <path d="M10.496 9.757C10.66 10.224 10.75 10.727 10.75 11.25C10.75 13.735 8.735 15.75 6.25 15.75C3.765 15.75 1.75 13.735 1.75 11.25C1.75 10.339 2.021 9.491 2.486 8.783" stroke="rgba(255, 255, 255, 1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"></path>
                                <path d="M11.511 15.745C12.042 15.773 12.587 15.707 13.123 15.536C15.49 14.778 16.794 12.245 16.036 9.878C15.278 7.511 12.745 6.207 10.378 6.965C9.50999 7.243 8.78599 7.759 8.25299 8.418" stroke="rgba(255, 255, 255, 1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"></path>
                                <path d="M8.156 11.171C7.695 11.083 7.239 10.92 6.806 10.679C4.636 9.468 3.859 6.727 5.07 4.556C6.281 2.385 9.022 1.609 11.193 2.82C11.904 3.217 12.465 3.778 12.856 4.429" stroke="rgba(255, 255, 255, 1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"></path>
                              </svg>
                              <span>Execute workflow</span>
                            </>)}
                        </button>
                        {canRunNowViaTrigger && runNowCandidate && (<button onClick={handleRunNowViaTrigger} disabled={isRunNowButtonDisabled} className={`flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition-all shadow-lg disabled:cursor-not-allowed ${hasValidationErrors
                ? 'bg-gray-600 cursor-not-allowed disabled:opacity-50'
                : isCronRunButtonActive
                    ? 'bg-emerald-600 hover:bg-emerald-600 disabled:opacity-100'
                    : isCronRunButton
                        ? 'bg-emerald-700 hover:bg-emerald-600 disabled:opacity-100'
                        : 'bg-[#F04D26] hover:bg-[#e04420] disabled:opacity-50'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="15px" height="15px" viewBox="0 0 18 18">
                              <path fillRule="evenodd" clipRule="evenodd" d="M13.4868 7.0974C13.4955 6.98275 13.5 6.8669 13.5 6.75C13.5 4.26472 11.4853 2.25 9 2.25C6.51472 2.25 4.5 4.26472 4.5 6.75C4.5 6.86689 4.50446 6.98275 4.51321 7.0974C2.89021 7.777 1.75 9.38035 1.75 11.25C1.75 13.7353 3.76472 15.75 6.25 15.75C7.28562 15.75 8.23953 15.4002 9 14.8122C9.76047 15.4002 10.7144 15.75 11.75 15.75C14.2353 15.75 16.25 13.7353 16.25 11.25C16.25 9.38035 15.1098 7.77701 13.4868 7.0974Z" fill="rgba(255, 255, 255, 1)" fillOpacity="0.3"></path>
                              <path d="M10.496 9.757C10.66 10.224 10.75 10.727 10.75 11.25C10.75 13.735 8.735 15.75 6.25 15.75C3.765 15.75 1.75 13.735 1.75 11.25C1.75 10.339 2.021 9.491 2.486 8.783" stroke="rgba(255, 255, 255, 1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"></path>
                              <path d="M11.511 15.745C12.042 15.773 12.587 15.707 13.123 15.536C15.49 14.778 16.794 12.245 16.036 9.878C15.278 7.511 12.745 6.207 10.378 6.965C9.50999 7.243 8.78599 7.759 8.25299 8.418" stroke="rgba(255, 255, 255, 1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"></path>
                              <path d="M8.156 11.171C7.695 11.083 7.239 10.92 6.806 10.679C4.636 9.468 3.859 6.727 5.07 4.556C6.281 2.385 9.022 1.609 11.193 2.82C11.904 3.217 12.465 3.778 12.856 4.429" stroke="rgba(255, 255, 255, 1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"></path>
                            </svg>
                            <span>{isCronRunButtonActive
                                ? 'Cron is Running'
                                : isCronRunButton
                                    ? 'Cron is Active'
                                    : 'Run Webhook Now'}</span>
                          </button>)}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      {disableManualExecute && !hasValidationErrors && (<div className="text-xs space-y-1">
                          <div className="font-semibold text-amber-300">Manual trigger not found</div>
                          <div className="text-white/90">Use <span className="font-medium">{runNowCandidate?.source === 'cron' ? 'Run Cron Now' : 'Run Webhook Now'}</span> for this workflow.</div>
                        </div>)}
                      {isCronRunButton && !hasValidationErrors && (<div className="text-xs space-y-1">
                          <div className="font-semibold text-emerald-300">Cron is active</div>
                          <div className="text-white/90">This workflow runs automatically by schedule.</div>
                        </div>)}
                      {hasValidationErrors && (<div className="text-xs space-y-1">
                          <div className="font-semibold text-red-400">Workflow has errors:</div>
                          {validation.issues.filter(i => i.type === 'error').map((e, i) => (<div key={i} className="text-white/90">• {e.message}</div>))}
                        </div>)}
                      {hasValidationWarnings && !hasValidationErrors && (<div className="text-xs space-y-1">
                          <div className="font-semibold text-yellow-400">Workflow has warnings:</div>
                          {validation.issues.filter(i => i.type === 'warning').map((w, i) => (<div key={i} className="text-white/90">• {w.message}</div>))}
                          <div className="mt-2 text-white/70">You can still execute, but results may be unexpected</div>
                        </div>)}
                      {!hasValidationErrors && !hasValidationWarnings && (<div className="text-xs">Workflow is valid and ready to run</div>)}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Panel>)}
          </ReactFlow>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-56">
        <ContextMenuItem onSelect={() => onOpenDrawer?.()} disabled={!isInteractive}>
          Add node
          <ContextMenuShortcut><Kbd>Tab</Kbd></ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={handleTidyUpInternal} disabled={!hasNodes}>
          Tidy up workflow
          <ContextMenuShortcut>
            <KbdGroup><Kbd>⇧</Kbd><Kbd>⌥</Kbd><Kbd>T</Kbd></KbdGroup>
          </ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={handleSelectAll} disabled={!hasNodes}>
          Select all
          <ContextMenuShortcut>
            <KbdGroup><Kbd>⌘</Kbd><Kbd>A</Kbd></KbdGroup>
          </ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={handleClearSelection} disabled={!hasSelectedNodes}>
          Clear selection
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>);
};
export default WorkflowCanvas;
