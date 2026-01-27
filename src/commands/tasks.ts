import { Command } from "commander";
import chalk from "chalk";
import { createClient, TemboApiError, type Task } from "../api";

function formatTask(task: Task): void {
  console.log(`${chalk.cyan(task.id)} ${chalk.bold(task.title)}`);
  console.log(`  Status: ${getStatusColor(task.status)}`);
  if (task.description) {
    const desc =
      task.description.length > 80
        ? task.description.slice(0, 80) + "..."
        : task.description;
    console.log(`  ${chalk.dim(desc)}`);
  }
  console.log(`  Created: ${chalk.dim(new Date(task.createdAt).toLocaleString())}`);
  console.log();
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "completed":
    case "done":
      return chalk.green(status);
    case "in_progress":
    case "running":
      return chalk.yellow(status);
    case "failed":
    case "error":
      return chalk.red(status);
    case "pending":
    case "queued":
      return chalk.blue(status);
    default:
      return chalk.white(status);
  }
}

export function registerTaskCommands(program: Command): void {
  const tasks = program.command("tasks").description("Manage Tembo tasks");

  tasks
    .command("list")
    .description("List tasks")
    .option("-p, --page <number>", "Page number", "1")
    .option("-l, --limit <number>", "Items per page", "10")
    .option("--json", "Output as JSON")
    .action(async (options) => {
      try {
        const client = await createClient();
        const response = await client.listTasks(
          parseInt(options.page),
          parseInt(options.limit)
        );

        if (options.json) {
          console.log(JSON.stringify(response, null, 2));
          return;
        }

        if (response.issues.length === 0) {
          console.log(chalk.yellow("No tasks found."));
          return;
        }

        console.log(
          chalk.bold(`Tasks (${response.meta.totalCount} total)\n`)
        );

        for (const task of response.issues) {
          formatTask(task);
        }

        console.log(
          chalk.dim(
            `Page ${response.meta.page} of ${Math.ceil(response.meta.totalCount / response.meta.limit)}`
          )
        );
      } catch (error) {
        handleError(error);
      }
    });

  tasks
    .command("search")
    .description("Search tasks")
    .argument("<query>", "Search query")
    .option("-l, --limit <number>", "Max results", "10")
    .option("--json", "Output as JSON")
    .action(async (query: string, options) => {
      try {
        const client = await createClient();
        const response = await client.searchTasks(query, parseInt(options.limit));

        if (options.json) {
          console.log(JSON.stringify(response, null, 2));
          return;
        }

        if (response.issues.length === 0) {
          console.log(chalk.yellow(`No tasks matching "${query}"`));
          return;
        }

        console.log(chalk.bold(`Search results for "${query}"\n`));

        for (const task of response.issues) {
          formatTask(task);
        }
      } catch (error) {
        handleError(error);
      }
    });

  tasks
    .command("create")
    .description("Create a new task")
    .argument("<prompt>", "Task description/prompt")
    .option("-a, --agent <agent>", "Agent to use (default: claudeCode:claude-opus-4-5)")
    .option("-r, --repo <urls...>", "Repository URLs")
    .option("-b, --branch <branch>", "Target branch")
    .option("--no-queue", "Don't start task immediately")
    .option("--json", "Output as JSON")
    .action(async (prompt: string, options) => {
      try {
        const client = await createClient();
        const task = await client.createTask({
          prompt,
          agent: options.agent,
          repositories: options.repo,
          branch: options.branch,
          queueRightAway: options.queue,
        });

        if (options.json) {
          console.log(JSON.stringify(task, null, 2));
          return;
        }

        console.log(chalk.green("Task created!"));
        formatTask(task);
      } catch (error) {
        handleError(error);
      }
    });
}

function handleError(error: unknown): never {
  if (error instanceof TemboApiError) {
    if (error.status === 401) {
      console.error(chalk.red("Unauthorized. Run 'tembo-cli auth login' first."));
    } else if (error.status === 429) {
      console.error(chalk.red("Rate limited. Please wait and try again."));
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
