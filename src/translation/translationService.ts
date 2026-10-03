import type { TranslationOptions, TranslationProvider } from './types';

export class TranslationService {
    constructor(private readonly provider: TranslationProvider) {}

    async translate(text: string, options: TranslationOptions): Promise<string> {
        if (text.trim().length === 0) {
            return text;
        }
        return this.provider.translate(text, options);
    }
}
