import * as assert from 'assert';
import { providerRegistry, getProviderMetadata, getAvailableProviders, getCredentialProviders, isTranslationProviderId } from '../translation/providers/providerRegistry';

suite('Provider registry', () => {
    test('Defines stable IDs, centralized immutable metadata and availability', () => {
        assert.deepStrictEqual(Object.keys(providerRegistry), ['mock', 'google', 'deepl', 'openai']);
        assert.ok(Object.isFrozen(providerRegistry));
        for (const provider of Object.values(providerRegistry)) {
            assert.strictEqual(getProviderMetadata(provider.id), provider);
            assert.ok(Object.isFrozen(provider));
            assert.ok(provider.displayName.length > 0);
            assert.ok(provider.description.length > 0);
            assert.strictEqual(provider.available, provider.id === 'mock');
            assert.strictEqual(provider.requiresApiKey, provider.id !== 'mock');
        }
    });
    test('Only exposes mock as available and cloud providers as requiring credentials', () => {
        assert.deepStrictEqual(getAvailableProviders().map(provider => provider.id), ['mock']);
        assert.deepStrictEqual(getCredentialProviders().map(provider => provider.id), ['google', 'deepl', 'openai']);
    });
    test('Rejects unknown, inherited and malformed provider identifiers', () => {
        for (const value of ['mock', 'google', 'deepl', 'openai']) {
            assert.ok(isTranslationProviderId(value));
        }
        for (const value of ['Google', '', 'toString', '__proto__', null, undefined, 0, {}]) {
            assert.strictEqual(isTranslationProviderId(value), false);
        }
    });
});
