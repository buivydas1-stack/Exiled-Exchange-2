import type { FilterPreset } from "./interfaces";

// Same syntax as the PoE1 customization: one case-insensitive regex per line.
export function compileModifierExclusions(input = "") {
  const patterns: RegExp[] = [];
  const invalidLines: number[] = [];
  input.split(/\r?\n/).forEach((line, index) => {
    const pattern = line.trim();
    if (!pattern) return;
    try {
      patterns.push(new RegExp(pattern, "i"));
    } catch {
      invalidLines.push(index + 1);
    }
  });
  return { patterns, invalidLines };
}

export function applyModifierExclusions(
  presets: Pick<FilterPreset, "stats">[],
  input = "",
): void {
  const { patterns } = compileModifierExclusions(input);
  if (!patterns.length) return;
  for (const preset of presets) {
    for (const filter of preset.stats) {
      if (
        !filter.hidden &&
        patterns.some((pattern) => pattern.test(filter.text))
      ) {
        filter.disabled = true;
      }
    }
  }
}
