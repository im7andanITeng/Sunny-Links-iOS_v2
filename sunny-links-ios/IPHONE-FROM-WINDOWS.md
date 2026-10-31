# Getting Sunny Links on your iPhone from Windows

No Mac needed. GitHub's free Mac machines build the `.ipa`, and Sideloadly on your
Windows PC signs it with your own Apple ID and copies it to the phone.

## What you need

- A free **GitHub** account
- The game in a **GitHub repository** — a *public* repo uses GitHub's free Mac
  minutes; a *private* repo charges per minute
- **Sideloadly** (free) — download only from https://sideloadly.io
- **iTunes** and **iCloud for Windows**, both from Apple's own site (not the
  Microsoft Store) — Sideloadly needs them to talk to the phone
- A USB cable and your normal **Apple ID**

## Step 1 — Put the project on GitHub

Unzip `Sunny-Links-iOS.zip`, then upload the folder to a new **public**
repository. The folder holds 176 files, which is more than the web page can
take in one drag, so the easy way is the free **GitHub Desktop** app — full
click-by-click steps in **UPLOAD-TO-GITHUB.md** (Route A).

## Step 2 — Build the .ipa in the cloud

1. Open the repository on github.com and click the **Actions** tab.
2. On the left pick **Build iPhone .ipa**, then **Run workflow** → **Run workflow**.
3. Wait about 10 minutes for the run to finish (green tick).

**Only see "Xcode - Build and Analyze", or a page full of suggestions?** That means
the workflow file didn't arrive with the upload. Fix it in two minutes with
**UPLOAD-TO-GITHUB.md → Route D**, then come back here.


## Step 3 — Download the .ipa

Click the finished run, then under **Artifacts** click **SunnyLinks-ipa**.
You get `SunnyLinks.ipa` — save it somewhere easy, like your Desktop.

## Step 4 — Install it with Sideloadly

1. Plug your iPhone in with the USB cable and keep it unlocked.
2. Open Sideloadly. Drag `SunnyLinks.ipa` onto it.
3. Type your **Apple ID** and password. If you use two-factor authentication,
   generate an app-specific password at appleid.apple.com and use that here.
4. Click **Start** and wait for "Done".

On the iPhone: **Settings → General → VPN & Device Management**, tap your Apple
ID under *Developer App*, then **Trust**. The icon is now on your home screen.

## The limits Apple puts on free accounts

- The app **stops opening after 7 days** — plug in and press Start in Sideloadly
  again to get another 7 days. Sideloadly's auto-refresh can do this for you.
- Only **3 sideloaded apps** at a time.
- On iOS 16 and newer you must turn on **Developer Mode** first:
  Settings → Privacy & Security → Developer Mode → On → restart.
- Apple's paid Developer Program ($99/year) removes the 7-day limit and lets you
  share through TestFlight instead.

## Changing the game later

Every change you make in Lovable needs a fresh build: push the new code to GitHub
(or re-upload the folder), run the workflow again, download the new `.ipa`, and
install it over the old one with Sideloadly.
