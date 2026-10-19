# Splash image quality — Windows 1.1.3

- Default splash now uses a dedicated embedded 512px PNG instead of decoding a multi-frame ICO. The ICO remains the executable icon.
- Runtime club splash keeps the original bitmap (bounded decoding to 1024px width) independently of the 256px shortcut image. Small logos are not enlarged to a square; aspect ratio and transparency are retained.
- WPF layout rounding, device pixel snapping, HighQuality bitmap scaling and DownOnly image stretching reduce blur on high-DPI screens.
- Newly uploaded club logos keep up to 1024px, with high-quality canvas resampling and adaptive downscaling to the existing 1.4M-character storage limit. Existing small uploads cannot recover original detail; the UI explains when to re-upload the original.

Validation: WPF branding regression verifies embedded 512px splash, separate 256px ICO, unchanged 96x48 small-logo aspect ratio, cached identity restore, invalid input rejection and reset. Windows 1.1.3 publish, TypeScript, ESLint for logo picker and production Next build pass.
