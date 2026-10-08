# Changelog

All notable changes to DevLingo will be documented in this file.

The project follows Semantic Versioning.

## [Unreleased]

### Added

- Open-source contributor documentation and development/packaging guide
- Architecture, provider and Markdown translation documentation
- GitHub bug/feature issue forms and pull request template
- MIT license and package license metadata, approved by the maintainer
- Security policy, code of conduct and roadmap
- Manual demo recording script and asset guidance

- Native DevLingo command center launched from a theme-aware globe icon in the editor title toolbar
- Context-aware QuickPick actions and editor context menus that reuse existing translation commands
- Target-language picker, native settings shortcut and visible provider credential state
- Configurable comment translation toggle, enabled by default, that suppresses inactive and pending hover results
- Command-center construction, routing, cancellation, settings and hover-toggle tests

- Google Cloud Translation Basic v2 provider using the official `@google-cloud/translate` SDK
- API-key injection through the existing SecretStorage resolver and provider commands
- Plain-text translation with automatic or explicit source language
- Sanitized authentication, enablement, billing, quota, rate-limit, network and service errors
- Offline Google provider, feature, credential and cache-isolation tests

- Functional DeepL provider using the official `deepl-node` SDK and `translateText()`
- Registry-based DeepL language mapping with automatic source detection and US English target
- Controlled DeepL authentication, quota, rate-limit, connection, service and language errors
- Offline DeepL provider, credential, feature and OpenAI/DeepL cache-isolation tests

- Functional OpenAI translation provider using the official SDK and non-streaming Responses API
- Centralized `gpt-5.6-luna` model with reasoning disabled, text-only prompts and automatic/explicit source language
- Controlled authentication, rate-limit, network, service and invalid-response errors
- Offline provider, feature-integration, Markdown protection and cache-isolation tests

- Centralized provider IDs and immutable metadata for mock, Google, DeepL and OpenAI providers
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

- Provider pickers identify the current provider and avoid redundant selection notifications
- Missing-key prompts offer Configure/Later and open the selected provider directly
- Clear masked credential prompts and confirmation before removing a saved key
- Comment hover headings include the target language and suppress results after a language change
- Markdown progress names the source file; selection picker uses uppercase language codes

- Rewritten user-facing README with current provider, credential and installation guidance
- Removed Mock from the extension; DeepL is the default and fixtures remain test-only
- Distinguish OpenAI exhausted credits/quota from temporary rate limits
- Added isolated extension debugging and disabled debugger Network view

- Google Cloud Translation, DeepL and OpenAI are selectable alongside mock
- Translation features and caches are renewed on provider configuration and credential changes without reloading VS Code
- Cache keys include provider identity and optional source language; each cache remains isolated to its provider lifetime
- Reused the bounded translation cache across hover and Markdown translation

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