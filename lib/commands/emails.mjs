import { createClient } from '../client.mjs';
import { parse, output, fail } from '../parse.mjs';

const HELP = `Usage: instantly emails <subcommand> [options]

Subcommands:
  list                    List emails (unified inbox)
  unread-count            Get unread count

Options:
  --campaign <id>         Filter by campaign
  --unread                Only unread emails
  --type <type>           Filter: received, sent, manual
  --all                   Paginate through all results
  --api-key <key>         Override API key`;

export async function run(sub, args) {
  const { flags } = parse(args, {
    campaign: { type: 'string' },
    unread: { type: 'boolean', default: false },
    type: { type: 'string' },
  });

  if (!sub || flags.help) return fail(HELP);

  const client = createClient(flags);

  switch (sub) {
    case 'list': {
      const query = {};
      if (flags.campaign) query.campaign_id = flags.campaign;
      if (flags.unread) query.is_unread = true;
      if (flags.type) query.email_type = flags.type;

      if (flags.all) {
        const items = await client.paginate('GET', '/emails', { query, key: 'data' });
        output(items);
      } else {
        const data = await client.request('GET', '/emails', { query: { ...query, limit: 20 } });
        output(data);
      }
      break;
    }

    case 'unread-count':
      output(await client.request('GET', '/emails/unread/count'));
      break;

    default:
      fail(`Unknown subcommand: ${sub}. Run 'instantly emails --help'`);
  }
}
