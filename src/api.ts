import { loadConfig, getApiKey } from "./config";

export interface User {
  orgId: string;
  userId?: string;
  email?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
}

export interface TaskListResponse {
  issues: Task[];
  meta: {
    totalCount: number;
    page: number;
    limit: number;
  };
}

export interface Repository {
  id: string;
  name: string;
  url: string;
  provider: string;
}

export interface RepositoryListResponse {
  codeRepositories: Repository[];
}

export interface CreateTaskParams {
  prompt: string;
  agent?: string;
  repositories?: string[];
  branch?: string;
  queueRightAway?: boolean;
}

export class TemboApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message?: string
  ) {
    super(message || `API Error: ${status} ${statusText}`);
    this.name = "TemboApiError";
  }
}

export class TemboApi {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = "https://api.tembo.io") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new TemboApiError(response.status, response.statusText, text);
    }

    return response.json() as Promise<T>;
  }

  async me(): Promise<User> {
    return this.request<User>("/me");
  }

  async listTasks(page = 1, limit = 10): Promise<TaskListResponse> {
    return this.request<TaskListResponse>(
      `/task/list?page=${page}&limit=${limit}`
    );
  }

  async searchTasks(query: string, limit = 10): Promise<TaskListResponse> {
    return this.request<TaskListResponse>(
      `/task/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
  }

  async createTask(params: CreateTaskParams): Promise<Task> {
    return this.request<Task>("/task/create", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async listRepositories(): Promise<RepositoryListResponse> {
    return this.request<RepositoryListResponse>("/repository/list");
  }
}

export async function createClient(): Promise<TemboApi> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error(
      "No API key found. Run 'tembo-cli auth login' or set TEMBO_API_KEY env var."
    );
  }

  const config = await loadConfig();
  return new TemboApi(apiKey, config.apiUrl);
}
