import { atom, type WritableAtom } from 'nanostores';
import type { ITerminal } from '~/types/terminal';
import { coloredText } from '~/utils/terminal';
import { sandboxApi } from '~/lib/api/sandbox';

interface TerminalSession {
  terminal: ITerminal;
  ws: WebSocket | null;
}

export class TerminalStore {
  #terminals: TerminalSession[] = [];

  showTerminal: WritableAtom<boolean> = import.meta.hot?.data.showTerminal ?? atom(true);

  constructor() {
    if (import.meta.hot) {
      import.meta.hot.data.showTerminal = this.showTerminal;
    }
  }

  toggleTerminal(value?: boolean) {
    this.showTerminal.set(value !== undefined ? value : !this.showTerminal.get());
  }

  async attachBoltTerminal(terminal: ITerminal) {
    const ws = sandboxApi.connectPty((data) => {
      terminal.write(data);
    });

    if (ws) {
      terminal.write(coloredText.green('Bolt shell initializing via WebSocket PTY...\n'));

      ws.onopen = () => {
        terminal.write(coloredText.green('\r\nBolt shell initialized\n'));
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

      this.#terminals.push({ terminal, ws });

      terminal.write(coloredText.green('\r\nUse Ctrl+C to stop processes, Ctrl+D to exit shell\n'));
    } else {
      terminal.write(coloredText.red('Failed to connect PTY terminal. Using REST fallback.\n'));
      try {
        await sandboxApi.exec('echo "bolt shell ready"');
        terminal.write(coloredText.green('Bolt shell initialized (REST mode)\n'));
      } catch (error: any) {
        terminal.write(coloredText.red('Failed to initialize shell\n\n') + error.message);
      }
    }
  }

  async attachTerminal(terminal: ITerminal) {
    try {
      const ws = sandboxApi.connectPty((data) => {
        terminal.write(data);
      });

      if (ws) {
        terminal.write(coloredText.green('Shell initializing...\n'));

        ws.onopen = () => {
          terminal.write(coloredText.green('Shell ready\n'));
        };

        terminal.onData((data) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(data);
          }
        });

        this.#terminals.push({ terminal, ws });
      } else {
        const result = await sandboxApi.exec('echo "shell ready"');
        this.#terminals.push({ terminal, ws: null });
        terminal.write(coloredText.green('Shell ready\n'));
      }
    } catch (error: any) {
      terminal.write(coloredText.red('Failed to spawn shell\n\n') + error.message);
    }
  }

  onTerminalResize(cols: number, rows: number) {
    for (const session of this.#terminals) {
      if (session.ws && session.ws.readyState === WebSocket.OPEN) {
        session.ws.send(JSON.stringify({ type: 'resize', cols, rows }));
      }
    }
  }

  async detachTerminal(terminal: ITerminal) {
    const terminalIndex = this.#terminals.findIndex((t) => t.terminal === terminal);

    if (terminalIndex !== -1) {
      const session = this.#terminals[terminalIndex];
      if (session.ws) {
        session.ws.close();
      }
      this.#terminals.splice(terminalIndex, 1);
    }
  }
}
