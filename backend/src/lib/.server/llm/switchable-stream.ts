import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('SwitchableStream');

export class SwitchableStream extends TransformStream<Uint8Array, Uint8Array> {
  private writer: WritableStreamDefaultWriter<Uint8Array>;
  private _isClosed: boolean = false;

  constructor() {
    super();
    this.writer = this.writable.getWriter();
  }

  async write(data: Uint8Array | string) {
    if (this._isClosed) return;
    const encoded = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    await this.writer.write(encoded);
  }

  async close() {
    if (this._isClosed) return;
    this._isClosed = true;
    try {
      await this.writer.close();
    } catch (err) {
      logger.warn('SwitchableStream close error:', err);
    }
  }

  isClosed() {
    return this._isClosed;
  }
}
