export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
}

export const dummyConversation: ChatMessage[] = [
  {
    id: "c1",
    role: "ai",
    text: "こんにちは！今週の目標や日々のタスクについて、気になることがあれば何でも聞いてください。",
  },
  {
    id: "c2",
    role: "user",
    text: "今週タスクが全然消化できていなくて焦っています。どう優先順位をつければいいですか？",
  },
  {
    id: "c3",
    role: "ai",
    text: "まずは「今日中に終わらせないと支障が出るもの」から3つだけ選んでみましょう。全部を完璧にこなそうとせず、小さく前進することを優先すると気持ちが楽になりますよ。",
  },
];

export const canned = "なるほど、状況を整理しますね。（これはUIモックの自動応答です）";
