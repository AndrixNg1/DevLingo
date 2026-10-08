import type { SecretManager } from '../../config/secrets';
import type { TranslationProvider } from '../types';
import { MockTranslationProvider } from './mockTranslationProvider';
import { getProviderMetadata, isTranslationProviderId, type TranslationProviderId } from './providerRegistry';

export class ProviderNotAvailableError extends Error {
    constructor(public readonly providerId: TranslationProviderId) {
        super(`DevLingo: ${getProviderMetadata(providerId).displayName} is not available yet.`);
        this.name = 'ProviderNotAvailableError';
    }
}

export class UnknownTranslationProviderError extends Error {
    constructor() {
        // Don't echo arbitrary configuration values into notifications or logs.
        super('DevLingo: Unknown translation provider. Choose an available provider in DevLingo settings.');
        this.name = 'UnknownTranslationProviderError';
    }
}

export class ProviderNotConfiguredError extends Error {
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
        if (metadata.requiresApiKey && !await this.secrets.hasApiKey(metadata.id)) {
            throw new ProviderNotConfiguredError(providerId);
        }
        switch (providerId) {
            case 'mock': return new MockTranslationProvider();
            default: throw new ProviderNotAvailableError(providerId);
        }
    }
}
