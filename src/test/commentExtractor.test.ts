import * as assert from 'assert';
import { commentLanguageIds, extractComment } from '../comments/commentExtractor';

suite('Comment extraction', () => {
    const examples: [string, string, string][] = [
        ['javascript', 'const x = 1; // Fetch current user', 'Fetch current user'],
        ['javascriptreact', '// Fetch current user', 'Fetch current user'],
        ['typescript', '/* Validate token */', 'Validate token'],
        ['typescriptreact', 'const view = <div>{/* Navigation */}</div>;', 'Navigation'],
        ['vue', '<template><!-- Navigation --></template>', 'Navigation'],
        ['php', '<?php # Load configuration\n?>', 'Load configuration'],
        ['css', '/* Validate token */', 'Validate token'],
        ['scss', '// Validate token', 'Validate token'],
        ['less', '// Validate token', 'Validate token'],
        ['python', 'value = 1 # Load configuration', 'Load configuration'],
        ['shellscript', 'echo ok # Load configuration', 'Load configuration'],
        ['html', '<!-- Navigation -->', 'Navigation'],
    ];
    for (const [language, source, expected] of examples) {
        test(`Extracts comments in ${language}`, () => {
            const offset = source.indexOf(expected);
            assert.strictEqual(extractComment(source, offset, language)?.text, expected);
        });
    }
    test('Supports multiline blocks and strips documentation stars', () => {
        const source = '/**\n * Fetch user\n * Validate token\n */';
        assert.deepStrictEqual(extractComment(source, source.indexOf('Validate'), 'typescript'), {
            text: 'Fetch user\nValidate token', start: 0, end: source.length,
        });
    });
    test('Supports multiline HTML comments', () => {
        const source = '<!--\nNavigation\nLinks\n-->';
        assert.strictEqual(extractComment(source, source.indexOf('Links'), 'html')?.text, 'Navigation\nLinks');
    });
    test('Includes delimiters in the range and excludes following code', () => {
        const source = '/* hello */const x = 1;';
        assert.deepStrictEqual(extractComment(source, 0, 'javascript'), { text: 'hello', start: 0, end: 11 });
        assert.strictEqual(extractComment(source, 10, 'javascript')?.text, 'hello');
        assert.strictEqual(extractComment(source, 11, 'javascript'), undefined);
    });
    test('Finds a later comment after skipping earlier comments and strings', () => {
        const source = '/* first */ const value = "// fake"; // second';
        assert.strictEqual(extractComment(source, source.indexOf('second'), 'javascript')?.text, 'second');
        assert.strictEqual(extractComment(source, source.indexOf('value'), 'javascript'), undefined);
    });
    for (const source of ['//', '//  ', '////', '/****/', '/**/', '/* \n */', '/**\n * \n */']) {
        test(`Ignores empty script comment ${JSON.stringify(source)}`, () => {
            assert.strictEqual(extractComment(source, 0, 'javascript'), undefined);
        });
    }
    for (const [language, source] of [
        ['python', '#  '], ['shellscript', '#'], ['html', '<!-- -->'],
    ]) {
        test(`Ignores empty comments in ${language}`, () => {
            assert.strictEqual(extractComment(source, 0, language), undefined);
        });
    }
    const nonComments: [string, string, string][] = [
        ['javascript', 'const url = "https://example.com";', '//'],
        ['typescript', "const text = '/* fake */';", 'fake'],
        ['javascript', 'const text = `// fake\n/* fake */`;', 'fake'],
        ['javascript', 'const pattern = /[/*]fake/;', 'fake'],
        ['javascript', 'if (valid) /[/*]fake/.test(value);', 'fake'],
        ['python', 'text = "# fake"', 'fake'],
        ['python', 'text = """\n# fake\n"""', 'fake'],
        ['shellscript', 'echo "# fake"', 'fake'],
        ['shellscript', 'echo foo#fake', 'fake'],
        ['shellscript', 'echo \\#fake', 'fake'],
        ['shellscript', "cat <<'END'\n# fake\nEND\n", 'fake'],
        ['php', "<?php $s = <<<'END'\n// fake\nEND;\n", 'fake'],
        ['php', '<div>// fake</div>', 'fake'],
        ['php', '<?php #[Attribute] class Example {}', 'Attribute'],
        ['html', '<div title="<!-- fake -->">// text</div>', 'fake'],
        ['html', '<textarea><!-- fake --></textarea>', 'fake'],
        ['html', '<style>// fake</style>', 'fake'],
        ['vue', '<template><div>// fake</div></template>', 'fake'],
        ['javascriptreact', 'const view = <div>// fake</div>;', 'fake'],
        ['typescriptreact', 'const view = <div title="/* fake */" />;', 'fake'],
        ['css', 'a { color: #fff; }', 'fff'],
        ['css', 'a { content: "/* fake */"; }', 'fake'],
    ];
    for (const [language, source, marker] of nonComments) {
        test(`Ignores code/string in ${language}: ${source}`, () => {
            assert.strictEqual(extractComment(source, source.indexOf(marker), language), undefined);
        });
    }
    test('Uses language-appropriate delimiters', () => {
        assert.strictEqual(extractComment('// code', 3, 'python'), undefined);
        assert.strictEqual(extractComment('# code', 3, 'javascript'), undefined);
        assert.strictEqual(extractComment('// code', 3, 'css'), undefined);
    });
    test('Handles script/style regions in Vue and HTML', () => {
        for (const language of ['vue', 'html']) {
            const source = '<script>const s = "// fake"; // real\n</script><style>/* style */</style><!-- markup -->';
            for (const expected of ['real', 'style', 'markup']) {
                // style occurs in the opening tag too.
                const offset = expected === 'style' ? source.indexOf('/* style') + 3 : source.indexOf(expected);
                assert.strictEqual(extractComment(source, offset, language)?.text, expected);
            }
        }
    });
    test('Uses SCSS comments when a Vue style block declares SCSS', () => {
        const source = '<style lang="scss">// theme\n</style>';
        assert.strictEqual(extractComment(source, source.indexOf('theme'), 'vue')?.text, 'theme');
    });
    test('Rejects unsupported languages and invalid offsets', () => {
        assert.strictEqual(extractComment('// hello', 4, 'plaintext'), undefined);
        assert.strictEqual(extractComment('// hello', -1, 'javascript'), undefined);
        assert.strictEqual(extractComment('// hello', 8, 'javascript'), undefined);
        assert.strictEqual(extractComment('', 0, 'javascript'), undefined);
        assert.strictEqual(commentLanguageIds.length, 12);
    });
});
