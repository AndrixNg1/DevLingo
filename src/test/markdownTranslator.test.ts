import * as assert from 'assert';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { MarkdownTranslator } from '../markdown/markdownTranslator';
import { TranslationService } from '../translation/translationService';
import { FixtureTranslationProvider } from './helpers/fixtureTranslationProvider';

suite('Markdown translator', () => {
    const translator = () => new MarkdownTranslator(new TranslationService(new FixtureTranslationProvider()));
    const prefix = '\\[fr\\] ';
    const examples: [string, string, string][] = [
        ['paragraph', 'DevLingo helps developers.', `${prefix}DevLingo helps developers.`],
        ['multiple paragraphs', 'Hello\n\nWorld\n', `${prefix}Hello\n\n${prefix}World\n`],
        ['H1 heading', '# Getting Started', `# ${prefix}Getting Started`],
        ['nested headings', '# Start\n\n## Install\n\n### Configure', `# ${prefix}Start\n\n## ${prefix}Install\n\n### ${prefix}Configure`],
        ['closing heading markers', '## Install ##', `## ${prefix}Install ##`],
        ['setext heading', 'Getting Started\n===============', `${prefix}Getting Started\n===============`],
        ['inline code', 'Use `npm install` to install DevLingo.', `${prefix}Use \`npm install\` ${prefix}to install DevLingo.`],
        ['multiple inline code fragments', 'Run `npm install` and `npm test`.', `${prefix}Run \`npm install\` ${prefix}and \`npm test\`.`],
        ['multiline inline code', 'Use ``line\n`code`\nend`` now.', `${prefix}Use \`\`line\n\`code\`\nend\`\` ${prefix}now.`],
        ['Markdown link', '[Read the documentation](https://example.com/docs)', `[${prefix}Read the documentation](https://example.com/docs)`],
        ['link title', '[Documentation](https://example.com "DevLingo docs")', `[${prefix}Documentation](https://example.com "DevLingo docs")`],
        ['link nested URL parentheses', '[Docs](https://example.com/a_(b))', `[${prefix}Docs](https://example.com/a_(b))`],
        ['raw URLs', 'Visit https://example.com and http://localhost:3000 now.', `${prefix}Visit https://example.com ${prefix}and http://localhost:3000 ${prefix}now.`],
        ['autolink', 'Visit <https://example.com> today.', `${prefix}Visit <https://example.com> ${prefix}today.`],
        ['email autolink', 'Contact <dev@example.com>.', `${prefix}Contact <dev@example.com>.`],
        ['images', 'See ![DevLingo Logo](./assets/logo.png "Logo") here.', `${prefix}See ![DevLingo Logo](./assets/logo.png "Logo") ${prefix}here.`],
        ['unordered list', '- Install Node.js\n* Open VS Code\n+ Install DevLingo', `- ${prefix}Install Node.js\n* ${prefix}Open VS Code\n+ ${prefix}Install DevLingo`],
        ['nested unordered list', '- Installation\n  - Install Node.js\n    - Install dependencies', `- ${prefix}Installation\n  - ${prefix}Install Node.js\n    - ${prefix}Install dependencies`],
        ['ordered list', '1. Install Node.js\n2. Open the project\n3. Start VS Code', `1. ${prefix}Install Node.js\n2. ${prefix}Open the project\n3. ${prefix}Start VS Code`],
        ['task list', '- [ ] Install dependencies\n- [x] Configure DevLingo', `- [ ] ${prefix}Install dependencies\n- [x] ${prefix}Configure DevLingo`],
        ['blockquote', '> DevLingo is under development.', `> ${prefix}DevLingo is under development.`],
        ['nested multiline blockquote', '> > First line\n> > Second line', `> > ${prefix}First line\n> > ${prefix}Second line`],
        ['CRLF and whitespace', '# Title\r\n\r\n  Hello  \r\nWorld\r\n', `# ${prefix}Title\r\n\r\n  ${prefix}Hello  \r\n${prefix}World\r\n`],
        ['table', '| Feature | Status |\n| :--- | ---: |\n| Translation | Development |', `| ${prefix}Feature | ${prefix}Status |\n| :--- | ---: |\n| ${prefix}Translation | ${prefix}Development |`],
        ['emphasis', 'Use **bold** and *italic* text.', `${prefix}Use **${prefix}bold** ${prefix}and *${prefix}italic* ${prefix}text.`],
        ['reference link', '[Read documentation][docs]\n\n[docs]: https://example.com "Docs"', `[${prefix}Read documentation][docs]\n\n[docs]: https://example.com "Docs"`],
    ];
    for (const [name, input, expected] of examples) {
        test(`Translates ${name} while retaining source syntax`, async () => {
            assert.strictEqual(await translator().translateMarkdown(input, 'fr'), expected);
        });
    }
    const protectedExamples = [
        '', ' \r\n\t\n', '---\n\n***\n\n___\n',
        '---\ntitle: DevLingo\ndescription: Developer extension\nversion: 0.1.0\n---\n',
        '---\ntitle: DevLingo\n...\r\n',
        '<div class="warning">\n  DevLingo is under development.\n</div>\n',
        '<div>\n\nText after a blank line.\n\n</div>',
        '<!-- Internal documentation note -->', '<!-- multiline\nnote -->',
        '<br />', '![Logo](./logo.png)', '[logo]: ./logo.png "Title"',
        '![Logo][logo]\n\n[logo]: ./logo.png',
        '[docs]\n\n[docs]: https://example.com',
        '[docs][]\n\n[docs]: https://example.com',
        'https://example.com\n\n<http://localhost:3000>',
        '    const user = getUser();\n    // do not translate\n',
        '> ```ts\n> const x = 1;\n> ```',
        '- ```ts\n  const x = 1;\n  ```',
    ];
    for (const language of ['javascript', 'typescript', 'bash', '']) {
        protectedExamples.push(`\`\`\`${language}\r\nconst user = await getUser();\r\n\`\`\`\r\n`);
    }
    protectedExamples.push('~~~~bash\nnpm install\n~~~\n~~~~', '```js\nUnclosed code fence');
    for (const [index, input] of protectedExamples.entries()) {
        test(`Keeps protected-only document ${index} byte-for-byte and never calls the provider`, async () => {
            const markdown = new MarkdownTranslator(new TranslationService({ async translate() {
                assert.fail('Protected content must not reach the provider');
            } }));
            assert.strictEqual(await markdown.translateMarkdown(input, 'fr'), input);
        });
    }
    test('Only sends natural-language segments from a mixed document to the service', async () => {
        const sent: string[] = [];
        const markdown = new MarkdownTranslator(new TranslationService({ async translate(text, options) {
            assert.strictEqual(options.targetLanguage, 'de');
            sent.push(text);
            return `Translated ${text}`;
        } }));
        const protectedBlock = '```bash\nnpm install devlingo\n```';
        const frontmatter = '---\ntitle: DevLingo\n---\n';
        const input = frontmatter + '# Installation\n\nInstall using `npm install`.\n\n' + protectedBlock
            + '\n\nRead [Docs](https://example.com "Original title").\n\n![Logo](logo.png)\n\n<!-- Note -->';
        const output = await markdown.translateMarkdown(input, 'de');
        assert.deepStrictEqual(sent, ['Installation', 'Install using', 'Read', 'Docs']);
        assert.ok(output.startsWith(frontmatter));
        for (const protectedText of [protectedBlock, '`npm install`', 'https://example.com "Original title"', '![Logo](logo.png)', '<!-- Note -->']) {
            assert.ok(output.includes(protectedText));
        }
    });
    test('Translates the manual verification fixture while preserving its protected content', async () => {
        const input = await fs.readFile(path.resolve(__dirname, '../../test/fixtures/markdown-sample.md'), 'utf8');
        const output = await translator().translateMarkdown(input, 'fr');
        assert.ok(output.includes('# \\[fr\\] DevLingo'));
        assert.ok(output.includes('| \\[fr\\] Feature | \\[fr\\] Status |'));
        for (const protectedText of [
            '---\ntitle: DevLingo\nversion: 0.1.0\n---',
            '```bash\nnpm install\n```', '`npm run compile`',
            'https://example.com/docs "DevLingo docs"',
            '![DevLingo Logo](./assets/logo.png)',
            '<div class="warning">\n  This HTML stays unchanged.\n</div>',
            '<!-- Internal documentation note -->',
        ]) {
            assert.ok(output.includes(protectedText), protectedText);
        }
    });
    test('Caches repeated text and separates languages', async () => {
        let calls = 0;
        const markdown = new MarkdownTranslator(new TranslationService({ async translate(text) { calls++; return text; } }));
        await markdown.translateMarkdown('# Hello\n\nHello', 'fr');
        assert.strictEqual(calls, 1);
        await markdown.translateMarkdown('Hello', 'de');
        assert.strictEqual(calls, 2);
    });
    test('Propagates a failure halfway through translation', async () => {
        let calls = 0;
        const markdown = new MarkdownTranslator(new TranslationService({ async translate() {
            if (++calls === 2) {
                throw new Error('Translation failed');
            }
            return 'Translated';
        } }));
        await assert.rejects(markdown.translateMarkdown('# Heading\n\nParagraph', 'fr'), /Translation failed/);
    });
    test('Preserves escaped punctuation and entities without placeholders', async () => {
        const input = 'Use \\*literal\\* &amp; `__CODE_1__` now.';
        const output = await translator().translateMarkdown(input, 'fr');
        assert.ok(output.includes('\\*'));
        assert.ok(output.includes('&amp;'));
        assert.ok(output.includes('`__CODE_1__`'));
    });
    test('Escapes Markdown injected by a future provider', async () => {
        const markdown = new MarkdownTranslator(new TranslationService({ async translate() {
            return '# heading\n[link](bad) <script> *emphasis* | column';
        } }));
        const output = await markdown.translateMarkdown('Hello', 'fr');
        const { fromMarkdown } = await import('mdast-util-from-markdown');
        const tree = fromMarkdown(output);
        assert.strictEqual(tree.children.length, 1);
        assert.strictEqual(tree.children[0].type, 'paragraph');
        if (tree.children[0].type === 'paragraph') {
            assert.ok(tree.children[0].children.every(node => node.type === 'text'));
        }
    });
    for (const value of ['---', '~~~code', '1. numbered', '  # heading  ', '~~strikethrough~~']) {
        test(`Keeps translated prose from becoming structural Markdown: ${value}`, async () => {
            const markdown = new MarkdownTranslator(new TranslationService({ async translate() { return value; } }));
            const { fromMarkdown } = await import('mdast-util-from-markdown');
            const root = fromMarkdown(await markdown.translateMarkdown('Hello', 'fr'));
            assert.strictEqual(root.children[0].type, 'paragraph');
            if (root.children[0].type === 'paragraph') {
                assert.strictEqual(root.children[0].children[0].type, 'text');
                if (root.children[0].children[0].type === 'text') {
                    assert.strictEqual(root.children[0].children[0].value, value.trim());
                }
            }
        });
    }
});
