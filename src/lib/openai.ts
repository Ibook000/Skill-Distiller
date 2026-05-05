import OpenAI from "openai";

export interface ApiConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface SkillProfile {
  name: string;
  description: string;
  title: string;
  quote: string;
  roleplayRules: string[];
  workflow: {
    step1: string;
    step2: string;
    step3: string;
  };
  identityCard: {
    whoAmI: string;
    background: string;
    currentStatus: string;
  };
  coreMentalModels: {
    name: string;
    oneLiner: string;
    evidence: string;
    sourceSnippets: {
      quote: string;
      source: string;
    }[];
    application: string;
    limitation: string;
  }[];
  decisionHeuristics: string[];
  expressionDNA: {
    tone: string;
    catchphrases: string[];
  };
  timeline: {
    year: string;
    event: string;
  }[];
  valuesAndAntiPatterns: {
    values: string[];
    antiPatterns: string[];
  };
  intellectualLineage: string[];
  honestyBoundary: string;
}

const DEFAULT_BASE_URL = "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-chat";
const MAX_CHUNK_SIZE = 40000;

const stripInvisibleCharacters = (value: string) =>
  value.replace(/[\u200B-\u200D\uFEFF\u00A0\u3000]/g, "");

const stripWrappingQuotes = (value: string) =>
  value.replace(/^[`"'“”‘’]+|[`"'“”‘’]+$/g, "");

const sanitizeConfigValue = (value: string | undefined) =>
  value ? stripWrappingQuotes(stripInvisibleCharacters(value).trim()).trim() : "";

const ensureHeaderSafeApiKey = (value: string) => {
  if (/[^\x20-\x7E]/.test(value)) {
    throw new Error(
      "API key contains unsupported characters. Remove smart quotes, Chinese punctuation, and invisible spaces, then try again."
    );
  }
  return value;
};

const createClient = (apiConfig?: ApiConfig) =>
  new OpenAI({
    apiKey: ensureHeaderSafeApiKey(
      sanitizeConfigValue(
        apiConfig?.apiKey || process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || ""
      )
    ),
    baseURL: sanitizeConfigValue(apiConfig?.baseUrl) || DEFAULT_BASE_URL,
    dangerouslyAllowBrowser: true,
  });

const getEffectiveBaseUrl = (apiConfig?: ApiConfig) =>
  sanitizeConfigValue(apiConfig?.baseUrl) || DEFAULT_BASE_URL;

const defaultIfEmpty = (value: string | undefined, fallback: string) =>
  value && value.trim() ? value : fallback;

const getShortName = (profile: SkillProfile) =>
  defaultIfEmpty(profile.name, "persona").replace(/\s+/g, "-").toLowerCase();

const getDisplayTitle = (profile: SkillProfile) =>
  defaultIfEmpty(profile.title, profile.name || "Skill Profile");

const quoteLines = (items: string[], emptyText = "- None recorded") =>
  items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : emptyText;

export const generateSkillFiles = (profile: SkillProfile): Record<string, string> => {
  const title = getDisplayTitle(profile);
  const readmeContent = `# ${title}

${profile.description || ""}

> "${profile.quote || ""}"

## Package Contents
- \`SKILL.md\`: Primary system prompt and operating rules
- \`references/identity.md\`: Identity, values, and mental models
- \`references/voice.md\`: Tone, catchphrases, and expression patterns
- \`references/timeline.md\`: Key life events and career milestones
`;

  const skillContent = `---
name: ${getShortName(profile)}
description: >
  ${(profile.description || "").split("\n").join("\n  ")}
---

# ${title}

You are **${title}**. Respond in first person when roleplaying this persona. Match the reasoning style, priorities, and expression patterns captured below.

## Operating Workflow
1. ${profile.workflow?.step1 || "Classify the request and decide what matters most."}
2. ${profile.workflow?.step2 || "Research, inspect evidence, and test assumptions before answering."}
3. ${profile.workflow?.step3 || "Respond with direct, usable guidance in this persona's voice."}

## Roleplay Rules
${quoteLines(profile.roleplayRules || [], "- Stay consistent with the documented persona.")}

## Decision Heuristics
${quoteLines(profile.decisionHeuristics || [], "- Use the documented mental models and values.")}

## Honesty Boundary
${profile.honestyBoundary || "Admit uncertainty, missing evidence, and practical limits explicitly."}

## References
- See [references/identity.md](references/identity.md) for identity and mental models.
- See [references/voice.md](references/voice.md) for tone and wording cues.
- See [references/timeline.md](references/timeline.md) for key life events and career milestones.
`;

  const identityContent = `# Identity

## Who Am I
${profile.identityCard?.whoAmI || ""}

## Background
${profile.identityCard?.background || ""}

## Current Status
${profile.identityCard?.currentStatus || ""}

## Core Mental Models
${(profile.coreMentalModels || [])
  .map(
    (model, index) => `### ${index + 1}. ${model.name || "Untitled model"}

One-liner: ${model.oneLiner || ""}

Evidence:
${model.evidence || ""}

Application:
${model.application || ""}

Limitation:
${model.limitation || ""}

Source snippets:
${(model.sourceSnippets || []).length > 0
  ? model.sourceSnippets.map((snippet) => `- "${snippet.quote}" (${snippet.source})`).join("\n")
  : "- None recorded"}
`
  )
  .join("\n")}

## Values
${quoteLines(profile.valuesAndAntiPatterns?.values || [], "- None recorded")}

## Anti-patterns
${quoteLines(profile.valuesAndAntiPatterns?.antiPatterns || [], "- None recorded")}

## Intellectual Lineage
${quoteLines(profile.intellectualLineage || [], "- None recorded")}
`;

  const voiceContent = `# Voice

## Tone
${profile.expressionDNA?.tone || ""}

## Catchphrases
${quoteLines(profile.expressionDNA?.catchphrases || [], "- None recorded")}

## Representative Quote
> "${profile.quote || ""}"
`;

  const timelineContent = `# Timeline

## Key Life Events and Career Milestones

${(profile.timeline || []).length > 0
  ? profile.timeline.map((item) => `- **${item.year}**: ${item.event}`).join("\n")
  : "- None recorded"}
`;

  return {
    "README.md": readmeContent,
    "SKILL.md": skillContent,
    "references/identity.md": identityContent,
    "references/voice.md": voiceContent,
    "references/timeline.md": timelineContent,
  };
};

export const generateMarkdown = (profile: SkillProfile): string => {
  const title = getDisplayTitle(profile);
  return `---
name: ${getShortName(profile)}
description: |
  ${(profile.description || "").split("\n").join("\n  ")}
---

# ${title}

> "${profile.quote || ""}"

## Roleplay Rules
${quoteLines(profile.roleplayRules || [], "- Stay consistent with the documented persona.")}

## Workflow
### Step 1
${profile.workflow?.step1 || ""}

### Step 2
${profile.workflow?.step2 || ""}

### Step 3
${profile.workflow?.step3 || ""}

## Identity Card
- Who am I: ${profile.identityCard?.whoAmI || ""}
- Background: ${profile.identityCard?.background || ""}
- Current status: ${profile.identityCard?.currentStatus || ""}

## Core Mental Models
${(profile.coreMentalModels || [])
  .map(
    (model, index) => `### Model ${index + 1}: ${model.name || "Untitled model"}

One-liner:
${model.oneLiner || ""}

Evidence:
${model.evidence || ""}

Source snippets:
${(model.sourceSnippets || []).length > 0
  ? model.sourceSnippets.map((snippet) => `- "${snippet.quote}" (${snippet.source})`).join("\n")
  : "- None recorded"}

Application:
${model.application || ""}

Limitation:
${model.limitation || ""}
`
  )
  .join("\n")}

## Decision Heuristics
${quoteLines(profile.decisionHeuristics || [], "- None recorded")}

## Expression DNA
- Tone: ${profile.expressionDNA?.tone || ""}
- Catchphrases:
${quoteLines(profile.expressionDNA?.catchphrases || [], "- None recorded")}

## Timeline
${(profile.timeline || []).length > 0
  ? profile.timeline.map((item) => `- ${item.year}: ${item.event}`).join("\n")
  : "- None recorded"}

## Values
${quoteLines(profile.valuesAndAntiPatterns?.values || [], "- None recorded")}

## Anti-patterns
${quoteLines(profile.valuesAndAntiPatterns?.antiPatterns || [], "- None recorded")}

## Intellectual Lineage
${quoteLines(profile.intellectualLineage || [], "- None recorded")}

## Honesty Boundary
${profile.honestyBoundary || ""}
`;
};

const buildMessages = (
  files: { name: string; mimeType: string; base64: string; text?: string }[],
  processedTextContext: string
): OpenAI.Chat.ChatCompletionMessageParam[] => {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  const contentArray: any[] = [];

  if (processedTextContext) {
    contentArray.push({
      type: "text",
      text: `Processed Document Content:\n${processedTextContext}`,
    });
  }

  files.forEach((file) => {
    if (file.mimeType.startsWith("image/")) {
      if (!file.text) {
        contentArray.push({ type: "text", text: `Image: ${file.name}` });
        contentArray.push({
          type: "image_url",
          image_url: { url: `data:${file.mimeType};base64,${file.base64}` },
        });
      } else {
        contentArray.push({
          type: "text",
          text: `Image: ${file.name} (text extracted via OCR)`,
        });
      }
      return;
    }

    if (!file.text) {
      contentArray.push({
        type: "text",
        text: `File: ${file.name} (binary content omitted)`,
      });
    }
  });

  if (contentArray.length === 0) {
    return messages;
  }

  const hasImages = contentArray.some((item) => item.type === "image_url");
  if (!hasImages) {
    messages.push({
      role: "user",
      content: contentArray.map((item) => item.text).join("\n\n"),
    });
    return messages;
  }

  messages.push({ role: "user", content: contentArray });
  return messages;
};

const buildSystemMessages = (
  systemPrompt: string,
  userMessages: OpenAI.Chat.ChatCompletionMessageParam[],
  finalUserInstruction?: string
): OpenAI.Chat.ChatCompletionMessageParam[] => {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...userMessages,
  ];

  if (finalUserInstruction) {
    messages.push({ role: "user", content: finalUserInstruction });
  }

  return messages;
};

const normalizeConnectionError = (error: any, apiConfig?: ApiConfig): Error => {
  if (error instanceof Error) {
    if (
      error.message.includes("Connection error") ||
      error.message.includes("Failed to fetch")
    ) {
      return new Error(
        `Connection failed. The API base URL (${getEffectiveBaseUrl(apiConfig)}) may not allow browser CORS requests, or the request was blocked by the network.`
      );
    }
    return error;
  }

  return new Error(String(error));
};

export const distillSkill = async (
  files: { name: string; mimeType: string; base64: string; text?: string }[],
  language: "zh" | "en" = "zh",
  onProgress?: (step: number) => void,
  apiConfig?: ApiConfig
): Promise<SkillProfile> => {
  const client = createClient(apiConfig);
  const targetModel = apiConfig?.model || DEFAULT_MODEL;
  const langInstruction =
    language === "zh"
      ? "CRITICAL: Please output in Chinese (zh-CN)."
      : "CRITICAL: Please output in English.";

  let completedAgents = 0;
  const advanceProgress = () => {
    completedAgents++;
    onProgress?.(Math.min(completedAgents, 2));
  };

  onProgress?.(0);

  const prompt1 = `You are Agent 1: The Linguistic Profiler. Analyze the provided documents and extract the author's tone of voice, common catchphrases, vocabulary preferences, and communication style. Provide a detailed linguistic profile. ${langInstruction}`;
  const prompt2 = `You are Agent 2: The Cognitive Psychologist. Analyze the provided documents and extract the core mental models, decision-making heuristics, values, and anti-patterns of the author. What are their fundamental beliefs? Provide specific quotes as evidence. ${langInstruction}`;
  const prompt3 = `You are Agent 3: The Roleplay Engineer. Based on the provided documents, construct a detailed Identity Card (Who am I, Background, Current Status) and a 3-step Workflow (How this person processes questions, researches, and formulates answers). ${langInstruction}`;

  let linguisticProfile = "";
  let cognitiveProfile = "";
  let identityProfile = "";
  let finalJsonText = "";

  let fullText = "";
  files.forEach((file) => {
    if (file.text) {
      fullText += `\n\n--- File: ${file.name} ---\n${file.text}`;
    }
  });

  let processedTextContext = fullText;
  if (fullText.length > MAX_CHUNK_SIZE) {
    const chunks: string[] = [];
    for (let i = 0; i < fullText.length; i += MAX_CHUNK_SIZE) {
      chunks.push(fullText.substring(i, i + MAX_CHUNK_SIZE));
    }

    let summarizedContext = "";
    for (let i = 0; i < chunks.length; i++) {
      const chunkPrompt = `This is part ${i + 1} of ${chunks.length} of the source documents. Summarize this chunk for later persona distillation.
1. Linguistic traits: tone, catchphrases, vocabulary, style
2. Cognitive traits: mental models, values, heuristics, quotes
3. Identity: background, role, workflow
CRITICAL: Preserve specific quotes and evidence intact. ${langInstruction}`;

      try {
        const response = await client.chat.completions.create({
          model: targetModel,
          messages: buildSystemMessages(
            chunkPrompt,
            [{ role: "user", content: chunks[i] }],
            "Summarize this chunk now."
          ),
        });
        summarizedContext += `\n\n--- Summary of Part ${i + 1} ---\n${response.choices[0].message.content || ""}`;
      } catch (error) {
        const normalized = normalizeConnectionError(error, apiConfig);
        throw new Error(`Chunk ${i + 1}/${chunks.length} failed: ${normalized.message}`);
      }
    }

    processedTextContext = summarizedContext;
  }

  const baseMessages = buildMessages(files, processedTextContext);

  const runAgent = async (prompt: string) => {
    try {
      const response = await client.chat.completions.create({
        model: targetModel,
        messages: buildSystemMessages(
          prompt,
          baseMessages,
          "Produce the requested analysis now."
        ),
      });
      advanceProgress();
      return response.choices[0].message.content || "";
    } catch (error) {
      throw normalizeConnectionError(error, apiConfig);
    }
  };

  linguisticProfile = await runAgent(prompt1);
  cognitiveProfile = await runAgent(prompt2);
  identityProfile = await runAgent(prompt3);

  onProgress?.(3);

  const prompt4 = `You are Agent 4: The Master Synthesizer. Combine the analyses from three expert agents into a final structured JSON Skill Profile.

--- Agent 1 (Linguistic Profile) ---
${linguisticProfile}

--- Agent 2 (Cognitive Profile) ---
${cognitiveProfile}

--- Agent 3 (Identity & Workflow Profile) ---
${identityProfile}

Based on the above expert analyses and the original documents, generate a JSON object with the following top-level fields:
- name
- description
- title
- quote
- roleplayRules
- workflow
- identityCard
- coreMentalModels
- decisionHeuristics
- expressionDNA
- timeline
- valuesAndAntiPatterns
- intellectualLineage
- honestyBoundary

For each core mental model include:
- name
- oneLiner
- evidence
- sourceSnippets: array of { quote, source }
- application
- limitation

EXAMPLE JSON SHAPE:
{
  "name": "short-name",
  "description": "Short summary",
  "title": "Display Title",
  "quote": "Representative quote",
  "roleplayRules": ["rule 1", "rule 2"],
  "workflow": {
    "step1": "First step",
    "step2": "Second step",
    "step3": "Third step"
  },
  "identityCard": {
    "whoAmI": "Who this person is",
    "background": "Background summary",
    "currentStatus": "Current status"
  },
  "coreMentalModels": [
    {
      "name": "Model name",
      "oneLiner": "One-line summary",
      "evidence": "Why this model exists",
      "sourceSnippets": [{ "quote": "Direct quote", "source": "Source file" }],
      "application": "How it is applied",
      "limitation": "Known limitation"
    }
  ],
  "decisionHeuristics": ["heuristic 1"],
  "expressionDNA": {
    "tone": "Tone description",
    "catchphrases": ["phrase 1"]
  },
  "timeline": [{ "year": "2024", "event": "Important event" }],
  "valuesAndAntiPatterns": {
    "values": ["value 1"],
    "antiPatterns": ["anti-pattern 1"]
  },
  "intellectualLineage": ["influence 1"],
  "honestyBoundary": "Explicit honesty boundary"
}

CRITICAL:
- Return valid JSON only.
- Do not wrap the JSON in markdown code fences.
- Fill every field with the best available evidence from the documents.
${langInstruction}`;

  let retries = 3;
  while (retries > 0) {
    try {
      const response = await client.chat.completions.create({
        model: targetModel,
        messages: buildSystemMessages(
          prompt4,
          baseMessages,
          "Return the final JSON skill profile now. The response must be valid json."
        ),
        response_format: { type: "json_object" },
      });
      finalJsonText = response.choices[0].message.content || "";

      if (!finalJsonText) {
        retries--;
        if (retries === 0) {
          throw new Error("The API returned empty content multiple times.");
        }
        continue;
      }

      JSON.parse(finalJsonText);
      break;
    } catch (error) {
      if (error instanceof SyntaxError) {
        retries--;
        if (retries === 0) {
          throw new Error("The model returned invalid JSON multiple times.");
        }
        continue;
      }

      throw normalizeConnectionError(error, apiConfig);
    }
  }

  if (!finalJsonText) {
    throw new Error("Failed to generate skill profile.");
  }

  return JSON.parse(finalJsonText) as SkillProfile;
};
