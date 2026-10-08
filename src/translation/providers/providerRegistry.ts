export const providerRegistry = Object.freeze({
    mock: Object.freeze({ id: 'mock', displayName: 'Mock Provider (Development)', description: 'Temporary development provider; no real translation.', requiresApiKey: false, available: true }),
    google: Object.freeze({ id: 'google', displayName: 'Google Cloud Translation', description: 'Cloud Translation Basic v2 using your Google API key.', requiresApiKey: true, available: true }),
    deepl: Object.freeze({ id: 'deepl', displayName: 'DeepL', description: 'Cloud translation using your DeepL API key.', requiresApiKey: true, available: true }),
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
