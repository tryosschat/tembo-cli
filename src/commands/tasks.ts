import { Command } from "commander";
import chalk from "chalk";
import { createClient, TemboApiError, type Task } from "../api";

function getTaskStatus(task: Task): string {
  if (!task.solutions || task.solutions.length === 0) return "pending";
  const latest = task.solutions.at(-1);
  return latest?.status || "unknown";
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "success":
    case "completed":
    case "done":
      return chalk.green(status);
    case "in_progress":
    case "running":
    case "working":
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

function formatTask(task: Task): void {
  const status = getTaskStatus(task);
  console.log(`${chalk.cyan(task.id)} ${chalk.bold(task.title)}`);
  console.log(`  Status: ${getStatusColor(status)}`);

  if (task.agent) {
    console.log(`  Agent: ${chalk.dim(task.agent)}`);
  }

  if (task.solutions?.length) {
    for (const sol of task.solutions) {
      if (sol.pullRequest?.length) {
        for (const pr of sol.pullRequest) {
          console.log(`  PR: ${chalk.underline(pr.url)} (${pr.status})`);
        }
      }
    }
  }

  if (task.prompt) {
    const desc =
      task.prompt.length > 80
        ? task.prompt.slice(0, 80) + "..."
        : task.prompt;
    console.log(`  ${chalk.dim(desc)}`);
  }

  console.log(`  Created: ${chalk.dim(new Date(task.createdAt).toLocaleString())}`);
  console.log();
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
            `Page ${response.meta.currentPage} of ${response.meta.totalPages}`
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
