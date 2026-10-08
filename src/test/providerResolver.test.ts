import * as assert from 'assert';
import { ProviderResolver, ProviderNotAvailableError, UnknownTranslationProviderError, ProviderNotConfiguredError } from '../translation/providers/providerResolver';
import { SecretManager } from '../config/secrets';
import { FakeSecretStorage } from './helpers/fakeSecretStorage';
import { MockTranslationProvider } from '../translation/providers/mockTranslationProvider';
import { TranslationService } from '../translation/translationService';
import { getCredentialProviders } from '../translation/providers/providerRegistry';

suite('Provider resolver', () => {
    const create = () => new ProviderResolver(new SecretManager(new FakeSecretStorage()));
    test('Resolves the mock and integrates with the existing translation service', async () => {
        const provider = await create().resolve('mock');
        assert.ok(provider instanceof MockTranslationProvider);
        assert.strictEqual(await new TranslationService(provider).translate('Hello world', { targetLanguage: 'fr' }), '[fr] Hello world');
    });
    for (const provider of getCredentialProviders()) {
        test(`Rejects ${provider.id} without reading credentials or falling back`, async () => {
            const resolver = new ProviderResolver(new SecretManager({
                async get() { assert.fail('Unavailable providers must not read credentials'); },
                async store() { assert.fail('Must not store credentials'); },
                async delete() { assert.fail('Must not remove credentials'); },
            }));
            await assert.rejects(resolver.resolve(provider.id), (error: unknown) => {
                assert.ok(error instanceof ProviderNotAvailableError);
                assert.strictEqual(error.providerId, provider.id);
                assert.ok(error.message.includes(provider.displayName));
                return true;
            });
        });
    }
    test('Saved credentials do not make an unimplemented provider available', async () => {
        const secrets = new SecretManager(new FakeSecretStorage());
        await secrets.setApiKey('google', 'test-api-key');
        await assert.rejects(new ProviderResolver(secrets).resolve('google'), ProviderNotAvailableError);
    });
    test('Rejects unknown configurations without reflecting arbitrary values', async () => {
        for (const id of ['invalid', '__proto__', 'test-api-key', null, 1, {}]) {
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
