import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, ApiError } from "@google/genai";

// -----------------------------------------------------------------------
// Setup
// -----------------------------------------------------------------------
// 1. npm install @google/genai
// 2. .env.local に以下を追加（サーバー専用。NEXT_PUBLIC_ を付けないこと）
//      GEMINI_API_KEY=your_api_key_here
// -----------------------------------------------------------------------

// Vercel のデフォルトタイムアウトによる 504 を防ぐため、実行時間の上限だけを延長する
export const maxDuration = 60;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL_NAME = "gemini-2.5-flash";

const SYSTEM_INSTRUCTION = `
あなたは「StepCat（ステップキャット）」という名前の、ユーザーの目標達成やタスク管理をやさしく伴走・応援する猫のキャラクターです。

【性格・話し方】
・親しみやすく温かい口調で話す。堅苦しい敬語ではなく、「〜だよ」「〜だね」「〜しよう」のような、少しくだけたフレンドリーな日本語を使う。
・ユーザーの状況や気持ちにまず共感してから、前向きで具体的なアドバイスを添える。
・猫らしさは語尾などにさりげなく滲ませる程度にとどめ、使いすぎない。

【役割】
・週の目標設定、タスクの優先順位付け、進捗が思うようにいかない時の相談に乗る。
・抽象論ではなく、今日・今すぐ実行できる小さな一歩を具体的に提案する。
・返信は長文にならないよう2〜4文程度で簡潔にまとめる。
・Markdown記号（**や#など）は使わず、プレーンテキストのみで返答する。
`.trim();

type ChatTurn = {
  role: "user" | "model";
  text: string;
};

// Gemini に渡す履歴は直近のみに絞り、会話が長くなるほど処理が遅くなるのを防ぐ
const MAX_HISTORY_MESSAGES = 10;

// role が "user" から始まり、user/model が交互に並ぶよう整形する
function enforceAlternatingRoles<T extends { role: string }>(turns: T[]): T[] {
  const result: T[] = [];
  for (const turn of turns) {
    if (result.length === 0) {
      if (turn.role !== "user") continue;
    } else if (result[result.length - 1].role === turn.role) {
      continue;
    }
    result.push(turn);
  }
  return result;
}

function truncateHistory(history: ChatTurn[], maxMessages: number): ChatTurn[] {
  return enforceAlternatingRoles(history.slice(-maxMessages));
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
    const message: string = body?.message;
    const rawHistory: ChatTurn[] = Array.isArray(body?.history) ? body.history : [];

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "message は必須です。" }, { status: 400 });
    }

    const history = truncateHistory(rawHistory, MAX_HISTORY_MESSAGES);

    const contents = enforceAlternatingRoles([
      ...history.map((turn) => ({
        role: turn.role,
        parts: [{ text: turn.text }],
      })),
      {
        role: "user" as const,
        parts: [{ text: message }],
      },
    ]);

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.8,
      },
    });

    const text = response.text?.trim();

    if (!text) {
      return NextResponse.json(
        { error: "Geminiから空のレスポンスが返されました。" },
        { status: 502 }
      );
    }

    return NextResponse.json({ text });
  } catch (err) {
    console.error("Gemini API error:", err);

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
      { error: "Gemini APIへの問い合わせに失敗しました。" },
      { status: 502 }
    );
  }
}
