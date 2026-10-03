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

## [0.1.0-alpha.3]

### Added

- Markdown file translation
- `DevLingo: Translate Markdown File` command
- Automatic translated file generation using language suffixes
- Markdown-aware translation pipeline
- Translation progress notification
- Automatic opening of translated Markdown files
- Confirmation before replacing an existing translated file
- Additional Markdown translation tests

### Preserved

Markdown translation now preserves developer-specific content and formatting, including:

- Headings
- Bold and italic formatting
- Inline code
- Fenced code blocks
- Markdown links
- URLs
- Images
- Ordered and unordered lists
- Task lists
- Blockquotes
- Horizontal rules
- YAML frontmatter
- HTML blocks and comments
- Markdown document structure

### Changed

- Extended the translation architecture to support full Markdown documents
- Improved separation between VS Code commands and Markdown translation logic
- Reused the existing TranslationService and provider-independent architecture

### Development

DevLingo still uses the development MockTranslationProvider.

A real translation provider will be introduced in a future release.
