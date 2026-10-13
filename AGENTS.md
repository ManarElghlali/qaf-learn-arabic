<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep word artwork keyed by the stable curriculum word ID in a shared illustration registry and render it through WordIllustration, so Learn and Quiz always show the same image without coupling artwork to pronunciation data.
- Derive Home progress and Learn continuation through the shared learning-summary module using existing saved completion IDs, so both screens agree without changing the progress schema.
- Apply learning surfaces, sound-control sizes, navigation safe areas and color roles through shared styles and the existing Button component, so the five screens remain visually coherent without altering their engines.
- Render Home curriculum destinations through a shared disclosure component; only implemented lessons link to Learn, keeping progression discoverable without exposing unfinished content as actions.
- Define every lesson with a stable word bank and saved-progress key in the shared lessons registry, selecting it through the lesson search parameter, so Short and Long Sounds reuse isolated activities.
- Use the shared reading-sounds parser to keep written long vowels and approved diphthongs together in assessment targets, so feedback matches the curriculum sound tiles.
- Gate each Short Sounds unit through unitState in the lessons registry (all words learned → quiz pass → reading-test pass → next unit unlocks), storing quiz/test results per unit in progress.units, so units stay independent and sequential.
- Judge reading-test answers syllable by syllable (consonant + exact short vowel) in the server route /api/public/check-reading with an audio-capable model, so harakat errors are caught rather than only the word's letters.
- Keep unit selection on Home and completion-gated next-unit actions; in-unit Learn/Quiz/Test navigation preserves the selected lesson so activities never switch word banks.
- Keep quiz question controls in a shared presentation module with explicit answer-gated advancement, so selection feedback stays visible without changing scoring or word selection.
- Use the opt-in viewport-height AppShell layout for Learn and Quiz with in-flow navigation and shared height-aware activity styles, so content and answer feedback fit without scrolling or changing other screens.
