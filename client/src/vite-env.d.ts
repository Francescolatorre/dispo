/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** `api` | `local` | `auto` (default): where planning data lives. See src/data/dataSource.ts. */
  readonly VITE_DATA_SOURCE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
