import { createClient } from '../client.mjs';
import { parse, output, fail } from '../parse.mjs';

const HELP = `Usage: instantly accounts <subcommand> [options]

Subcommands:
  list                    List email accounts
  test <email>            Test account vitals (SPF/DKIM/DMARC)

Options:
  --status <n>            Filter (1=active,2=paused,3=maintenance,-1=error)
  --search <query>        Search by email
  --all                   Paginate through all results
  --api-key <key>         Override API key`;

export async function run(sub, args) {
  const { flags, positionals } = parse(args, {
    status: { type: 'string' },
    search: { type: 'string' },
  });

  if (!sub || flags.help) return fail(HELP);

  const client = createClient(flags);

  switch (sub) {
    case 'list': {
      const query = {};
      if (flags.status !== undefined) query.status = flags.status;
      if (flags.search) query.search = flags.search;

      if (flags.all) {
        const items = await client.paginate('GET', '/accounts', { query, key: 'data' });
        output(items);
      } else {
        const data = await client.request('GET', '/accounts', { query: { ...query, limit: 100 } });
        output(data);
      }
      break;
    }

    case 'test': {
      const email = positionals[0];
      if (!email) fail('Usage: instantly accounts test <email>');
      output(await client.request('POST', '/accounts/test/vitals', {
        body: { accounts: [email] },
      }));
      break;
    }

    default:
      fail(`Unknown subcommand: ${sub}. Run 'instantly accounts --help'`);
  }
}
