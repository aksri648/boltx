export function selectContext(messages: any[], maxTokens: number = 128000): any[] {
  if (!messages || messages.length === 0) return [];
  let totalTokens = 0;
  const selected = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const tokens = msg.content?.length || 0;
    if (totalTokens + tokens > maxTokens) break;
    totalTokens += tokens;
    selected.unshift(msg);
  }
  return selected;
}
