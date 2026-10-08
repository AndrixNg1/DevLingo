# DevLingo

Translate developer content without leaving VS Code.

[![CI](https://github.com/AndrixNg1/DevLingo/actions/workflows/ci.yml/badge.svg)](https://github.com/AndrixNg1/DevLingo/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)
![TypeScript](https://img.shields.io/badge/language-TypeScript-blue)

DevLingo translates selected text, code comments and Markdown documentation through OpenAI, DeepL or Google Cloud Translation. It uses Bring Your Own Key (BYOK) credentials, preserves protected Markdown content, and integrates with native VS Code menus.

**First release preparation:** version `1.0.0` is being prepared locally. DevLingo is not yet published to the VS Code Marketplace.

## Installation

Requires VS Code **1.140.0 or later**. Install a trusted VSIX built from this repository:

```sh
code --install-extension ./devlingo-1.0.0.vsix
```

Alternatively, open **Extensions → … → Install from VSIX…** and select the file. See [development and packaging](docs/development.md) to build it yourself. VSIX packaging and installation in normal VS Code have been validated by the maintainer.

## Get started

1. Open a file and click the **globe icon** in its editor title toolbar, or run **DevLingo: Open** in the Command Palette.
2. Choose **Translation Provider**: DeepL (default), OpenAI or Google Cloud Translation.
3. Choose **Configure Provider API Key**, select that provider, and enter your key in the masked input.
4. Choose **Target Language**: English (`en`), French (`fr`, default), Spanish (`es`) or German (`de`).

Saving credentials does not select a provider or validate the key remotely. Provider and credential changes take effect without reloading. Missing credentials block translation and offer **Configure** or **Later**. Configure opens the selected provider’s masked input directly; Later keeps that provider selected without translating. Provider switches do not show a success toast. Older settings selecting the removed `mock` provider must be changed explicitly.

## Features and usage

### Comment translation

Hover a supported comment, such as `// Fetch the authenticated user`, to see its translation without editing the source. Turn it on or off through **Comment Translation** in the command center.

Supported language IDs: JavaScript, JSX, TypeScript, TSX, Vue, PHP, CSS, SCSS, Less, Python, shellscript and HTML. Detection supports appropriate `//`, `#`, `/* … */` and `<!-- … -->` syntax. It is a conservative lexical scan, not a complete parser for every language; report missed or incorrectly detected comments with a minimal example.

### Translate selection

Select non-whitespace text → open DevLingo → **Translate Selection** → choose the target language. The result opens in a temporary plaintext document beside the source. The source is unchanged; this action uses its own language picker.

### Markdown translation

Open a saved local Markdown file → open DevLingo → **Translate Markdown File**. With French selected, `README.md` generates `README.fr.md` and opens the result. Existing output requires replacement confirmation; dirty output documents must be saved or closed first. The original file remains unchanged.

DevLingo translates prose in headings, paragraphs, emphasis, lists, task lists, blockquotes and GFM tables. It retains fenced/indented code, inline code, link destinations, raw URLs, images including their alt text, reference definitions, leading YAML frontmatter and protected HTML. HTML content is left untranslated. See [Markdown behavior and limitations](docs/markdown.md); translation quality and context depend on the provider.

### Other entry points

All actions are accessible through the **Command Palette**. Right-click selected text for **DevLingo: Translate Selection** or a Markdown editor for **DevLingo: Translate Markdown File**. The command center shows only actions relevant to the current editor. It also opens native settings and allows configuring/removing keys.

| Setting | Default | Purpose |
| --- | --- | --- |
| `devlingo.translationProvider` | `deepl` | Choose the provider; application scope |
| `devlingo.targetLanguage` | `fr` | Target for hover and Markdown |
| `devlingo.commentTranslationEnabled` | `true` | Enable comment hover; application scope |

Source language is automatically detected in normal UI workflows. The internal provider contract accepts an optional source language; there is currently no source-language setting or picker.

## Providers and credentials

| Provider | API key | Cloud | Status |
| --- | --- | --- | --- |
| OpenAI | Required | Yes | Implemented |
| DeepL | Required | Yes | Implemented; default |
| Google Cloud Translation Basic v2 | Required | Yes | Implemented |

Mock is no longer an extension provider; deterministic fixtures exist only in tests. Gemini is not implemented. [Provider details and extension guide](docs/providers.md) explain the architecture.

BYOK means **Bring Your Own Key**. DevLingo does not sell or provide translation credits. Account access, quotas and billing remain between you and the provider.

Keys are stored exclusively through **VS Code SecretStorage**, not workspace settings or project files. Never commit credentials or include them in issues, screenshots or logs. **Remove Provider API Key** asks for confirmation before removing a stored key. When translating, selected text, detected comments or Markdown prose fragments are sent to the selected cloud provider; consider that provider's data policies before translating sensitive content. See [security policy](SECURITY.md).

## Demo

Real captures below show the installed extension using DeepL and French. A GIF is not bundled; the [demo script](docs/demo-script.md) gives exact recording instructions.

### Translate comments on hover

![DevLingo translating a TypeScript comment to French with DeepL](assets/marketplace/comment-translation.png)

### Translate Markdown safely

![Real French Markdown output beside the English source, with code and links retained](assets/marketplace/markdown-translation.png)

### Native VS Code workflow

![DevLingo command center in VS Code](assets/marketplace/command-center.png)

The command center offers actions for the current editor and shows provider, target language and comment translation state. This capture shows DeepL selected with credentials configured through the secure input.

### Switch translation providers

![DevLingo provider picker showing Google Cloud Translation, DeepL and OpenAI](assets/marketplace/provider-selection.png)

DeepL is selected in this real installed-extension capture. Each cloud provider uses your own credentials.

## Project structure

```text
src/
├── commands/
├── comments/
├── config/
├── hover/
├── markdown/
├── translation/providers/
├── ui/
├── test/
└── extension.ts
docs/
.github/
```

## Documentation

- [Local development, validation and VSIX packaging](docs/development.md)
- [Architecture](docs/architecture.md)
- [Providers and adding a provider](docs/providers.md)
- [Markdown translation](docs/markdown.md)
- [Contributing](CONTRIBUTING.md) and [code of conduct](CODE_OF_CONDUCT.md)
- [Security](SECURITY.md), [roadmap](ROADMAP.md) and [changelog](CHANGELOG.md)

## Contributing

Contributions are welcome: bug fixes, providers, language support, Markdown edge cases, documentation, UX improvements and tests. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Report reproducible bugs and feature requests through [GitHub issues](https://github.com/AndrixNg1/DevLingo/issues/new/choose), without credentials.

## License

[MIT](LICENSE).
