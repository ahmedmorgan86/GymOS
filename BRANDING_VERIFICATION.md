# Dynamic club branding — Windows 1.1.2

- Built-in GYM OS icons: ICO (16–256 px), PNG (32–512 px), Apple touch icon, SVG fallback and web manifest.
- After a verified workspace packet arrives, browser title/favicon/Apple icon and the authenticated PWA manifest use the current club name and uploaded PNG logo. Icon endpoints validate the current tenant and send private/no-store responses.
- Windows receives branding only from the configured app origin. PNG type, encoded size and dimensions are bounded. The application window, taskbar window icon and the GYM OS desktop shortcut update. The last validated club brand is cached locally for the next startup splash.
- Removing the club logo restores the GYM OS symbol. Sign-out clears cached branding. During startup the displayed brand is the last saved identity until the current workspace is verified.
- An EXE file's embedded Explorer icon is fixed at build time; the runtime window and shortcut icons carry the selected club logo. Browser-installed launchers refresh their manifest on the browser's own schedule.

Validation: 63 Node tests; TypeScript; ESLint zero errors/warnings. Native branding smoke test verifies actual ICO decoding, startup persistence, tenant-specific cache paths, invalid-image rejection, logo removal and reset using synthetic data only.
No real club logo was overwritten for these tests.
