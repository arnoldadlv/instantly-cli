import { createClient } from '../client.mjs';
import { parse, readStdin, output, fail } from '../parse.mjs';

const HELP = `Usage: instantly campaigns <subcommand> [options]

Subcommands:
  list                    List campaigns
  get <id>                Get campaign details
  create                  Create campaign (JSON stdin)
  update <id>             Update campaign (JSON stdin)
  activate <id>           Start sending
  pause <id>              Stop sending
  duplicate <id>          Clone campaign

Options:
  --all                   Paginate through all results
  --status <n>            Filter by status (0=draft,1=active,2=paused,3=completed)
  --search <query>        Search by name
  --api-key <key>         Override API key`;

export async function run(sub, args) {
  const { flags, positionals } = parse(args, {
    status: { type: 'string' },
    search: { type: 'string' },
  });

  if (!sub || flags.help) return fail(HELP);

  const client = createClient(flags);
  const id = positionals[0];

  switch (sub) {
    case 'list': {
      const query = {};
      if (flags.status !== undefined) query.status = flags.status;
      if (flags.search) query.search = flags.search;

      if (flags.all) {
        const items = await client.paginate('GET', '/campaigns', { query, key: 'data' });
        output(items);
      } else {
        const data = await client.request('GET', '/campaigns', { query: { ...query, limit: 100 } });
        output(data);
      }
      break;
    }

    case 'get': {
      if (!id) fail('Usage: instantly campaigns get <id>');
      output(await client.request('GET', `/campaigns/${id}`));
      break;
    }

    case 'create': {
      const body = readStdin();
      if (!body) fail('Pipe campaign JSON to stdin. Required: name, campaign_schedule');
      output(await client.request('POST', '/campaigns', { body }));
      break;
    }

    case 'update': {
      if (!id) fail('Usage: instantly campaigns update <id>');
      const body = readStdin();
      if (!body) fail('Pipe update JSON to stdin');
      output(await client.request('PATCH', `/campaigns/${id}`, { body }));
      break;
    }

    case 'activate': {
      if (!id) fail('Usage: instantly campaigns activate <id>');
      output(await client.request('POST', `/campaigns/${id}/activate`));
      break;
    }

    case 'pause': {
      if (!id) fail('Usage: instantly campaigns pause <id>');
      output(await client.request('POST', `/campaigns/${id}/pause`));
      break;
    }

    case 'duplicate': {
      if (!id) fail('Usage: instantly campaigns duplicate <id>');
      output(await client.request('POST', `/campaigns/${id}/duplicate`));
      break;
    }

    default:
      fail(`Unknown subcommand: ${sub}. Run 'instantly campaigns --help'`);
  }
}
