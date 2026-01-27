# tembo-cli

CLI for the [Tembo Public API](https://docs.tembo.io/features/public-api) - manage AI coding tasks and repositories programmatically.

## Installation

### From GitHub Packages

```bash
# 1. Create a GitHub Personal Access Token with `read:packages` scope
#    Go to: https://github.com/settings/tokens/new?scopes=read:packages

# 2. Configure npm/bun to use GitHub Packages for @tryosschat scope
echo "@tryosschat:registry=https://npm.pkg.github.com" >> ~/.npmrc
echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN" >> ~/.npmrc

# 3. Install
bun add -g @tryosschat/tembo-cli
```

### From Source

```bash
git clone https://github.com/tryosschat/tembo-cli.git
cd tembo-cli
bun install
bun link
```

## Quick Start

```bash
# 1. Get your Tembo API key from https://app.tembo.io → Settings → API Keys

# 2. Authenticate
tembo-cli auth login YOUR_API_KEY

# 3. Create a task
tembo-cli tasks create "Fix the login bug in the auth component"

# 4. List your tasks
tembo-cli tasks list
```

## Commands

### Authentication

```bash
tembo-cli auth login <api-key>    # Set API key (validates against API)
tembo-cli auth logout             # Remove stored key
tembo-cli auth whoami             # Show current user
tembo-cli auth status             # Show config location and key status
```

### Tasks

```bash
tembo-cli tasks list              # List tasks (--page, --limit, --json)
tembo-cli tasks search <query>    # Search tasks (--limit, --json)
tembo-cli tasks create <prompt>   # Create task (-a agent, -r repo, -b branch)
```

### Repositories

```bash
tembo-cli repos list              # List enabled repos (--json)
```

## Examples

```bash
# Create a task with a specific agent
tembo-cli tasks create "Add dark mode support" \
  --agent "claudeCode:claude-4-5-sonnet" \
  --repo "https://github.com/myorg/myapp" \
  --branch "main"

# List tasks as JSON
tembo-cli tasks list --limit 5 --json

# Search for tasks
tembo-cli tasks search "authentication bug"
```

## Configuration

Config is stored at `~/.tembo-cli/config.json`. You can also use the `TEMBO_API_KEY` environment variable.

## Agent Skill

This CLI is also available as an [Agent Skill](https://agentskills.io) for AI coding agents:

```bash
npx skills add tryosschat/tembo-cli
```

## License

MIT
