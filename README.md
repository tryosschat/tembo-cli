# tembo-cli

CLI for the [Tembo Public API](https://docs.tembo.io/features/public-api) — manage AI coding tasks and repositories.

## Install

```bash
bun add -g @tryosschat/tembo-cli
```

## Quick Start

```bash
tembo-cli auth login YOUR_API_KEY
tembo-cli tasks list
tembo-cli tasks create "Fix the login bug"
tembo-cli repos list
```

Get your API key at [app.tembo.io](https://app.tembo.io) → Settings → API Keys.

## Commands

```bash
tembo-cli auth login <api-key>     # Save API key
tembo-cli auth logout              # Remove API key
tembo-cli auth whoami              # Show current user
tembo-cli auth status              # Show config info

tembo-cli tasks list               # List tasks (--page, --limit, --json)
tembo-cli tasks search <query>     # Search tasks (--limit, --json)
tembo-cli tasks create <prompt>    # Create task (-a agent, -r repo, -b branch)

tembo-cli repos list               # List repos (--json)
```

## Agent Skill

```bash
npx skills add tryosschat/tembo-cli
```

## License

MIT
