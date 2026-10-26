# Public homepage and return navigation — 26 October 2026

The bare root URL now renders the public website regardless of an existing account/session or selected club. It does not read account identity or commercial context to decide the public rendering. Public titles/canonical metadata remain public for signed-in visitors as well.

Management is an explicit `/?workspace=1` navigation after club selection, invitation acceptance or support entry; the existing identity, club/license, branch and support checks remain enforced. This preserves compatibility with the installed Windows trusted-root bridge. Ordinary sign-in and email confirmation lead to My clubs; member password recovery and member callback targets remain allowlisted.

The public site has visible Sign in and My clubs links at desktop/mobile widths. Clubs, the management sidebar and sign-in screen have clearly labelled links back to the main website. No logout or customer data modification is required to browse the website.

Offline preparation now caches only the explicit management URL, in shell cache v11. Public root navigations cannot fall back to the private management shell. Management PWA start URL is My clubs. The existing offline dependency preparation tests now distinguish public HTML from authenticated management HTML.

Validation:177 unit cases passed;7 optional database cases skipped. Four additional isolated homepage integration cases passed: logged-out and logged-in public rendering/metadata without reading identity, explicit sign-in/club authorization, missing-club redirects and rejected authorization errors, and malformed/duplicate query parameters. Existing33 mocked HTTP-handler cases remain CI requirements. TypeScript, ESLint and production build passed before final navigation-label-only refinements; final CI repeats all checks. Local browser confirmed public root, visible390px Sign in/My clubs without horizontal overflow, and navigation to the sign-in screen. No passwords or customer records were submitted.
