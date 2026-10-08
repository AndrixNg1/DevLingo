import type { SecretStorage } from 'vscode';
import { getProviderMetadata, isTranslationProviderId, type CredentialProviderId } from '../translation/providers/providerRegistry';

export function getProviderSecretKey(providerId: CredentialProviderId): string {
    if (!isTranslationProviderId(providerId) || !getProviderMetadata(providerId).requiresApiKey) {
        throw new Error('This provider does not support API credentials.');
    }
    return `devlingo.provider.${providerId}.apiKey`;
}

/** Credential persistence is exclusively delegated to VS Code SecretStorage. */
export class SecretManager {
    constructor(private readonly secrets: Pick<SecretStorage, 'get' | 'store' | 'delete'>) {}

    async getApiKey(providerId: CredentialProviderId): Promise<string | undefined> {
        try {
            return await this.secrets.get(getProviderSecretKey(providerId));
        } catch {
            throw new Error('Unable to read provider credentials.');
        }
    }

    async setApiKey(providerId: CredentialProviderId, value: string): Promise<void> {
        const trimmed = value.trim();
        if (!trimmed) {
            throw new Error('An API key must not be empty.');
        }
        const key = getProviderSecretKey(providerId);
        try {
            await this.secrets.store(key, trimmed);
        } catch {
            throw new Error('Unable to save provider credentials.');
        }
    }

    async deleteApiKey(providerId: CredentialProviderId): Promise<void> {
        try {
            await this.secrets.delete(getProviderSecretKey(providerId));
        } catch {
            throw new Error('Unable to remove provider credentials.');
        }
    }

    async hasApiKey(providerId: CredentialProviderId): Promise<boolean> {
        return Boolean((await this.getApiKey(providerId))?.trim());
    }
}
