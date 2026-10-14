declare module "potrace" {
  export function trace(
    file: Buffer | string,
    options: Record<string, unknown>,
    cb: (err: Error | null, svg: string) => void,
  ): void;
}
