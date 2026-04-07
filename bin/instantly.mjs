#!/usr/bin/env node

import { parseArgs } from 'node:util';

const COMMANDS = {
  campaigns: () => import('../lib/commands/campaigns.mjs'),
  leads: () => import('../lib/commands/leads.mjs'),
  analytics: () => import('../lib/commands/analytics.mjs'),
  accounts: () => import('../lib/commands/accounts.mjs'),
  emails: () => import('../lib/commands/emails.mjs'),
  config: () => import('../lib/commands/config.mjs'),
};

const args = process.argv.slice(2);
const group = args[0];
const sub = args[1];
const rest = args.slice(2);

if (!group || group === '--help' || group === '-h') {
  console.log(`Usage: instantly <command> <subcommand> [options]

Commands:
  campaigns    Manage email campaigns
  leads        Manage campaign leads
  analytics    Campaign performance data
  accounts     Email account management
  emails       Unified inbox
  config       Set API key

Run 'instantly <command> --help' for subcommand details.`);
  process.exit(0);
}

if (!COMMANDS[group]) {
  console.error(JSON.stringify({ error: `Unknown command group: ${group}` }));
  process.exit(1);
}

try {
  const mod = await COMMANDS[group]();
  await mod.run(sub, rest);
} catch (err) {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
}
