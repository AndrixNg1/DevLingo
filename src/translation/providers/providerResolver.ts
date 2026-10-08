import type { SecretManager } from '../../config/secrets';
import { TranslationError } from '../translationError';
import { OpenAITranslationProvider } from './openaiTranslationProvider';
import type { TranslationProvider } from '../types';
import { MockTranslationProvider } from './mockTranslationProvider';
import { getProviderMetadata, isTranslationProviderId, type TranslationProviderId } from './providerRegistry';

export class ProviderNotAvailableError extends TranslationError {
    constructor(public readonly providerId: TranslationProviderId) {
        super(`DevLingo: ${getProviderMetadata(providerId).displayName} is not available yet.`);
        this.name = 'ProviderNotAvailableError';
    }
}

export class UnknownTranslationProviderError extends TranslationError {
    constructor() {
        // Don't echo arbitrary configuration values into notifications or logs.
        super('DevLingo: Unknown translation provider. Choose an available provider in DevLingo settings.');
        this.name = 'UnknownTranslationProviderError';
    }
}

export class ProviderNotConfiguredError extends TranslationError {
    constructor(public readonly providerId: TranslationProviderId) {
        super(`DevLingo: ${getProviderMetadata(providerId).displayName} requires an API key. Use Configure Provider API Key.`);
        this.name = 'ProviderNotConfiguredError';
    }
}

export class ProviderResolver {
    constructor(private readonly secrets: SecretManager) {}

    async resolve(providerId: unknown): Promise<TranslationProvider> {
        if (!isTranslationProviderId(providerId)) {
            throw new UnknownTranslationProviderError();
        }
        if (!getProviderMetadata(providerId).available) {
            throw new ProviderNotAvailableError(providerId);
        }
        const metadata = getProviderMetadata(providerId);
        const apiKey = metadata.requiresApiKey ? (await this.secrets.getApiKey(metadata.id))?.trim() : undefined;
        if (metadata.requiresApiKey && !apiKey) {
            throw new ProviderNotConfiguredError(providerId);
        }
        switch (providerId) {
            case 'mock': return new MockTranslationProvider();
            case 'openai': return new OpenAITranslationProvider({ apiKey: apiKey! });
            default: throw new ProviderNotAvailableError(providerId);
        }
    }
}
