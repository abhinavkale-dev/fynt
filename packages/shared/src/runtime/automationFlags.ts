export type FyntRuntimeMode = 'full' | 'web-only';

const FYNT_RUNTIME_MODE_VALUES = new Set<FyntRuntimeMode>(['full', 'web-only']);

function isProductionRuntime(): boolean {
    return process.env.NODE_ENV === 'production';
}

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

function isProductionAutomationExplicitlyEnabled(): boolean {
    return process.env.FYNT_ENABLE_AUTOMATION_IN_PRODUCTION === 'true';
}

export function getFyntRuntimeMode(): FyntRuntimeMode {
    const configuredRuntimeMode = parseRuntimeMode(process.env.FYNT_RUNTIME_MODE);
    if (configuredRuntimeMode) {
        return configuredRuntimeMode;
    }

    return isProductionRuntime() ? 'web-only' : 'full';
}

export function isWebOnlyRuntimeMode(): boolean {
    return getFyntRuntimeMode() === 'web-only';
}

export function isExecutionDisabledForRuntime(): boolean {
    return isWebOnlyRuntimeMode();
}

export function isAutomationDisabledInProduction(): boolean {
    if (isWebOnlyRuntimeMode()) {
        return true;
    }

    if (!isProductionRuntime()) {
        return false;
    }

    return !isProductionAutomationExplicitlyEnabled();
}

export function isWorkflowSourceDisabledInProduction(source: string | null | undefined): boolean {
    if (!isAutomationDisabledInProduction()) {
        return false;
    }
    return source === 'webhook' || source === 'cron';
}
