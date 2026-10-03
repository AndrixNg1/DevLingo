import * as assert from 'assert';
import { TranslationCache } from '../translation/translationCache';
import { TranslationService } from '../translation/translationService';
import { MockTranslationProvider } from '../translation/providers/mockTranslationProvider';

suite('Hover translation cache', () => {
    test('Reuses pending and completed requests', async () => {
        let calls = 0;
        let resolve!: (text: string) => void;
        const service = new TranslationService({ translate() {
            calls++;
            return new Promise<string>(done => { resolve = done; });
        } });
        const cache = new TranslationCache(service);
        const first = cache.translate('Hello', 'fr');
        assert.strictEqual(cache.translate('Hello', 'fr'), first);
        assert.strictEqual(calls, 1);
        resolve('Bonjour');
        assert.strictEqual(await first, 'Bonjour');
        assert.strictEqual(await cache.translate('Hello', 'fr'), 'Bonjour');
        assert.strictEqual(calls, 1);
    });
    test('Separates original text and target language', async () => {
        let calls = 0;
        const mock = new MockTranslationProvider();
        const cache = new TranslationCache(new TranslationService({ async translate(text, options) {
            calls++;
            return mock.translate(text, options);
        } }));
        assert.strictEqual(await cache.translate('Hello', 'fr'), '[fr] Hello');
        assert.strictEqual(await cache.translate('Hello', 'de'), '[de] Hello');
        assert.strictEqual(await cache.translate('World', 'fr'), '[fr] World');
        assert.strictEqual(calls, 3);
    });
    test('Evicts old entries at capacity', async () => {
        let calls = 0;
        const cache = new TranslationCache(new TranslationService({ async translate(text) {
            calls++;
            return text;
        } }), 2);
        await cache.translate('one', 'fr');
        await cache.translate('two', 'fr');
        await cache.translate('three', 'fr');
        await cache.translate('two', 'fr');
        assert.strictEqual(calls, 3);
        await cache.translate('one', 'fr');
        assert.strictEqual(calls, 4);
    });
    test('Retries failed requests', async () => {
        let calls = 0;
        const cache = new TranslationCache(new TranslationService({ async translate() {
            if (++calls === 1) {
                throw new Error('Temporary failure');
            }
            return 'Bonjour';
        } }));
        await assert.rejects(cache.translate('Hello', 'fr'), /Temporary failure/);
        assert.strictEqual(await cache.translate('Hello', 'fr'), 'Bonjour');
        assert.strictEqual(calls, 2);
    });
});
