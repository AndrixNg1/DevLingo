export const providerRegistry = Object.freeze({
    mock: Object.freeze({ id: 'mock', displayName: 'Mock Provider (Development)', description: 'Temporary development provider; no real translation.', requiresApiKey: false, available: true }),
    google: Object.freeze({ id: 'google', displayName: 'Google Cloud Translation', description: 'Planned cloud provider; not available yet.', requiresApiKey: true, available: false }),
    deepl: Object.freeze({ id: 'deepl', displayName: 'DeepL', description: 'Planned cloud provider; not available yet.', requiresApiKey: true, available: false }),
    openai: Object.freeze({ id: 'openai', displayName: 'OpenAI', description: 'Cloud translation using your OpenAI API key.', requiresApiKey: true, available: true }),
} as const);

export type TranslationProviderId = keyof typeof providerRegistry;
export type CredentialProviderId = {
    [Id in TranslationProviderId]: typeof providerRegistry[Id]['requiresApiKey'] extends true ? Id : never
}[TranslationProviderId];
export type ProviderMetadata = typeof providerRegistry[TranslationProviderId];

export function isTranslationProviderId(value: unknown): value is TranslationProviderId {
    return typeof value === 'string' && Object.hasOwn(providerRegistry, value);
}

export function getProviderMetadata(id: TranslationProviderId): ProviderMetadata {
    return providerRegistry[id];
}

export function getAvailableProviders(): ProviderMetadata[] {
    return Object.values(providerRegistry).filter(provider => provider.available);
}

export function getCredentialProviders(): (ProviderMetadata & { id: CredentialProviderId })[] {
    return Object.values(providerRegistry).filter(provider => provider.requiresApiKey);
}
