/** @param {string} text */
export function normalizeStatText(text) {
  // Game descriptions and copied text can indent continuation lines differently.
  // Copied positive values lose their plus sign when replaced with placeholders.
  // Keep line breaks, words, and other single-line spacing intact.
  return text.replace(/[ \t]*\r?\n[ \t]*/g, "\n").replace(/\+#/g, "#");
}
