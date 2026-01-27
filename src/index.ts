#!/usr/bin/env bun
import { Command } from "commander";
import { registerAuthCommands } from "./commands/auth";
import { registerTaskCommands } from "./commands/tasks";
import { registerRepoCommands } from "./commands/repos";

const program = new Command();

program
  .name("tembo-cli")
  .description("CLI for the Tembo Public API - manage tasks and repositories")
  .version("0.1.0");

registerAuthCommands(program);
registerTaskCommands(program);
registerRepoCommands(program);

program.parse();
