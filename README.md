# DevLingo

DevLingo is a VS Code extension designed to make multilingual development workflows easier by translating Markdown documentation and code comments directly inside the editor.

## Features

### Markdown Translation

Translate Markdown files without leaving VS Code while preserving their structure and developer-specific content.

DevLingo aims to preserve:

- Headings
- Lists
- Links
- Inline code
- Code blocks
- Markdown formatting

### Comment Translation

Translate code comments directly from the editor using hover information without modifying the source file.

```ts
// Fetch the currently authenticated user
const user = await getCurrentUser();
```

Hovering over the comment can display its translation directly inside VS Code.

## Goals

DevLingo is built around a simple idea: developers should be able to understand documentation and source-code comments without constantly switching between their editor and external translation tools.

The project focuses on:

- Developer-friendly translation
- Non-destructive comment translation
- Markdown-aware translation
- Clean editor integration
- Extensible translation providers
- Fast and simple workflows

## Project Status

DevLingo is currently under active development.

The translation foundation currently uses a development-only mock provider. No external translation service is connected yet; Markdown translation is a planned feature.

To try it, press `F5`, select text in the Extension Development Host, and run **DevLingo: Translate Selection** from the Command Palette. Choose English, French, Spanish, or German. The mock result (for example, `[fr] Hello world`) opens in a temporary document beside the original without modifying it.

`TranslationService` depends only on `TranslationProvider`. To use another provider later, replace the provider instantiated in `src/extension.ts`; commands continue to use the same service.

Hover over a nonempty code comment to see **DevLingo** and its mock translation without modifying the file. Set `devlingo.targetLanguage` to `en`, `fr` (the default), `es`, or `de` in VS Code settings. Hover translations use a bounded in-memory cache shared across documents, keyed by comment text and target language; pending requests are reused and failures can be retried.

Comment hover supports JavaScript, JSX, TypeScript, TSX, Vue, PHP, CSS, SCSS, Less, Python, shell scripts, and HTML. It recognizes language-appropriate `//`, `#`, `/* */`, and `<!-- -->` comments, including multiline blocks. The MVP uses a conservative lexical scanner, not a full language parser: template-string contents and some complex embedded expressions are skipped to avoid translating normal code.

## Roadmap

- [ ] Translate the active Markdown file
- [ ] Select a target language
- [ ] Preserve Markdown syntax during translation
- [ ] Ignore fenced code blocks
- [ ] Preserve inline code
- [ ] Translate code comments on hover
- [ ] Automatic source-language detection
- [ ] Translation caching
- [ ] Configurable translation providers
- [ ] VS Code Marketplace release

## Development

### Requirements

- Node.js
- npm
- Visual Studio Code
- Git

### Install

Clone the repository and install the dependencies:

```bash
git clone https://github.com/AndrixNg1/DevLingo
cd devlingo
npm install
```

Open the project in VS Code:

```bash
code .
```

Press `F5` to start a new Extension Development Host instance.

## Project Structure

```text
src/
├── commands/
├── comments/
├── config/
├── hover/
├── markdown/
├── translation/
│   └── providers/
├── utils/
└── extension.ts
```

## Contributing

DevLingo is currently in early development.

Issues, ideas and contributions are welcome as the project evolves.

## License

This project is licensed under the MIT License.
