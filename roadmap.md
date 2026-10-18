# Onboarding and quiz adjustments
- [ ] Apply October 18 marked fixes: compact screen spacing, single Arabic labels, prominent optional first-quiz action and clean 3D open-book badge; preserve activities and verify phone layouts.
- [x] Apply the October 17 reference treatment to welcome, first quiz and shared app surfaces; verified quiz-to-lesson flow, English/Arabic layouts, no horizontal overflow, 66 passing tests and fresh preview build OK. Installed native appearance still needs a rebuilt app.
- [x] Add the existing matching illustration to Learn by listening and single-language path labels.
- [x] Use three free quiz formats; update copy and migrate existing completion by matching format.
- [x] Sample unique words for every quiz and 70% (rounded up) of each full Reading unit; 66 tests passed, latest preview build OK, and a complete six-target free quiz saved completion and opened Build the word without browser errors.

# Language and Sound Practice refinement
- [x] Add persistent English/Arabic selection without removing existing onboarding steps.
- [x] Centralize interface translations and RTL; add language choice in Profile. Existing English word meanings and legal documents remain explicitly English.
- [x] Match Sound Practice letter tiles to the reference while preserving sets, audio, progress and access locks.
- [x] Verify welcome, language switching, sound playback and existing regression tests (62 passed).

# Mobile-store foundation
- [x] Add manifest and matching Qaf public icons and head links.
- [x] Add Privacy and Profile access while preserving offline behavior and learning data.
- [x] Verify icons, navigation, metadata, phone layouts and existing tests; physical devices and published install/offline tests remain release checks.
- [ ] Confirm third-party audio retention before store submission (requires provider confirmation).

# Shaddah
- [x] Add all four exact word banks (32 words) with independent lessons, quizzes and reading tests.
- [x] Create 24 storybook subjects mapped to all 32 words and recordings for all 32 words and 46 distinct tiles; refine flagged word clips.
- [x] Verify exact curriculum, saved progress and every lesson/quiz on three phone sizes; recorded microphone samples advance in all four tests and wrong Tanween/gemination examples are rejected. AI listening remains variable and occasionally disagrees on generated samples; real-device pronunciation and listening verification remains necessary.

# Tanween Kasr
- [x] Add exact 20-word bank and isolated lessons, quiz and reading test.
- [x] Create 20 elegant line-art illustrations and teacher recordings for every word and sound tile.
- [x] Verify exact words, progress isolation and all recordings; all 20 lessons and 10 quiz questions fit three phone sizes. A recorded microphone sample advances, and the same audio fails a wrong final vowel. Real-device listening remains user verification.

# Tanween Damm
- [x] Add exact 18-word bank and isolated lessons, quiz and reading test.
- [x] Create storybook illustrations and teacher recordings with audible un endings.
- [x] Verify literal sounds, progress isolation, all 18 lessons and 10 quiz questions on three phone sizes; a recorded microphone sample advances and wrong-word audio fails. Real-device listening remains user verification.

# Tanween Fath
- [x] Add exact 30-word bank and isolated Tanween lessons, quiz and reading test.
- [x] Create editorial illustrations and teacher recordings with audible fathatan endings.
- [x] Verify progress isolation, assessment sounds, audio and one-screen layouts; microphone sample advances and wrong vowel recordings fail.

# Madd Yā
- [x] Add exact 25-word bank and isolated Learn, Quiz and Test integration.
- [x] Create modern storybook artwork and teacher recordings for every word and grouped sound.
- [x] Verify word bank, saved progress, audio, reading assessment and one-screen layouts; captured sample advances the test.

# Madd Waw
- [x] Add exact 26-word bank and isolated lesson, quiz and test integration.
- [x] Create premium flat artwork and teacher recordings for words and grouped sounds.
- [x] Support long uu and diphthongs in reading checks.
- [x] Verify unit isolation, audio and one-screen phone layouts; recorded sample passes through microphone capture and advances.

# Qaf premium refinement
- [x] Audit existing screens, functionality and assets.
- [x] Apply shared palette, typography, navigation and accessible controls.
- [x] Refine Home curriculum and saved-progress continuation.
- [x] Refine Learn, Quiz, Test and Profile without changing their engines.
- [x] Verify mobile layouts, navigation, saved progress, audio requests and microphone denial; real spoken assessment requires a supported device.
- [x] Document pre-existing functional limitations separately.

# Reference-led Home refinement
- [x] Audit existing functionality and apply the supplied reference to Home and shared navigation.
- [x] Preserve real continuation, all lesson data and unavailable curriculum states.
- [x] Check mobile layouts, saved progress and all five destinations; leave individual screen redesigns for Phase 2.

# Isolated unit screen refinement
- [x] Remove in-unit unit tabs; keep Home access and gate next-unit action on completion.
- [x] Refine lesson tiles, illustration size and Previous/Next controls.
- [x] Add highlighted quiz tiles, stacked answers, progress and answer-gated Continue.
- [x] Verify interactions, unit isolation and small-screen layouts.

# Single-screen learning activities
- [x] Fit Learn content, audio and Previous/Next into the available screen height.
- [x] Fit every quiz mode, feedback and Continue without scrolling.
- [x] Verify all units on short and tall screens, including completed lessons.- [x] Server-side pronunciation check limits (Lovable Cloud)
- [x] Daily reminder toggle restored with native local notifications
- [x] Native wrapping prep (Capacitor config, API base, CORS)
- [ ] Static SPA build for Capacitor + generate ios/android projects (needs Codemagic/CI)
- [ ] Apple/Google in-app subscriptions (blocked: developer accounts + store products)
- [ ] Turn on free 5-check quota once store billing exists

- [x] Free vs Premium gating (built and tested locally)
- [ ] Sandbox purchase tests on iOS + Android (buy, restore, renew, cancel, expiry, offline) — blocked on Apple/Google developer accounts and store products
