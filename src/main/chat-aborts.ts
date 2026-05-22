export type ChatAbort = () => void;

function chatKey(profile?: string, sessionId?: string): string {
  return `${profile || "default"}:${sessionId || "new"}`;
}

export class ChatAbortRegistry {
  private readonly aborts = new Map<string, ChatAbort>();

  replace(
    profile: string | undefined,
    sessionId: string | undefined,
    abort: ChatAbort,
  ): void {
    const key = chatKey(profile, sessionId);
    this.abortKey(key);
    this.aborts.set(key, abort);
  }

  clear(profile?: string, sessionId?: string): void {
    this.aborts.delete(chatKey(profile, sessionId));
  }

  abort(profile?: string, sessionId?: string): boolean {
    return this.abortKey(chatKey(profile, sessionId));
  }

  private abortKey(key: string): boolean {
    const abort = this.aborts.get(key);
    if (!abort) return false;
    abort();
    this.aborts.delete(key);
    return true;
  }

  abortAll(): void {
    for (const abort of this.aborts.values()) {
      abort();
    }
    this.aborts.clear();
  }

  size(): number {
    return this.aborts.size;
  }
}
