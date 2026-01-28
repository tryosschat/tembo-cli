#!/usr/bin/env bun
import { $ } from "bun";

const pkg = await Bun.file("package.json").json();
console.log(`\n📦 ${pkg.name}@${pkg.version}\n`);

const token = process.env.NPM_TOKEN;
if (!token) {
  console.error("Missing NPM_TOKEN env var.");
  console.error("Create a granular access token at: https://www.npmjs.com/settings/leoisadev/tokens");
  console.error("Then run:  NPM_TOKEN=your_token bun run deploy");
  process.exit(1);
}

const bump = process.argv[2] || "patch";
console.log(`Bumping version (${bump})...`);
await $`npm version ${bump} --no-git-tag-version`;

const newPkg = await Bun.file("package.json").json();
console.log(`Version: ${newPkg.version}\n`);

console.log("Publishing to npm...");
await $`npm publish --access public`.env({ ...process.env, npm_config_registry: "https://registry.npmjs.org/", npm_config__registry_npmjs_org__authToken: token });

console.log("\nPushing to git...");
await $`git add package.json`;
await $`git commit -m ${"release: v" + newPkg.version}`;
await $`git pull --rebase`;
await $`git push`;

console.log(`\n✓ Published ${newPkg.name}@${newPkg.version}`);
console.log(`  https://www.npmjs.com/package/${newPkg.name}`);
console.log(`  Install: bun add -g ${newPkg.name}\n`);
