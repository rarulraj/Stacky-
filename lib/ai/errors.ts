export class ApiKeyRequiredError extends Error {
  code = "API_KEY_REQUIRED" as const;
  constructor() {
    super("OpenAI API key required to research real vendors and technologies.");
    this.name = "ApiKeyRequiredError";
  }
}

export class GraphGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GraphGenerationError";
  }
}
