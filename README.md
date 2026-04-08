# instantly-cli

Zero-dependency CLI for the [Instantly.ai](https://instantly.ai) v2 API. Manage campaigns, leads, analytics, email accounts, and inbox from the terminal.

## Install

```bash
npm install -g instantly-ai-cli
```

Requires Node.js 18+.

## Setup

Get your API key from [app.instantly.ai](https://app.instantly.ai/app/settings/integrations) → Settings → Integrations.

```bash
instantly config set-api-key <your-key>
```

Or set the `INSTANTLY_API_KEY` environment variable.

## Commands

### Campaigns

```bash
instantly campaigns list [--all] [--status 1] [--search "name"]
instantly campaigns get <id>
instantly campaigns create                # JSON stdin
instantly campaigns update <id>           # JSON stdin
instantly campaigns activate <id>
instantly campaigns pause <id>
instantly campaigns duplicate <id>
```

### Leads

```bash
instantly leads list --campaign <id> [--all] [--search "query"]
instantly leads get <id>
instantly leads add                       # JSON stdin (1-1000 leads)
instantly leads delete                    # JSON stdin
instantly leads update-status             # JSON stdin
```

### Analytics

```bash
instantly analytics campaign [--id <id>] [--start-date 2026-01-01] [--end-date 2026-12-31]
instantly analytics overview [--id <id>]
instantly analytics daily [--id <id>]
```

### Email Accounts

```bash
instantly accounts list [--all] [--status 1] [--search "email"]
instantly accounts test <email>           # Check SPF/DKIM/DMARC
```

### Inbox

```bash
instantly emails list [--campaign <id>] [--unread] [--type received]
instantly emails unread-count
```

### Config

```bash
instantly config set-api-key <key>
instantly config show
```

## Examples

**Add leads to a campaign:**

```bash
echo '{
  "campaign_id": "your-campaign-uuid",
  "leads": [
    {
      "email": "john@company.com",
      "first_name": "John",
      "last_name": "Smith",
      "company_name": "Acme Inc",
      "custom_variables": {
        "hook": "Saw your team is working on compliance...",
        "contract": "H9240323D0013"
      }
    }
  ]
}' | instantly leads add
```

Custom variables map to `{{hook}}`, `{{contract}}`, etc. in your Instantly email templates.

**Check campaign performance:**

```bash
instantly analytics campaign --id <campaign-id> | jq '{sent: .emails_sent_count, opened: .open_count, replied: .reply_count}'
```

**List active campaigns:**

```bash
instantly campaigns list --status 1
```

**Paginate through all results:**

```bash
instantly accounts list --all
```

## Auth Resolution

The API key is resolved in this order:

1. `--api-key` flag
2. `INSTANTLY_API_KEY` environment variable
3. `~/.instantly/config.json`

## Output

All commands output JSON to stdout. Errors go to stderr as JSON with a non-zero exit code. Pipe to `jq` for formatting or to other tools for processing.

## License

MIT
