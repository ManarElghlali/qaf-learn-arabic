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
- Define each Short Sounds lesson (word bank, saved-progress key) in the shared lessons registry and select it via the ?lesson search param on Learn and Quiz, so new lessons reuse the same screens with independent progress.
- Gate each Short Sounds unit through unitState in the lessons registry (all words learned → quiz pass → reading-test pass → next unit unlocks), storing quiz/test results per unit in progress.units, so units stay independent and sequential.
