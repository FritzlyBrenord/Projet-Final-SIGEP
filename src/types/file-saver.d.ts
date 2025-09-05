declare module 'file-saver' {
  export function saveAs(data: Blob, filename?: string, disableAutoBOM?: boolean): void;
  export function saveAs(data: File, filename?: string, disableAutoBOM?: boolean): void;
}