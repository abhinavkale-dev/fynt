import { parseTemplate } from '@repo/shared/parser';
import type { ConditionNodeData, NodeExecutionOutput } from '../../engine/types/index.js';
import type { ExecutionMode } from '../../engine/executor.js';
interface Rule {
    route: string;
    operator: 'equals' | 'contains' | 'not_equals';
    value: string;
}
function parseRules(data: ConditionNodeData): Rule[] {
    if (Array.isArray(data.rules)) {
        return data.rules.filter((rule) => typeof rule.route === 'string' &&
            typeof rule.operator === 'string' &&
            typeof rule.value === 'string') as Rule[];
    }
    if (typeof data.rulesJson === 'string' && data.rulesJson.trim().length > 0) {
        try {
            const parsed = JSON.parse(data.rulesJson);
            if (Array.isArray(parsed)) {
                return parsed.filter((rule) => rule &&
                    typeof rule.route === 'string' &&
                    typeof rule.operator === 'string' &&
                    typeof rule.value === 'string') as Rule[];
            }
        }
        catch {
            return [];
        }
    }
    return [];
}
function matchesRule(value: string, rule: Rule): boolean {
    const comparison = rule.value;
    switch (rule.operator) {
        case 'equals':
            return value === comparison;
        case 'not_equals':
            return value !== comparison;
        case 'contains':
            return value.includes(comparison);
        default:
            return false;
    }
}
export async function executeConditionNode(data: ConditionNodeData, runMetadata: Record<string, NodeExecutionOutput>, _executionMode: ExecutionMode = 'legacy'): Promise<NodeExecutionOutput> {
    const expression = typeof data.expression === 'string' ? data.expression : '';
    const resolvedValue = parseTemplate(expression, runMetadata as Record<string, string>);
    const rules = parseRules(data);
    let selectedRoute = typeof data.defaultRoute === 'string' && data.defaultRoute.trim().length > 0
        ? data.defaultRoute.trim()
        : 'default';
    let matchedRule: Rule | null = null;
    for (const rule of rules) {
        if (matchesRule(resolvedValue, rule)) {
            selectedRoute = rule.route;
            matchedRule = rule;
            break;
        }
    }
    return {
        route: selectedRoute,
        value: resolvedValue,
        ...(matchedRule
            ? {
                matchedRule: {
                    route: matchedRule.route,
                    operator: matchedRule.operator,
                    value: matchedRule.value,
                },
            }
            : {}),
        evaluatedAt: new Date().toISOString(),
    };
}
