export interface ParseResult {
    output: string;
    missingVars?: string[];
    hasSubstitutions?: boolean;
}
const TEMPLATE_PATH_PATTERN = /^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/;
interface ParsedTemplateToken {
    useJson: boolean;
    lookupKey: string;
}
function parseTemplateToken(rawKey: string, startDelimiter: string, endDelimiter: string): ParsedTemplateToken | null {
    const trimmed = rawKey.trim();
    if (!trimmed)
        return null;
    let useJson = false;
    let lookupKey = trimmed;
    if (trimmed.startsWith('json ')) {
        useJson = true;
        lookupKey = trimmed.slice(5).trim();
    }
    if (!lookupKey)
        return null;
    if (lookupKey.includes(startDelimiter) || lookupKey.includes(endDelimiter))
        return null;
    if (!TEMPLATE_PATH_PATTERN.test(lookupKey))
        return null;
    return { useJson, lookupKey };
}
export function parseTemplateWithMetadata(template: string, values: Record<string, any>, startDelimiter = '{', endDelimiter = '}'): ParseResult {
    if (typeof template !== 'string') {
        return { output: String(template) };
    }
    let result = '';
    let i = 0;
    const missingVars: string[] = [];
    let hasSubstitutions = false;
    while (i < template.length) {
        if (template[i] === startDelimiter) {
            let j = i + 1;
            while (j < template.length && template[j] !== endDelimiter) {
                j++;
            }
            if (j < template.length) {
                const key = template.slice(i + 1, j);
                const token = parseTemplateToken(key, startDelimiter, endDelimiter);
                if (!token) {
                    result += template[i];
                    i++;
                    continue;
                }
                hasSubstitutions = true;
                const { useJson, lookupKey } = token;
                const keys = lookupKey.split('.');
                let value: any = values;
                for (const k of keys) {
                    if (value && typeof value === 'object') {
                        value = value[k];
                    }
                    else {
                        value = undefined;
                        break;
                    }
                }
                if (value !== undefined && value !== null) {
                    result += useJson ? JSON.stringify(value) : String(value);
                }
                else {
                    missingVars.push(lookupKey);
                    result += '';
                }
                i = j + 1;
            }
            else {
                result += template[i];
                i++;
            }
        }
        else {
            result += template[i];
            i++;
        }
    }
    const parseResult: ParseResult = {
        output: result,
        hasSubstitutions
    };
    if (missingVars.length > 0) {
        parseResult.missingVars = missingVars;
    }
    return parseResult;
}
export function parseTemplate(template: string, values: Record<string, any>, startDelimiter = '{', endDelimiter = '}'): string {
    return parseTemplateWithMetadata(template, values, startDelimiter, endDelimiter).output;
}
