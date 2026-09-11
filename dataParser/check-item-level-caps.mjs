// Read-only verifier. Pass a directory of saved PoE2DB HTML, or --fetch.
// Never execute page scripts or silently update the checked-in defaults.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const snapshot = JSON.parse(await readFile(new URL(
  '../renderer/src/web/price-check/filters/normal-modifier-levels.json', import.meta.url,
), 'utf8'));
const input = process.argv[2];
assert.ok(input, 'Usage: node dataParser/check-item-level-caps.mjs <HTML-directory|--fetch>');
let tables = 0;
for (const [category, entry] of Object.entries(snapshot.categories)) {
  for (const [page, witness] of Object.entries(entry.tables)) {
    let html;
    if (input === '--fetch') {
      const response = await fetch(snapshot.source + page, { signal: AbortSignal.timeout(30000) });
      assert.ok(response.ok, `${page}: HTTP ${response.status}`);
      html = await response.text();
    } else {
      html = await readFile(path.join(input, `${page}.html`), 'utf8');
    }
    const match = html.match(/new ModsView\((\{[^\r\n]*\})\);/);
    assert.ok(match, `${page}: missing modifier data`);
    const data = JSON.parse(match[1]);
    assert.ok(Array.isArray(data.normal) && data.normal.length, `${page}: empty normal pool`);
    const levels = data.normal.map(mod => Number(mod.Level));
    assert.ok(levels.every(level => Number.isInteger(level) && level >= 1), `${page}: invalid level`);
    assert.equal(Math.max(...levels), entry.level, `${page}: cap changed; review before updating`);
    assert.equal(data.normal.length, witness.modifiers, `${page}: pool changed; review before updating`);
    assert.ok(data.normal.some(mod => mod.Name === witness.limitingModifier && Number(mod.Level) === entry.level), `${page}: missing limiting modifier`);
    tables++;
  }
  console.log(`${category}: ${entry.level} (${Object.keys(entry.tables).length} tables)`);
}
console.log(`PASS: ${tables} normal modifier tables match the ${snapshot.checkedAt} snapshot.`);
