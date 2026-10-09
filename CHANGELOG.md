# Changelog

All notable changes to DevLingo are documented here.

DevLingo follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

No unreleased changes yet.

---

## [1.0.0]

DevLingo's first stable release.

### Added

- Code comment translation on hover, without modifying source files
- Selected-text translation displayed in a separate plaintext editor
- Markdown document translation to language-suffixed sibling files
- Markdown structure preservation for prose, code, links, images, lists, tables, frontmatter, and protected HTML
- OpenAI translation provider
- DeepL translation provider
- Google Cloud Translation Basic v2 provider
- Secure API key configuration and removal through VS Code SecretStorage
- Translation provider selection
- Target-language configuration and selection
- Comment translation toggle
- Native VS Code QuickPick command center
- Editor-title toolbar integration
- Editor context-menu actions
- Command Palette integration
- Provider-aware, bounded in-memory translation caching for hover and Markdown
- Progress notifications
- Safe Markdown output creation
- Replace/Cancel confirmation for existing translated Markdown files
- Provider-specific authentication, quota, rate-limit, network, and service error handling
- VSIX distribution support
- Marketplace product assets including the DevLingo icon and product screenshots
- Offline automated tests and CI validation
- Open-source contribution documentation
- GitHub issue and pull request templates

### Changed

- Removed the selectable Mock provider from the installed extension; deterministic mock fixtures remain available for automated testing
- Set DeepL as the default translation provider
- Translation features and caches now refresh after provider or credential changes without requiring a VS Code reload
- Refined credential prompts and provider-selection UX
- Improved comment-hover presentation
- Improved Markdown translation progress messages
- Improved README asset paths and packaging compatibility

### Providers

DevLingo v1.0.0 supports three production translation providers:

- OpenAI through the official SDK and Responses API
- DeepL through the official SDK
- Google Cloud Translation Basic v2 through the official SDK

DeepL is the default provider.

A deterministic `FixtureTranslationProvider` remains available exclusively for development and offline automated testing. It is not exposed in the installed extension's provider selector.

### Markdown

- Translate prose in headings, paragraphs, emphasis, lists, task lists, blockquotes, link labels, and GFM table cells
- Preserve inline code
- Preserve fenced code blocks
- Preserve indented code blocks
- Preserve URLs
- Preserve Markdown link destinations and titles
- Preserve images
- Preserve reference definitions
- Preserve horizontal rules
- Protect supported YAML frontmatter
- Protect supported HTML regions and comments
- Create language-suffixed sibling files without modifying the source document
- Provide Replace/Cancel confirmation when the translated output already exists

DevLingo follows the principle:

> Translate content, preserve structure.

### Security

- Provider credentials are stored through VS Code SecretStorage
- Credentials are stored independently for each provider
- API keys are never intentionally stored in repository files
- API keys are never stored in workspace or project settings
- API keys are never embedded in source files
- DevLingo follows a Bring Your Own Key model
- Translation requests are sent directly to the provider selected by the user
- Providers receive only the content required for the requested translation
- User-visible provider failures use controlled error messages instead of exposing raw SDK errors or credentials

### Documentation

- Complete user README
- Installation documentation
- Quick Start guide
- Translation provider configuration
- API credential configuration
- Target-language configuration
- Comment translation documentation
- Selected-text translation documentation
- Markdown translation documentation
- Markdown preservation documentation
- Privacy documentation
- Troubleshooting guide
- Architecture documentation
- Provider development documentation
- Development documentation
- Contribution guidelines
- Code of Conduct
- Security policy
- Project roadmap
- Demo instructions
- Marketplace asset guidance
- MIT license
- GitHub issue templates
- Pull request template

### Distribution

- VSIX packaging validated during development
- Installed-extension workflow validated
- DevLingo prepared as the first stable `1.0.0` release
- Visual Studio Marketplace publication follows the GitHub v1.0.0 release

---

## [1.0.1]

### Changed

- Changed the Marketplace extension identifier to `devlingo-translate` to avoid a naming conflict.
- Updated the extension display name to `DevLingo Translate`.

No runtime functionality changed.

## [0.1.0-alpha.5]

Cloud translation providers milestone.

### Added

- OpenAI translation provider
- DeepL translation provider
- Google Cloud Translation provider
- Provider-specific credential handling
- Secure provider API key storage through VS Code SecretStorage
- Provider selection
- Provider-specific error handling
- Translation integration with real external services

### Changed

- Connected the translation features to production translation providers
- Improved provider resolution and configuration behavior
- Expanded translation-service integration for multiple providers

### Development

- Kept deterministic mock translation support for offline development and testing
- Added provider-focused validation and test coverage

---

## [0.1.0-alpha.4]

Translation-provider infrastructure milestone.

### Added

- `TranslationProvider` abstraction
- Central translation service
- Provider registry and resolver
- Provider-aware translation architecture
- Secure credential-management infrastructure
- Bring Your Own Key foundation
- Translation caching infrastructure
- Provider configuration support

### Changed

- Decoupled translation features from individual translation implementations
- Prepared comment and Markdown translation for multiple providers
- Structured the project so additional translation providers could be added without rewriting feature logic

### Development

- Added infrastructure for production cloud providers
- Improved testability through provider abstraction and mock implementations

---

## [0.1.0-alpha.3]

Markdown translation milestone.

### Added

- Markdown file translation
- Language-suffixed translated output files
- Markdown parsing and translation pipeline
- Markdown structure protection
- Preservation of developer-oriented content such as code and URLs
- Safe translated-file creation
- Initial Markdown translation commands

### Markdown

- Preserved fenced code blocks
- Preserved inline code
- Preserved URLs and link destinations
- Preserved Markdown structure while translating human-readable content
- Kept original Markdown files unchanged

### Changed

- Expanded DevLingo beyond code comments to documentation translation

---

## [0.1.0-alpha.2]

Code comment translation milestone.

### Added

- Code comment detection
- Comment translation on hover
- VS Code HoverProvider integration
- Non-destructive comment translation
- Target-language configuration
- Translation service integration for comment content
- Initial translation caching

### Changed

- Improved the extension's core translation workflow
- Kept translated comments outside source files so code remains unchanged

### Development

- Added automated coverage for comment extraction and translation behavior

---

## [0.1.0-alpha.1]

Initial DevLingo foundation.

### Added

- Initial VS Code extension project
- TypeScript-based extension architecture
- Core command registration
- Initial configuration system
- Translation service foundation
- Development mock translation provider
- Basic extension activation and lifecycle handling
- Initial testing infrastructure
- Linting and compilation setup
- Continuous integration foundation
- Initial project documentation

### Architecture

Established the first DevLingo project structure and the foundation used by subsequent translation features.

---

[Unreleased]: https://github.com/AndrixNg1/DevLingo/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/AndrixNg1/DevLingo/compare/v0.1.0-alpha.5...v1.0.0
[0.1.0-alpha.5]: https://github.com/AndrixNg1/DevLingo/compare/v0.1.0-alpha.4...v0.1.0-alpha.5
[0.1.0-alpha.4]: https://github.com/AndrixNg1/DevLingo/compare/v0.1.0-alpha.3...v0.1.0-alpha.4
[0.1.0-alpha.3]: https://github.com/AndrixNg1/DevLingo/compare/v0.1.0-alpha.2...v0.1.0-alpha.3
[0.1.0-alpha.2]: https://github.com/AndrixNg1/DevLingo/compare/v0.1.0-alpha.1...v0.1.0-alpha.2
[0.1.0-alpha.1]: https://github.com/AndrixNg1/DevLingo/releases/tag/v0.1.0-alpha.1