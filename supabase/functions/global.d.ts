declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    toObject(): { [key: string]: string };
  }
  export const env: Env;

  export function readTextFile(path: string | URL): Promise<string>;
  export function writeTextFile(path: string | URL, data: string): Promise<void>;
}
