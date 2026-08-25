# TypeGremlin Chrome Web Store Listing

This document is the source of truth for TypeGremlin's Chrome Web Store copy,
privacy answers, submission URLs, and graphic-asset checklist.

## Product details

### Name

TypeGremlin

### Summary

A privacy-first text expander that stores your reusable snippets locally.

### Detailed description

TypeGremlin is a privacy-first text expander that turns short, user-created
shortcuts into longer plain-text snippets in standard browser text fields.

Use it for messages, email addresses, repeated instructions, code fragments,
and other text you would rather not type from scratch every time.

Features:

- Create, edit, and delete reusable text snippets.
- Expand shortcuts in standard text inputs and textareas.
- Keep snippets locally on your device using Chrome extension storage.
- Import and export portable JSON backups.
- Avoid expansion in fields detected as password-related.
- Preserve Chrome's normal undo and redo behavior in supported fields.
- Use TypeGremlin without an account, analytics, advertising, or a remote
  service.

TypeGremlin runs on regular webpages so it can recognize your shortcuts where
you choose to type. Shortcut matching and replacement happen locally in your
browser. TypeGremlin does not transmit your snippets, typed content, browsing
history, or website activity to the developer or another service.

TypeGremlin currently supports standard inputs and textareas. Contenteditable
regions and rich-text editors are not supported in this version.

### Category

Productivity

### Language

English

## Privacy practices

### Single purpose

TypeGremlin expands user-created text shortcuts into longer plain-text snippets
inside supported browser text fields.

### Storage permission justification

The `storage` permission is required to save the user's shortcut and replacement
collection locally, keep Settings synchronized with open webpages, and preserve
the collection between browser sessions. TypeGremlin does not use Chrome sync
or transmit this stored data.

### Broad website access justification

TypeGremlin's content script runs on regular webpages because its single purpose
is to expand a user's saved shortcuts wherever they choose to type in supported
standard inputs and textareas. It examines text immediately before the cursor to
detect a matching shortcut and inserts the corresponding locally stored
replacement. Processing stays on the device. TypeGremlin does not collect page
content, browsing history, website addresses, cookies, or unrelated typed text.

### Remote code

TypeGremlin does not use remote code. All executable JavaScript is compiled from
the TypeScript source and included in the extension package.

### Data handling summary

- Snippets are stored locally with `chrome.storage.local`.
- Ordinary typed content is not saved or added to a typing history.
- Shortcut matching occurs locally in the browser.
- No user data is transmitted, sold, shared, or used for advertising.
- No analytics, tracking, external APIs, accounts, or remote services are used.
- Exported and imported JSON backup files are created, read, and validated
  locally at the user's request.

Use the exact dashboard questions shown at submission time to determine the
required data-category selections. Answers must remain consistent with the
extension behavior, this document, and the published privacy policy.

### Limited Use certification

TypeGremlin's use of information complies with the Chrome Web Store User Data
Policy, including the Limited Use requirements.

## URLs

- Privacy policy: https://loridunford.com/typegremlin/privacy.html
- Official website: TODO — choose the public TypeGremlin project page.
- Support URL: TODO — publish or choose a page where users can request help and
  report problems.
- Source repository: TODO — add the public repository URL.

Do not invent or submit placeholder URLs. Complete the TODO items only after
each public page is live and verified over HTTPS.

## Graphic assets

### Required

- [x] Store icon: 128 × 128 PNG with padded artwork
  (`icons/icon128.png`)
- [x] Screenshot 1: 1280 × 800 — create and manage snippets
  (`store-assets/screenshots/01-settings.png`)
- [x] Screenshot 2: 1280 × 800 — saved snippets and local backup/restore
  (`store-assets/screenshots/02-backup-restore.png`)
- [x] Screenshot 3: 1280 × 800 — expansion in a real standard web form
  (`store-assets/screenshots/03-text-expansion.png`)
- [x] Small promotional tile: 440 × 280 PNG
  (`store-assets/typegremlin-small-promo.png`)

At least one screenshot is required. The three planned screenshots provide a
clearer account of the current user experience without advertising unsupported
features.

### Optional

- [ ] Marquee promotional image: 1400 × 560 PNG or JPEG
- [ ] YouTube promotional video

The marquee image and video can wait until after the initial submission.

## Screenshot rules

- Show current TypeGremlin behavior and branding.
- Use 1280 × 800 for high-resolution display.
- Keep screenshots sharp, correctly oriented, square-cornered, and full bleed.
- Use minimal explanatory text and avoid unsupported or comparative claims.
- Do not expose private snippets, accounts, tabs, bookmarks, or personal data.
- Use deliberate demonstration snippets created only for store assets.

## Submission checklist

- [ ] Bump `package.json` and `manifest.json` to the release version.
- [ ] Run `npm run package` and inspect the final ZIP.
- [ ] Load the versioned staging folder in a clean Chrome profile.
- [ ] Complete the full `TESTING.md` smoke test against the packaged build.
- [ ] Upload and verify the required graphic assets.
- [ ] Paste the product description and select Productivity.
- [ ] Complete permission justifications and privacy-practice answers.
- [ ] Add and verify the privacy, website, support, and repository URLs.
- [ ] Confirm the developer account uses two-step verification.
- [ ] Review every dashboard field for consistency before submission.
