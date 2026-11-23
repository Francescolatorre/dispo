/**
 * Thin adapter over the WebMCP imperative API (W3C WebML CG draft, Nov 2026).
 *
 * - Entry point: `document.modelContext` (current spec); `navigator.modelContext` is the
 *   deprecated pre-May-2026 location that Chrome still ships during the origin trial.
 * - `registerTool(tool, { signal })` — there is no `unregisterTool`; aborting the signal unregisters.
 * - `execute` receives the arguments as an object and may return any JSON-serializable value.
 *
 * No polyfill: without a native implementation every function here is a no-op (see docs/webmcp.md).
 */

/** Minimal JSON Schema subset we use for tool input schemas. */
export interface JsonSchema {
  type?: 'object' | 'string' | 'number' | 'integer' | 'boolean' | 'array';
  description?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean;
  items?: JsonSchema;
  enum?: ReadonlyArray<string | number>;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  multipleOf?: number;
  minLength?: number;
  default?: unknown;
}

export interface ToolAnnotations {
  /** The tool only reads state. */
  readOnlyHint?: boolean;
  /** The tool has consequences the user should confirm (agents may still ignore hints). */
  consequentialHint?: boolean;
  /** The output contains user-generated text that must not be treated as instructions. */
  untrustedContentHint?: boolean;
}

export interface ToolExecuteOptions {
  signal?: AbortSignal;
}

/** JSON-serializable result returned to the agent. */
export type ToolResult = Record<string, unknown>;

export interface ModelContextTool {
  name: string;
  title?: string;
  description: string;
  inputSchema: JsonSchema;
  annotations?: ToolAnnotations;
  execute(input: Record<string, unknown>, options?: ToolExecuteOptions): Promise<ToolResult>;
}

export interface RegisterToolOptions {
  signal?: AbortSignal;
}

/** The part of the `ModelContext` interface this app relies on. */
export interface ModelContextLike {
  registerTool(tool: ModelContextTool, options?: RegisterToolOptions): Promise<void> | void;
}

interface WithModelContext {
  modelContext?: ModelContextLike;
}

function isModelContext(value: unknown): value is ModelContextLike {
  return !!value && typeof (value as ModelContextLike).registerTool === 'function';
}

/** `document.modelContext ?? navigator.modelContext`, or `undefined` if WebMCP is unavailable. */
export function getModelContext(): ModelContextLike | undefined {
  const fromDocument = typeof document !== 'undefined' ? (document as unknown as WithModelContext).modelContext : undefined;
  if (isModelContext(fromDocument)) return fromDocument;
  const fromNavigator = typeof navigator !== 'undefined' ? (navigator as unknown as WithModelContext).modelContext : undefined;
  if (isModelContext(fromNavigator)) return fromNavigator;
  return undefined;
}

export interface RegistrationResult {
  /** Names of the tools the browser accepted. */
  registered: string[];
  /** Tools the browser rejected (e.g. duplicate name, invalid schema). */
  failed: Array<{ name: string; error: string }>;
}

/**
 * Registers all `tools` until `signal` aborts. Resolves with what was accepted; never throws.
 * Without a model context it resolves with nothing registered.
 */
export async function registerTools(
  tools: readonly ModelContextTool[],
  signal: AbortSignal,
  modelContext: ModelContextLike | undefined = getModelContext(),
): Promise<RegistrationResult> {
  const result: RegistrationResult = { registered: [], failed: [] };
  if (!modelContext || signal.aborted) return result;
  await Promise.all(
    tools.map(async (tool) => {
      try {
        await modelContext.registerTool(tool, { signal });
        result.registered.push(tool.name);
      } catch (e) {
        result.failed.push({ name: tool.name, error: e instanceof Error ? e.message : String(e) });
      }
    }),
  );
  return result;
}
