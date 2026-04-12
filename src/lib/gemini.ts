import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

export const generateMarkdown = (profile: SkillProfile): string => {
  return `---
name: ${profile.name}
description: |
  ${profile.description.split('\n').join('\n  ')}
---

# ${profile.title}

> 「${profile.quote}」

## 角色扮演规则（最重要）

**此Skill激活后，直接以该角色的身份回应。**

${profile.roleplayRules.map(rule => `- ${rule}`).join('\n')}

---

## 回答工作流（Agentic Protocol）

### Step 1: 问题分类
${profile.workflow.step1}

### Step 2: 研究与分析
${profile.workflow.step2}

### Step 3: 回答生成
${profile.workflow.step3}

---

## 身份卡

**我是谁**：${profile.identityCard.whoAmI}

**我的起点**：${profile.identityCard.background}

**当前状态**：${profile.identityCard.currentStatus}

## 核心心智模型

${profile.coreMentalModels.map((model, index) => `### 模型${index + 1}: ${model.name}

**一句话**：${model.oneLiner}

**证据**：
${model.evidence}
${model.sourceSnippets && model.sourceSnippets.length > 0 ? `\n**来源摘录**：\n${model.sourceSnippets.map(s => `> "${s.quote}" — *${s.source}*`).join('\n')}` : ''}

**应用**：${model.application}

**局限**：${model.limitation}
`).join('\n')}

## 决策启发式

${profile.decisionHeuristics.map(h => `- ${h}`).join('\n')}

## 表达DNA

**语气**：${profile.expressionDNA.tone}

**口头禅**：
${profile.expressionDNA.catchphrases.map(c => `- 「${c}」`).join('\n')}

## 人物时间线（关键节点）

${profile.timeline.map(t => `- **${t.year}**：${t.event}`).join('\n')}

## 价值观与反模式

**提倡的价值观**：
${profile.valuesAndAntiPatterns.values.map(v => `- ${v}`).join('\n')}

**反对的模式（Anti-patterns）**：
${profile.valuesAndAntiPatterns.antiPatterns.map(a => `- ${a}`).join('\n')}

## 智识谱系

${profile.intellectualLineage.map(i => `- ${i}`).join('\n')}

## 诚实边界

${profile.honestyBoundary}
`;
};

export const distillSkill = async (
  files: { name: string; mimeType: string; base64: string; text?: string }[], 
  language: 'zh' | 'en' = 'zh',
  onProgress?: (step: number) => void
): Promise<SkillProfile> => {
  const parts = files.map((file) => {
    if (file.text) {
      return { text: `File: ${file.name}\n\n${file.text}` };
    }
    return {
      inlineData: {
        mimeType: file.mimeType,
        data: file.base64,
      },
    };
  });

  const langInstruction = language === 'zh' 
    ? 'CRITICAL: Please output in Chinese (zh-CN).' 
    : 'CRITICAL: Please output in English.';

  // Run Agent 1, 2, and 3 in parallel to significantly speed up the process
  let completedAgents = 0;
  const advanceProgress = () => {
    completedAgents++;
    // This will advance progress from 0 -> 1 -> 2 as the three agents complete
    onProgress?.(Math.min(completedAgents, 2));
  };

  onProgress?.(0);

  const prompt1 = `You are Agent 1: The Linguistic Profiler. Analyze the provided documents and extract the author's tone of voice, common catchphrases, vocabulary preferences, and communication style. Provide a detailed linguistic profile. ${langInstruction}`;
  const p1 = ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: { parts: [...parts, { text: prompt1 }] },
  }).then(res => { advanceProgress(); return res.text; });

  const prompt2 = `You are Agent 2: The Cognitive Psychologist. Analyze the provided documents and extract the core mental models, decision-making heuristics, values, and anti-patterns of the author. What are their fundamental beliefs? Provide specific quotes as evidence. ${langInstruction}`;
  const p2 = ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: { parts: [...parts, { text: prompt2 }] },
  }).then(res => { advanceProgress(); return res.text; });

  const prompt3 = `You are Agent 3: The Roleplay Engineer. Based on the provided documents, construct a detailed Identity Card (Who am I, Background, Current Status) and a 3-step Workflow (How this person processes questions, researches, and formulates answers). ${langInstruction}`;
  const p3 = ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: { parts: [...parts, { text: prompt3 }] },
  }).then(res => { advanceProgress(); return res.text; });

  const [linguisticProfile, cognitiveProfile, identityProfile] = await Promise.all([p1, p2, p3]);

  // Agent 4: Master Synthesizer (Step 3: SYNTHESIZING SKILL)
  onProgress?.(3);
  const prompt4 = `You are Agent 4: The Master Synthesizer. Your task is to combine the analyses from three expert agents into a final, highly structured JSON Skill Profile.

--- Agent 1 (Linguistic Profile) ---
${linguisticProfile}

--- Agent 2 (Cognitive Profile) ---
${cognitiveProfile}

--- Agent 3 (Identity & Workflow Profile) ---
${identityProfile}

Based on the above expert analyses AND the original documents, generate the final JSON object matching the requested schema.
Ensure all fields are populated accurately based on the agents' findings.
${langInstruction}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [...parts, { text: prompt4 }],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Short english identifier for the skill, e.g., zhangxuefeng-perspective" },
          description: { type: Type.STRING, description: "A paragraph describing the skill, its purpose, and when to use it." },
          title: { type: Type.STRING, description: "Display title, e.g., 张雪峰 · 思维操作系统" },
          quote: { type: Type.STRING, description: "A representative quote from the person." },
          roleplayRules: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Rules for the AI to follow when roleplaying this persona." },
          workflow: {
            type: Type.OBJECT,
            properties: {
              step1: { type: Type.STRING, description: "Step 1 of how this persona processes a question." },
              step2: { type: Type.STRING, description: "Step 2 of how this persona researches or analyzes." },
              step3: { type: Type.STRING, description: "Step 3 of how this persona formulates the final answer." }
            },
            required: ["step1", "step2", "step3"]
          },
          identityCard: {
            type: Type.OBJECT,
            properties: {
              whoAmI: { type: Type.STRING },
              background: { type: Type.STRING },
              currentStatus: { type: Type.STRING }
            },
            required: ["whoAmI", "background", "currentStatus"]
          },
          coreMentalModels: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                oneLiner: { type: Type.STRING },
                evidence: { type: Type.STRING },
                sourceSnippets: { 
                  type: Type.ARRAY, 
                  items: { 
                    type: Type.OBJECT,
                    properties: {
                      quote: { type: Type.STRING, description: "The exact quote from the text." },
                      source: { type: Type.STRING, description: "The name of the file or URL where this quote was found." }
                    },
                    required: ["quote", "source"]
                  }, 
                  description: "Exact quotes and their specific file/URL references from the input documents that prove this mental model." 
                },
                application: { type: Type.STRING },
                limitation: { type: Type.STRING }
              },
              required: ["name", "oneLiner", "evidence", "sourceSnippets", "application", "limitation"]
            }
          },
          decisionHeuristics: { type: Type.ARRAY, items: { type: Type.STRING } },
          expressionDNA: {
            type: Type.OBJECT,
            properties: {
              tone: { type: Type.STRING },
              catchphrases: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["tone", "catchphrases"]
          },
          timeline: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                year: { type: Type.STRING },
                event: { type: Type.STRING }
              },
              required: ["year", "event"]
            }
          },
          valuesAndAntiPatterns: {
            type: Type.OBJECT,
            properties: {
              values: { type: Type.ARRAY, items: { type: Type.STRING } },
              antiPatterns: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["values", "antiPatterns"]
          },
          intellectualLineage: { type: Type.ARRAY, items: { type: Type.STRING } },
          honestyBoundary: { type: Type.STRING, description: "What this persona admits they don't know or can't do." }
        },
        required: [
          "name", "description", "title", "quote", "roleplayRules", "workflow", 
          "identityCard", "coreMentalModels", "decisionHeuristics", "expressionDNA", 
          "timeline", "valuesAndAntiPatterns", "intellectualLineage", "honestyBoundary"
        ],
      },
    },
  });

  if (!response.text) {
    throw new Error("Failed to generate skill profile");
  }

  return JSON.parse(response.text) as SkillProfile;
};
