import { uniqueNamesGenerator, adjectives, animals } from 'unique-names-generator';
export function generateWorkflowName(): string {
    return uniqueNamesGenerator({
        dictionaries: [adjectives, adjectives, animals],
        separator: '-',
        length: 3,
        style: 'lowerCase'
    });
}
