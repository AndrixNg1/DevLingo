# Roadmap

DevLingo v1.0.0 is the first stable release. Final release preparation is in progress; VS Code Marketplace publication has not been performed. This roadmap describes direction, not dated delivery commitments.

## Completed

- Core provider-independent translation architecture
- Code comment translation on hover
- Selected-text translation
- Markdown file translation and Markdown structure preservation
- OpenAI translation provider
- DeepL translation provider
- Google Cloud Translation Basic v2 provider
- Secure credentials through VS Code SecretStorage
- Provider selector and provider-isolated translation caches
- Native command center, editor toolbar and context menus
- Command Palette integration
- Target-language configuration and selection
- Comment translation toggle
- UX polish for credentials, provider switching, hover and Markdown output
- Automated lint, compile, offline tests and CI established during development
- VSIX packaging and installed-extension testing, validated by the maintainer
- Offline development/test mock fixtures; the installed extension offers three cloud providers
- User, architecture, provider, Markdown and development documentation
- Contribution guidelines, security policy, MIT licensing and GitHub templates
- Marketplace artwork: PNG icon and four real screenshots included in the VSIX and available on the public repository
- Installed README verification: icon, badges and all four screenshots render after the asset push
- Final v1.0.0 user and technical documentation

## Current phase

- Final v1.0.0 release preparation
- Maintainer performs final validation, commit, push, annotated Git tag and GitHub Release

## Next

- VS Code Marketplace preparation: confirm publisher access and configure private vulnerability reporting
- VS Code Marketplace publication

## Future ideas

- Extend target-language coverage using the shared language registry.
- Address reported comment-detection and Markdown edge cases with regression tests.
- Evaluate configurable OpenAI models and additional providers, including local translation, without coupling features to providers.
- Record a reviewed demo GIF using the existing demo script.

These are possible follow-up improvements, not delivery commitments.
