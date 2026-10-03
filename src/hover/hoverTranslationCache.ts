import type { TranslationService } from '../translation/translationService';

/** Shares pending requests too; failures are evicted so the next hover can retry. */
export class HoverTranslationCache {
    private readonly entries = new Map<string, Promise<string>>();

    constructor(private readonly service: TranslationService, private readonly capacity = 100) {}

    translate(text: string, targetLanguage: string): Promise<string> {
        const key = JSON.stringify([text, targetLanguage]);
        const existing = this.entries.get(key);
        if (existing) {
            return existing;
        }
        const request = this.service.translate(text, { targetLanguage }).catch(error => {
            if (this.entries.get(key) === request) {
                this.entries.delete(key);
            }
            throw error;
        });
        this.entries.set(key, request);
        if (this.entries.size > this.capacity) {
            const oldest = this.entries.keys().next().value;
            if (oldest !== undefined) {
                this.entries.delete(oldest);
            }
        }
        return request;
    }
}
