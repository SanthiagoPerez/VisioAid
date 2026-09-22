import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@visioaid/reading-history/v1';
const MAX_ENTRIES = 10;

export type ReadingHistoryEntry = {
  id: string;
  text: string;
  createdAt: string;
};

export async function getReadingHistory(): Promise<ReadingHistoryEntry[]> {
  const storedHistory = await AsyncStorage.getItem(STORAGE_KEY);
  if (!storedHistory) return [];

  try {
    const parsedHistory: unknown = JSON.parse(storedHistory);
    if (!Array.isArray(parsedHistory)) return [];

    return parsedHistory.filter(
      (entry): entry is ReadingHistoryEntry =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof entry.id === 'string' &&
        typeof entry.text === 'string' &&
        typeof entry.createdAt === 'string',
    );
  } catch {
    return [];
  }
}

export async function saveReading(text: string): Promise<ReadingHistoryEntry[]> {
  const entry: ReadingHistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    createdAt: new Date().toISOString(),
  };
  const existingHistory = await getReadingHistory();
  const history = [entry, ...existingHistory.filter((item) => item.text !== text)].slice(
    0,
    MAX_ENTRIES,
  );

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return history;
}
