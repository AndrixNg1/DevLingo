import type { TranslationOptions, TranslationProvider } from '../../translation/types';

/** Deterministic test fixture; never registered as an extension provider. */
export class FixtureTranslationProvider implements TranslationProvider {
    async translate(text: string, options: TranslationOptions): Promise<string> {
        return `[${options.targetLanguage}] ${text}`;
    }
}
