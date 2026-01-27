import { Command } from "commander";
import chalk from "chalk";
import {
  setApiKey,
  clearApiKey,
  getApiKey,
  getConfigPath,
} from "../config";
import { createClient, TemboApiError } from "../api";

export function registerAuthCommands(program: Command): void {
  const auth = program
    .command("auth")
    .description("Manage authentication");

  auth
    .command("login")
    .description("Set your Tembo API key")
    .argument("<api-key>", "Your Tembo API key from app.tembo.io")
    .action(async (apiKey: string) => {
      try {
        const client = new (await import("../api")).TemboApi(apiKey);
        const user = await client.me();

        await setApiKey(apiKey);

        console.log(chalk.green("Successfully authenticated!"));
        console.log(`Organization: ${chalk.cyan(user.orgId)}`);
        console.log(`Config saved to: ${chalk.dim(getConfigPath())}`);
      } catch (error) {
        if (error instanceof TemboApiError) {
          if (error.status === 401) {
            console.error(chalk.red("Invalid API key"));
          } else {
            console.error(chalk.red(`API error: ${error.message}`));
          }
        } else {
          console.error(
            chalk.red(`Error: ${error instanceof Error ? error.message : error}`)
          );
        }
        process.exit(1);
      }
    });

  auth
    .command("logout")
    .description("Remove stored API key")
    .action(async () => {
      await clearApiKey();
      console.log(chalk.green("API key removed."));
    });

  auth
    .command("whoami")
    .description("Show current authenticated user")
    .action(async () => {
      try {
        const apiKey = await getApiKey();
        if (!apiKey) {
          console.log(chalk.yellow("Not logged in."));
          console.log(`Run ${chalk.cyan("tembo-cli auth login <api-key>")} to authenticate.`);
          return;
        }

        const client = await createClient();
        const user = await client.me();

        console.log(chalk.green("Authenticated"));
        console.log(`Organization: ${chalk.cyan(user.orgId)}`);
        if (user.email) {
          console.log(`Email: ${chalk.cyan(user.email)}`);
        }
      } catch (error) {
        if (error instanceof TemboApiError && error.status === 401) {
          console.error(chalk.red("Invalid or expired API key."));
          console.log(`Run ${chalk.cyan("tembo-cli auth login <api-key>")} to re-authenticate.`);
        } else {
          console.error(
            chalk.red(`Error: ${error instanceof Error ? error.message : error}`)
          );
        }
        process.exit(1);
      }
    });

  auth
    .command("status")
    .description("Show authentication status and config location")
    .action(async () => {
      const apiKey = await getApiKey();
      const isEnvKey = !!process.env.TEMBO_API_KEY;

      console.log(`Config path: ${chalk.dim(getConfigPath())}`);

      if (apiKey) {
        const maskedKey = apiKey.slice(0, 8) + "..." + apiKey.slice(-4);
        console.log(`API key: ${chalk.cyan(maskedKey)}`);
        console.log(`Source: ${isEnvKey ? chalk.yellow("TEMBO_API_KEY env") : chalk.green("config file")}`);
      } else {
        console.log(chalk.yellow("No API key configured."));
      }
    });
}
