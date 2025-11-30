import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class FileStorageService {
  private dataDir: string;

  constructor() {
    this.dataDir = path.resolve(process.cwd(), 'server', 'data');
  }

  private async ensureDir() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (err) {
      // ignore
    }
  }

  async read(key: string): Promise<any> {
    await this.ensureDir();
    const file = path.join(this.dataDir, `${key}.json`);
    try {
      const raw = await fs.readFile(file, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  }

  async write(key: string, value: any): Promise<void> {
    await this.ensureDir();
    const file = path.join(this.dataDir, `${key}.json`);
    await fs.writeFile(file, JSON.stringify(value, null, 2), 'utf-8');
  }
}
