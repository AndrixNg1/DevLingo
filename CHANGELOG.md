# Changelog

All notable changes to DevLingo are documented here. The project follows Semantic Versioning.

## [Unreleased]

No changes recorded after the prepared 1.0.0 release.

## [1.0.0]

DevLingo's first stable release. These release notes are prepared for publication; no public release or Git tag has been created yet.

### Added

- Code comment translation on hover, without modifying source files
- Selected-text translation displayed in a separate plaintext editor
- Markdown document translation to language-suffixed sibling files
- Markdown structure preservation for prose, code, links, images, lists, tables, frontmatter and protected HTML
- OpenAI, DeepL and Google Cloud Translation Basic v2 providers
- Secure API key configuration and removal through VS Code SecretStorage
- Translation provider selection and target-language selection
- Comment translation toggle
- Native VS Code QuickPick command center and editor toolbar integration
- Editor context-menu and Command Palette integration
- Provider-aware, bounded in-memory translation caching for hover and Markdown
- Progress notifications, safe output creation and Replace/Cancel confirmation for existing Markdown translations
- Provider-specific authentication, quota, rate-limit, network and service error messages
- VSIX packaging support, PNG icon and four real Marketplace screenshots
- Offline automated tests and CI validation
- Open-source contribution documentation and GitHub issue/PR templates

### Changed

- Removed the development Mock provider from the extension; fixtures remain test-only
- Set DeepL as the default translation provider
- Renew translation features and caches after provider or credential changes without reloading VS Code
- Refined credential prompts, provider selection, hover headings and Markdown progress messages
- Made README asset paths explicit and pinned packaging link resolution to the repository's main branch

### Security

- Provider credentials are stored through VS Code SecretStorage, separately for each provider
- API keys are never stored in workspace/project settings or source files
- Providers receive only the content required for the requested translation
- User-visible failures use controlled messages without raw SDK errors or credentials

### Documentation

- Complete user README covering installation, Quick Start, providers, credentials, languages, features, privacy and troubleshooting
- Architecture, provider, Markdown preservation and development documentation
- Contribution guidelines, code of conduct, security policy and roadmap
- Demo recording instructions and Marketplace asset/package validation guidance
- MIT license and accurate repository/support metadata

## [0.1.0-alpha.5]

### Added

- OpenAI translation provider
- DeepL translation provider
- Google Cloud Translation provider
- Secure provider credentials using VS Code SecretStorage
- Provider-specific error handling
- Provider-aware translation caching
- Cloud provider selection and resolution
- Automated tests for cloud translation providers

### Providers

DevLingo now supports:

- OpenAI
- DeepL
- Google Cloud Translation
- Mock Provider for development and testing

### Security

- API keys are stored securely using VS Code SecretStorage
- Credentials are never stored in workspace settings or source code
- API keys are never exposed in logs or notifications

### Changed

- Translation features can now use real cloud providers
- Translate Selection remains provider-independent
- Comment translation remains provider-independent
- Markdown translation remains provider-independent
- Markdown formatting preservation continues to be handled by DevLingo

### Development

This release completes the initial cloud translation provider layer.

The next development phase will focus on DevLingo's user experience and editor integration.
