import * as assert from 'assert';
import { ProviderResolver, ProviderNotAvailableError, UnknownTranslationProviderError, ProviderNotConfiguredError } from '../translation/providers/providerResolver';
import { SecretManager } from '../config/secrets';
import { FakeSecretStorage } from './helpers/fakeSecretStorage';
import { DeepLTranslationProvider } from '../translation/providers/deeplTranslationProvider';
import { OpenAITranslationProvider } from '../translation/providers/openaiTranslationProvider';
import { GoogleTranslationProvider } from '../translation/providers/googleTranslationProvider';
import { getCredentialProviders } from '../translation/providers/providerRegistry';

suite('Provider resolver', () => {
    const create = () => new ProviderResolver(new SecretManager(new FakeSecretStorage()));
    for (const provider of getCredentialProviders()) {
        test(`Rejects ${provider.id} without credentials or falling back`, async () => {
            const resolver = new ProviderResolver(new SecretManager({
                async get() { return undefined; },
                async store() { assert.fail('Must not store credentials'); },
                async delete() { assert.fail('Must not remove credentials'); },
            }));
            await assert.rejects(resolver.resolve(provider.id), (error: unknown) => {
                assert.ok(error instanceof ProviderNotConfiguredError);
                assert.strictEqual(error.providerId, provider.id);
                assert.ok(error.message.includes(provider.displayName));
                return true;
            });
        });
    }
    test('Requires a nonempty OpenAI key without falling back', async () => {
        const storage = new FakeSecretStorage();
        const secrets = new SecretManager(storage);
        const resolver = new ProviderResolver(secrets);
        await assert.rejects(resolver.resolve('openai'), ProviderNotConfiguredError);
        storage.values.set('devlingo.provider.openai.apiKey', '  ');
        await assert.rejects(resolver.resolve('openai'), ProviderNotConfiguredError);
        await secrets.setApiKey('openai', 'test-api-key');
        assert.ok(await resolver.resolve('openai') instanceof OpenAITranslationProvider);
    });
    test('Requires DeepL credentials and resolves it without a network request', async () => {
        const storage = new FakeSecretStorage();
        const secrets = new SecretManager(storage);
        const resolver = new ProviderResolver(secrets);
        await assert.rejects(resolver.resolve('deepl'), ProviderNotConfiguredError);
        storage.values.set('devlingo.provider.deepl.apiKey', '  ');
        await assert.rejects(resolver.resolve('deepl'), ProviderNotConfiguredError);
        await secrets.setApiKey('deepl', 'test-api-key');
        assert.ok(await resolver.resolve('deepl') instanceof DeepLTranslationProvider);
    });
    test('Requires Google credentials and resolves the Basic v2 provider without a request', async () => {
        const storage = new FakeSecretStorage();
        const secrets = new SecretManager(storage);
        const resolver = new ProviderResolver(secrets);
        await assert.rejects(resolver.resolve('google'), ProviderNotConfiguredError);
        storage.values.set('devlingo.provider.google.apiKey', '  ');
        await assert.rejects(resolver.resolve('google'), ProviderNotConfiguredError);
        await secrets.setApiKey('google', 'test-api-key');
        assert.ok(await resolver.resolve('google') instanceof GoogleTranslationProvider);
    });
    test('Rejects unknown configurations without reflecting arbitrary values', async () => {
        for (const id of ['mock', 'invalid', '__proto__', 'test-api-key', null, 1, {}]) {
            await assert.rejects(create().resolve(id), (error: unknown) => {
                assert.ok(error instanceof UnknownTranslationProviderError);
                assert.ok(!error.message.includes('test-api-key'));
                return true;
            });
        }
    });
    test('Keeps the future missing-credential error explicit and provider-specific', () => {
        const error = new ProviderNotConfiguredError('google');
        assert.strictEqual(error.providerId, 'google');
        assert.ok(error.message.includes('requires an API key'));
        assert.ok(error.message.includes('Configure Provider API Key'));
    });
});
