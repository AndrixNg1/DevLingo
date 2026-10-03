import type { TranslationOptions, TranslationProvider } from '../types';

/** Temporary development provider; performs no real translation. */
export class MockTranslationProvider implements TranslationProvider {
    async translate(text: string, options: TranslationOptions): Promise<string> {
        return `[${options.targetLanguage}] ${text}`;
    }
}
