# kapsikkum apps

An F-Droid repository and a SideStore/AltStore source for kapsikkum's apps, hosted on GitHub Pages at
https://kapsikkum.github.io/apps/.

| | URL |
| --- | --- |
| F-Droid / Droid-ify / Neo Store | `https://kapsikkum.github.io/apps/fdroid/repo` |
| SideStore / AltStore | `https://kapsikkum.github.io/apps/sidestore.json` |

Apps: [Mudrix](https://github.com/kapsikkum/mudrix-web), [PhotoScout](https://github.com/kapsikkum/photoscout).

## How it works

`apps.json` lists the apps and the release assets to use. `.github/workflows/update.yml` runs
`scripts/build.mjs`, which downloads each app's latest APK, writes the F-Droid metadata and builds the SideStore
source (IPAs are linked from the GitHub release, not copied). `fdroid update` then signs the F-Droid index, and
the result is deployed to Pages. It runs every 6 hours, on `repository_dispatch` of type `app-release`, and by hand.

## Adding an app

Add an entry to `apps.json` (`repo`, the release tag or `latest-stable`, the APK and IPA asset names, the Android
package and iOS bundle id). Only the latest release of each app is kept in the F-Droid repo.

## Notes

- The F-Droid repo key is the `FDROID_KEYSTORE_BASE64` / `FDROID_KEYSTORE_PASSWORD` secrets. Keep a backup of the
  keystore: if it changes, everyone has to remove and re-add the repo.
- F-Droid only installs updates signed by the same key as the installed app, so each app's APK has to be signed
  with a stable key in its own release workflow.
- IPAs are unsigned; SideStore signs them on the device.
