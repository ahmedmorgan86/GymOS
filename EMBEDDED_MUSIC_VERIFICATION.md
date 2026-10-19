# Embedded music / Windows mini panel — 1.1.4

Supersedes the external-link behavior described in MUSIC_VERIFICATION.md.

- Music room no longer contains outbound platform anchors. Platform buttons guide URL input; saving a valid content link immediately loads its official embed in a fixed 400px mini panel with collapse and close controls. Empty platform homepages are not accepted as playable content.
- Added official Anghami, Apple Music, Deezer and TIDAL embeds alongside Spotify, YouTube / YouTube Music and SoundCloud. Apple song IDs are retained. Exact host / content validation and bounded links remain.
- Embedded frames allow scripts, forms, presentation and their own origin, but do not permit popups or top-level navigation. Provider full playback, subscription, regional and login limitations remain; no downloads or DRM bypass are implemented.
- Windows 1.1.4 additionally opens the official provider web player in a 400x520 panel inside the main window, with minimize/restore and close. It does not launch an external browser or separate application window.
- The native panel uses a separate profile keyed by owner and branch; GymOS Auth cookies and the native GymOS message bridge are not exposed to providers. Initial navigation has an exact provider host allowlist; subsequent links/popup requests stay inside the panel and require HTTPS. OS URL schemes are blocked. Password autosave and device permissions are disabled.
- Announcements, local music selection, stop-all, sign-out, main-document navigation or workspace-scope changes close the native music panel. Sign-in and full subscriber playback must be completed/tested by the actual provider account holder.

Validation: 67 Node tests; WPF branding/navigation checks including provider URL rejection and per-owner profile isolation; TypeScript and ESLint. Local browser tests loaded Spotify and Anghami widgets, measured 400px fixed panel, collapsed to a 200px iframe, closed to zero iframes, confirmed zero outbound Music room anchors and popup/top-navigation sandbox restrictions. Deezer URL loaded its widget frame; full playback was not confirmed. The native provider control loaded Anghami's full web player and Play reached the provider's login prompt inside GYM OS; no credentials were entered. The final main-window panel is verified separately after publishing.

Official references: https://www.anghami.com/embed ; https://widget.deezer.com/ ; https://developer.tidal.com/documentation/embeds/embeds-overview ; https://support.apple.com/en-ae/guide/music-web/apdm0783785d/web
