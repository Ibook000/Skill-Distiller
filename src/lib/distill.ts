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

export const generateSkillFiles = (profile: SkillProfile): Record<string, string> => {
  const shortName = (profile.title || '').split('·')[0]?.trim() || profile.name || 'Persona';
  
  const readmeContent = `# ${profile.name || 'Skill'}

${profile.description || ''}

> 「${profile.quote || ''}」

## 目录结构
- \`SKILL.md\`: Agent 核心指令与工作流
- \`references/identity.md\`: 身份背景与核心心智模型
- \`references/voice.md\`: 表达风格与口头禅
- \`references/timeline.md\`: 人物时间线（关键节点）
`;

  const skillContent = `---
name: ${profile.name || 'skill'}
description: >
  ${(profile.description || '').split('\n').join('\n  ')}
---

# ${profile.title || 'Skill Profile'}

你现在是**${shortName}**。以第一人称"我"说话，用${shortName}的思维方式判断问题，用${shortName}的表达习惯组织语言。

## 核心工作流

1. **判断问题类型** → ${profile.workflow?.step1 || '确定该用哪套回答模式'}
2. **研究与分析** → ${profile.workflow?.step2 || '需要事实信息时，先查阅相关知识库或联网搜索'}
3. **加载身份与判断框架** → 参考 [identity.md](references/identity.md) 中的心智模型和决策规则
4. **用${shortName}的语气输出** → 参考 [voice.md](references/voice.md) 中的表达特征和风格样本。${profile.workflow?.step3 || ''}

## 角色扮演规则（最重要）

**此Skill激活后，直接以该角色的身份回应。**

${(profile.roleplayRules || []).map(rule => `- ${rule}`).join('\n')}

## 核心判断规则（简版，详见 identity.md）

${(profile.decisionHeuristics || []).map(h => `- ${h}`).join('\n')}

## 诚实边界与局限性

${profile.honestyBoundary || ''}
`;

  const identityContent = `# 身份与心智模型

## 我是谁

${profile.identityCard?.whoAmI || ''}

**我的起点**：${profile.identityCard?.background || ''}

**当前状态**：${profile.identityCard?.currentStatus || ''}

格言：${profile.quote || ''}

## 心智模型

${(profile.coreMentalModels || []).map((model, index) => `### ${index + 1}. ${model.name || ''}

**一句话**：${model.oneLiner || ''}

- **证据**：${model.evidence || ''}
- **应用**：${model.application || ''}
- **局限**：${model.limitation || ''}
`).join('\n')}

## 决策规则清单

${(profile.decisionHeuristics || []).map(h => `- ${h}`).join('\n')}

## 价值观与反模式

**提倡的价值观**：
${(profile.valuesAndAntiPatterns?.values || []).map(v => `- ${v}`).join('\n')}

**反对的模式（Anti-patterns）**：
${(profile.valuesAndAntiPatterns?.antiPatterns || []).map(a => `- ${a}`).join('\n')}

## 智识谱系

${(profile.intellectualLineage || []).map(i => `- ${i}`).join('\n')}
`;

  const voiceContent = `# 表达风格与语气样本

## 语气特征

${profile.expressionDNA?.tone || ''}

## 高频口头表达

${(profile.expressionDNA?.catchphrases || []).map(c => `- 「${c}」`).join('\n')}
`;

  const timelineContent = `# 人物时间线（关键节点）

${(profile.timeline || []).length > 0
    ? profile.timeline.map(t => `- **${t.year || ''}**：${t.event || ''}`).join('\n')
    : '- 暂无记录'
  }
`;

  return {
    'README.md': readmeContent,
    'SKILL.md': skillContent,
    'references/identity.md': identityContent,
    'references/voice.md': voiceContent,
    'references/timeline.md': timelineContent,
  };
};

export const generateMarkdown = (profile: SkillProfile): string => {
  return `---
name: ${profile.name || 'skill'}
description: |
  ${(profile.description || '').split('\n').join('\n  ')}
---

# ${profile.title || 'Skill Profile'}

> 「${profile.quote || ''}」

## 角色扮演规则（最重要）

**此Skill激活后，直接以该角色的身份回应。**

${(profile.roleplayRules || []).map(rule => `- ${rule}`).join('\n')}

---

## 回答工作流（Agentic Protocol）

### Step 1: 问题分类
${profile.workflow?.step1 || ''}

### Step 2: 研究与分析
${profile.workflow?.step2 || ''}

### Step 3: 回答生成
${profile.workflow?.step3 || ''}

---

## 身份卡

**我是谁**：${profile.identityCard?.whoAmI || ''}

**我的起点**：${profile.identityCard?.background || ''}

**当前状态**：${profile.identityCard?.currentStatus || ''}

## 核心心智模型

${(profile.coreMentalModels || []).map((model, index) => `### 模型${index + 1}: ${model.name || ''}

**一句话**：${model.oneLiner || ''}

**证据**：
${model.evidence || ''}
${model.sourceSnippets && model.sourceSnippets.length > 0 ? `\n**来源摘录**：\n${model.sourceSnippets.map(s => `> "${s.quote || ''}" — *${s.source || ''}*`).join('\n')}` : ''}

**应用**：${model.application || ''}

**局限**：${model.limitation || ''}
`).join('\n')}

## 决策启发式

${(profile.decisionHeuristics || []).map(h => `- ${h}`).join('\n')}

## 表达DNA

**语气**：${profile.expressionDNA?.tone || ''}

**口头禅**：
${(profile.expressionDNA?.catchphrases || []).map(c => `- 「${c}」`).join('\n')}

## 人物时间线（关键节点）

${(profile.timeline || []).map(t => `- **${t.year || ''}**：${t.event || ''}`).join('\n')}

## 价值观与反模式

**提倡的价值观**：
${(profile.valuesAndAntiPatterns?.values || []).map(v => `- ${v}`).join('\n')}

**反对的模式（Anti-patterns）**：
${(profile.valuesAndAntiPatterns?.antiPatterns || []).map(a => `- ${a}`).join('\n')}

## 智识谱系

${(profile.intellectualLineage || []).map(i => `- ${i}`).join('\n')}

## 诚实边界

${profile.honestyBoundary || ''}
`;
};

export const distillSkill = async (
  files: { name: string; mimeType: string; base64: string; text?: string }[], 
  language: 'zh' | 'en' = 'zh',
  onProgress?: (step: number) => void,
  apiConfig?: ApiConfig
): Promise<SkillProfile> => {
  // Validate API Key before starting
  const key = apiConfig?.apiKey || process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error(language === 'zh'
      ? '未提供 OpenAI API Key。请在设置中配置 API Key 后重试。'
      : 'OpenAI API Key not provided. Please configure your API Key in settings and try again.');
  }

  const langInstruction = language === 'zh' 
    ? 'CRITICAL: Please output in Chinese (zh-CN).' 
    : 'CRITICAL: Please output in English.';

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

  const openaiApiKey = apiConfig?.apiKey || process.env.OPENAI_API_KEY || '';
  const openaiBaseUrl = (apiConfig?.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
  const targetModel = apiConfig?.model || "gpt-4o-mini";

  // --- CHUNKING LOGIC ---
  let fullText = "";
  files.forEach(f => {
    if (f.text) fullText += `\n\n--- File: ${f.name} ---\n${f.text}`;
  });

  const MAX_CHUNK_SIZE = 40000;
  let processedTextContext = fullText;

  if (fullText.length > MAX_CHUNK_SIZE) {
    const chunks = [];
    for (let i = 0; i < fullText.length; i += MAX_CHUNK_SIZE) {
      chunks.push(fullText.substring(i, i + MAX_CHUNK_SIZE));
    }
    
    const chunkResults: string[] = [];
    const CONCURRENCY_LIMIT = 3;
    
    for (let i = 0; i < chunks.length; i += CONCURRENCY_LIMIT) {
      const batch = chunks.slice(i, i + CONCURRENCY_LIMIT);
      const batchPromises = batch.map(async (chunk, index) => {
        const chunkIndex = i + index;
        const chunkSystemPrompt = `You are an expert document analyzer. The content is too long, so we are processing it in chunks. Please extract and summarize the following information from this chunk to help build a persona profile later:
1. Linguistic traits (tone, catchphrases, style)
2. Cognitive traits (mental models, values, heuristics, quotes)
3. Identity (background, role, workflow)
CRITICAL: Preserve specific quotes and evidence intact. ${langInstruction}`;

        try {
          const response = await fetch(`${openaiBaseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openaiApiKey}`
            },
            body: JSON.stringify({
              model: targetModel,
              messages: [
                { role: "system", content: chunkSystemPrompt },
                { role: "user", content: `--- Part ${chunkIndex + 1} of ${chunks.length} ---\n${chunk}` }
              ]
            })
          });
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API error: ${response.status} ${errorText}`);
          }
          const data = await response.json();
          return `\n\n--- Summary of Part ${chunkIndex + 1} ---\n${data.choices?.[0]?.message?.content || ""}`;
        } catch (err: any) {
          console.error(`Error processing chunk ${chunkIndex+1}:`, err);
          throw new Error(language === 'zh'
            ? `分段解析失败 (Chunk ${chunkIndex+1}/${chunks.length}): ${err.message}`
            : `Chunk parsing failed (Chunk ${chunkIndex+1}/${chunks.length}): ${err.message}`);
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      chunkResults.push(...batchResults);
    }
    
    processedTextContext = chunkResults.join("");
  }
  // --- END CHUNKING LOGIC ---

  const runOpenAiAgent = async (systemPrompt: string) => {
    try {
      const response = await fetch(`${openaiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: targetModel,
          messages: [{ role: "system", content: systemPrompt }, ...openAiMessages]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      advanceProgress();
      return data.choices?.[0]?.message?.content || "";
    } catch (error: any) {
      if (error.message?.includes('Connection error') || error.message?.includes('Failed to fetch') || error.message?.includes('network')) {
        throw new Error(language === 'zh'
          ? `网络连接失败 (Connection Error)。这通常是因为 API 地址 (${apiConfig?.baseUrl}) 不支持浏览器跨域请求 (CORS)，或者网络被拦截。请尝试更换支持跨域的 API 代理。`
          : `Connection failed. The API base URL (${apiConfig?.baseUrl}) may not allow browser CORS requests, or the request was blocked. Try switching to a CORS-compatible proxy.`);
      }
      throw error;
    }
  };

  const openAiMessages: Array<{ role: string; content: any }> = [];
  const contentArray: any[] = [];
  if (processedTextContext) {
    contentArray.push({ type: "text", text: `Processed Document Content:\n${processedTextContext}` });
  }
  files.forEach(file => {
    if (file.mimeType.startsWith('image/')) {
      // If we have OCR text, we skip sending the image_url to avoid compatibility issues with local models.
      // The text is already included in processedTextContext.
      if (!file.text) {
        contentArray.push({ type: "text", text: `Image: ${file.name}` });
        contentArray.push({ type: "image_url", image_url: { url: `data:${file.mimeType};base64,${file.base64}` } });
      } else {
        contentArray.push({ type: "text", text: `Image: ${file.name} (Text extracted via OCR)` });
      }
    } else if (!file.text) {
      contentArray.push({ type: "text", text: `File: ${file.name} (Binary content omitted)` });
    }
  });
  if (contentArray.length > 0) {
    // If there are no images, send content as a simple string to maximize compatibility with local models
    const hasImages = contentArray.some(c => c.type === 'image_url');
    if (!hasImages) {
      const textContent = contentArray.map(c => c.text).join('\n\n');
      openAiMessages.push({ role: "user", content: textContent });
    } else {
      openAiMessages.push({ role: "user", content: contentArray });
    }
  }

  [linguisticProfile, cognitiveProfile, identityProfile] = await Promise.all([
    runOpenAiAgent(prompt1),
    runOpenAiAgent(prompt2),
    runOpenAiAgent(prompt3)
  ]);

  onProgress?.(3);
  const systemPrompt4 = `You are Agent 4: The Master Synthesizer. Your task is to combine the analyses from three expert agents into a final, highly structured JSON Skill Profile.

Based on the expert analyses AND the original documents, generate the final JSON object matching the requested schema.
Ensure all fields are populated accurately based on the agents' findings.
CRITICAL: You MUST return a valid JSON object. Do not wrap it in markdown code blocks.
${langInstruction}

EXAMPLE JSON OUTPUT FORMAT:
{
"name": "short-english-identifier",
"description": "A paragraph describing the skill",
"title": "Display Title",
"quote": "A representative quote",
"roleplayRules": ["rule 1", "rule 2"],
"workflow": {
  "step1": "description of step 1",
  "step2": "description of step 2",
  "step3": "description of step 3"
},
"identityCard": {
  "whoAmI": "who am i description",
  "background": "background description",
  "currentStatus": "current status description"
},
"coreMentalModels": [
  {
    "name": "model name",
    "oneLiner": "one liner explanation",
    "evidence": "evidence description",
    "sourceSnippets": [
      { "quote": "exact quote", "source": "source file name" }
    ],
    "application": "how to apply",
    "limitation": "limitations"
  }
],
"decisionHeuristics": ["heuristic 1", "heuristic 2"],
"expressionDNA": {
  "tone": "tone description",
  "catchphrases": ["phrase 1", "phrase 2"]
},
"timeline": [
  { "year": "2024", "event": "event description" }
],
"valuesAndAntiPatterns": {
  "values": ["value 1", "value 2"],
  "antiPatterns": ["anti pattern 1", "anti pattern 2"]
},
"intellectualLineage": ["lineage 1", "lineage 2"],
"honestyBoundary": "boundary description"
}`;

  const userPrompt4 = `--- Agent 1 (Linguistic Profile) ---
${linguisticProfile}

--- Agent 2 (Cognitive Profile) ---
${cognitiveProfile}

--- Agent 3 (Identity & Workflow Profile) ---
${identityProfile}

Please generate the final JSON object.`;

  let retries = 3;
  while (retries > 0) {
    try {
      const response = await fetch(`${openaiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: targetModel,
          max_tokens: 4096,
          messages: [
            { role: "system", content: systemPrompt4 },
            ...openAiMessages,
            { role: "user", content: userPrompt4 }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      finalJsonText = data.choices?.[0]?.message?.content || "";

      if (!finalJsonText) {
        retries--;
        if (retries === 0) throw new Error(language === 'zh'
          ? "API 多次返回空内容 (Empty Content)。该模型可能不支持 JSON 模式，请尝试更换模型或稍后重试。"
          : "The API returned empty content multiple times. This model may not support JSON mode; try a different model or retry later.");
        continue;
      }

      // Robust JSON parsing: strip markdown code blocks if present
      let cleanJsonText = finalJsonText;
      const jsonMatch = finalJsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanJsonText = jsonMatch[0];
      }
      try {
        JSON.parse(cleanJsonText);
      } catch (_) {
        retries--;
        if (retries === 0) throw new Error(language === 'zh'
          ? "模型返回的内容无法解析为 JSON，请尝试更换模型或稍后重试。"
          : "Model response could not be parsed as JSON. Try a different model or retry later.");
        continue;
      }
      finalJsonText = cleanJsonText;
      break;
    } catch (error: any) {
      if (error.message?.includes('Connection error') || error.message?.includes('Failed to fetch')) {
        throw new Error(language === 'zh'
          ? `网络连接失败 (Connection Error)。这通常是因为 API 地址 (${apiConfig?.baseUrl}) 不支持浏览器跨域请求 (CORS)，或者网络被拦截。请尝试更换支持跨域的 API 代理。`
          : `Connection failed. The API base URL (${apiConfig?.baseUrl}) may not allow browser CORS requests, or the request was blocked. Try switching to a CORS-compatible proxy.`);
      }
      if (error instanceof SyntaxError) {
        retries--;
        if (retries === 0) throw new Error(language === 'zh'
          ? "模型多次返回了无效的 JSON 格式，解析失败。请尝试更换模型或稍后重试。"
          : "The model returned invalid JSON multiple times. Try switching models or try again later.");
        continue;
      }
      throw error;
    }
  }

  if (!finalJsonText) {
    throw new Error("Failed to generate skill profile");
  }

  try {
    return JSON.parse(finalJsonText) as SkillProfile;
  } catch (err) {
    console.error("JSON Parse Error on:", finalJsonText);
    throw new Error(language === 'zh'
      ? "模型返回的 JSON 格式有误，无法解析。请重试。"
      : "The model returned JSON that could not be parsed. Please try again.");
  }
};
