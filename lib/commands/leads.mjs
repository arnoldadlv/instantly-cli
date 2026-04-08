import { createClient } from '../client.mjs';
import { parse, readStdin, output, fail } from '../parse.mjs';

const HELP = `Usage: instantly leads <subcommand> [options]

Subcommands:
  list                    List leads (requires --campaign)
  get <id>                Get lead details
  add                     Bulk add leads (JSON stdin, 1-1000)
  delete                  Bulk delete leads (JSON stdin)
  update-status           Update interest status (JSON stdin)

Options:
  --campaign <id>         Campaign ID
  --search <query>        Search leads
  --all                   Paginate through all results
  --api-key <key>         Override API key`;

export async function run(sub, args) {
  const { flags, positionals } = parse(args, {
    campaign: { type: 'string' },
    search: { type: 'string' },
  });

  if (!sub || flags.help) return fail(HELP);

  const client = createClient(flags);
  const id = positionals[0];

  switch (sub) {
    case 'list': {
      const body = {};
      if (flags.campaign) body.campaign = flags.campaign;
      if (flags.search) body.search = flags.search;

      if (flags.all) {
        const items = await client.paginate('POST', '/leads/list', { body, key: 'data' });
        output(items);
      } else {
        const data = await client.request('POST', '/leads/list', {
          body: { ...body, limit: 100 },
        });
        output(data);
      }
      break;
    }

    case 'get': {
      if (!id) fail('Usage: instantly leads get <id>');
      output(await client.request('GET', `/leads/${id}`));
      break;
    }

    case 'add': {
      const body = readStdin();
      if (!body) fail('Pipe JSON to stdin. Required: campaign_id or list_id, leads[]');
      output(await client.request('POST', '/leads/add', { body }));
      break;
    }

    case 'delete': {
      const body = readStdin();
      if (!body) fail('Pipe JSON to stdin. Required: campaign_id or list_id');
      output(await client.request('DELETE', '/leads', { body }));
      break;
    }

    case 'update-status': {
      const body = readStdin();
      if (!body) fail('Pipe JSON to stdin. Required: lead_email, interest_value');
      output(await client.request('POST', '/leads/update-interest-status', { body }));
      break;
    }

    default:
      fail(`Unknown subcommand: ${sub}. Run 'instantly leads --help'`);
  }
}
