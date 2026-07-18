import { execSync } from 'node:child_process'

// Returns the ISO date (YYYY-MM-DD) of the last git commit that touched `file`,
// used to drive honest `dateModified` schema values that auto-update on edit.
// Mirrors the sitemap `lastmod` strategy in astro.config.mjs. Runs at build time
// (blog pages are prerendered). Falls back to `fallback` when git history is
// unavailable (e.g. shallow CI clone) instead of inventing a date.
export function gitDateISO(file: string, fallback: string): string {
  try {
    const out = execSync(`git log -1 --format=%cI -- "${file}"`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    return out ? out.split('T')[0] : fallback
  } catch {
    return fallback
  }
}
