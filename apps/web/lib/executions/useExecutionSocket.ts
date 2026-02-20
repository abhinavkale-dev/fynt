"use client";
import { useEffect, useState } from "react";
import { subscribeToExecutionRun, type ExecutionSocketEvent, } from "./executionSocketClient";
interface UseExecutionSocketOptions {
    runId: string | null | undefined;
    enabled?: boolean;
    onEvent?: (event: ExecutionSocketEvent) => void;
}
interface UseExecutionSocketResult {
    isConnected: boolean;
}
export function useExecutionSocket({ runId, enabled = true, onEvent, }: UseExecutionSocketOptions): UseExecutionSocketResult {
    const [isConnected, setIsConnected] = useState(false);
    useEffect(() => {
        if (!enabled || !runId) {
            setIsConnected(false);
            return;
        }
        const unsubscribe = subscribeToExecutionRun(runId, (event) => {
            if (event.type === "socket") {
                if (event.status === "connected")
                    setIsConnected(true);
                if (event.status === "disconnected")
                    setIsConnected(false);
            }
            else if (event.type === "connected") {
                setIsConnected(true);
            }
            onEvent?.(event);
        });
        return () => {
            unsubscribe();
            setIsConnected(false);
        };
    }, [runId, enabled, onEvent]);
    return { isConnected };
}
