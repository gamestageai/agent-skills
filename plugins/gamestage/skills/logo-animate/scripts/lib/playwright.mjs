// Playwright from the project, then from the global tree of the Node running this script
// (which is where `npm install -g` puts it, under nvm, Volta, Homebrew or Windows alike).
// On Windows npm is a .cmd file, which Node runs only through a shell.
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

export function loadPlaywright() {
  const req = createRequire(import.meta.url);
  const tries = [
    () => req('playwright'),
    () => createRequire(pathToFileURL(join(process.cwd(), 'x')).href)('playwright'),
    () => req(join(dirname(process.execPath), '..', 'lib', 'node_modules', 'playwright')),
    () => req(join(dirname(process.execPath), 'node_modules', 'playwright')),
    () => req(join(execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['root', '-g'], { encoding: 'utf8', shell: process.platform === 'win32' }).trim(), 'playwright')),
  ];
  for (const t of tries) { try { return t(); } catch {} }
  console.error('Playwright not found. Install it with: npm install -g playwright && npx playwright install chromium');
  process.exit(1);
}

// Reads `--flag value` pairs and the bare arguments from argv.
export function parseArgs(argv, valueFlags) {
  const flags = {}, rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      if (valueFlags.includes(k)) flags[k] = argv[++i]; else flags[k] = true;
    } else rest.push(a);
  }
  return { flags, rest };
}
