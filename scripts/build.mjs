// Pulls each app's latest release from GitHub and produces what the two repos need:
//   fdroid/repo/<apk>        the APKs `fdroid update` indexes
//   fdroid/metadata/<id>.yml F-Droid metadata
//   site/sidestore.json      the AltStore/SideStore source (IPAs stay on the GitHub release)
// Needs the `gh` CLI (GH_TOKEN) and runs from the repository root.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const cfg = JSON.parse(readFileSync('apps.json', 'utf8'));
const gh = (...a) => execFileSync('gh', a, { encoding: 'utf8', maxBuffer: 1 << 26 });
const FIELDS = 'tagName,publishedAt,assets,body';

// "latest-stable" is the newest non-pre-release; anything else names a release tag.
const pickRelease = (app) =>
  JSON.parse(
    app.release === 'latest-stable'
      ? gh('release', 'view', '-R', app.repo, '--json', FIELDS)
      : gh('release', 'view', app.release, '-R', app.repo, '--json', FIELDS)
  );

rmSync('fdroid/repo', { recursive: true, force: true });
mkdirSync('fdroid/repo', { recursive: true });
mkdirSync('fdroid/metadata', { recursive: true });
mkdirSync('site', { recursive: true });

const source = {
  name: cfg.name,
  identifier: 'io.github.kapsikkum.apps',
  subtitle: cfg.description,
  description: cfg.description,
  website: cfg.url,
  iconURL: cfg.apps[0].icon,
  tintColor: cfg.apps[0].tint,
  apps: [],
  news: [],
};

for (const app of cfg.apps) {
  const rel = pickRelease(app);
  const tag = rel.tagName.replace(/^v/, '');
  // A rolling "latest" release has no version of its own, so it is versioned by its date.
  const version = /^\d/.test(tag) ? tag : rel.publishedAt.slice(0, 10).replaceAll('-', '.');
  console.log(`${app.name}: ${rel.tagName} (${version})`);

  if (app.android) {
    // Every listed APK the release has (an older release may still carry the universal one).
    for (const name of app.android.assets) {
      if (rel.assets.some((a) => a.name === name)) {
        gh('release', 'download', rel.tagName, '-R', app.repo, '-p', name, '-D', 'fdroid/repo', '--clobber');
      }
    }
    writeFileSync(
      `fdroid/metadata/${app.android.package}.yml`,
      [
        'Categories:',
        '  - Internet',
        `License: ${app.license}`,
        `SourceCode: https://github.com/${app.repo}`,
        `IssueTracker: https://github.com/${app.repo}/issues`,
        'AuthorName: kapsikkum',
        `Name: ${app.name}`,
        `Summary: ${app.subtitle}`,
        'Description: |-',
        `  ${app.description}`,
        '',
      ].join('\n')
    );
  }

  const ipa = app.ios && rel.assets.find((a) => a.name === app.ios.asset);
  if (ipa) {
    source.apps.push({
      name: app.name,
      bundleIdentifier: app.ios.bundleId,
      developerName: 'kapsikkum',
      subtitle: app.subtitle,
      localizedDescription: app.description,
      iconURL: app.icon,
      tintColor: app.tint,
      screenshotURLs: [],
      versions: [
        {
          version,
          date: rel.publishedAt,
          size: ipa.size,
          downloadURL: ipa.url,
          localizedDescription: (rel.body || '').slice(0, 1500),
          minOSVersion: '15.0',
        },
      ],
    });
  }
}

writeFileSync('site/sidestore.json', `${JSON.stringify(source, null, 2)}\n`);
