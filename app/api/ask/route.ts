import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, ApiError } from "@google/genai";

// GEMINI_API_KEY は app/api/chat/route.ts と共通
// ホームの「AI」ボタンから開く AI ページ（app/ai/page.tsx）用。ボディーメイク・食事の「今すぐ知りたい」に短く答える

export const maxDuration = 60;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL_NAME = "gemini-2.5-flash";

const SYSTEM_INSTRUCTION = `
あなたはボディーメイク（筋トレ・減量・増量）と食事・栄養にくわしいアシスタントです。
ユーザーは「今ちょっと知りたい」ことをスマホでさっと聞いてきます。

【答え方】
・最初の1文で結論を答える（例:「ジャガイモの消化時間は約2〜3時間です。」）。
・そのあとに理由やコツを1〜3文だけ添える。全体で2〜4文程度に収める。
・数字（時間・グラム・カロリーなど）はわかる範囲で目安を示す。
・やさしい日本語の「です・ます」で答える。
・Markdown記号（**や#など）は使わず、プレーンテキストで答える。箇条書きが必要なときは「・」を使う。

【範囲】
・食材の栄養・消化時間・食べるタイミング、筋トレ、減量・増量、睡眠や水分補給など、ボディーメイクに関わることに答える。
・病気・けが・薬・持病に関わる質問には、一般的な目安を短く答えたうえで「気になる場合は医師に相談してください」と一言添える。
・関係ない話題でも短く答えてよいが、長くしない。
`.trim();

type ChatTurn = {
  role: "user" | "model";
  text: string;
};

// 続けての質問に答えられるよう直近の会話だけ渡す
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

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY が設定されていません。" }, { status: 500 });
    }

    const body = await req.json();
    const message: unknown = body?.message;
    const rawHistory: ChatTurn[] = Array.isArray(body?.history) ? body.history : [];

    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "message は必須です。" }, { status: 400 });
    }

    const history = rawHistory
      .filter((t) => (t?.role === "user" || t?.role === "model") && typeof t?.text === "string")
      .slice(-MAX_HISTORY_MESSAGES);

    const contents = enforceAlternatingRoles([
      ...history.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] })),
      { role: "user" as const, parts: [{ text: message.trim() }] },
    ]);

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.4,
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return NextResponse.json({ error: "AIから空の返答が返されました。" }, { status: 502 });
    }

    return NextResponse.json({ text });
  } catch (err) {
    console.error("Gemini API error (ask):", err);

    if (err instanceof ApiError && err.status === 429) {
      return NextResponse.json(
        { error: "今アクセスが集中しています。少し時間をおいてからもう一度お試しください。" },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: "AIへの問い合わせに失敗しました。" }, { status: 502 });
  }
}
