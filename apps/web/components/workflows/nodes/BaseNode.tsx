"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Handle, Position } from '@xyflow/react';
import { useEditor } from '@/contexts/EditorContext';
import { NodeConfigDialog } from '../dialogs';
const NODE_ENTRANCE = {
    spring: { type: "spring" as const, stiffness: 350, damping: 25 },
};
interface BaseNodeProps {
    id: string;
    selected?: boolean;
    icon: React.ReactNode;
    label: string;
    subtitle: string;
    isConfigured?: boolean;
    isTrigger?: boolean;
    nodeType: string;
    hideDefaultSourceHandle?: boolean;
    sourceHandles?: Array<{
        id: string;
        label?: string;
        top?: string;
    }>;
}
export default function BaseNode({ id, selected, icon, label, subtitle, isConfigured, isTrigger, nodeType, hideDefaultSourceHandle, sourceHandles, }: BaseNodeProps) {
    const { deleteNode, getNodeData, updateNodeData, nodeStatuses, executeNode, executeWorkflow, openNodeConfig, canEditNodes, } = useEditor();
    const [configOpen, setConfigOpen] = useState(false);
    const executionStatus = nodeStatuses[id];
    const nodeData = (getNodeData(id) || {}) as Record<string, unknown>;
    const isNodeActive = nodeData.isActive !== false;
    const handleExecuteStep = () => {
        if (!isNodeActive) {
            return;
        }
        if (executeNode) {
            executeNode(id);
        }
    };
    const handleExecuteWorkflow = () => {
        if (!isNodeActive) {
            return;
        }
        if (executeWorkflow) {
            executeWorkflow();
        }
    };
    const handleToggleNodeActive = () => {
        void Promise.resolve(updateNodeData(id, { isActive: !isNodeActive }));
    };
    const isManualTriggerNode = isTrigger && (nodeType === 'triggerNode' || nodeType === 'manualTrigger');
    return (<motion.div className="relative group flex flex-col items-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={NODE_ENTRANCE.spring}>
      <div className="relative">
        {isManualTriggerNode && canEditNodes && (<div className="absolute top-1/2 -left-4 -translate-x-full -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out nodrag z-10 flex items-center gap-1">
            <button onClick={handleExecuteWorkflow} className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-[#2D2D2E] disabled:text-white/50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-lg whitespace-nowrap" title={isNodeActive ? "Execute workflow" : "Trigger is deactivated"} aria-label="Execute workflow" disabled={!isNodeActive}>
              <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="15px" height="15px" viewBox="0 0 18 18">
                <path fillRule="evenodd" clipRule="evenodd" d="M13.4868 7.0974C13.4955 6.98275 13.5 6.8669 13.5 6.75C13.5 4.26472 11.4853 2.25 9 2.25C6.51472 2.25 4.5 4.26472 4.5 6.75C4.5 6.86689 4.50446 6.98275 4.51321 7.0974C2.89021 7.777 1.75 9.38035 1.75 11.25C1.75 13.7353 3.76472 15.75 6.25 15.75C7.28562 15.75 8.23953 15.4002 9 14.8122C9.76047 15.4002 10.7144 15.75 11.75 15.75C14.2353 15.75 16.25 13.7353 16.25 11.25C16.25 9.38035 15.1098 7.77701 13.4868 7.0974Z" fill="rgba(255, 255, 255, 1)" fillOpacity="0.3" data-color="color-2"></path>
                <path d="M10.496 9.757C10.66 10.224 10.75 10.727 10.75 11.25C10.75 13.735 8.735 15.75 6.25 15.75C3.765 15.75 1.75 13.735 1.75 11.25C1.75 10.339 2.021 9.491 2.486 8.783" stroke="rgba(255, 255, 255, 1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"></path>
                <path d="M11.511 15.745C12.042 15.773 12.587 15.707 13.123 15.536C15.49 14.778 16.794 12.245 16.036 9.878C15.278 7.511 12.745 6.207 10.378 6.965C9.50999 7.243 8.78599 7.759 8.25299 8.418" stroke="rgba(255, 255, 255, 1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"></path>
                <path d="M8.156 11.171C7.695 11.083 7.239 10.92 6.806 10.679C4.636 9.468 3.859 6.727 5.07 4.556C6.281 2.385 9.022 1.609 11.193 2.82C11.904 3.217 12.465 3.778 12.856 4.429" stroke="rgba(255, 255, 255, 1)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"></path>
              </svg>
              <span className="whitespace-nowrap">Execute workflow</span>
            </button>
            <button onClick={handleToggleNodeActive} className={`w-8 h-8 border rounded flex items-center justify-center transition-[color,background-color,transform] duration-100 ease-out active:scale-[0.95] ${isNodeActive
                ? 'bg-[#2D2D2E] hover:bg-[#3e3e3e] border-[#5b5b5b] text-white'
                : 'bg-[#3A2A2A] hover:bg-[#4a3030] border-[#6f4f4f] text-[#ffb6b6]'}`} title={isNodeActive ? "Deactivate node" : "Activate node"} aria-label={isNodeActive ? "Deactivate node" : "Activate node"}>
              <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="16px" height="16px" viewBox="0 0 18 18">
                <path fillRule="evenodd" clipRule="evenodd" d="M5.35528 8.46328C4.67183 7.77848 3.56372 7.77958 2.88033 8.46298C1.04246 10.3009 1.04178 13.2824 2.87967 15.1203C4.71756 16.9582 7.69841 16.9582 9.53631 15.1203C10.2211 14.4369 10.2204 13.3284 9.53699 12.645L5.35528 8.46328Z" fill="currentColor"></path>
                <path fillRule="evenodd" clipRule="evenodd" d="M16.7803 1.21967C17.0732 1.51256 17.0732 1.98744 16.7803 2.28033L15.6086 3.45203C16.9405 5.29199 16.7777 7.87891 15.1203 9.53631C14.4322 10.1368 13.3829 10.1082 12.7283 9.45365L8.54706 5.27232C7.89086 4.61741 7.86338 3.56763 8.4637 2.87964C10.1211 1.22223 12.708 1.05947 14.548 2.39136L15.7197 1.21967C16.0126 0.926777 16.4874 0.926777 16.7803 1.21967Z" fill="currentColor" fillOpacity="0.4"></path>
                <path d="M2.39136 14.548C2.53639 14.7483 2.69915 14.9398 2.87963 15.1203C3.06013 15.3008 3.25165 15.4636 3.45202 15.6086L2.28033 16.7803C1.98744 17.0732 1.51256 17.0732 1.21967 16.7803C0.926777 16.4874 0.926777 16.0126 1.21967 15.7197L2.39136 14.548Z" fill="currentColor"></path>
                <path d="M9.22631 12.3343L8.16565 11.2737L9.46962 9.96967C9.76251 9.67678 10.2374 9.67678 10.5303 9.96967C10.8232 10.2626 10.8232 10.7374 10.5303 11.0303L9.22631 12.3343Z" fill="currentColor"></path>
                <path d="M8.0303 7.46967C8.32319 7.76257 8.32319 8.23744 8.03029 8.53033L6.72631 9.83434L5.66565 8.77368L6.96964 7.46967C7.26253 7.17678 7.73741 7.17678 8.0303 7.46967Z" fill="currentColor"></path>
              </svg>
            </button>
          </div>)}

        {!isManualTriggerNode && canEditNodes && (<div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-[opacity,transform] duration-150 ease-out nodrag z-10">
          <button className="w-8 h-8 bg-[#2D2D2E] hover:bg-[#3e3e3e] disabled:bg-[#2D2D2E] disabled:text-white/50 disabled:cursor-not-allowed border border-[#5b5b5b] rounded flex items-center justify-center text-white transition-[color,background-color,transform] duration-100 ease-out active:scale-[0.95]" onClick={handleExecuteStep} title={isNodeActive ? "Execute step" : "Node is deactivated"} aria-label="Execute step" disabled={!isNodeActive}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" viewBox="0 0 18 18">
              <path fillRule="evenodd" clipRule="evenodd" d="M6.49899 6.87101C6.49899 5.905 7.54673 5.30636 8.37855 5.79096L12.0298 7.92011C12.857 8.40249 12.8571 9.59851 12.0298 10.0809L8.37882 12.2099C7.54699 12.6945 6.49899 12.096 6.49899 11.13V6.87101Z" fill="currentColor"></path>
              <path fillRule="evenodd" clipRule="evenodd" d="M8.25 1.75C8.25 1.33579 8.58579 1 9 1C13.4182 1 17 4.58179 17 9C17 13.4182 13.4182 17 9 17C8.58579 17 8.25 16.6642 8.25 16.25C8.25 15.8358 8.58579 15.5 9 15.5C12.5898 15.5 15.5 12.5898 15.5 9C15.5 5.41021 12.5898 2.5 9 2.5C8.58579 2.5 8.25 2.16421 8.25 1.75Z" fill="currentColor" fillOpacity="0.4"></path>
              <path d="M3.87299 14.877C4.28699 14.877 4.62299 14.5412 4.62299 14.127C4.62299 13.7128 4.28699 13.377 3.87299 13.377C3.45899 13.377 3.12299 13.7128 3.12299 14.127C3.12299 14.5412 3.45899 14.877 3.87299 14.877Z" fill="currentColor" fillOpacity="0.4"></path>
              <path d="M1.75 9.75C2.164 9.75 2.5 9.4142 2.5 9C2.5 8.5858 2.164 8.25 1.75 8.25C1.336 8.25 1 8.5858 1 9C1 9.4142 1.336 9.75 1.75 9.75Z" fill="currentColor" fillOpacity="0.4"></path>
              <path d="M3.87299 4.623C4.28699 4.623 4.62299 4.2872 4.62299 3.873C4.62299 3.4588 4.28699 3.123 3.87299 3.123C3.45899 3.123 3.12299 3.4588 3.12299 3.873C3.12299 4.2872 3.45899 4.623 3.87299 4.623Z" fill="currentColor" fillOpacity="0.4"></path>
              <path d="M6.22601 16.448C6.64001 16.448 6.97601 16.1122 6.97601 15.698C6.97601 15.2838 6.64001 14.948 6.22601 14.948C5.81201 14.948 5.47601 15.2838 5.47601 15.698C5.47601 16.1122 5.81201 16.448 6.22601 16.448Z" fill="currentColor" fillOpacity="0.4"></path>
              <path d="M2.302 12.524C2.716 12.524 3.052 12.1882 3.052 11.774C3.052 11.3598 2.716 11.024 2.302 11.024C1.888 11.024 1.552 11.3598 1.552 11.774C1.552 12.1882 1.888 12.524 2.302 12.524Z" fill="currentColor" fillOpacity="0.4"></path>
              <path d="M2.302 6.976C2.716 6.976 3.052 6.6402 3.052 6.226C3.052 5.8118 2.716 5.476 2.302 5.476C1.888 5.476 1.552 5.8118 1.552 6.226C1.552 6.6402 1.888 6.976 2.302 6.976Z" fill="currentColor" fillOpacity="0.4"></path>
              <path d="M6.22601 3.052C6.64001 3.052 6.97601 2.7162 6.97601 2.302C6.97601 1.8878 6.64001 1.552 6.22601 1.552C5.81201 1.552 5.47601 1.8878 5.47601 2.302C5.47601 2.7162 5.81201 3.052 6.22601 3.052Z" fill="currentColor" fillOpacity="0.4"></path>
            </svg>
          </button>
          <button className={`w-8 h-8 border rounded flex items-center justify-center transition-[color,background-color,transform] duration-100 ease-out active:scale-[0.95] ${isNodeActive
                ? 'bg-[#2D2D2E] hover:bg-[#3e3e3e] border-[#5b5b5b] text-white'
                : 'bg-[#3A2A2A] hover:bg-[#4a3030] border-[#6f4f4f] text-[#ffb6b6]'}`} onClick={handleToggleNodeActive} title={isNodeActive ? "Deactivate node" : "Activate node"} aria-label={isNodeActive ? "Deactivate node" : "Activate node"}>
            <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="16px" height="16px" viewBox="0 0 18 18">
              <path fillRule="evenodd" clipRule="evenodd" d="M5.35528 8.46328C4.67183 7.77848 3.56372 7.77958 2.88033 8.46298C1.04246 10.3009 1.04178 13.2824 2.87967 15.1203C4.71756 16.9582 7.69841 16.9582 9.53631 15.1203C10.2211 14.4369 10.2204 13.3284 9.53699 12.645L5.35528 8.46328Z" fill="currentColor"></path>
              <path fillRule="evenodd" clipRule="evenodd" d="M16.7803 1.21967C17.0732 1.51256 17.0732 1.98744 16.7803 2.28033L15.6086 3.45203C16.9405 5.29199 16.7777 7.87891 15.1203 9.53631C14.4322 10.1368 13.3829 10.1082 12.7283 9.45365L8.54706 5.27232C7.89086 4.61741 7.86338 3.56763 8.4637 2.87964C10.1211 1.22223 12.708 1.05947 14.548 2.39136L15.7197 1.21967C16.0126 0.926777 16.4874 0.926777 16.7803 1.21967Z" fill="currentColor" fillOpacity="0.4" data-color="color-2"></path>
              <path d="M2.39136 14.548C2.53639 14.7483 2.69915 14.9398 2.87963 15.1203C3.06013 15.3008 3.25165 15.4636 3.45202 15.6086L2.28033 16.7803C1.98744 17.0732 1.51256 17.0732 1.21967 16.7803C0.926777 16.4874 0.926777 16.0126 1.21967 15.7197L2.39136 14.548Z" fill="currentColor"></path>
              <path d="M9.22631 12.3343L8.16565 11.2737L9.46962 9.96967C9.76251 9.67678 10.2374 9.67678 10.5303 9.96967C10.8232 10.2626 10.8232 10.7374 10.5303 11.0303L9.22631 12.3343Z" fill="currentColor"></path>
              <path d="M8.0303 7.46967C8.32319 7.76257 8.32319 8.23744 8.03029 8.53033L6.72631 9.83434L5.66565 8.77368L6.96964 7.46967C7.26253 7.17678 7.73741 7.17678 8.0303 7.46967Z" fill="currentColor"></path>
            </svg>
          </button>
          <button className="w-8 h-8 bg-[#2D2D2E] hover:bg-[#3e3e3e] border border-[#5b5b5b] rounded flex items-center justify-center text-white transition-[color,background-color,transform] duration-100 ease-out active:scale-[0.95]" onClick={() => deleteNode(id)} title="Delete" aria-label="Delete node">
            <svg xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" viewBox="0 0 18 18">
              <path opacity="0.4" d="M3.40771 5L3.90253 14.3892C3.97873 15.8531 5.18472 17 6.64862 17H11.3527C12.8166 17 14.0226 15.853 14.0988 14.3896L14.5936 5H3.40771Z" fill="currentColor"></path>
              <path d="M15.25 4H12V2.75C12 1.7852 11.2148 1 10.25 1H7.75C6.7852 1 6 1.7852 6 2.75V4H2.75C2.3359 4 2 4.3359 2 4.75C2 5.1641 2.3359 5.5 2.75 5.5H15.25C15.6641 5.5 16 5.1641 16 4.75C16 4.3359 15.6641 4 15.25 4ZM7.5 2.75C7.5 2.6143 7.6143 2.5 7.75 2.5H10.25C10.3857 2.5 10.5 2.6143 10.5 2.75V4H7.5V2.75Z" fill="currentColor"></path>
            </svg>
          </button>
          <button className="w-8 h-8 bg-[#2D2D2E] hover:bg-[#3e3e3e] border border-[#5b5b5b] rounded flex items-center justify-center text-white transition-[color,background-color,transform] duration-100 ease-out active:scale-[0.95]" onClick={() => {
                if (openNodeConfig) {
                    openNodeConfig(id, nodeType);
                    return;
                }
                setConfigOpen(true);
            }} title="Settings" aria-label="Configure node">
            <svg xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" viewBox="0 0 18 18">
              <path opacity="0.4" d="M9.433 8.25H12.1541C11.8135 6.8198 10.5328 5.75 9 5.75C8.6769 5.75 8.371 5.8118 8.0762 5.8999L9.433 8.25Z" fill="currentColor"></path>
              <path opacity="0.4" d="M9.4331 9.75L8.0766 12.1001C8.3713 12.1882 8.6771 12.25 9.0001 12.25C10.5329 12.25 11.8135 11.1802 12.1542 9.75H9.4331Z" fill="currentColor"></path>
              <path opacity="0.4" d="M6.77409 6.64429C6.14689 7.23729 5.75009 8.0708 5.75009 9C5.75009 9.9292 6.14709 10.7629 6.77439 11.356L8.13419 9L6.77409 6.64429Z" fill="currentColor"></path>
              <path d="M16.2501 8.25H15.2007C15.1289 7.6531 14.976 7.08111 14.7476 6.54761L15.6539 6.02441C16.0128 5.81741 16.1353 5.3589 15.9283 5C15.7208 4.6401 15.2618 4.51859 14.9039 4.72559L13.9904 5.2529C13.636 4.7822 13.2179 4.364 12.7471 4.0097L13.2744 3.0961C13.4814 2.7372 13.3589 2.27869 13 2.07169C12.6426 1.86519 12.1821 1.9867 11.9756 2.3461L11.4523 3.25229C10.919 3.02399 10.3468 2.87119 9.75001 2.79919V1.74991C9.75001 1.33581 9.41411 0.999908 9.00001 0.999908C8.58591 0.999908 8.25001 1.33581 8.25001 1.74991V2.79919C7.65311 2.87119 7.08101 3.02409 6.54771 3.25229L6.02441 2.3461C5.81741 1.9867 5.35891 1.86509 5.00001 2.07169C4.64111 2.27869 4.51861 2.7372 4.72561 3.0961L5.25291 4.0097C4.78211 4.3639 4.36401 4.7822 4.00961 5.2529L3.09611 4.72559C2.73771 4.51859 2.27871 4.6402 2.07171 5C1.86471 5.3589 1.98721 5.81741 2.34611 6.02441L3.25241 6.54761C3.02401 7.08101 2.87121 7.6531 2.79931 8.25H1.74991C1.33581 8.25 0.999908 8.5859 0.999908 9C0.999908 9.4141 1.33581 9.75 1.74991 9.75H2.79931C2.87111 10.3469 3.02401 10.9189 3.25241 11.4524L2.34611 11.9756C1.98721 12.1826 1.86471 12.6411 2.07171 13C2.21041 13.2407 2.46281 13.375 2.72161 13.375C2.84901 13.375 2.97791 13.3428 3.09611 13.2744L4.00961 12.7471C4.36401 13.2178 4.78211 13.636 5.25291 13.9903L4.72561 14.9039C4.51861 15.2628 4.64111 15.7213 5.00001 15.9283C5.11821 15.9967 5.2471 16.0289 5.3745 16.0289C5.6333 16.0289 5.88571 15.8946 6.02441 15.6539L6.54771 14.7477C7.08101 14.976 7.65321 15.1288 8.25001 15.2008V16.2501C8.25001 16.6642 8.58591 17.0001 9.00001 17.0001C9.41411 17.0001 9.75001 16.6642 9.75001 16.2501V15.2008C10.3469 15.1288 10.919 14.9759 11.4523 14.7477L11.9756 15.6539C12.1143 15.8946 12.3667 16.0289 12.6255 16.0289C12.7529 16.0289 12.8818 15.9967 13 15.9283C13.3589 15.7213 13.4814 15.2628 13.2744 14.9039L12.7471 13.9903C13.2179 13.6361 13.636 13.2178 13.9904 12.7471L14.9039 13.2744C15.0221 13.3428 15.151 13.375 15.2784 13.375C15.5372 13.375 15.7896 13.2407 15.9283 13C16.1353 12.6411 16.0128 12.1826 15.6539 11.9756L14.7476 11.4524C14.976 10.919 15.1288 10.3469 15.2007 9.75H16.2501C16.6642 9.75 17.0001 9.4141 17.0001 9C17.0001 8.5859 16.6642 8.25 16.2501 8.25ZM9.00011 13.75C6.38101 13.75 4.25011 11.6191 4.25011 9C4.25011 6.3809 6.38101 4.25 9.00011 4.25C11.6192 4.25 13.7501 6.3809 13.7501 9C13.7501 11.6191 11.6192 13.75 9.00011 13.75Z" fill="currentColor"></path>
            </svg>
          </button>
        </div>)}
        <div className={`
            relative w-24 h-24 rounded-2xl bg-[#2D2D2E]
            border-2 transition-[border-color,box-shadow] duration-300 ease-out
            ${executionStatus === 'Running' ? 'border-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.3)]'
            : executionStatus === 'Success' ? 'border-green-500 shadow-[0_0_12px_rgba(34,197,94,0.3)]'
                : executionStatus === 'Skipped' ? 'border-[#6b7280] shadow-[0_0_10px_rgba(107,114,128,0.2)]'
                    : executionStatus === 'Failed' ? 'border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                        : !isNodeActive ? 'border-[#4a4a4a] shadow-none'
                            : selected ? 'border-[#999] shadow-lg' : 'border-[#5b5b5b]'}
            ${selected ? 'ring-2 ring-white/25 ring-offset-2 ring-offset-[#141414]' : ''}
            ${!isNodeActive ? 'opacity-60' : ''}
            hover:shadow-[0_1px_4px_1px_rgba(255,255,255,0.08)]
          `}>
          {!isNodeActive && (<div className="absolute top-2 right-2 z-10 rounded bg-[#2D2D2E] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/65 border border-[#5b5b5b]">
              Off
            </div>)}

          <div className="absolute inset-0 flex items-center justify-center">
            {icon}
          </div>

          {executionStatus && (<div className="absolute bottom-2 right-2 z-10">
              {(executionStatus === 'Running' || executionStatus === 'Pending') && (<div className="relative w-4 h-4 rounded-full bg-[#2D2D2E] border border-yellow-500 flex items-center justify-center overflow-hidden">
                  <svg className="absolute inset-0 size-4 text-yellow-400 animate-[spin_1.6s_linear_infinite]" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="12 28"/>
                  </svg>
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" style={{ animation: 'status-pulse 2.2s ease-in-out infinite' }}/>
                </div>)}
              {executionStatus === 'Success' && (<div className="w-4 h-4 rounded-full bg-[#2D2D2E] border border-green-500 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-green-500"/>
                </div>)}
              {executionStatus === 'Skipped' && (<div className="w-4 h-4 rounded-full bg-[#2D2D2E] border border-[#6b7280] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#9ca3af]"/>
                </div>)}
              {(executionStatus === 'Failed' || executionStatus === 'Failure') && (<div className="w-4 h-4 rounded-full bg-[#2D2D2E] border border-red-500 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-red-500"/>
                </div>)}
            </div>)}

          {!isConfigured && !executionStatus && isNodeActive && (<div className="absolute bottom-2 right-2 z-10 animate-pulse">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-sm"></div>
                <svg width="18px" height="18px" className="text-red-500 relative z-10 drop-shadow-lg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <path fill="currentColor" fillRule="evenodd" d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM11 9a1 1 0 0 1 2 0v4a1 1 0 1 1-2 0V9zm1 8a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>)}

          {!isTrigger && (<Handle type="target" position={Position.Left} className="w-4! h-4! bg-[#5b5b5b]! border-2! border-[#2D2D2E]! rounded-full transition-[background-color,transform] duration-150 ease-out hover:bg-[#999]! hover:scale-110!"/>)}

          {!hideDefaultSourceHandle && (<Handle type="source" position={Position.Right} className="w-4! h-4! bg-[#5b5b5b]! border-2! border-[#2D2D2E]! rounded-full transition-[background-color,transform] duration-150 ease-out hover:bg-[#999]! hover:scale-110!"/>)}

          {sourceHandles?.map((handle) => (<div key={handle.id}>
              <Handle id={handle.id} type="source" position={Position.Right} style={{ top: handle.top ?? "50%" }} className="w-3! h-3! bg-[#6f6f6f]! border-2! border-[#2D2D2E]! rounded-full transition-[background-color,transform] duration-150 ease-out hover:bg-[#ddd]! hover:scale-110!"/>
              {handle.label && (<span className="absolute text-[10px] text-white/50 uppercase tracking-wide" style={{ top: handle.top ?? "50%", right: "-56px", transform: "translateY(-50%)" }}>
                  {handle.label}
                </span>)}
            </div>))}
        </div>
      </div>

      <div className="mt-3 flex flex-col items-center text-center pointer-events-none">
        <p className="text-white font-medium text-sm whitespace-nowrap">
          {label}
        </p>
        <p className="text-[#999] text-xs whitespace-nowrap">
          {subtitle}
        </p>
      </div>

      {!openNodeConfig && (<NodeConfigDialog open={configOpen} onOpenChange={setConfigOpen} nodeId={id} nodeType={nodeType} nodeData={getNodeData(id) || {}} onSave={(nodeId, data) => updateNodeData(nodeId, data)}/>)}
    </motion.div>);
}
