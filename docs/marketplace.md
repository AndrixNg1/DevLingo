# Marketplace preparation

**DevLingo v1.0.0 is the first stable release**, with publisher **andrixng**. It has not been published to the VS Code Marketplace. The manifest and lockfile remain at version 1.0.0. The maintainer handles final validation and Git/GitHub release operations separately from documentation preparation.

## Prepared assets and metadata

| Asset | Dimensions | Purpose |
| --- | --- | --- |
| `assets/icon.png` | 1254 × 1254 | Extension icon; maintainer artwork, RGB PNG |
| `assets/marketplace/command-center.png` | 1440 × 900 | Native VS Code command center |
| `assets/marketplace/comment-translation.png` | 1440 × 900 | Real DeepL French comment hover |
| `assets/marketplace/markdown-translation.png` | 1440 × 900 | Real French Markdown output beside the source |
| `assets/marketplace/provider-selection.png` | 1440 × 900 | Google Cloud Translation, DeepL and OpenAI picker |

The screenshots use a clean public demo workspace. They contain no API keys or private source material. Keep the original captures; do not generate replacement UI or translations.

The four screenshots total approximately **332 KiB**. They are already compact PNGs. There is no raw video or demo GIF in the package. The [demo script](demo-script.md) is the fallback; a GIF is optional and must not be referenced until a reviewed file exists.

The manifest uses the `Other` category, nine relevant keywords, MIT licensing, the actual GitHub repository/support links and a dark `#0B1830` banner matching the icon. Translation is not a VS Code display-language pack. Badges describe the project version, license, CI and TypeScript; there are no Marketplace download, rating or published-version claims.

## Installed README image diagnosis

The original VSIX included every screenshot, and filename casing and relative paths matched. `.vscodeignore` did not exclude the images. The failure occurred because `vsce` rewrote image references to GitHub HTTPS URLs such as:

```text
https://github.com/AndrixNg1/DevLingo/raw/HEAD/assets/marketplace/comment-translation.png
```

Those URLs returned **HTTP 404**. Before the asset push on 2026-10-08, the public repository's `main` branch was at `cb2c831091365e22ccd659e0a80b9353fe970730` and did not contain the `assets` directory. The local assets had not reached the public branch.

README now uses explicit `./assets/marketplace/*.png` paths. The manifest sets `vsce.githubBranch` to `main`, so a standard package resolves them against that branch. These local corrections make the intended paths unambiguous; **they do not upload the files**.

The installed extension details renderer needs accessible HTTPS image sources. Packaging an image alone is insufficient. See the official [VS Code publishing documentation](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#marketplace-integration).

**Resolved on 2026-10-08:** the prepared assets and documentation were pushed to the public `main` branch in `af827a8`. All four screenshot URLs return **HTTP 200**, and the downloaded PNGs match the repository files. The icon, README, badges and all four screenshots render in the installed extension's details page. Repository hosting and Marketplace publication are separate steps; DevLingo is still unpublished on the Marketplace.

## Maintainer package and visual validation

The following commands are for the maintainer's final validation or future packaging changes; a documentation-only preparation pass does not execute them. Run from the repository root:

```sh
npm run lint
npm run compile
npm test
vsce ls
vsce package
code --install-extension ./devlingo-1.0.0.vsix --force
```

Inspect the archive and verify:

- The version is 1.0.0 and publisher is `andrixng`.
- The icon and all four referenced PNGs are included with exactly matching case.
- Packaged README links resolve to the intended public `main` assets.
- Each remote image URL returns a PNG response, not a 404 page.
- No source tests, private demo files, credentials, raw videos or missing GIF references are included.
- Required SDK dependencies and compiled extension files remain available.

Then open **Extensions → DevLingo → Details** in normal VS Code, outside the Extension Development Host. Check the icon, README and badges, and scroll to each of the four screenshots. A packaged file, a successful installation or the editor's Markdown preview alone does not validate the installed extension's README.

Do not mark Marketplace documentation complete while a screenshot is broken. After remote assets become accessible, rebuild the VSIX and inspect the exact build intended for distribution.

### Development validation record (2026-10-08)

- Version and publisher: **1.0.0**, **andrixng**; manifest and lockfile agree.
- Package checked during development: icon and all four README screenshots included; approximately **7.98 MiB** compressed, with no raw video or missing GIF reference.
- Installed view checked during development: icon, README, four badges and all four screenshots rendered in normal VS Code after VSIX installation.
- Public documentation at that check: README, changelog, roadmap, contribution and security guides, and the linked technical/demo guides returned HTTP 200.
- Development validation: lint and compilation passed; **288 tests passed**. GitHub CI passed for the pushed documentation commits.

These are prior development results, not validation performed during final documentation preparation. The maintainer performs final validation manually. A distribution package must include the final documentation; rebuild it through the maintainer's normal packaging workflow if the existing VSIX predates those edits.

If a network interruption leaves an image blank, restore connectivity and reload the extension details page before repeating the visual check.

## Before publication

- Confirm access to the `andrixng` Marketplace publisher account.
- Enable GitHub private vulnerability reporting or document another private reporting channel; GitHub reports it disabled as of 2026-10-08.
- Perform the maintainer's final review of the verified VSIX and release metadata.

The maintainer creates and pushes the `v1.0.0` tag and GitHub Release after final validation. VS Code Marketplace preparation and publication follow as a separate distribution step. A GIF is optional and is not a release blocker.
