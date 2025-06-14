# Lain Sentinel

A browser extension inspired by *Serial Experiments Lain* that protects your navigation from malicious scripts and trackers.

## Installation

1. **Google Chrome**:
   - Open `chrome://extensions/`.
   - Enable "Developer mode" (top right).
   - Click "Load unpacked" and select the `lain-sentinel` folder.
2. **Mozilla Firefox**:
   - Open `about:debugging#/runtime/this-firefox`.
   - Click "Load Temporary Add-on" and select `manifest.json` from the `lain-sentinel` folder.

## Security Notes
- No external dependencies are used, ensuring a secure environment.
- Regularly update the `blocklist.json` to stay protected against new threats.
- Use the whitelist feature for trusted sites to avoid false positives.

## Extending Detection
- Modify `isSuspiciousScript()` in `background.js` to add new patterns or rules.
- Update `blocklist.json` with additional malicious URLs.

## Migrating to Manifest V3
- Replace `background` with `background.service_worker` and use a service worker file.
- Use `action` instead of `browser_action`.
- Switch to `declarativeNetRequest` for blocking instead of `webRequestBlocking`.
- Remove `persistent`: true and adjust background task handling.