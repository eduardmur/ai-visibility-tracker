export const PLATFORM_IDS = ["chatgpt", "perplexity", "gemini", "claude", "grok"] as const;
export type PlatformId = (typeof PLATFORM_IDS)[number];

export interface PlatformDefinition {
  id: PlatformId;
  label: string;
  /** Gateway model id (`creator/model`). Override with the env variable in `modelEnv`. */
  defaultModel: string;
  modelEnv: string;
  description: string;
}

export const PLATFORMS: Record<PlatformId, PlatformDefinition> = {
  chatgpt: {
    id: "chatgpt",
    label: "ChatGPT",
    defaultModel: "openai/gpt-5.4-nano",
    modelEnv: "MODEL_CHATGPT",
    description: "OpenAI model answering with the web_search tool.",
  },
  perplexity: {
    id: "perplexity",
    label: "Perplexity",
    defaultModel: "perplexity/sonar",
    modelEnv: "MODEL_PERPLEXITY",
    description: "Perplexity Sonar, a search-native model.",
  },
  gemini: {
    id: "gemini",
    label: "Gemini",
    defaultModel: "google/gemini-3-flash",
    modelEnv: "MODEL_GEMINI",
    description: "Gemini grounded with Google Search.",
  },
  claude: {
    id: "claude",
    label: "Claude",
    defaultModel: "anthropic/claude-haiku-4.5",
    modelEnv: "MODEL_CLAUDE",
    description: "Claude with the web search tool, one search per answer.",
  },
  grok: {
    id: "grok",
    label: "Grok",
    defaultModel: "xai/grok-4.20-non-reasoning",
    modelEnv: "MODEL_GROK",
    description: "Grok with xAI web search, budgeted to one search per answer.",
  },
};

export const DEFAULT_PLATFORMS: PlatformId[] = ["chatgpt", "perplexity", "gemini"];

export const EXTRACTOR_DEFAULT_MODEL = "openai/gpt-4o-mini";

export function isPlatformId(value: unknown): value is PlatformId {
  return typeof value === "string" && (PLATFORM_IDS as readonly string[]).includes(value);
}

export function platformModelId(id: PlatformId): string {
  const override = process.env[PLATFORMS[id].modelEnv]?.trim();
  return override || PLATFORMS[id].defaultModel;
}

export function extractorModelId(): string {
  return process.env.MODEL_EXTRACTOR?.trim() || EXTRACTOR_DEFAULT_MODEL;
}

export function platformLabel(id: string): string {
  return isPlatformId(id) ? PLATFORMS[id].label : id;
}

/** Keeps only known platform ids, in canonical order. */
export function normalizePlatformList(values: unknown): PlatformId[] {
  const set = new Set(Array.isArray(values) ? values.filter(isPlatformId) : []);
  return PLATFORM_IDS.filter((id) => set.has(id));
}
