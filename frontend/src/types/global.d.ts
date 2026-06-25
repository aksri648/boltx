/// <reference types="vite/client" />

declare var process: {
  env: Record<string, string | undefined>;
  versions: Record<string, string>;
  platform: string;
  arch: string;
  nextTick: (callback: () => void) => void;
  hrtime: (time?: [number, number]) => [number, number];
  pid: number;
  ppid: number;
  cwd: () => string;
  exit: (code?: number) => void;
};

interface Buffer extends Uint8Array {
  toString(encoding?: string, start?: number, end?: number): string;
  toJSON(): { type: 'Buffer'; data: number[] };
  equals(otherBuffer: Uint8Array): boolean;
  compare(otherBuffer: Uint8Array, targetStart?: number, targetEnd?: number, sourceStart?: number, sourceEnd?: number): number;
  slice(start?: number, end?: number): Buffer;
  subarray(start?: number, end?: number): Buffer;
  write(string: string, offset?: number, length?: number, encoding?: string): number;
  fill(value: string | Uint8Array | number, offset?: number, end?: number, encoding?: string): Buffer;
}

declare var Buffer: {
  new(): Buffer;
  prototype: Buffer;
  from(data: string | Uint8Array | ArrayBuffer | SharedArrayBuffer, encoding?: string): Buffer;
  from(data: ReadonlyArray<number>): Buffer;
  from(data: ArrayBuffer, byteOffset?: number, byteLength?: number): Buffer;
  alloc(size: number, fill?: string | Uint8Array | number, encoding?: string): Buffer;
  allocUnsafe(size: number): Buffer;
  isBuffer(obj: any): obj is Buffer;
  isEncoding(encoding: string): boolean;
  concat(list: ReadonlyArray<Uint8Array>, totalLength?: number): Buffer;
  byteLength(string: string | Uint8Array | ArrayBuffer | SharedArrayBuffer, encoding?: string): number;
};

declare namespace NodeJS {
  type Timeout = number;
  interface Importer {}
  type TypedArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;
  interface ErrnoException extends Error {
    errno?: number;
    code?: string;
    path?: string;
    syscall?: string;
    stack?: string;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
  item(index: number): SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
  item(index: number): SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface Window {
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
}

declare module '*.scss' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module 'istextorbinary' {
  export function isText(filename: string, buffer?: Buffer): boolean;
  export function isBinary(filename: string, buffer?: Buffer): boolean;
  export function getEncoding(buffer: Buffer, options?: { chunkLength?: number }): string | null;
}

declare module 'path' {
  export function resolve(...pathSegments: string[]): string;
  export function join(...pathSegments: string[]): string;
  export function basename(path: string, ext?: string): string;
  export function dirname(path: string): string;
  export function extname(path: string): string;
  export function relative(from: string, to: string): string;
  export function normalize(path: string): string;
  export const sep: string;
  export const delimiter: string;
  export function isAbsolute(path: string): boolean;
  export function parse(path: string): { root: string; dir: string; base: string; ext: string; name: string };
}

declare module 'node:buffer' {
  export { Buffer };
}

declare module 'jspdf' {
  const jsPDF: any;
  export default jsPDF;
}

declare module '@octokit/rest' {
  const Octokit: any;
  export { Octokit };
}

declare module '@modelcontextprotocol/sdk/client/streamableHttp.js' {
  export class StreamableHTTPClientTransport {
    constructor(url: string | URL, options?: any);
    start(): Promise<void>;
    close(): Promise<void>;
    send(message: any): Promise<void>;
  }
}

interface Window {
  showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
}

declare module 'vitest' {
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void): void;
  export function test(name: string, fn: () => void): void;
  export function expect(value: any): any;
  export function beforeEach(fn: () => void): void;
  export function afterEach(fn: () => void): void;
  export function beforeAll(fn: () => void): void;
  export function afterAll(fn: () => void): void;
  export function vi(): any;
  export type Mock = any;
}
