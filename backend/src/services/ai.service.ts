import { config } from '../config/env';

interface ScoreResult {
  score: number;
  breakdown: { point: string; score: number; max: number; comment: string }[];
  overallFeedback: string;
  suggestions: string[];
}

interface WeaknessAnalysis {
  weaknessAreas: { type: string; accuracy: number; commonIssues: string[]; suggestion: string }[];
  strengthAreas: { type: string; accuracy: number }[];
  overallTrend: 'improving' | 'declining' | 'stable';
  summary: string;
}

/**
 * AI 服务：封装 OpenAI 调用。
 * - 如已配置 OPENAI_API_KEY：调用真实 API
 * - 如未配置：返回模拟结果（方便开发测试）
 */
export class AiService {
  /**
   * AI 单题评分。
   */
  async scoreAnswer(
    questionContent: string,
    modelAnswer: string | null,
    scoringPoints: unknown[] | null,
    userAnswer: string,
  ): Promise<ScoreResult> {
    if (config.openai.apiKey) {
      return this.scoreWithOpenAI(questionContent, modelAnswer, scoringPoints, userAnswer);
    }
    return this.mockScore(userAnswer);
  }

  /**
   * 薄弱板块分析。
   */
  async analyzeWeakness(
    records: { type: string; score: number | null; userAnswer: string | null }[],
  ): Promise<WeaknessAnalysis> {
    if (config.openai.apiKey && records.length >= 5) {
      return this.analyzeWithOpenAI(records);
    }
    return this.mockAnalyze(records);
  }

  // ---- OpenAI 真实调用 ----
  private async scoreWithOpenAI(
    questionContent: string,
    modelAnswer: string | null,
    scoringPoints: unknown[] | null,
    userAnswer: string,
  ): Promise<ScoreResult> {
    const prompt = `你是一位资深的公务员面试考官，拥有20年考官经验。
请根据以下标准对考生答案进行评分（满分10分）：

题目：${questionContent}
参考答案：${modelAnswer ?? '（无）'}
评分要点：${scoringPoints ? JSON.stringify(scoringPoints) : '（无预设要点）'}

考生答案：${userAnswer}

请从以下维度评分并给出详细点评：
1. 逻辑结构（3分）：是否有清晰的答题框架
2. 内容要点（4分）：是否覆盖关键得分点
3. 语言表达（2分）：是否流畅、规范
4. 时间控制（1分）：内容是否详略得当

请严格以 JSON 格式回复，格式如下：
{
  "score": 7.5,
  "breakdown": [
    {"point": "逻辑结构", "score": 2.0, "max": 3, "comment": "..."},
    {"point": "内容要点", "score": 3.0, "max": 4, "comment": "..."},
    {"point": "语言表达", "score": 1.5, "max": 2, "comment": "..."},
    {"point": "时间控制", "score": 1.0, "max": 1, "comment": "..."}
  ],
  "overallFeedback": "总体评价...",
  "suggestions": ["建议1", "建议2", "建议3"]
}`;

    const response = await this.callOpenAI(prompt);
    return this.parseScoreResponse(response);
  }

  private async analyzeWithOpenAI(
    records: { type: string; score: number | null; userAnswer: string | null }[],
  ): Promise<WeaknessAnalysis> {
    const summary = records
      .map((r) => `题型：${r.type}，得分：${r.score ?? 'N/A'}`)
      .join('\n');

    const prompt = `你是一位公务员面试培训专家。以下是某考生的练习记录，请分析其薄弱板块和优势：

${summary}

请以 JSON 格式回复：
{
  "weaknessAreas": [{"type": "题型名", "accuracy": 45, "commonIssues": ["问题1"], "suggestion": "改进建议"}],
  "strengthAreas": [{"type": "题型名", "accuracy": 85}],
  "overallTrend": "improving",
  "summary": "总体分析摘要"
}`;

    const response = await this.callOpenAI(prompt);
    try {
      return JSON.parse(response);
    } catch {
      return this.mockAnalyze(records);
    }
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const url = `${config.openai.baseUrl}/chat/completions`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.openai.apiKey}`,
      },
      body: JSON.stringify({
        model: config.openai.model,
        messages: [
          { role: 'system', content: '你是一个专业的公务员面试AI助手。请始终以合法的JSON格式回复。' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenAI API 错误 (${res.status}): ${text}`);
    }

    const data = (await res.json()) as { choices: { message: { content: string } }[] };
    return data.choices[0]?.message?.content ?? '{}';
  }

  // ---- 模拟评分（无 API Key 时使用）----
  private mockScore(userAnswer: string): ScoreResult {
    const length = (userAnswer ?? '').length;
    const baseScore = length < 20 ? 3 : length < 100 ? 5 : length < 300 ? 7 : 8;
    const score = Math.min(10, baseScore + (Math.random() * 2 - 1));

    return {
      score: Math.round(score * 10) / 10,
      breakdown: [
        { point: '逻辑结构', score: Math.round(score * 0.3 * 10) / 10, max: 3, comment: length < 20 ? '缺少答题框架' : '有基本框架' },
        { point: '内容要点', score: Math.round(score * 0.4 * 10) / 10, max: 4, comment: length < 50 ? '要点不足' : '覆盖了主要要点' },
        { point: '语言表达', score: Math.round(Math.min(2, score * 0.2) * 10) / 10, max: 2, comment: '表述基本清晰' },
        { point: '时间控制', score: Math.round(Math.min(1, score * 0.1) * 10) / 10, max: 1, comment: '内容详略基本得当' },
      ],
      overallFeedback: length < 20 ? '回答过于简略，建议展开论述。' : length < 100 ? '回答有一定内容，但可以更加具体。' : '回答不错，继续保持！',
      suggestions: length < 20
        ? ['建议扩充答题内容，每个要点至少展开2-3句话', '参考参考答案的答题框架']
        : ['建议在作答中加入具体案例', '注意使用机关工作规范用语'],
    };
  }

  private mockAnalyze(
    records: { type: string; score: number | null }[],
  ): WeaknessAnalysis {
    const typeMap = new Map<string, { total: number; score: number }>();
    for (const r of records) {
      if (!typeMap.has(r.type)) typeMap.set(r.type, { total: 0, score: 0 });
      const e = typeMap.get(r.type)!;
      e.total++;
      e.score += (r.score ?? 0);
    }

    const areas = Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      accuracy: Math.round((data.score / (data.total * 10)) * 100),
    }));

    const sorted = areas.sort((a, b) => a.accuracy - b.accuracy);

    return {
      weaknessAreas: sorted
        .filter((a) => a.accuracy < 70)
        .slice(0, 3)
        .map((a) => ({
          type: a.type,
          accuracy: a.accuracy,
          commonIssues: ['答题缺乏系统性', '要点覆盖不全面'],
          suggestion: `建议每天练习3道${a.type}题，重点加强逻辑训练。`,
        })),
      strengthAreas: sorted.filter((a) => a.accuracy >= 70).slice(0, 3),
      overallTrend: 'improving',
      summary: `共分析 ${records.length} 条记录。${
        sorted.filter((a) => a.accuracy < 70).length > 0
          ? `薄弱板块：${sorted.filter((a) => a.accuracy < 70).map((a) => a.type).join('、')}。`
          : '整体表现良好！'
      }`,
    };
  }

  private parseScoreResponse(response: string): ScoreResult {
    // 尝试从回答中提取 JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          score: parsed.score ?? 5,
          breakdown: parsed.breakdown ?? [],
          overallFeedback: parsed.overallFeedback ?? '',
          suggestions: parsed.suggestions ?? [],
        };
      } catch {
        // fallback
      }
    }
    return this.mockScore('');
  }
}

export const aiService = new AiService();
