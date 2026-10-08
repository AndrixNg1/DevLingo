# Roadmap

DevLingo 1.0.0 is prepared locally for its first public release. It has not been published or tagged. This roadmap describes direction, not dated delivery commitments.

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
- Command Palette integration, target-language selection and comment translation toggle
- UX polish for credentials, provider switching, hover and Markdown output
- Automated lint, compile and offline tests
- VSIX packaging and installed-extension testing, validated by the maintainer
- Removal of the development Mock provider; test fixtures remain offline
- User, architecture, provider, Markdown and development documentation
- Contribution guidelines, security policy, MIT licensing and GitHub templates
- Marketplace artwork: PNG icon and four real screenshots prepared locally

## Current phase

- Marketplace preparation and final readiness review
- Make README screenshots available over HTTPS on the public repository, then verify their rendering in the installed VSIX
- Confirm publisher access and private security reporting availability before publication

## Next

- Marketplace publication after readiness checks pass
- Create the `v1.0.0` Git tag and GitHub release with the verified VSIX

## Future ideas

- Extend target-language coverage using the shared language registry.
- Address reported comment-detection and Markdown edge cases with regression tests.
- Evaluate configurable OpenAI models and additional providers, including local translation, without coupling features to providers.
- Record a reviewed demo GIF using the existing demo script.

These are possible follow-up improvements, not delivery commitments.
