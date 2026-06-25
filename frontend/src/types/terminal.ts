export interface ITerminal {
  readonly cols?: number;
  readonly rows?: number;

  reset: () => void;
  write: (data: string) => void;
  onData: (cb: (data: string) => void) => void;
  onResize?: (cb: (size: { cols: number; rows: number }) => void) => void;
  input: (data: string) => void;
}
