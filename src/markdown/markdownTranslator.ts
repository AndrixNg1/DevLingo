import type { TranslationService } from '../translation/translationService';
import { TranslationCache } from '../translation/translationCache';
import { getTranslatableRanges } from './markdownTextRanges';

export class MarkdownTranslator {
    private readonly cache: TranslationCache;

    constructor(service: TranslationService) {
        this.cache = new TranslationCache(service);
    }

    async translateMarkdown(content: string, targetLanguage: string): Promise<string> {
        if (!content.trim()) {
            return content;
        }
        const ranges = await getTranslatableRanges(content);
        let output = '';
        let cursor = 0;
        for (const { start, end } of ranges) {
            const translated = await this.cache.translate(content.slice(start, end), targetLanguage);
            output += content.slice(cursor, start) + escapeText(translated);
            cursor = end;
        }
        return output + content.slice(cursor);
    }
}

/** Treat provider output as prose, preventing it from introducing Markdown constructs. */
function escapeText(text: string): string {
    return text.trim().replace(/[\r\n]+/g, ' ').replace(/([\\`*_[\]<>|~])/g, '\\$1')
        .replace(/^([#+\-])/, '\\$1')
        .replace(/^(\d+)([.)])(?=\s)/, '$1\\$2');
}
