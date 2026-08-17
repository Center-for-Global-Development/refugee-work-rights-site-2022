// Visual parity check: screenshots every route on the local preview and the
// live site with headless Chrome, then compares file hashes. Identical hashes
// mean pixel-perfect parity (Chrome PNG encoding is deterministic); differing
// hashes need an eyeball — for map pages a small anti-aliasing delta on the
// SVG map is expected (jqvmap scaled in pixel space; we scale via viewBox).
//
// Usage:  npm run preview &   then   node scripts/parity.mjs [outDir]
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const LOCAL = 'http://127.0.0.1:4321';
const LIVE = 'https://refugeeworkrights.org';
const OUT = process.argv[2] || 'parity-shots';
const WIDTHS = [375, 640, 1024, 1440];
const ROUTES = [
  '/',
  '/about/',
  '/about/campaign-history/',
  '/learn-about-refugee-work-rights/',
  '/learn-about-refugee-work-rights/legal-foundations/',
  '/learn-about-refugee-work-rights/key-research/',
  '/take-action/',
  '/our-supporters/',
  '/press/',
  '/contact-us/',
  '/scorecard/',
  '/scorecard/?viewAs=list',
  '/scorecard/germany/',
  '/scorecard-methodology/',
  '/dataset/',
  '/about-the-refugee-rights-toolkit/',
  '/privacy-policy/',
  '/terms-and-conditions/',
];

mkdirSync(OUT, { recursive: true });

function shoot(url, file, width) {
  const profile = mkdtempSync(join(tmpdir(), 'parity-'));
  try {
    execFileSync(CHROME, [
      '--headless',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      `--user-data-dir=${profile}`,
      `--window-size=${width},3000`,
      `--screenshot=${file}`,
      '--timeout=25000',
      url,
    ], { stdio: 'ignore', timeout: 40000 });
  } finally {
    rmSync(profile, { recursive: true, force: true });
  }
}

const md5 = (f) => createHash('md5').update(readFileSync(f)).digest('hex');

let same = 0;
let diff = 0;
for (const route of ROUTES) {
  for (const width of WIDTHS) {
    const name = route.replace(/[/?=]+/g, '_') || '_home';
    const localFile = join(OUT, `local${name}-${width}.png`);
    const liveFile = join(OUT, `live${name}-${width}.png`);
    try {
      shoot(LOCAL + route, localFile, width);
      shoot(LIVE + route, liveFile, width);
      const match = md5(localFile) === md5(liveFile);
      match ? same++ : diff++;
      console.log(`${match ? '✓ identical' : '≠ differs  '} ${route} @${width}`);
    } catch (e) {
      console.log(`! error     ${route} @${width}: ${e.message}`);
    }
  }
}
console.log(`\n${same} identical, ${diff} differing (inspect those in ${OUT}/)`);
