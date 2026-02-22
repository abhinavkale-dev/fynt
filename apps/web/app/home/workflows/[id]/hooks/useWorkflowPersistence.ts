'use client';
import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { Edge, Node } from '@xyflow/react';
import { useDebounce } from '@/hooks/use-debounce';
import { validateGraphShape } from '@/lib/workflow/graphValidation';
import { instantiateTemplateGraphPreservingCredentials } from '@/lib/templates/instantiate';
import type { WorkflowTemplate } from '@/lib/templates/types';
import type { SaveStatus } from '../components/SaveStatusIndicator';
interface WorkflowActionInput {
    id: string;
    availableActionId: string;
    metadata: Record<string, unknown>;
}
interface CreateWorkflowInput {
    id: string;
    title: string;
    availableTriggerId: string;
    triggerMetadata: Record<string, unknown>;
    actions: WorkflowActionInput[];
    nodes: Node[];
    edges: Edge[];
}
interface UpdateWorkflowInput {
    id: string;
    title?: string;
    nodes?: Node[];
    edges?: Edge[];
    triggerMetadata?: Record<string, unknown>;
    actions?: WorkflowActionInput[];
}
interface WorkflowRecord {
    id: string;
    title: string;
    nodes: unknown;
    edges: unknown;
    trigger?: {
        metadata?: unknown;
    } | null;
}
interface WorkflowCredentialReference {
    id: string;
    platform: string;
}
type CreateWorkflowMutation = {
    mutateAsync: (input: CreateWorkflowInput) => Promise<WorkflowRecord>;
    isPending: boolean;
};
type UpdateWorkflowMutation = {
    mutateAsync: (input: UpdateWorkflowInput) => Promise<unknown>;
    isPending: boolean;
};
interface WorkflowSaveSnapshot {
    title: string;
    nodes: Node[];
    edges: Edge[];
}
const AUTO_SAVE_DEBOUNCE_MS = 2000;
function buildSnapshotKey(snapshot: WorkflowSaveSnapshot): string {
    return JSON.stringify({
        title: snapshot.title,
        nodes: snapshot.nodes,
        edges: snapshot.edges,
    });
}
function sanitizeNodeForPersistence(node: Node): Node {
    const stableNode: Node = {
        id: node.id,
        type: node.type,
        position: {
            x: node.position?.x ?? 0,
            y: node.position?.y ?? 0,
        },
        data: cloneForSave(node.data ?? {}),
    };
    if (node.parentId) {
        stableNode.parentId = node.parentId;
    }
    if (node.extent !== undefined) {
        stableNode.extent = node.extent;
    }
    if (node.hidden !== undefined) {
        stableNode.hidden = node.hidden;
    }
    if (node.sourcePosition !== undefined) {
        stableNode.sourcePosition = node.sourcePosition;
    }
    if (node.targetPosition !== undefined) {
        stableNode.targetPosition = node.targetPosition;
    }
    return stableNode;
}
function sanitizeEdgeForPersistence(edge: Edge): Edge {
    const stableEdge: Edge = {
        id: edge.id,
        source: edge.source,
        target: edge.target,
    };
    if (edge.type !== undefined) {
        stableEdge.type = edge.type;
    }
    if (edge.sourceHandle !== undefined) {
        stableEdge.sourceHandle = edge.sourceHandle;
    }
    if (edge.targetHandle !== undefined) {
        stableEdge.targetHandle = edge.targetHandle;
    }
    if (edge.data !== undefined) {
        stableEdge.data = cloneForSave(edge.data);
    }
    if (edge.label !== undefined) {
        stableEdge.label = edge.label;
    }
    return stableEdge;
}
function sanitizeSnapshot(snapshot: WorkflowSaveSnapshot): WorkflowSaveSnapshot {
    return {
        title: snapshot.title,
        nodes: snapshot.nodes.map(sanitizeNodeForPersistence),
        edges: snapshot.edges.map(sanitizeEdgeForPersistence),
    };
}
function getTemplateDefaultFields(template: WorkflowTemplate | null): Record<string, Record<string, string>> {
    if (!template?.fieldRequirements)
        return {};
    const defaults: Record<string, Record<string, string>> = {};
    for (const requirement of template.fieldRequirements) {
        if (!requirement.defaultValue)
            continue;
        const nodeFields = defaults[requirement.nodeId] ?? {};
        nodeFields[requirement.field] = requirement.defaultValue;
        defaults[requirement.nodeId] = nodeFields;
    }
    return defaults;
}
function parseGraphArray<T>(value: unknown): T[] {
    if (Array.isArray(value)) {
        return value as T[];
    }
    if (value &&
        typeof value === 'object' &&
        Symbol.iterator in value &&
        typeof (value as {
            [Symbol.iterator]?: unknown;
        })[Symbol.iterator] === 'function') {
        try {
            return Array.from(value as Iterable<T>);
        }
        catch {
            void 0;
        }
    }
    if (value && typeof value === 'object') {
        const entries = Object.entries(value as Record<string, unknown>);
        const numericEntries = entries.filter(([key]) => /^\d+$/.test(key));
        if (numericEntries.length > 0) {
            return numericEntries
                .sort((a, b) => Number(a[0]) - Number(b[0]))
                .map(([, item]) => item as T);
        }
        const keyedArray = (value as Record<string, unknown>).items ??
            (value as Record<string, unknown>).values ??
            (value as Record<string, unknown>).data ??
            (value as Record<string, unknown>).nodes ??
            (value as Record<string, unknown>).edges;
        if (Array.isArray(keyedArray)) {
            return keyedArray as T[];
        }
        if (entries.length > 0 && entries.every(([key]) => Number.isInteger(Number(key)))) {
            return entries
                .sort((a, b) => Number(a[0]) - Number(b[0]))
                .map(([, item]) => item as T);
        }
    }
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return parseGraphArray<T>(parsed);
        }
        catch {
            void 0;
        }
    }
    return [];
}
function cloneForSave<T>(value: T): T {
    if (typeof structuredClone === 'function') {
        return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value)) as T;
}
function extractCredentialId(data: unknown): string | undefined {
    if (!data || typeof data !== 'object') {
        return undefined;
    }
    const credentialValue = (data as Record<string, unknown>).credentialId;
    if (typeof credentialValue !== 'string') {
        return undefined;
    }
    const trimmed = credentialValue.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}
interface UseWorkflowPersistenceParams {
    id: string;
    workflowData: WorkflowRecord | undefined;
    template: WorkflowTemplate | null;
    currentWorkflowId: string;
    setCurrentWorkflowId: Dispatch<SetStateAction<string>>;
    workflowTitle: string;
    setWorkflowTitle: Dispatch<SetStateAction<string>>;
    setTempTitle: Dispatch<SetStateAction<string>>;
    nodes: Node[];
    edges: Edge[];
    setNodes: Dispatch<SetStateAction<Node[]>>;
    setEdges: Dispatch<SetStateAction<Edge[]>>;
    onWorkflowCreated: (workflow: WorkflowRecord) => void;
    createWorkflowMutation: CreateWorkflowMutation;
    updateWorkflowMutation: UpdateWorkflowMutation;
    availableCredentials: WorkflowCredentialReference[];
    credentialsReady: boolean;
}
export function useWorkflowPersistence({ id, workflowData, template, currentWorkflowId, setCurrentWorkflowId, workflowTitle, setWorkflowTitle, setTempTitle, nodes, edges, setNodes, setEdges, onWorkflowCreated, createWorkflowMutation, updateWorkflowMutation, availableCredentials, credentialsReady, }: UseWorkflowPersistenceParams) {
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
    const [lastSaveError, setLastSaveError] = useState<string | null>(null);
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
    const [hasUserMadeChanges, setHasUserMadeChanges] = useState(false);
    const changeVersionRef = useRef(0);
    const [changeVersion, setChangeVersion] = useState(0);
    const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
    const enqueueWorkflowUpdateRef = useRef<(workflowId: string, snapshot: WorkflowSaveSnapshot, saveVersion: number) => Promise<void>>(async () => { });
    const lastValidGraphRef = useRef<Pick<WorkflowSaveSnapshot, 'nodes' | 'edges'> | null>(null);
    const lastPersistedSnapshotKeyRef = useRef<string | null>(null);
    const attemptedGraphRepairRef = useRef<Set<string>>(new Set());
    const [showTemplateSetup, setShowTemplateSetup] = useState(false);
    const [templateSetupDismissed, setTemplateSetupDismissed] = useState(false);
    const [graphRecoveryNotice, setGraphRecoveryNotice] = useState<string | null>(null);
    const [graphIntegrityError, setGraphIntegrityError] = useState<string | null>(null);
    const debouncedNodes = useDebounce(nodes, AUTO_SAVE_DEBOUNCE_MS);
    const debouncedEdges = useDebounce(edges, AUTO_SAVE_DEBOUNCE_MS);
    const debouncedTitle = useDebounce(workflowTitle, AUTO_SAVE_DEBOUNCE_MS);
    const debouncedChangeVersion = useDebounce(changeVersion, AUTO_SAVE_DEBOUNCE_MS);
    const availableCredentialIds = useMemo(() => new Set(availableCredentials.map((credential) => credential.id)), [availableCredentials]);
    const credentialIdsByPlatform = useMemo(() => {
        const byPlatform = new Map<string, Set<string>>();
        for (const credential of availableCredentials) {
            const platform = credential.platform.toLowerCase();
            const existing = byPlatform.get(platform);
            if (existing) {
                existing.add(credential.id);
                continue;
            }
            byPlatform.set(platform, new Set([credential.id]));
        }
        return byPlatform;
    }, [availableCredentials]);
    const templateBindingPlatformByNodeId = useMemo(() => {
        const byNodeId = new Map<string, string>();
        if (!template) {
            return byNodeId;
        }
        for (const binding of template.requiredBindings) {
            const platform = binding.platform.toLowerCase();
            for (const nodeId of binding.nodeIds) {
                if (!byNodeId.has(nodeId)) {
                    byNodeId.set(nodeId, platform);
                }
            }
        }
        return byNodeId;
    }, [template]);
    const isTemplateNodeCredentialValid = useCallback((nodeId: string, credentialId: string | undefined): boolean => {
        if (!credentialId) {
            return false;
        }
        const normalizedCredentialId = credentialId.trim();
        if (!normalizedCredentialId) {
            return false;
        }
        const requiredPlatform = templateBindingPlatformByNodeId.get(nodeId);
        if (requiredPlatform) {
            const platformCredentialIds = credentialIdsByPlatform.get(requiredPlatform);
            return Boolean(platformCredentialIds?.has(normalizedCredentialId));
        }
        return availableCredentialIds.has(normalizedCredentialId);
    }, [templateBindingPlatformByNodeId, credentialIdsByPlatform, availableCredentialIds]);
    const markWorkflowChanged = useCallback(() => {
        const nextVersion = changeVersionRef.current + 1;
        changeVersionRef.current = nextVersion;
        setChangeVersion(nextVersion);
        setHasUserMadeChanges(true);
        setSaveStatus('unsaved');
    }, []);
    const finalizeSaveState = useCallback((savedVersion: number) => {
        const hasNewerChanges = changeVersionRef.current !== savedVersion;
        setHasUserMadeChanges(hasNewerChanges);
        setSaveStatus(hasNewerChanges ? 'unsaved' : 'saved');
    }, []);
    const enqueueWorkflowUpdate = useCallback(async (workflowId: string, snapshot: WorkflowSaveSnapshot, saveVersion: number) => {
        const queuedSnapshot = sanitizeSnapshot({
            title: snapshot.title,
            nodes: cloneForSave(snapshot.nodes),
            edges: cloneForSave(snapshot.edges),
        });
        const validation = validateGraphShape(queuedSnapshot.nodes as Array<{
            id?: unknown;
        }>, queuedSnapshot.edges as Array<{
            source?: unknown;
            target?: unknown;
        }>);
        const isTemplateGraphEmpty = Boolean(template && queuedSnapshot.nodes.length === 0);
        if (!validation.isValid || isTemplateGraphEmpty) {
            const fallbackGraph = lastValidGraphRef.current;
            const validationErrorMessage = !validation.isValid
                ? validation.errors.join(' ')
                : 'Template workflow graph cannot be empty.';
            if (fallbackGraph) {
                queuedSnapshot.nodes = cloneForSave(fallbackGraph.nodes);
                queuedSnapshot.edges = cloneForSave(fallbackGraph.edges);
                setSaveStatus('error');
                setLastSaveError(`Invalid workflow graph snapshot was blocked. Reverted to last valid graph. ${validationErrorMessage}`);
            }
            else {
                setSaveStatus('error');
                setLastSaveError(`Invalid workflow graph snapshot was blocked. ${validationErrorMessage}`);
                return;
            }
        }
        const snapshotKey = buildSnapshotKey(queuedSnapshot);
        if (lastPersistedSnapshotKeyRef.current === snapshotKey) {
            finalizeSaveState(saveVersion);
            return;
        }
        const runSave = () => {
            if (workflowId === 'new')
                return Promise.resolve();
            setLastSaveError(null);
            setSaveStatus('saved');
            lastValidGraphRef.current = {
                nodes: cloneForSave(queuedSnapshot.nodes),
                edges: cloneForSave(queuedSnapshot.edges),
            };
            lastPersistedSnapshotKeyRef.current = snapshotKey;
            finalizeSaveState(saveVersion);
            return updateWorkflowMutation.mutateAsync({
                id: workflowId,
                title: queuedSnapshot.title,
                nodes: queuedSnapshot.nodes,
                edges: queuedSnapshot.edges,
            }).then(() => {}, (err: unknown) => {
                console.error('Workflow save failed:', err);
                setSaveStatus('error');
                setLastSaveError(err instanceof Error ? err.message : 'Failed to save');
            });
        };
        saveQueueRef.current = saveQueueRef.current
            .catch(() => {})
            .then(runSave);
    }, [updateWorkflowMutation, finalizeSaveState, template]);
    useEffect(() => {
        enqueueWorkflowUpdateRef.current = enqueueWorkflowUpdate;
    }, [enqueueWorkflowUpdate]);
    const handleAutoSave = useCallback(async () => {
        if (currentWorkflowId === 'new')
            return;
        if (createWorkflowMutation.isPending)
            return;
        if (debouncedChangeVersion !== changeVersionRef.current)
            return;
        const saveVersion = changeVersionRef.current;
        await enqueueWorkflowUpdate(currentWorkflowId, {
            title: debouncedTitle,
            nodes: debouncedNodes,
            edges: debouncedEdges,
        }, saveVersion);
    }, [
        currentWorkflowId,
        createWorkflowMutation,
        debouncedChangeVersion,
        debouncedTitle,
        debouncedNodes,
        debouncedEdges,
        enqueueWorkflowUpdate,
    ]);
    const handleImmediateSave = useCallback(async (overrides?: {
        nodes?: Node[];
        edges?: Edge[];
        title?: string;
    }) => {
        if (currentWorkflowId === 'new')
            return;
        const saveVersion = changeVersionRef.current;
        await enqueueWorkflowUpdate(currentWorkflowId, {
            title: overrides?.title ?? workflowTitle,
            nodes: overrides?.nodes ?? nodes,
            edges: overrides?.edges ?? edges,
        }, saveVersion);
    }, [currentWorkflowId, workflowTitle, nodes, edges, enqueueWorkflowUpdate]);
    const handleManualSave = useCallback(async () => {
        try {
            setSaveStatus('saving');
            setLastSaveError(null);
            const sanitizedCurrentSnapshot = sanitizeSnapshot({
                title: workflowTitle,
                nodes,
                edges,
            });
            const graphValidation = validateGraphShape(nodes as Array<{
                id?: unknown;
            }>, edges as Array<{
                source?: unknown;
                target?: unknown;
            }>);
            if (!graphValidation.isValid) {
                throw new Error(`Cannot save invalid graph. ${graphValidation.errors.join(' ')}`);
            }
            if (currentWorkflowId === 'new') {
                const newWorkflow = await createWorkflowMutation.mutateAsync({
                    id: crypto.randomUUID(),
                    title: workflowTitle,
                    availableTriggerId: 'manual',
                    triggerMetadata: {},
                    actions: [],
                    nodes: sanitizedCurrentSnapshot.nodes,
                    edges: sanitizedCurrentSnapshot.edges,
                });
                onWorkflowCreated(newWorkflow);
                setCurrentWorkflowId(newWorkflow.id);
                lastValidGraphRef.current = {
                    nodes: cloneForSave(sanitizedCurrentSnapshot.nodes),
                    edges: cloneForSave(sanitizedCurrentSnapshot.edges),
                };
                lastPersistedSnapshotKeyRef.current = buildSnapshotKey(sanitizedCurrentSnapshot);
                setHasLoadedInitialData(true);
                setSaveStatus('saved');
                setHasUserMadeChanges(false);
                changeVersionRef.current = 0;
                setChangeVersion(0);
            }
            else {
                const saveVersion = changeVersionRef.current;
                await updateWorkflowMutation.mutateAsync({
                    id: currentWorkflowId,
                    title: workflowTitle,
                    nodes: sanitizedCurrentSnapshot.nodes,
                    edges: sanitizedCurrentSnapshot.edges,
                });
                lastValidGraphRef.current = {
                    nodes: cloneForSave(sanitizedCurrentSnapshot.nodes),
                    edges: cloneForSave(sanitizedCurrentSnapshot.edges),
                };
                lastPersistedSnapshotKeyRef.current = buildSnapshotKey(sanitizedCurrentSnapshot);
                finalizeSaveState(saveVersion);
            }
        }
        catch (err) {
            console.error('Failed to save workflow:', err);
            setSaveStatus('error');
            setLastSaveError(err instanceof Error ? err.message : 'Failed to save');
        }
    }, [
        currentWorkflowId,
        createWorkflowMutation,
        workflowTitle,
        nodes,
        edges,
        onWorkflowCreated,
        setCurrentWorkflowId,
        updateWorkflowMutation,
        finalizeSaveState,
    ]);
    useEffect(() => {
        setCurrentWorkflowId((previousWorkflowId) => previousWorkflowId === id ? previousWorkflowId : id);
        if (id === 'new') {
            setNodes([]);
            setEdges([]);
            setWorkflowTitle('Untitled Workflow');
            setTempTitle('Untitled Workflow');
            setGraphRecoveryNotice(null);
            setGraphIntegrityError(null);
            lastValidGraphRef.current = {
                nodes: [],
                edges: [],
            };
            lastPersistedSnapshotKeyRef.current = buildSnapshotKey({
                title: 'Untitled Workflow',
                nodes: [],
                edges: [],
            });
            setHasLoadedInitialData(true);
            changeVersionRef.current = 0;
            setChangeVersion(0);
        }
        else if (workflowData) {
            if (workflowData.id !== id) {
                return;
            }
            if (hasLoadedInitialData && currentWorkflowId === workflowData.id) {
                return;
            }
            const workflowNodes = parseGraphArray<Node>(workflowData.nodes);
            const workflowEdges = parseGraphArray<Edge>(workflowData.edges);
            let snapshotNodesForKey = workflowNodes;
            let snapshotEdgesForKey = workflowEdges;
            const graphValidation = validateGraphShape(workflowNodes as Array<{
                id?: unknown;
            }>, workflowEdges as Array<{
                source?: unknown;
                target?: unknown;
            }>);
            const hasCorruptGraph = Boolean(template) && workflowNodes.length === 0;
            if (hasCorruptGraph && template) {
                const attemptedRepair = attemptedGraphRepairRef.current.has(workflowData.id);
                const repairedGraph = instantiateTemplateGraphPreservingCredentials(template, workflowNodes, undefined, getTemplateDefaultFields(template));
                setNodes(repairedGraph.nodes);
                setEdges(repairedGraph.edges);
                setGraphIntegrityError(null);
                setGraphRecoveryNotice('Workflow graph was repaired automatically.');
                lastValidGraphRef.current = {
                    nodes: cloneForSave(repairedGraph.nodes),
                    edges: cloneForSave(repairedGraph.edges),
                };
                snapshotNodesForKey = repairedGraph.nodes;
                snapshotEdgesForKey = repairedGraph.edges;
                if (!attemptedRepair) {
                    attemptedGraphRepairRef.current.add(workflowData.id);
                    const nextVersion = changeVersionRef.current + 1;
                    changeVersionRef.current = nextVersion;
                    setChangeVersion(nextVersion);
                    setHasUserMadeChanges(true);
                    void enqueueWorkflowUpdateRef.current(workflowData.id, {
                        title: workflowData.title,
                        nodes: repairedGraph.nodes,
                        edges: repairedGraph.edges,
                    }, nextVersion);
                }
            }
            else {
                setNodes(workflowNodes);
                setEdges(workflowEdges);
                setGraphRecoveryNotice(null);
                if (!graphValidation.isValid) {
                    setGraphIntegrityError(`Workflow graph is invalid. ${graphValidation.errors.join(' ')}`);
                }
                else {
                    setGraphIntegrityError(null);
                    lastValidGraphRef.current = {
                        nodes: cloneForSave(workflowNodes),
                        edges: cloneForSave(workflowEdges),
                    };
                }
            }
            setWorkflowTitle(workflowData.title);
            setTempTitle(workflowData.title);
            const sanitizedLoadedSnapshot = sanitizeSnapshot({
                title: workflowData.title,
                nodes: snapshotNodesForKey,
                edges: snapshotEdgesForKey,
            });
            lastPersistedSnapshotKeyRef.current = buildSnapshotKey(sanitizedLoadedSnapshot);
            setSaveStatus('saved');
            setHasLoadedInitialData(true);
            if (!(hasCorruptGraph && template)) {
                changeVersionRef.current = 0;
                setChangeVersion(0);
            }
        }
    }, [
        id,
        workflowData,
        template,
        hasLoadedInitialData,
        currentWorkflowId,
        setNodes,
        setEdges,
        setWorkflowTitle,
        setTempTitle,
        setCurrentWorkflowId,
    ]);
    useEffect(() => {
        if (!workflowData || !template || template.requiredBindings.length === 0)
            return;
        if (workflowData.id !== id)
            return;
        if (!credentialsReady)
            return;
        if (templateSetupDismissed)
            return;
        const nodeById = new Map(nodes.map((node) => [node.id, node]));
        const hasMissingCredentials = template.requiredBindings.some((binding) => binding.nodeIds.some((nodeId) => {
            const node = nodeById.get(nodeId);
            if (!node)
                return false;
            const credentialId = extractCredentialId(node.data);
            return !isTemplateNodeCredentialValid(nodeId, credentialId);
        }));
        const hasMissingRequiredFields = (template.fieldRequirements ?? []).some((fieldRequirement) => {
            if (!fieldRequirement.required)
                return false;
            const node = nodeById.get(fieldRequirement.nodeId);
            if (!node)
                return false;
            const nodeData = node.data && typeof node.data === 'object'
                ? (node.data as Record<string, unknown>)
                : {};
            const value = nodeData[fieldRequirement.field];
            if (typeof value === 'string') {
                return value.trim().length === 0;
            }
            return value === undefined || value === null;
        });
        if (hasMissingCredentials || hasMissingRequiredFields) {
            setShowTemplateSetup(true);
        }
    }, [workflowData, id, template, nodes, templateSetupDismissed, credentialsReady, isTemplateNodeCredentialValid]);
    useEffect(() => {
        setTemplateSetupDismissed(false);
    }, [workflowData?.id]);
    useEffect(() => {
        if (!hasLoadedInitialData)
            return;
        if (currentWorkflowId === 'new')
            return;
        if (!hasUserMadeChanges)
            return;
        handleAutoSave();
    }, [
        debouncedNodes,
        debouncedEdges,
        debouncedTitle,
        hasLoadedInitialData,
        currentWorkflowId,
        hasUserMadeChanges,
        handleAutoSave,
    ]);
    useEffect(() => {
        setHasLoadedInitialData(false);
        setSaveStatus('saved');
        setLastSaveError(null);
        setHasUserMadeChanges(false);
        setGraphRecoveryNotice(null);
        setGraphIntegrityError(null);
        setTemplateSetupDismissed(false);
        lastPersistedSnapshotKeyRef.current = null;
        changeVersionRef.current = 0;
        setChangeVersion(0);
    }, [id]);
    useEffect(() => {
        return () => {
            setIsAutoSaving(false);
            saveQueueRef.current = Promise.resolve();
        };
    }, []);
    return {
        saveStatus,
        lastSaveError,
        isAutoSaving,
        isCreateWorkflowPending: createWorkflowMutation.isPending,
        isUpdateWorkflowPending: updateWorkflowMutation.isPending,
        showTemplateSetup,
        setShowTemplateSetup,
        setTemplateSetupDismissed,
        graphRecoveryNotice,
        graphIntegrityError,
        markWorkflowChanged,
        handleImmediateSave,
        handleManualSave,
    };
}
