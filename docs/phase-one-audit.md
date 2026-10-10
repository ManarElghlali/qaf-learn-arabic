# Qaf phase-one audit

## Existing functionality preserved
- Five existing routes and navigation destinations.
- All 42 approved words, Arabic spelling, tashkeel, units and illustrations.
- Full-word and sound-unit speech playback.
- Adaptive quiz modes, answer checking and scoring.
- Ten-word recording assessment, recognition callbacks and original 0.67 similarity threshold.
- Existing local progress key, streak logic, reminders and demo premium controls.

## Design changes
- Shared warm palette, Manrope/Noto Naskh typography, consistent radii and accessible buttons.
- Compact progress summary and a prominent Start/Continue/Review action.
- Resume uses the first unlearned curriculum word from saved completion IDs; no new storage or lesson data.
- Consistent illustrated destination cards; unavailable lesson outlines remain non-interactive.
- Unified reading controls, quiz feedback, assessment states, profile settings and safe-area navigation.
- No onboarding, new accounts, payment integration or new subscription screen.

## Reference availability
The two mentioned screenshots were not available as attachments. The existing live app and assets were used as the visual baseline.

## Pre-existing functional limitations (not changed in this visual phase)
- Audio uses device speech synthesis, not recorded teacher audio. Arabic voice quality and isolated-sound pronunciation depend on the device.
- A delayed speech queue does not clear pending timeouts; rapid taps may enqueue older speech despite cancellation.
- Speech recognition ignores tashkeel, checking letter similarity rather than exact short vowels. Recognition support varies by browser and service availability.
- Holding the microphone while permission is pending can miss the release event; recognition can end before the user releases, and callback timers are not cancelled on navigation. Media capture is not a separate audio-analysis fallback.
- Test scores are persisted by the existing Save & try again action, not automatically upon finishing.
- Quiz misses and scores are session state, not persistent progress.
- Reminder setting requests notification permission and sends a confirmation; it does not schedule daily notifications.
- Existing premium purchase and restore controls are demos, not real billing.

These items require a separate functional phase; the redesign does not simulate results or conceal these limitations.