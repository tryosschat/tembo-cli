import { Command } from "commander";
import chalk from "chalk";
import { createClient, TemboApiError } from "../api";

export function registerRepoCommands(program: Command): void {
  const repos = program.command("repos").description("Manage repositories");

  repos
    .command("list")
    .description("List enabled repositories")
    .option("--json", "Output as JSON")
    .action(async (options) => {
      try {
        const client = await createClient();
        const response = await client.listRepositories();

        if (options.json) {
          console.log(JSON.stringify(response, null, 2));
          return;
        }

        if (response.codeRepositories.length === 0) {
          console.log(chalk.yellow("No repositories configured."));
          console.log(
            `Connect repositories at ${chalk.cyan("https://app.tembo.io")}`
          );
          return;
        }

        console.log(chalk.bold(`Repositories (${response.codeRepositories.length})\n`));

        for (const repo of response.codeRepositories) {
          const providerIcon = getProviderIcon(repo.integration?.type);
          console.log(`${providerIcon} ${chalk.cyan(repo.name)}`);
          console.log(`   ${chalk.dim(repo.url)}`);
          if (repo.description) {
            console.log(`   ${chalk.dim(repo.description)}`);
          }
          console.log();
        }
      } catch (error) {
        if (error instanceof TemboApiError) {
          if (error.status === 401) {
            console.error(chalk.red("Unauthorized. Run 'tembo-cli auth login' first."));
          } else {
            console.error(chalk.red(`API error (${error.status}): ${error.message}`));
          }
        } else {
          console.error(
            chalk.red(`Error: ${error instanceof Error ? error.message : error}`)
          );
        }
        process.exit(1);
      }
    });
}

function getProviderIcon(provider: string | undefined): string {
  switch (provider?.toLowerCase()) {
    case "github":
      return "[GH]";
    case "gitlab":
      return "[GL]";
    case "bitbucket":
      return "[BB]";
    default:
      return "[??]";
  }
}
