/**
 * Pollinations.ai prompt-injection middleware.
 *
 * Free, key-less image generation. Every request is automatically reinforced
 * with positive quality cues and protected by a negative-prompt blocklist so
 * end-users never see deformed anatomy / extra limbs.
 *
 * Usage:
 *   import { pollinationsImage } from '@/lib/pollinations';
 *   const url = pollinationsImage('a girl holding flowers in a meadow');
 *   <img src={url} alt="..." />
 */

const POSITIVE_SUFFIX =
  '(masterpiece, perfect human anatomy, realistic hands, detailed faces, high resolution)';

const NEGATIVE_PROMPT =
  '(deformed, extra limbs, mutated, fused bodies, double heads, missing arms, ugly)';

export interface PollinationsOpts {
  width?: number;
  height?: number;
  seed?: number;
  /** 'flux' is default & free; 'turbo' is faster lower-quality. */
  model?: 'flux' | 'turbo';
  /** Hide the small Pollinations logo in the corner. */
  nologo?: boolean;
  /** Skip prompt-enhancement on Pollinations side (we already inject ours). */
  enhance?: boolean;
}

const DEFAULTS: Required<Omit<PollinationsOpts, 'seed'>> = {
  width: 768,
  height: 768,
  model: 'flux',
  nologo: true,
  enhance: false,
};

/**
 * Build a Pollinations URL with the safety/quality middleware applied.
 * Pure function — safe to call during render.
 */
export function pollinationsImage(userPrompt: string, opts: PollinationsOpts = {}): string {
  const o = { ...DEFAULTS, ...opts };
  const safe = (userPrompt || '').trim().slice(0, 700);
  const finalPrompt = `${safe}, ${POSITIVE_SUFFIX}`;
  const params = new URLSearchParams({
    width: String(o.width),
    height: String(o.height),
    model: o.model,
    nologo: o.nologo ? 'true' : 'false',
    enhance: o.enhance ? 'true' : 'false',
    negative_prompt: NEGATIVE_PROMPT,
  });
  if (opts.seed !== undefined) params.set('seed', String(opts.seed));
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?${params.toString()}`;
}

export const POLLINATIONS_NEGATIVE = NEGATIVE_PROMPT;
export const POLLINATIONS_POSITIVE = POSITIVE_SUFFIX;
