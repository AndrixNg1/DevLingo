# LinguaCode

LinguaCode is a VS Code extension designed to make multilingual development workflows easier by translating Markdown documentation and code comments directly inside the editor.

## Features

### Markdown Translation

Translate Markdown files without leaving VS Code while preserving their structure and developer-specific content.

LinguaCode aims to preserve:

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

LinguaCode is built around a simple idea: developers should be able to understand documentation and source-code comments without constantly switching between their editor and external translation tools.

The project focuses on:

- Developer-friendly translation
- Non-destructive comment translation
- Markdown-aware translation
- Clean editor integration
- Extensible translation providers
- Fast and simple workflows

## Project Status

LinguaCode is currently under active development.

The first versions focus on building the core architecture and implementing Markdown translation.

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
cd linguacode
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

LinguaCode is currently in early development.

Issues, ideas and contributions are welcome as the project evolves.

## License

This project is licensed under the MIT License.