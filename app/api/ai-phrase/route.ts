import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type, ApiError } from "@google/genai";

// -----------------------------------------------------------------------
// Setup
// -----------------------------------------------------------------------
// 1. npm install @google/genai （app/api/chat/route.ts と共通）
// 2. .env.local に以下を追加（サーバー専用。NEXT_PUBLIC_ を付けないこと）
//      GEMINI_API_KEY=your_api_key_here
// -----------------------------------------------------------------------

// Vercel のデフォルトタイムアウトによる 504 を防ぐため、実行時間の上限だけを延長する
export const maxDuration = 60;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL_NAME = "gemini-2.5-flash-lite";

type Mode = "generate" | "correct";

// 英語添削ページ（app/en/page.tsx）用のシステムプロンプト
// ------------------------------------------------------------------
// generate: 「フレーズ生成（日→英）」モード。日本語の意図から英語フレーズを2種類提案する
// correct : 「フレーズ添削（英→日）」モード。自作の英語フレーズを添削し、日本語で解説する
// ------------------------------------------------------------------

const GENERATE_SYSTEM_INSTRUCTION = `
ユーザーが入力した日本語の意図を汲み取り、日常会話で使える自然な英語フレーズを2つ提案してください。

1つ目（short）: 簡単で短いフレーズ。中学校レベル（CEFR A2程度）のシンプルな単語・構文を使い、
　カジュアルな場面でそのまま使える短い言い回しにしてください。
2つ目（long）: 少し長めで丁寧なフレーズ。1つ目よりも丁寧・具体的な言い方にしつつ、
　不自然に長くなりすぎない範囲（1文程度）にしてください。

【重要】いかなる場合も、必ず純粋なJSON形式のみで出力すること。\`\`\`json などのマークダウン記法や、前置き・後書きのテキストは一切含めないこと。
`.trim();

const generateResponseSchema = {
  type: Type.OBJECT,
  properties: {
    short: {
      type: Type.STRING,
      description: "簡単で短い英語フレーズ",
    },
    long: {
      type: Type.STRING,
      description: "少し長めで丁寧な英語フレーズ",
    },
  },
  required: ["short", "long"],
};

const CORRECT_SYSTEM_INSTRUCTION = `
ユーザーが入力した英語フレーズを、日本人の英語学習者向けに添削してください。
あなたは優しく穏やかな英語の先生です。厳しく指摘しすぎず、学習者が理解しやすいように説明してください。

必ず以下の3つの情報をセットで返してください。
1. evaluation: 元のフレーズが文法的に正しいか、自然な表現かどうかの簡潔な評価（日本語、1文程度）。
　　誤りがあれば「〜という誤りがあります」、誤りはないがより自然な言い方があれば「文法的には正しいですが、
　　より自然にするなら〜」、既に自然で問題がなければ「とても自然な表現です」のように簡潔に述べてください。
2. corrected: 修正・改善後の英語フレーズ。文法的な誤りがあれば正しく直し、誤りがなくてもより自然で
　　ネイティブらしい言い方があればそちらに修正してください。既に完璧で直す必要がない場合は、
　　入力されたフレーズをそのまま corrected に入れてください。
3. explanation: なぜその修正が良いのか（あるいはなぜそのままで良いのか）を、日本語でわかりやすく解説してください。
　　文法用語を使う場合は簡単な補足を添え、初級〜中級学習者にも理解できるようにしてください。

【重要】いかなる場合も、必ず純粋なJSON形式のみで出力すること。\`\`\`json などのマークダウン記法や、前置き・後書きのテキストは一切含めないこと。
`.trim();

const correctResponseSchema = {
  type: Type.OBJECT,
  properties: {
    evaluation: {
      type: Type.STRING,
      description: "元のフレーズの評価（日本語、簡潔に）",
    },
    corrected: {
      type: Type.STRING,
      description: "修正・改善後の英語フレーズ",
    },
    explanation: {
      type: Type.STRING,
      description: "修正理由の解説（日本語）",
    },
  },
  required: ["evaluation", "corrected", "explanation"],
};

// Gemini が ```json ... ``` のようなマークダウンや前置き・後書きのテキストを
// 混ぜて返してきた場合に備え、JSON.parse できる形に整形する
function extractJson(rawText: string): string {
  let text = rawText.trim();

  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }

  return text;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY が設定されていません。" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const mode: Mode = body?.mode === "correct" ? "correct" : "generate";
    const text: string = body?.text;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "text は必須です。" },
        { status: 400 }
      );
    }

    const systemInstruction =
      mode === "correct" ? CORRECT_SYSTEM_INSTRUCTION : GENERATE_SYSTEM_INSTRUCTION;
    const responseSchema = mode === "correct" ? correctResponseSchema : generateResponseSchema;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          role: "user" as const,
          parts: [{ text }],
        },
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.8,
      },
    });

    const rawText = response.text;

    if (!rawText) {
      return NextResponse.json(
        { error: "Gemini から空のレスポンスが返されました。" },
        { status: 502 }
      );
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(extractJson(rawText));
    } catch {
      return NextResponse.json(
        { error: "Gemini のレスポンスをJSONとして解析できませんでした。", raw: rawText },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err) {
    // Vercel のログで原因をすぐ特定できるよう、エラーの詳細を必ず出力する
    console.error("API Error Details:", err);
    if (err instanceof ApiError) {
      console.error("API Error Details: status =", err.status, ", message =", err.message);
    } else if (err instanceof Error) {
      console.error("API Error Details: message =", err.message, ", stack =", err.stack);
    }

    if (err instanceof ApiError && err.status === 429) {
      return NextResponse.json(
        {
          error:
            "現在アクセスが集中しているため、返信できませんでした。少し時間をおいてからもう一度お試しください。",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "サーバーエラーが発生しました。" },
      { status: 500 }
    );
  }
}
