export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
}

/** チャット画面を開いたときに最初から表示しておく、StepCatからの挨拶 */
export const initialConversation: ChatMessage[] = [
  {
    id: "c1",
    role: "ai",
    text: "こんにちは！今週の目標や日々のタスクについて、気になることがあれば何でも聞いてください。",
  },
];
