import { parseArgs } from 'node:util';
import { readFileSync } from 'node:fs';

export function parse(args, options = {}) {
  const { values, positionals } = parseArgs({
    args,
    options: {
      'api-key': { type: 'string' },
      all: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
      ...options,
    },
    allowPositionals: true,
    strict: false,
  });
  return { flags: values, positionals };
}

export function readStdin() {
  try {
    const input = readFileSync(0, 'utf8').trim();
    if (!input) return null;
    return JSON.parse(input);
  } catch {
    return null;
  }
}

export function output(data) {
  console.log(JSON.stringify(data, null, 2));
}

export function fail(message) {
  console.error(JSON.stringify({ error: message }));
  process.exit(1);
}
