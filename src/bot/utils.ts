// Escape markdown special characters for Telegram
export function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

// Split long messages
export function splitMessage(message: string, maxLength: number): string[] {
  const chunks: string[] = [];
  const lines = message.split('\n');
  let currentChunk = '';

  for (const line of lines) {
    if ((currentChunk + line + '\n').length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      // If single line is too long, split it
      if (line.length > maxLength) {
        chunks.push(line.slice(0, maxLength));
        currentChunk = line.slice(maxLength) + '\n';
      } else {
        currentChunk = line + '\n';
      }
    } else {
      currentChunk += line + '\n';
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Format time ago
export function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

// Get mood emoji
export function getMoodEmoji(mood: string): string {
  const map: Record<string, string> = {
    tired: "😴",
    curious: "🧐",
    motivated: "⚡",
    relaxed: "🧘",
    bored: "🤥",
    chill: "😌",
  };
  return map[mood] || "💭";
}
