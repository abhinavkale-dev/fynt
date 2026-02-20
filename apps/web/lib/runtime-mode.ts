export type FyntRuntimeMode = 'full' | 'web-only';

const FYNT_RUNTIME_MODE_VALUES = new Set<FyntRuntimeMode>(['full', 'web-only']);

function parseRuntimeMode(value: string | undefined): FyntRuntimeMode | null {
    if (!value) {
        return null;
    }

    const normalized = value.trim().toLowerCase();
    if (FYNT_RUNTIME_MODE_VALUES.has(normalized as FyntRuntimeMode)) {
        return normalized as FyntRuntimeMode;
    }

    return null;
}

export function getClientRuntimeMode(): FyntRuntimeMode {
    const configuredRuntimeMode = parseRuntimeMode(process.env.NEXT_PUBLIC_FYNT_RUNTIME_MODE);
    if (configuredRuntimeMode) {
        return configuredRuntimeMode;
    }

    return process.env.NODE_ENV === 'production' ? 'web-only' : 'full';
}

export function isExecutionBlockedInClientRuntime(): boolean {
    return getClientRuntimeMode() === 'web-only';
}
