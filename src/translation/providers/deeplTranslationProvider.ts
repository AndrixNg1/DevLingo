import * as deepl from 'deepl-node';
import type { TranslationOptions, TranslationProvider } from '../types';
import { TranslationError } from '../translationError';
import { getDeepLSourceLanguage, getDeepLTargetLanguage } from './deeplLanguages';

/** Text-only SDK surface for offline tests; credentials and VS Code remain outside it. */
export interface DeepLTranslationClient {
    translateText(text: string, sourceLanguage: deepl.SourceLanguageCode | null,
        targetLanguage: deepl.TargetLanguageCode, options: deepl.TranslateTextOptions): Promise<{ text: string }>;
}

export class DeepLTranslationProvider implements TranslationProvider {
    private readonly client: DeepLTranslationClient;

    constructor(options: { apiKey: string }, client?: DeepLTranslationClient) {
        const apiKey = options.apiKey.trim();
        if (!apiKey) {
            throw new TranslationError('DevLingo: DeepL requires an API key.');
        }
        this.client = client ?? new deepl.DeepLClient(apiKey, {
            maxRetries: 0,
            minTimeout: 30000,
            sendPlatformInfo: false,
        });
    }

    async translate(text: string, options: TranslationOptions): Promise<string> {
        if (!text.trim()) {
            return text;
        }
        const sourceLanguage = getDeepLSourceLanguage(options.sourceLanguage);
        const targetLanguage = getDeepLTargetLanguage(options.targetLanguage);
        let result;
        try {
            result = await this.client.translateText(text, sourceLanguage, targetLanguage, { preserveFormatting: true });
        } catch (error) {
            throw mapDeepLError(error);
        }
        if (typeof result?.text !== 'string' || !result.text.trim()) {
            throw new TranslationError('DevLingo: DeepL returned an empty translation.');
        }
        return result.text;
    }
}

function mapDeepLError(error: unknown): TranslationError {
    let message = 'DevLingo: DeepL translation failed. Try again later.';
    if (error instanceof deepl.AuthorizationError) {
        message = 'DevLingo: DeepL authentication failed. Check your API key.';
    } else if (error instanceof deepl.QuotaExceededError) {
        message = 'DevLingo: DeepL usage limit reached.';
    } else if (error instanceof deepl.TooManyRequestsError) {
        message = 'DevLingo: DeepL rate limit reached. Try again later.';
    } else if (error instanceof deepl.ConnectionError) {
        message = 'DevLingo: Unable to reach DeepL.';
    } else if (error instanceof deepl.ArgumentError) {
        message = 'DevLingo: DeepL rejected the translation language or request.';
    } else if (error instanceof deepl.DeepLError) {
        // The SDK uses base DeepLError for HTTP 400/5xx, without structured status fields.
        if (error.message.startsWith('Bad request')) {
            message = 'DevLingo: DeepL rejected the translation language or request.';
        } else if (error.message.startsWith('Service unavailable') || /^Unexpected status code: 5\d\d\b/.test(error.message)) {
            message = 'DevLingo: DeepL service is unavailable. Try again later.';
        }
    }
    return new TranslationError(message);
}
