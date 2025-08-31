const history: string[] = [];

export function addHistory(entry: string) {
  history.push(entry);
}

export function getHistory(): string[] {
  return history;
}
