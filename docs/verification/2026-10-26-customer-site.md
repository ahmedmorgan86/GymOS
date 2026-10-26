# Customer-facing website and sign-in branding — 2026-10-26

Reworked the marketing page around the purchase journey: an actual club dashboard first, explicit member/membership/attendance/collections features, team and branch access, app downloads, trial setup and activation/support by agreement. Removed generic slogans from public copy and the product gallery. No published software package prices or invented customer testimonials.

The dashboard image was captured exclusively from a synthetic fixture in a temporary copy of the existing Workspace component. Live workspace loading and branding writes were replaced in that temporary copy; record names and financial values were obscured. Decorative dashboard banners were hidden for capture. The fixture and routes were removed. No live customer data appears in the image. Men-only gym photography remains in a secondary section.

Added CSS hero/device motion, workflow pulses, icon/card hover treatments, button sheen, viewport reveals and scroll progress. A persistent pause control disables animations; reduced-motion preferences bypass the reveal observer and disable CSS motion. Local browser counted21 animated elements when enabled and zero when paused. The restoration attempt was interrupted by navigation; no successful restoration is claimed in that observation.

Sign-in now has a centered104px logo and40px wordmark on desktop,92px/36px on mobile, a separate language control, aligned field spacing and clearer headings. Authentication submission, registration requirements and return targets are unchanged. The support wordmark has its own size cap.

Validation:166 unit tests passed with7 optional database tests skipped. Typecheck, lint and production build passed. Local Arabic320px sign-in had305px document width without horizontal overflow; language switching to English was verified by the visible heading and direction after a coordinate click. Preview screenshots use blank fields; no credential values are included in delivery. No sign-in, registration, message, payment or business-data mutation was submitted during this UI review.
