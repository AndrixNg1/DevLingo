import * as assert from 'assert';
import * as vscode from 'vscode';
import * as deepl from 'deepl-node';
import { DeepLTranslationProvider, type DeepLTranslationClient } from '../translation/providers/deeplTranslationProvider';
import { getDeepLSourceLanguage, getDeepLTargetLanguage } from '../translation/providers/deeplLanguages';
import { OpenAITranslationProvider } from '../translation/providers/openaiTranslationProvider';
import { languages } from '../config/languages';
import { TranslationService } from '../translation/translationService';
import { TranslationCache } from '../translation/translationCache';
import { TranslationError } from '../translation/translationError';
import { MarkdownTranslator } from '../markdown/markdownTranslator';
import { CommentTranslationHover } from '../hover/commentTranslationHover';

suite('DeepL translation provider (offline)', () => {
    let requests: Parameters<DeepLTranslationClient['translateText']>[];
    let output: string;
    let failure: unknown;
    let provider: DeepLTranslationProvider;
    setup(() => {
        requests = []; output = 'Bonjour'; failure = undefined;
        provider = new DeepLTranslationProvider({ apiKey: 'test-api-key' }, { async translateText(...args) {
            requests.push(args);
            if (failure) {
                throw failure;
            }
            return { text: output };
        } });
    });
    test('Returns empty and whitespace input unchanged without making requests', async () => {
        for (const text of ['', ' ', '\t\r\n']) {
            assert.strictEqual(await provider.translate(text, { targetLanguage: 'fr' }), text);
        }
        assert.deepStrictEqual(requests, []);
    });
    test('Uses text translation, automatic detection and preserveFormatting', async () => {
        assert.strictEqual(await provider.translate('Hello', { targetLanguage: 'fr' }), 'Bonjour');
        assert.deepStrictEqual(requests, [['Hello', null, 'fr', { preserveFormatting: true }]]);
        assert.ok(!JSON.stringify(requests).includes('test-api-key'));
    });
    test('Maps every target from the language registry and chooses US English', async () => {
        for (const language of languages) {
            const expected = language.code === 'en' ? 'en-US' : language.code;
            assert.strictEqual(getDeepLTargetLanguage(language.code), expected);
            await provider.translate('Hello', { targetLanguage: language.code });
            assert.strictEqual(requests.at(-1)?.[2], expected);
        }
        assert.strictEqual(getDeepLTargetLanguage(' EN '), 'en-US');
    });
    test('Maps all automatic source forms to null', async () => {
        for (const sourceLanguage of [undefined, '', '  ', 'auto', ' AUTO ']) {
            assert.strictEqual(getDeepLSourceLanguage(sourceLanguage), null);
            await provider.translate('Hello', { targetLanguage: 'fr', sourceLanguage });
            assert.strictEqual(requests.at(-1)?.[1], null);
        }
    });
    test('Passes explicit source codes, including codes outside initial target languages', async () => {
        for (const sourceLanguage of ['en', 'de', 'it', ' FR ']) {
            await provider.translate('Hello', { targetLanguage: 'fr', sourceLanguage });
            assert.strictEqual(requests.at(-1)?.[1], sourceLanguage.trim().toLowerCase());
        }
    });
    test('Rejects unsupported targets and malformed source codes before requests', async () => {
        for (const targetLanguage of ['', 'xx', '__proto__', 'en-US']) {
            await assert.rejects(provider.translate('Hello', { targetLanguage }), /target language is not supported/);
        }
        await assert.rejects(provider.translate('Hello', { targetLanguage: 'fr', sourceLanguage: 'not-a-language' }), /source language is not supported/);
        assert.strictEqual(requests.length, 0);
    });
    test('Returns translated text without removing meaningful whitespace or line breaks', async () => {
        output = '\tBonjour\nle monde  \r\n';
        assert.strictEqual(await provider.translate('\tHello\nworld  \r\n', { targetLanguage: 'fr' }), output);
    });
    test('Rejects empty responses using a controlled error', async () => {
        for (const value of ['', ' \r\n']) {
            output = value;
            await assert.rejects(provider.translate('Hello', { targetLanguage: 'fr' }), /empty translation/);
        }
    });
    test('Rejects missing credentials without creating a client', () => {
        assert.throws(() => new DeepLTranslationProvider({ apiKey: '  ' }), /requires an API key/);
    });
    const errors: [string, () => unknown, string][] = [
        ['authentication', () => new deepl.AuthorizationError('test-api-key'), 'authentication failed'],
        ['quota', () => new deepl.QuotaExceededError('test-api-key'), 'usage limit reached'],
        ['rate limit', () => new deepl.TooManyRequestsError('test-api-key'), 'rate limit reached'],
        ['connection', () => new deepl.ConnectionError('test-api-key', false, new Error('test-api-key')), 'Unable to reach'],
        ['language argument', () => new deepl.ArgumentError('test-api-key'), 'language or request'],
        ['API bad request', () => new deepl.DeepLError('Bad request, test-api-key'), 'language or request'],
        ['service unavailable', () => new deepl.DeepLError('Service unavailable, test-api-key'), 'service is unavailable'],
        ['server error', () => new deepl.DeepLError('Unexpected status code: 500 Internal Server Error, test-api-key'), 'service is unavailable'],
        ['unclassified SDK', () => new deepl.DeepLError('test-api-key'), 'translation failed'],
        ['unexpected', () => new Error('test-api-key'), 'translation failed'],
    ];
    for (const [name, create, message] of errors) {
        test(`Maps ${name} errors without raw SDK details or credentials`, async () => {
            failure = create();
            await assert.rejects(provider.translate('Hello', { targetLanguage: 'fr' }), (error: unknown) => {
                assert.ok(error instanceof TranslationError);
                assert.ok(error.message.includes(message));
                assert.ok(!error.message.includes('test-api-key'));
                assert.strictEqual(error.cause, undefined);
                return true;
            });
        });
    }
    test('Isolates DeepL and OpenAI results and reuses pending/completed requests', async () => {
        const deepLCache = new TranslationCache(new TranslationService(provider, 'deepl'));
        let openAICalls = 0;
        const openAI = new OpenAITranslationProvider({ apiKey: 'test-api-key' }, { responses: { async create() {
            openAICalls++;
            return { output_text: 'Salut' };
        } } });
        const openAICache = new TranslationCache(new TranslationService(openAI, 'openai'));
        const first = deepLCache.translate('Hello', 'fr', 'en');
        assert.strictEqual(deepLCache.translate('Hello', 'fr', 'en'), first);
        assert.strictEqual(await first, 'Bonjour');
        assert.strictEqual(await openAICache.translate('Hello', 'fr', 'en'), 'Salut');
        assert.strictEqual(await deepLCache.translate('Hello', 'fr', 'en'), 'Bonjour');
        assert.strictEqual(await openAICache.translate('Hello', 'fr', 'en'), 'Salut');
        assert.strictEqual(requests.length, 1);
        assert.strictEqual(openAICalls, 1);
        await deepLCache.translate('Hello', 'fr', 'de');
        assert.strictEqual(requests.length, 2);
    });
    test('Markdown sends only prose segments and keeps code, frontmatter, URLs and HTML protected', async () => {
        const translator = new MarkdownTranslator(new TranslationService(provider, 'deepl'));
        const markdown = '---\ntitle: Protected\n---\n# Hello\n\nHello `identifier` [Hello](https://example.com)\n\n```ts\nconst user = 1;\n```\n\n<!-- Protected -->\n';
        const translated = await translator.translateMarkdown(markdown, 'fr');
        assert.ok(translated.startsWith('---\ntitle: Protected\n---\n# Bonjour'));
        assert.ok(translated.includes('`identifier`'));
        assert.ok(translated.includes('[Bonjour](https://example.com)'));
        assert.ok(translated.includes('```ts\nconst user = 1;\n```'));
        assert.ok(translated.includes('<!-- Protected -->'));
        assert.deepStrictEqual(requests.map(request => request[0]), ['Hello']);
    });
    test('Hover sends only the comment and caches repeated translations', async () => {
        const hover = new CommentTranslationHover(new TranslationService(provider, 'deepl'));
        const document = await vscode.workspace.openTextDocument({ content: '// Hello\nconst user = 1;', language: 'typescript' });
        const cancellation = new vscode.CancellationTokenSource();
        try {
            const result = await hover.provideHover(document, new vscode.Position(0, 4), cancellation.token);
            assert.ok((result?.contents[0] as vscode.MarkdownString).value.includes('Bonjour'));
            await hover.provideHover(document, new vscode.Position(0, 5), cancellation.token);
            assert.deepStrictEqual(requests.map(request => request[0]), ['Hello']);
            assert.strictEqual(document.getText(), '// Hello\nconst user = 1;');
        } finally {
            cancellation.dispose();
        }
    });
});
