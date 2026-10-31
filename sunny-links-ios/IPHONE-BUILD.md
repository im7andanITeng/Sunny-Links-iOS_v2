# Putting Sunny Links on an iPhone (real .ipa)

The game is web code, so the phone app is a thin wrapper around it. Everything
needed to build and sign it lives in this project; the only thing missing is a
Mac, because Apple only lets Xcode on macOS produce a signed .ipa.

**No Mac?** See `IPHONE-FROM-WINDOWS.md` — GitHub's free Mac machines build the
.ipa and Sideloadly on your Windows PC installs it.

## What the kit contains

| File | What it does |
| --- | --- |
| `capacitor.config.ts` | App name ("Sunny Links") and bundle id (`com.sunnylinks.minigolf`) |
| `vite.cap.config.ts`, `cap/index.html`, `src/cap/main.tsx` | Builds the game as a standalone bundle into `cap-dist/` |
| `ios/` | The Xcode project, already generated and already holding the built game |
| `package.json` scripts | `build:cap`, `cap:sync`, `ios:open`, `ios:add` |

## What you need on the Mac

- macOS with **Xcode** installed (free, from the App Store) and its command line tools.
- An **Apple ID**. Free works: the app runs on devices you own, and has to be
  re-installed every 7 days.
- **Apple Developer Program** ($99/year) if you want TestFlight (up to 10,000
  testers), the App Store, or a build that never expires.
- [bun](https://bun.sh) or npm, and CocoaPods if Xcode asks for it
  (`brew install cocoapods`).

## Steps on the Mac

1. **Copy the project over** (clone it, or copy the folder — skip `node_modules`).
2. **Install and sync**
   ```bash
   bun install
   bun run cap:sync     # rebuilds the game and copies it into the Xcode project
   ```
3. **Open it in Xcode**
   ```bash
   bun run ios:open     # or: open ios/App/App.xcworkspace
   ```
   Always open `App.xcworkspace`, not `App.xcodeproj`.
4. **Turn on signing**: click the **App** target → **Signing & Capabilities** →
   **Team** → pick your Apple ID. Xcode creates the certificate for you.
   Change the bundle id here if you want your own (e.g. `com.yourname.minigolf`).
5. **Run it on your phone**: plug the iPhone in, choose it as the run target,
   press ▶. First launch: **Settings → General → VPN & Device Management**,
   tap your developer name, then **Trust**.

## Making the .ipa

**In Xcode:** **Product → Archive**. When it finishes, the Organizer window
opens → **Distribute App** → pick:

- **App Store Connect** — for TestFlight or App Store review.
- **Ad Hoc** — installs on specific devices registered to your account.
- **Development** — for your own devices.

Then **Export** — the file it writes is the `.ipa`.

**From the terminal** (same result):

```bash
xcodebuild -workspace ios/App/App.xcworkspace -scheme App \
  -configuration Release -sdk iphoneos archive \
  -archivePath build/App.xcarchive

xcodebuild -exportArchive -archivePath build/App.xcarchive \
  -exportPath build/ipa -exportOptionsPlist ExportOptions.plist
```

`ExportOptions.plist` (put it in `ios/`) picks the destination — change
`method` to `ad-hoc` or `development`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key><string>app-store</string>
  <key>teamID</key><string>YOUR_TEN_CHARACTER_TEAM_ID</string>
  <key>uploadSymbols</key><true/>
</dict>
</plist>
```

## After changing the game

Run `bun run cap:sync` again, then rebuild or re-archive in Xcode. The wrapper
never needs regenerating.

## Worth knowing

- **Leaderboard and profile need internet.** They read and write the game's
  shared backend over HTTPS, so a phone with no connection still plays, but the
  board won't refresh.
- **The app icon is already in place** (`ios/App/App/Assets.xcassets/AppIcon.appiconset`).
- **Different name or bundle id?** Edit `capacitor.config.ts`, delete the `ios`
  folder, then `bun run ios:add && bun run cap:sync`.
- **No Mac at all?** The next best thing is installing from Safari: open the
  published site, tap Share, then **Add to Home Screen** — it gets its own icon
  and opens full screen, but it is not an App Store listing.
