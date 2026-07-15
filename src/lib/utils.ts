import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Deterministic JSON serialization with recursively sorted object keys.
 *
 * PostgreSQL `jsonb` does not preserve object key order, so content read back
 * from the database has different key ordering than the JSON produced locally
 * by the editor. A plain JSON.stringify comparison would therefore always
 * differ even for identical content. Sorting keys makes the comparison stable.
 */
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeysDeep(value))
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep)
  }
  if (value !== null && typeof value === "object") {
    const source = value as Record<string, unknown>
    return Object.keys(source)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortKeysDeep(source[key])
        return acc
      }, {})
  }
  return value
}
