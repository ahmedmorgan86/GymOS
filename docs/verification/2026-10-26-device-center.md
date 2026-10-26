# Device center — 26 October 2026

## Delivered
- Windows SetupAPI read-only inventory, bounded to 200 relevant records. Native hot-plug notifications debounce refresh. The page receives an opaque ID, sanitized display name, category and `detected` status, never raw instance paths or fingerprint templates.
- Native delivery accepts only the trusted HTTPS root and a valid per-mount request nonce. Navigation/unmount revokes watch delivery. Unknown desktop commands remain rejected.
- Settings → Devices & connections: browser-permitted cameras and outputs, separate photo/attendance camera preferences, keyboard-wedge input test, short audio test and Windows sound settings.
- Preferences are local to tenant, branch and device. Configuration is restricted to authorized administrators outside read-only support. No server records, schema or production customer data are changed.
- Camera sessions begin only after explicit user action. On disconnection capture stops; automatic recovery targets the same actual device, respects visibility/recovery/permissions and cancels late streams after stop or unmount. Face capture checks live session identity before and after asynchronous processing. Stale frames cannot initiate attendance.

## Verification
- 175 unit cases passed; 7 optional database cases skipped. Nine new device/camera cases include malformed payloads, scope isolation, denied permission, late permission responses, same-device recovery, simultaneous notifications, ended streams and stale-session rejection.
- Windows: 16 category classification cases plus trusted-origin/nonce/command boundary checks passed. Read-only enumeration returned 27 records (including virtual printer/input entries): 2 audio, 3 audio controllers, 6 HID, 2 keyboards, 2 network adapters, 8 printers, 1 serial port, 3 USB entries.
- No camera or biometric sensor was exposed on this computer. No physical scanner/card reader, camera, biometric terminal or reconnect operation was certified.
- Local browser: synthetic input acknowledged without attendance; branch A recovery preference did not change branch B; read-only mode had no configuration inputs. No audio was played by this inspection.

## Acceptance still required
1. Choose actual hardware models and verify OS drivers from the vendor.
2. Keyboard-wedge scanner: configure Enter suffix; scan an assigned test card in Reception, verify branch/expiry/duplicate rules and focus behavior.
3. Camera: grant permission, select the intended device, test photo and QR/face enrollment with explicit consent; unplug/reconnect and confirm same-device recovery on Windows and target phones.
4. Audio: confirm physical output and volume; printers: test real paper size and barcode readability.
5. Biometric/serial/network/PCSC hardware: implement or configure the vendor protocol/SDK in the existing scoped signed-event integration, then test replay protection, branch mapping, permissions and real events before enabling it.

Detection does not install drivers, grant OS permission, discover every network endpoint, bypass SDK restrictions, or guarantee every model. A standard keyboard-emulating scanner may be listed as a keyboard and still work. A detected sensor may be unusable until its vendor integration exists.

Sources: [Microsoft SetupDiGetClassDevs](https://learn.microsoft.com/en-us/windows/win32/api/setupapi/nf-setupapi-setupdigetclassdevsw), [WM_DEVICECHANGE](https://learn.microsoft.com/en-us/windows/win32/devio/wm-devicechange), [Media enumeration](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices).
- Re-run validation for this change: TypeScript, ESLint, production Next build and Windows Release build passed. All 33 mocked HTTP-handler integration cases passed. These are isolated handler checks, not external-provider or physical hardware certification.

## Released artifacts and search notification
- Device implementation merged in PR38, production merge e6c6f9367adc86835592ea72cf8c8e765532e50d; Vercel deployment dpl_EKVnQVEUrCb6m4r2gdtdNxWZuXqd was READY on the production alias.
- Windows1.1.11 executable:169537073 bytes; SHA256 `864b26f0d925f76ef2123b3216f82e23ec43c77d77fa026a2cd6e1ad84ad34fb`. ProductVersion records source b6e3c166fd4f7fac1ed0321fce14fbe26505a59c. Publisher remains unsigned.
- Six bilingual PDFs regenerated (133 pages); changed pages rendered and reviewed. Download routing updated only after the GitHub release asset was uploaded and published.
- IndexNow accepted the three public-page notifications with HTTP200 after public preflight. This does not confirm indexing/ranking or ownership verification in Google/Bing/Yandex consoles.
