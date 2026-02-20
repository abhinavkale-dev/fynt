"use client";
import React, { createContext, useContext } from 'react';
interface EditorContextType {
    updateNodeData: (nodeId: string, data: any) => void | Promise<void>;
    deleteNode: (nodeId: string) => void;
    addNode: (type: string, position?: {
        x: number;
        y: number;
    }) => void;
    duplicateNode: (nodeId: string) => void;
    getNodeData: (nodeId: string) => any;
    nodeStatuses: Record<string, string>;
    executeNode?: (nodeId: string) => void;
    executeWorkflow?: () => void;
    openNodeConfig?: (nodeId: string, nodeType: string) => void;
    canEditNodes: boolean;
}
const EditorContext = createContext<EditorContextType | null>(null);
interface EditorProviderProps {
    children: React.ReactNode;
    onUpdateNodeData?: (nodeId: string, data: any) => void | Promise<void>;
    onDeleteNode?: (nodeId: string) => void;
    onAddNode?: (type: string, position?: {
        x: number;
        y: number;
    }) => void;
    onDuplicateNode?: (nodeId: string) => void;
    getNodeData?: (nodeId: string) => any;
    nodeStatuses?: Record<string, string>;
    onExecuteNode?: (nodeId: string) => void;
    onExecuteWorkflow?: () => void;
    onOpenNodeConfig?: (nodeId: string, nodeType: string) => void;
    canEditNodes?: boolean;
}
export function EditorProvider({ children, onUpdateNodeData, onDeleteNode, onAddNode, onDuplicateNode, getNodeData, nodeStatuses, onExecuteNode, onExecuteWorkflow, onOpenNodeConfig, canEditNodes = false, }: EditorProviderProps) {
    const contextValue: EditorContextType = {
        updateNodeData: onUpdateNodeData || (() => { }),
        deleteNode: onDeleteNode || (() => { }),
        addNode: onAddNode || (() => { }),
        duplicateNode: onDuplicateNode || (() => { }),
        getNodeData: getNodeData || (() => null),
        nodeStatuses: nodeStatuses || {},
        executeNode: onExecuteNode,
        executeWorkflow: onExecuteWorkflow,
        openNodeConfig: onOpenNodeConfig,
        canEditNodes,
    };
    return (<EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>);
}
export function useEditor() {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error('useEditor must be used within an EditorProvider');
    }
    return context;
}
export const runtimeCallbacks = {};
