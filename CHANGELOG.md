# Changelog

All notable changes to DevLingo will be documented in this file.

The project follows Semantic Versioning.

## [Unreleased]

### Added

- Markdown file translation using the existing provider-independent service and mock provider
- Preservation of Markdown structure, code, links, images, frontmatter and HTML
- Target-language filenames, progress notifications and automatic output opening
- Atomic output creation and explicit confirmation before replacing existing translations
- Markdown, filename, filesystem and command integration tests

### Changed

- Reused the bounded translation cache across hover and Markdown translation

### Planned

- Translation provider integration

## [0.1.0-alpha.2]

### Added

- Code comment detection
- Comment translation on hover
- Configurable target language
- In-memory translation cache
- Additional translation architecture tests
