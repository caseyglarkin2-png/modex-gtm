import { mkdir, readFile, writeFile, appendFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export interface CheckpointOptions {
  /** Root directory for all per-account state, e.g. ~/.config/yardflow-audio-pipeline */
  root: string;
  /** Account slug (used to scope state). */
  account: string;
}

/**
 * Per-stage state store. Each stage of the pipeline writes its output to
 * `<root>/runs/<account>/<stage>.json` so the next stage can read it
 * without re-running expensive work (Gemini deep research, NotebookLM
 * podcast generation). Failures resume from checkpoint via --skip-to.
 */
export class Checkpoint {
  private readonly dir: string;
  constructor(opts: CheckpointOptions) {
    this.dir = resolve(opts.root, 'runs', opts.account);
  }

  async write<T>(stage: string, payload: T): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    await writeFile(this.path(stage), JSON.stringify(payload, null, 2), 'utf8');
  }

  async read<T = unknown>(stage: string): Promise<T | null> {
    try {
      const raw = await readFile(this.path(stage), 'utf8');
      return JSON.parse(raw) as T;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw err;
    }
  }

  async appendLog(line: string): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    const ts = new Date().toISOString();
    await appendFile(resolve(this.dir, 'run.log'), `${ts} ${line}\n`, 'utf8');
  }

  async readLog(): Promise<string> {
    try {
      return await readFile(resolve(this.dir, 'run.log'), 'utf8');
    } catch {
      return '';
    }
  }

  private path(stage: string): string {
    return resolve(this.dir, `${stage}.json`);
  }
}
