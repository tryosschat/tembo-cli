import { homedir } from "os";
import { join, dirname } from "path";

export interface Config {
  apiKey: string;
  apiUrl: string;
}

const CONFIG_DIR = join(homedir(), ".tembo-cli");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

const DEFAULT_CONFIG: Config = {
  apiKey: "",
  apiUrl: "https://api.tembo.io",
};

async function ensureConfigDir(): Promise<void> {
  const dir = Bun.file(CONFIG_DIR);
  if (!(await dir.exists())) {
    await Bun.write(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
  }
}

export async function loadConfig(): Promise<Config> {
  const file = Bun.file(CONFIG_PATH);
  
  if (!(await file.exists())) {
    await ensureConfigDir();
    await Bun.write(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
    return DEFAULT_CONFIG;
  }

  try {
    const content = await file.text();
    const config = JSON.parse(content) as Partial<Config>;
    return {
      ...DEFAULT_CONFIG,
      ...config,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function saveConfig(config: Partial<Config>): Promise<void> {
  const existing = await loadConfig();
  const merged = { ...existing, ...config };
  
  const dir = dirname(CONFIG_PATH);
  const dirFile = Bun.file(dir);
  if (!(await dirFile.exists())) {
    const fs = await import("fs/promises");
    await fs.mkdir(dir, { recursive: true });
  }
  
  await Bun.write(CONFIG_PATH, JSON.stringify(merged, null, 2));
}

export async function getApiKey(): Promise<string | null> {
  const envKey = process.env.TEMBO_API_KEY;
  if (envKey) return envKey;

  const config = await loadConfig();
  return config.apiKey || null;
}

export async function setApiKey(apiKey: string): Promise<void> {
  await saveConfig({ apiKey });
}

export async function clearApiKey(): Promise<void> {
  await saveConfig({ apiKey: "" });
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}
