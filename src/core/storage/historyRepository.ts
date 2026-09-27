import * as SQLite from 'expo-sqlite';
import { QrResultType } from '../scan/resultParser';

export interface HistoryItem {
  id?: number;
  type: QrResultType;
  rawContent: string;
  isScanOrGenerate: 'scan' | 'generate';
  timestamp: number;
}

export class HistoryRepository {
  private static instance: HistoryRepository;
  private db: SQLite.SQLiteDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): HistoryRepository {
    if (!HistoryRepository.instance) {
      HistoryRepository.instance = new HistoryRepository();
    }
    return HistoryRepository.instance;
  }

  public async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      this.db = await SQLite.openDatabaseAsync('qr_scanner.db');
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,
          rawContent TEXT NOT NULL,
          isScanOrGenerate TEXT NOT NULL,
          timestamp INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_history_timestamp ON history (timestamp DESC);
      `);
    })();

    await this.initPromise;
  }

  public async insert(item: Omit<HistoryItem, 'id'>): Promise<number> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.runAsync(
      `INSERT INTO history (type, rawContent, isScanOrGenerate, timestamp) VALUES (?, ?, ?, ?)`,
      [item.type, item.rawContent, item.isScanOrGenerate, item.timestamp]
    );
    return result.lastInsertRowId;
  }

  public async getAll(): Promise<HistoryItem[]> {
    await this.init();
    if (!this.db) return [];

    return await this.db.getAllAsync<HistoryItem>(
      `SELECT * FROM history ORDER BY timestamp DESC`
    );
  }

  public async getRecent(limit: number = 5): Promise<HistoryItem[]> {
    await this.init();
    if (!this.db) return [];

    return await this.db.getAllAsync<HistoryItem>(
      `SELECT * FROM history ORDER BY timestamp DESC LIMIT ?`,
      [limit]
    );
  }

  public async delete(id: number): Promise<void> {
    await this.init();
    if (!this.db) return;

    await this.db.runAsync(`DELETE FROM history WHERE id = ?`, [id]);
  }

  public async clear(): Promise<void> {
    await this.init();
    if (!this.db) return;

    await this.db.runAsync(`DELETE FROM history`);
  }

  public async search(
    query: string,
    filterMode?: 'all' | 'scan' | 'generate'
  ): Promise<HistoryItem[]> {
    await this.init();
    if (!this.db) return [];

    const trimmed = `%${query.trim()}%`;
    if (filterMode && filterMode !== 'all') {
      return await this.db.getAllAsync<HistoryItem>(
        `SELECT * FROM history WHERE isScanOrGenerate = ? AND rawContent LIKE ? ORDER BY timestamp DESC`,
        [filterMode, trimmed]
      );
    }

    return await this.db.getAllAsync<HistoryItem>(
      `SELECT * FROM history WHERE rawContent LIKE ? ORDER BY timestamp DESC`,
      [trimmed]
    );
  }
}
