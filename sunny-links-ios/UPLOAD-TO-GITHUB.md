# Uploading the game folder to GitHub (from Windows)

You need the game on GitHub once. After that, every rebuild is just
"re-upload the folder → the .ipa builds itself".

The folder has 176 files, which is more than the browser can take in one drag,
so use **GitHub Desktop** — a free app from GitHub with buttons, no commands.

---

## Route A — GitHub Desktop (easiest, no typing)

### 1. Get the folder ready
1. Download `Sunny-Links-iOS.zip` and unzip it (right-click → **Extract All**).
2. You now have a folder called **sunny-links-ios**. Keep it somewhere simple,
   like `C:\Users\yourname\Documents\sunny-links-ios`.
3. Don't add or rename anything inside it.

### 2. Install GitHub Desktop
1. Go to https://desktop.github.com and click **Download for Windows**.
2. Run the installer, then open **GitHub Desktop**.
3. Click **Sign in to GitHub** and log in with your GitHub account
   (create one free at github.com first if you don't have one).

### 3. Point it at the folder
1. In GitHub Desktop: menu **File → Add Local Repository…**
2. **Path:** click **Choose…** and pick the `sunny-links-ios` folder. OK.
3. It will say *"doesn't appear to be a Git repository"* with a link —
   click **create a repository**.
4. In the create box:
   - **Name:** `sunny-links-ios` (or whatever you like)
   - **Description:** leave blank
   - **Private:** make sure it is **OFF** — public repos get free Mac minutes
   - Click **Create Repository**

### 4. Send it up
1. GitHub Desktop now lists every file on the left. Click **Commit to main**
   (the message box can stay as it is).
2. Click **Publish repository**. In the popup:
   - Keep **Publish to GitHub** checked
   - Make sure **Keep this code private** is **unchecked**
   - Click **Publish repository**
3. Wait for the arrow/spinner at the top to finish. That's the upload done.

### 5. Check it landed
1. Open https://github.com → your repository.
2. You should see `src`, `ios`, `cap`, `public`, `.github`, `package.json`,
   `.env` and the rest.
3. Click the **Actions** tab — the **Build iPhone .ipa** workflow should already
   be running because of the upload. If it isn't, run it by hand:
   **Actions → Build iPhone .ipa → Run workflow → Run workflow.**

Then follow **IPHONE-FROM-WINDOWS.md** from Step 3 to grab the `.ipa`.

---

## Route B — command line (if you already use git)

Open **Git Bash** (from Git for Windows) and run, one line at a time:

```bash
cd /c/Users/yourname/Documents/sunny-links-ios
git init
git add -A
git commit -m "Sunny Links"
git branch -M main
```

Then create an **empty public** repository on github.com (no README, no
gitignore), copy its URL, and:

```bash
git remote add origin https://github.com/YOURNAME/sunny-links-ios.git
git push -u origin main
```

---

## Route C — browser drag-and-drop (not recommended here)

github.com → **Add file → Upload files** only accepts **100 files at a time**,
and this folder has 176, so you would have to drag it in two batches and hope
the hidden `.github` folder comes along. Use Route A instead.

---

## Is it safe to make the repo public?

The folder's `.env` file only holds the game's **public** address and publish
key — the ones any visitor's browser already downloads. There are no private
keys, passwords or database credentials in it, so a public repo is fine and is
what keeps the Mac build free.

## Route D — the workflow file didn't arrive (Actions tab looks wrong)

Symptom: the **Actions** tab shows **"Xcode - Build and Analyze"**, or a page full
of suggested workflow templates, instead of **"Build iPhone .ipa"**. That means the
hidden `.github` folder never made it up. Fix it by pasting the file in by hand:

1. On github.com, open your repository.
2. Click **Add file** → **Create new file**.
3. In the **name box at the top**, type exactly this (slashes are fine, GitHub
   makes the folders for you):
   `.github/workflows/ios-ipa.yml`
4. Delete whatever template text is in the big box, then paste everything between
   the lines below.
5. Click **Commit main** (or **Commit file**).
6. Click the **Actions** tab → **Build iPhone .ipa** → **Run workflow** →
   **Run workflow**.

```text
name: Build iPhone .ipa

on:
  workflow_dispatch:
  push:
    branches: [main]
    paths:
      - "src/**"
      - "cap/**"
      - "public/**"
      - "ios/**"
      - "package.json"
      - "bun.lock"
      - "capacitor.config.ts"
      - "vite.cap.config.ts"

jobs:
  ipa:
    runs-on: macos-15
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install packages
        run: bun install

      - name: Build the game bundle
        run: bun run build:cap

      - name: Copy the game into the iPhone project + install native pods
        run: bunx cap sync ios

      - name: Build the app without signing
        run: >
          xcodebuild
          -workspace ios/App/App.xcworkspace
          -scheme App
          -configuration Release
          -destination 'generic/platform=iOS'
          -derivedDataPath ios/App/build
          CODE_SIGNING_ALLOWED=NO
          CODE_SIGNING_REQUIRED=NO
          CODE_SIGN_IDENTITY=""
          build

      - name: Package the .ipa
        run: |
          mkdir -p payload/Payload
          cp -R ios/App/build/Build/Products/Release-iphoneos/App.app payload/Payload/
          cd payload && zip -qry ../SunnyLinks.ipa Payload
          ls -la ../SunnyLinks.ipa

      - uses: actions/upload-artifact@v4
        with:
          name: SunnyLinks-ipa
          path: SunnyLinks.ipa
          retention-days: 30
```

---

## Doing it again after a change

Unzip the new `Sunny-Links-iOS.zip` over the old folder (replace the files),
then in GitHub Desktop: type a message → **Commit to main** → **Push origin**.
The workflow runs again on its own.

