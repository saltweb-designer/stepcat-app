import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, ApiError } from "@google/genai";

// 予定・タスク・メモの「内容」を要約し、一覧に表示する短いタイトルを返す
// （components/entry-form/EntryFormModal.tsx から保存時に呼び出す）
// GEMINI_API_KEY は app/api/ai-phrase/route.ts と共通

export const maxDuration = 30;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODEL_NAME = "gemini-2.5-flash-lite";

/** タイトルの最大文字数。これを超えた場合は切り詰める */
const MAX_TITLE_LENGTH = 30;

const SYSTEM_INSTRUCTION = `
ユーザーが入力したスケジュール・タスク・メモの内容を要約し、一覧に表示する短いタイトルを1つだけ作ってください。

- 日本語で、20文字以内を目安に、内容が一目でわかる名詞句にしてください（例：「歯医者の予約」「企画書の提出」）。
- 「予定」「メモ」「明日のこと」のような抽象的な言葉ではなく、何をするか・何についてかという具体的な中身を入れてください。
- 内容が複数ある場合は、主なものを優先し、必要なら「・」でつないでください（例：「歯医者・買い物」）。
- 入力が英語など日本語以外の場合は、その言語のままで構いません。
- 句点・鍵括弧・引用符・絵文字・前置き・説明は付けず、タイトルの文字列だけを出力してください。
`.trim();

function cleanTitle(raw: string) {
  const line = raw.split("\n").map((l) => l.trim()).find((l) => l !== "") ?? "";
  return line.replace(/^["'「『【]+|["'」』】。．.]+$/g, "").trim().slice(0, MAX_TITLE_LENGTH);
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY が設定されていません。" }, { status: 500 });
    }

    const body = await req.json();
    const text: string = body?.text;
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "text は必須です。" }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: "user" as const, parts: [{ text: text.slice(0, 4000) }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3,
      },
    });

    const title = cleanTitle(response.text ?? "");
    if (!title) {
      return NextResponse.json({ error: "Gemini から空のレスポンスが返されました。" }, { status: 502 });
    }

    return NextResponse.json({ title });
  } catch (err) {
    console.error("API Error Details:", err);
    if (err instanceof ApiError && err.status === 429) {
      return NextResponse.json({ error: "現在アクセスが集中しています。" }, { status: 429 });
    }
    return NextResponse.json({ error: "サーバーエラーが発生しました。" }, { status: 500 });
  }
}
