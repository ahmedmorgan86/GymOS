# Music room verification — 2026-10-19

## Delivered
- Shared bilingual Music room in the web app and Windows WebView2 shell.
- Device-local IndexedDB audio library, scoped by verified owner and selected branch. No upload, cloud sync or inclusion in gym backups. Up to 100 files / 250 MiB per scope, 25 MiB per file. Actual codec support depends on device.
- HTML audio controls, volume, previous/next, shuffle excluding current track, repeat track and stop. Playback remains available while navigating within the same workspace; changing owner/branch/role or signing out unmounts and stops the player. No automatic playback after app launch.
- Saved device-local platform links (50 maximum). Exact HTTPS host allowlist; rejects credentials, nonstandard ports, arbitrary HTML and untrusted embed hosts. Tracking stripped. No provider credentials or unofficial streaming/download API.
- Spotify, YouTube / YouTube Music and SoundCloud official embeds loaded only after an explicit click. Video frame stays visible while playing; navigating away removes embed. Anghami, Apple Music, Deezer and TIDAL open their official browser destination. Windows opens external links in the default browser.
- During any GymOS announcement request local music volume becomes 15% of selected volume and returns after completion/failure/stop; concurrent speech IDs tracked independently. Embedded platform is removed and must be restarted manually. External browser/app audio cannot be controlled.
- Only existing owner/manager edit roles may import, edit, remove or operate the in-app player. No new backend access or role escalation.

## Tests performed
- 66 Node tests pass, including provider URL sanitization, malicious URL rejection, embed generation, file size/type bounds and deterministic shuffle/next.
- TypeScript and ESLint checked. Production Next webpack build checked.
- Temporary local React harness exercised real IndexedDB import of a generated 12-second WAV and actual browser playback (duration 12, paused false), stop and persistence after reload.
- Switching test owner scope showed an empty library; switching to read-only disabled import, save, player and remove controls.
- Actual media volume-change UI confirmed 65% -> 10% (rounded from 9.75%) during synthetic speech event -> 65% after completion.
- Official Spotify embed loaded its playlist and controls. A synthetic announcement removed the iframe (count 0). No paid account login or full subscription stream tested.
- Temporary test route removed before publication; no gym records modified by these tests.

## Limits
- Premium/full-track playback, regional availability, ads and embed restrictions belong to each provider. YouTube Music links use the official YouTube video/list player where IDs are supported; not a separate YouTube Music SDK login.
- Anghami/Apple Music/Deezer/TIDAL integration is an official external link, not an embedded or account-connected library.
- No cross-device music file sync, background Windows service, audio output-device selector, music downloads, or control over external apps.
- Local storage is subject to browser/device quota and removal by browser data clearing. Keep original audio files.
- This verification does not assert physical speaker volume, every codec, or account-based playback on all eight platforms.
