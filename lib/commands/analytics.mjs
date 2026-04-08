import { createClient } from '../client.mjs';
import { parse, output, fail } from '../parse.mjs';

const HELP = `Usage: instantly analytics <subcommand> [options]

Subcommands:
  campaign                Per-campaign stats
  overview                Aggregated totals
  daily                   Day-by-day breakdown

Options:
  --id <id>               Campaign ID
  --start-date <date>     Start date (YYYY-MM-DD)
  --end-date <date>       End date (YYYY-MM-DD)
  --api-key <key>         Override API key`;

export async function run(sub, args) {
  const { flags } = parse(args, {
    id: { type: 'string' },
    'start-date': { type: 'string' },
    'end-date': { type: 'string' },
  });

  if (!sub || flags.help) return fail(HELP);

  const client = createClient(flags);

  const query = {};
  if (flags.id) query.id = flags.id;
  if (flags['start-date']) query.start_date = flags['start-date'];
  if (flags['end-date']) query.end_date = flags['end-date'];

  switch (sub) {
    case 'campaign':
      output(await client.request('GET', '/campaigns/analytics', { query }));
      break;

    case 'overview':
      output(await client.request('GET', '/campaigns/analytics/overview', { query }));
      break;

    case 'daily': {
      const q = { ...query };
      if (q.id) { q.campaign_id = q.id; delete q.id; }
      output(await client.request('GET', '/campaigns/analytics/daily', { query: q }));
      break;
    }

    default:
      fail(`Unknown subcommand: ${sub}. Run 'instantly analytics --help'`);
  }
}
