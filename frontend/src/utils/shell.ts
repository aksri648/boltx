import type { ITerminal } from '~/types/terminal';
import { withResolvers } from './promises';
import { atom } from 'nanostores';
import { expoUrlAtom } from '~/lib/stores/qrCodeStore';
import { sandboxApi } from '~/lib/api/sandbox';

export async function newShellProcess(terminal: ITerminal) {
  const ws = sandboxApi.connectPty((data) => {
    terminal.write(data);
  });

  if (ws) {
    terminal.write('\r\n');

    await new Promise<void>((resolve) => {
      ws.onopen = () => {
        terminal.write('\r\n');
        resolve();
      };
      ws.onerror = () => resolve();
    });

    terminal.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    terminal.onResize?.((size: { cols: number; rows: number }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols: size.cols, rows: size.rows }));
      }
    });

    return {
      resize: (cols: number, rows: number) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'resize', cols, rows }));
        }
      },
      kill: () => ws.close(),
      input: new WritableStream({
        write: (chunk: string) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(chunk);
          }
        },
      }),
      output: new ReadableStream({
        start(controller) {
          ws.onmessage = (event) => {
            if (typeof event.data === 'string') {
              try {
                JSON.parse(event.data);
                return;
              } catch { }
              controller.enqueue(event.data);
            }
          };
          ws.onclose = () => controller.close();
        },
      }),
    };
  }

  terminal.write('Shell ready (Daytona sandbox, REST mode)\r\n');
  return { resize: () => {}, kill: () => {}, input: { getWriter: () => ({ write: () => {} }) }, output: new ReadableStream() };
}

export type ExecutionResult = { output: string; exitCode: number } | undefined;

export class BoltShell {
  #initialized: (() => void) | undefined;
  #readyPromise: Promise<void>;
  #terminal: ITerminal | undefined;
  #ws: WebSocket | null = null;
  executionState = atom<
    { sessionId: string; active: boolean; executionPrms?: Promise<any>; abort?: () => void } | undefined
  >();
  #outputStream: ReadableStreamDefaultReader<string> | undefined;
  #shellInputStream: WritableStreamDefaultWriter<string> | undefined;

  constructor() {
    this.#readyPromise = new Promise((resolve) => {
      this.#initialized = resolve;
    });
  }

  ready() {
    return this.#readyPromise;
  }

  async init(terminal: ITerminal) {
    this.#terminal = terminal;
    terminal.write('Bolt shell initializing (WebSocket PTY)...\r\n');

    const ws = sandboxApi.connectPty((data) => {
      terminal.write(data);
    });

    if (ws) {
      this.#ws = ws;

      ws.onopen = () => {
        terminal.write('\r\n');
        terminal.write('Bolt shell initialized via WebSocket PTY\r\n');
        this.#initialized?.();
      };

      ws.onmessage = (event) => {
        if (typeof event.data === 'string') {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'connected') return;
          } catch {
            terminal.write(event.data);
          }
        } else if (event.data instanceof Blob) {
          event.data.arrayBuffer().then((buf) => {
            const str = new Uint8Array(buf).reduce((s, b) => s + String.fromCharCode(b), '');
            terminal.write(str);
          });
        }
      };

      ws.onclose = () => {
        terminal.write('\r\n[PTY session ended]\r\n');
      };

      ws.onerror = (err) => {
        terminal.write('\r\n[PTY WebSocket error]\r\n');
      };

      terminal.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });

      terminal.onResize?.((size: { cols: number; rows: number }) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'resize', cols: size.cols, rows: size.rows }));
        }
      });
    } else {
      terminal.write('Bolt shell initialized (REST mode)\r\n');
      this.#initialized?.();
    }
  }

  get terminal() {
    return this.#terminal;
  }

  get process() {
    return undefined;
  }

  async executeCommand(sessionId: string, command: string, abort?: () => void): Promise<ExecutionResult> {
    try {
      const resp = await sandboxApi.exec(command);
      return { output: resp.result, exitCode: resp.exitCode };
    } catch (error: any) {
      return { output: error.message, exitCode: 1 };
    }
  }
}

export function newBoltShellProcess() {
  return new BoltShell();
}

export function cleanTerminalOutput(input: string): string {
  const removeOsc = input
    .replace(/\x1b\](\d+;[^\x07\x1b]*|\d+[^\x07\x1b]*)\x07/g, '')
    .replace(/\](\d+;[^\n]*|\d+[^\n]*)/g, '');

  const removeAnsi = removeOsc
    .replace(/\u001b\[[\?]?[0-9;]*[a-zA-Z]/g, '')
    .replace(/\x1b\[[\?]?[0-9;]*[a-zA-Z]/g, '')
    .replace(/\u001b\[[0-9;]*m/g, '')
    .replace(/\x1b\[[0-9;]*m/g, '')
    .replace(/\u001b/g, '')
    .replace(/\x1b/g, '');

  const cleanNewlines = removeAnsi
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n');

  const formatOutput = cleanNewlines
    .replace(/^([~\/][^\n❯]+)❯/m, '$1\n❯')
    .replace(/(?<!^|\n)>/g, '\n>')
    .replace(/(?<!^|\n|\w)(error|failed|warning|Error|Failed|Warning):/g, '\n$1:')
    .replace(/(?<!^|\n|\/)(at\s+(?!async|sync))/g, '\nat ')
    .replace(/\bat\s+async/g, 'at async')
    .replace(/(?<!^|\n)(npm ERR!)/g, '\n$1');

  const cleanSpaces = formatOutput
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');

  return cleanSpaces
    .replace(/\n{3,}/g, '\n\n')
    .replace(/:\s+/g, ': ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^\s+|\s+$/g, '')
    .replace(/\u0000/g, '');
}
