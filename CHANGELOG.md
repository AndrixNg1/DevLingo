# Changelog

All notable changes to DevLingo will be documented in this file.

The project follows Semantic Versioning.

## [Unreleased]

### Added

- Centralized provider IDs and immutable metadata for mock and planned Google, DeepL and OpenAI providers
- Provider resolver with explicit unavailable, unknown and missing-credential errors
- SecretStorage credential manager and configure/remove credential commands
- Available-provider selection command and `devlingo.translationProvider` setting, defaulting to mock
- Provider configuration, credential security, resolver and cache-invalidation tests
- Markdown file translation using the existing provider-independent service and mock provider
- Preservation of Markdown structure, code, links, images, frontmatter and HTML
- Target-language filenames, progress notifications and automatic output opening
- Atomic output creation and explicit confirmation before replacing existing translations
- Markdown, filename, filesystem and command integration tests

### Changed

- Translation features and caches are renewed on provider configuration changes without reloading VS Code
- Reused the bounded translation cache across hover and Markdown translation

### Planned

- Translation provider integration

## [0.1.0-alpha.4]

### Added

- Multi-provider translation architecture
- Centralized translation provider registry
- Translation provider metadata and availability management
- Translation provider resolver
- Secure provider credential storage using VS Code SecretStorage
- Provider API key configuration command
- Provider API key removal command
- Translation provider selection infrastructure
- Provider-related unit tests

### Changed

- DevLingo translation infrastructure is now ready to support multiple cloud providers
- Translation provider configuration is centralized
- TranslationService remains fully provider-independent
- Provider-specific logic is isolated from Markdown, hover, and selection translation features

### Security

- API credentials are stored only through VS Code SecretStorage
- Provider credentials are never stored in settings or source files
- Credentials are never logged or displayed after being saved

### Providers

Provider infrastructure is prepared for:

- Google Cloud Translation
- DeepL
- OpenAI

The MockTranslationProvider remains the active development provider.

No external translation API is integrated in this release.