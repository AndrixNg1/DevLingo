import type { SourceLanguageCode, TargetLanguageCode } from 'deepl-node';
import { languages } from '../../config/languages';
import { TranslationError } from '../translationError';

/** Only DeepL's English target needs a variant; other targets reuse the registry codes. */
export function getDeepLTargetLanguage(code: string): TargetLanguageCode {
    const normalized = code.trim().toLowerCase();
    const language = languages.find(language => language.code === normalized);
    if (!language) {
        throw new TranslationError('DevLingo: DeepL target language is not supported.');
    }
    return language.code === 'en' ? 'en-US' : language.code;
}

export function getDeepLSourceLanguage(code?: string): SourceLanguageCode | null {
    const normalized = code?.trim().toLowerCase();
    if (!normalized || normalized === 'auto') {
        return null;
    }
    if (!/^[a-z]{2,3}$/.test(normalized)) {
        throw new TranslationError('DevLingo: DeepL source language is not supported.');
    }
    // DeepL validates concrete source codes; no duplicated catalogue or discovery request.
    return normalized as SourceLanguageCode;
}
