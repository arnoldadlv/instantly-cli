import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const CONFIG_DIR = join(homedir(), '.instantly');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');

function readConfig() {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function writeConfig(config) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', { mode: 0o600 });
}

export async function run(sub, args) {
  if (sub === 'set-api-key') {
    const key = args[0];
    if (!key) {
      console.error(JSON.stringify({ error: 'Usage: instantly config set-api-key <key>' }));
      process.exit(1);
    }
    const config = readConfig();
    config.api_key = key;
    writeConfig(config);
    console.log(JSON.stringify({ ok: true, path: CONFIG_PATH }));
    return;
  }

  if (sub === 'show') {
    const config = readConfig();
    const masked = { ...config };
    if (masked.api_key) {
      masked.api_key = masked.api_key.slice(0, 8) + '...' + masked.api_key.slice(-4);
    }
    console.log(JSON.stringify(masked, null, 2));
    return;
  }

  console.error(JSON.stringify({ error: 'Subcommands: set-api-key <key>, show' }));
  process.exit(1);
}
