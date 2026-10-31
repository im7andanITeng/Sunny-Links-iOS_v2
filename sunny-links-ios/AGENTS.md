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
- Players are anonymous (device id in localStorage) and synced to the players table so the leaderboard is shared without sign-in.
- The phone app is a separate static build (`vite.cap.config.ts` → `cap-dist/` → Capacitor's `ios/` project) so the web build in `vite.config.ts` stays untouched; refresh the native copy with `bun run cap:sync` after any game change.
