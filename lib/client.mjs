import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const BASE_URL = 'https://api.instantly.ai/api/v2';
const CONFIG_PATH = join(homedir(), '.instantly', 'config.json');
const MAX_RETRIES = 3;
const TIMEOUT_MS = 30_000;

function resolveApiKey(flags) {
  if (flags['api-key']) return flags['api-key'];
  if (process.env.INSTANTLY_API_KEY) return process.env.INSTANTLY_API_KEY;
  try {
    const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
    return config.api_key;
  } catch {
    return null;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function createClient(flags = {}) {
  const apiKey = resolveApiKey(flags);
  if (!apiKey) {
    console.error(JSON.stringify({
      error: 'No API key found. Set one with: instantly config set-api-key <key>'
    }));
    process.exit(1);
  }

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  async function request(method, path, { body, query } = {}) {
    let url = `${BASE_URL}${path}`;
    if (query) {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null) params.set(k, String(v));
      }
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }

    const opts = { method, headers, signal: AbortSignal.timeout(TIMEOUT_MS) };
    if (body) opts.body = JSON.stringify(body);

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await fetch(url, opts);

        if (res.status === 429 || res.status >= 500) {
          if (attempt === MAX_RETRIES) {
            const text = await res.text().catch(() => '');
            throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
          }
          const retryAfter = res.headers.get('retry-after');
          const delayMs = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : Math.min(1000 * Math.pow(2, attempt), 4000);
          await sleep(delayMs);
          continue;
        }

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
        }

        if (res.status === 204 || res.headers.get('content-length') === '0') {
          return {};
        }

        return await res.json();
      } catch (err) {
        if (err.name === 'TimeoutError') {
          throw new Error(`Request timed out after ${TIMEOUT_MS}ms: ${method} ${path}`);
        }
        if (attempt === MAX_RETRIES) throw err;
        await sleep(Math.min(1000 * Math.pow(2, attempt), 4000));
      }
    }
  }

  async function paginate(method, path, { body, query, key } = {}) {
    const results = [];
    let cursor = undefined;

    while (true) {
      const q = { ...query, limit: 100 };
      const b = body ? { ...body, limit: 100 } : undefined;

      if (cursor) {
        if (b) b.starting_after = cursor;
        else q.starting_after = cursor;
      }

      const data = await request(method, path, { body: b, query: q });
      const items = key ? data[key] : data.data || data.items || data;

      if (Array.isArray(items)) results.push(...items);
      else return data;

      cursor = data.next_starting_after;
      if (!cursor || (Array.isArray(items) && items.length === 0)) break;
    }

    return results;
  }

  return { request, paginate };
}
