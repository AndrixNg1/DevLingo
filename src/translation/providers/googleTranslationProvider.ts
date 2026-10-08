import { v2 } from '@google-cloud/translate';
import type { TranslateRequest } from '@google-cloud/translate/build/src/v2';
import { languages } from '../../config/languages';
import { TranslationError } from '../translationError';
import type { TranslationOptions, TranslationProvider } from '../types';

/** Only the Basic v2 text API is exposed to the provider and its offline tests. */
export interface GoogleTranslationClient {
    translate(text: string, options: TranslateRequest): Promise<[string, unknown?]>;
}

export class GoogleTranslationProvider implements TranslationProvider {
    private readonly client: GoogleTranslationClient;

    constructor(options: { apiKey: string }, client?: GoogleTranslationClient) {
        const apiKey = options.apiKey.trim();
        if (!apiKey) {
            throw new TranslationError('DevLingo: Google Cloud Translation requires an API key.');
        }
        if (client) {
            this.client = client;
        } else {
            const sdk = new v2.Translate({ key: apiKey, autoRetry: false, maxRetries: 0 });
            // The SDK honours an endpoint environment variable; BYOK stays on Google's endpoint.
            sdk.baseUrl = 'https://translation.googleapis.com/language/translate/v2';
            this.client = sdk;
        }
    }

    async translate(text: string, options: TranslationOptions): Promise<string> {
        if (!text.trim()) {
            return text;
        }
        const target = options.targetLanguage.trim().toLowerCase();
        if (!languages.some(language => language.code === target)) {
            throw new TranslationError('DevLingo: Google Cloud Translation target language is not supported.');
        }
        const source = options.sourceLanguage?.trim().toLowerCase();
        const request: TranslateRequest = { to: target, format: 'text' };
        if (source && source !== 'auto') {
            if (!/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/.test(source)) {
                throw new TranslationError('DevLingo: Google Cloud Translation source language is not supported.');
            }
            request.from = source;
        }
        let result;
        try {
            result = await this.client.translate(text, request);
        } catch (error) {
            throw mapGoogleError(error);
        }
        const translation = result?.[0];
        if (typeof translation !== 'string' || !translation.trim()) {
            throw new TranslationError('DevLingo: Google Cloud Translation returned an empty translation.');
        }
        return translation;
    }
}

function record(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
}

function mapGoogleError(error: unknown): TranslationError {
    const details = record(error);
    const response = record(details.response);
    let payload: unknown = response.body ?? response.data;
    if (typeof payload === 'string') {
        try {
            payload = JSON.parse(payload);
        } catch {
            payload = undefined;
        }
    }
    const body = record(record(payload).error);
    const code = details.code ?? details.statusCode ?? response.statusCode ?? response.status ?? body.code ?? record(details.cause).code;
    const reasons = new Set<string>();
    const collect = (items: unknown) => {
        if (Array.isArray(items)) {
            for (const item of items) {
                const reason = record(item).reason;
                if (typeof reason === 'string') {
                    reasons.add(reason);
                }
            }
        }
    };
    collect(details.errors); collect(details.details); collect(body.errors); collect(body.details);
    let message = 'DevLingo: Google Cloud Translation failed. Try again later.';
    if (reasons.has('keyInvalid') || reasons.has('API_KEY_INVALID') || code === 401) {
        message = 'DevLingo: Google Cloud Translation authentication failed. Check your API key.';
    } else if (['accessNotConfigured', 'SERVICE_DISABLED', 'BILLING_DISABLED', 'billingNotActive', 'API_KEY_SERVICE_BLOCKED', 'API_KEY_HTTP_REFERRER_BLOCKED', 'API_KEY_IP_ADDRESS_BLOCKED', 'ipRefererBlocked'].some(reason => reasons.has(reason))) {
        message = 'DevLingo: Google Cloud Translation is not configured correctly. Check API access, key restrictions and billing in Google Cloud.';
    } else if (['dailyLimitExceeded', 'quotaExceeded', 'RESOURCE_EXHAUSTED', 'QUOTA_EXCEEDED'].some(reason => reasons.has(reason))) {
        message = 'DevLingo: Google Cloud Translation quota exceeded.';
    } else if (code === 429 || ['rateLimitExceeded', 'userRateLimitExceeded', 'RATE_LIMIT_EXCEEDED'].some(reason => reasons.has(reason))) {
        message = 'DevLingo: Google Cloud Translation rate limit reached. Try again later.';
    } else if (['ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENETUNREACH', 'EHOSTUNREACH', 'UND_ERR_CONNECT_TIMEOUT'].includes(String(code))) {
        message = 'DevLingo: Unable to reach Google Cloud Translation.';
    } else if (code === 403) {
        message = 'DevLingo: Google Cloud Translation access denied. Check API access, key restrictions and billing in Google Cloud.';
    } else if (code === 400) {
        message = 'DevLingo: Google Cloud Translation rejected the translation language or request.';
    } else if (typeof code === 'number' && code >= 500) {
        message = 'DevLingo: Google Cloud Translation API is unavailable. Try again later.';
    }
    return new TranslationError(message);
}
