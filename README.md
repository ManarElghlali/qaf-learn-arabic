# Qaf Learn Arabic

Build a production-ready mobile Arabic reading app named "Qaf" (ق), teaching Arabic reading step by step starting with Short Sounds (Fatha), incorporating all specifications and fixing the audio pronunciation, speech recognition, and missing asset bugs.

1. Product Vision & Architecture:
- Mobile-first web app styled like an iOS/Android native app, with Arabic RTL support, calm premium aesthetic, Noto Naskh Arabic and Manrope fonts.
- Four curriculum stages: Short Sounds (الحركات القصيرة), Long Sounds (المدود), Tanween (التنوين), Shadda (الشدة).
- V1 implements the full Short Sounds -> Fatha (الفتحة) curriculum with exactly 42 approved words. Later stages and lessons (Damma, Kasra, Sukun) show structured cards with a "قريبًا · Coming Soon" badge.

2. Complete 42 Approved Fatha Words (with exact spelling & tashkeel):
1. كَتَبَ (كَ — تَ — بَ) He wrote
2. ذَهَبَ (ذَ — هَ — بَ) He went
3. جَلَسَ (جَ — لَ — سَ) He sat
4. أَكَلَ (أَ — كَ — لَ) He ate
5. شَرَبَ (شَ — رَ — بَ) He drank
6. لَعَبَ (لَ — عَ — بَ) He played
7. رَسَمَ (رَ — سَ — مَ) He drew
8. قَرَأَ (قَ — رَ — أَ) He read
9. فَتَحَ (فَ — تَ — حَ) He opened
10. دَخَلَ (دَ — خَ — لَ) He entered
11. خَرَجَ (خَ — رَ — جَ) He went out
12. حَمَلَ (حَ — مَ — لَ) He carried
13. مَسَحَ (مَ — سَ — حَ) He wiped
14. غَسَلَ (غَ — سَ — لَ) He washed
15. طَبَخَ (طَ — بَ — خَ) He cooked
16. ضَحَكَ (ضَ — حَ — كَ) He laughed
17. صَعَدَ (صَ — عَ — دَ) He climbed
18. نَزَلَ (نَ — زَ — لَ) He went down
19. نَظَرَ (نَ — ظَ — رَ) He looked
20. سَمَعَ (سَ — مَ — عَ) He heard
21. بَحَثَ (بَ — حَ — ثَ) He searched
22. وَجَدَ (وَ — جَ — دَ) He found
23. وَقَفَ (وَ — قَ — فَ) He stood
24. هَرَبَ (هَ — رَ — بَ) He ran away
25. زَرَعَ (زَ — رَ — عَ) He planted
26. قَطَعَ (قَ — طَ — عَ) He cut
27. جَمَعَ (جَ — مَ — عَ) He collected
28. فَرَحَ (فَ — رَ — حَ) He was happy
29. مَنَعَ (مَ — نَ — عَ) He prevented
30. تَرَكَ (تَ — رَ — كَ) He left
31. رَكَبَ (رَ — كَ — بَ) He rode
32. نَفَخَ (نَ — فَ — خَ) He blew
33. نَشَرَ (نَ — شَ — رَ) He spread
34. سَحَبَ (سَ — حَ — بَ) He pulled
35. دَفَعَ (دَ — فَ — عَ) He pushed
36. رَفَعَ (رَ — فَ — عَ) He lifted
37. وَقَعَ (وَ — قَ — عَ) He fell
38. بَدَأَ (بَ — دَ — أَ) He started
39. خَلَعَ (خَ — لَ — عَ) He took off
40. طَلَبَ (طَ — طَ — بَ / طَ — لَ — بَ) He asked
41. ثَبَتَ (ثَ — بَ — تَ) He stood firm
42. يَبَسَ (يَ — بَ — سَ) He dried up
Provide clear illustrations/icons for all 42 words, including words 41 and 42.

3. Audio Pronunciation System (Critical Fix):
- Natural, clear Arabic pronunciation with exact short vowels (harakat), sounding like a professional Arabic female teacher.
- Individual sound unit playback: Tapping each sound unit (e.g. كَ, تَ, بَ) plays ONLY that sound unit, cleanly with no extra syllables or long vowel elongation.
- Full word playback: Tapping the listen button or illustration plays the complete word naturally as one continuous word (e.g., كَتَبَ -> ka-ta-ba).
- Clean audio playback queue: Stop prior sound before starting a new one; no overlapping audio.

4. Learning, Quiz, & Assessment Flows:
- Learn: Word card with segmented sound units, full audio play, transliteration toggle, English meaning, and word progress.
- Quiz: Three adaptive quiz modes (Build the word from letter blocks, Listen and pick the word, Picture and match the word).
- Final Reading Assessment (Critical Fix):
  * 10-word test sequence.
  * Microphone interaction: Press and hold to record, release to stop recording and immediately trigger analysis.
  * Real microphone audio capture with fallback to speech recognition, evaluating Arabic pronunciation.
  * On success: "Correct! ✓", mark completed, auto-advance.
  * On error: "Try again", allow re-recording, and provide a clearly labeled "Hear the word" audio help button.
  * Handle permission denial and microphone states gracefully.

5. Profile, Settings, & Monetization:
- Local progress persistence (streak, words learned, test scores).
- Daily reminder notification toggle.
- Clean paywall sheet with monthly/yearly plans and restore purchase action.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/39bba5af-b89a-41c2-99c0-66decc97a1d1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
