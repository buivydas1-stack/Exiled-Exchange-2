# Price-check item-level defaults

Verified on 2026-09-11 against PoE2DB's **Base / normal** modifier tables, with
the live game on [0.5.5b](https://www.pathofexile.com/forum/view-thread/4004106).
The dated snapshot is `renderer/src/web/price-check/filters/normal-modifier-levels.json`.
It records each table and a modifier that needs the stated maximum level.

| Item class | Highest normal modifier level |
| --- | ---: |
| Amulets, belts, rings, quivers | 82 |
| Body armour, helmets, gloves, boots, shields, bucklers, foci | 82 |
| Bows, crossbows, maces (both sizes), quarterstaves, spears, talismans, sceptres | 82 |
| Wands, caster staves | 81 |
| Life flasks, mana flasks, charms | 83 |
| Relics (all seven shapes) | 80 |
| Jewels (including time-lost variants), tablets | 1; omit item-level filter |

All 28 armour/shield attribute variants were checked separately. Their maxima
currently agree, so no subtype-specific rule is necessary. Both flask types,
all relic shapes, and the eight jewel/tablet variants were also checked separately.
Sources are linked by their page names under <https://poe2db.tw/us/Modifiers>.

For example, [One Hand Maces](https://poe2db.tw/us/One_Hand_Maces#ModifiersCalc)
need level 82 for Merciless. An ilvl 86 mace therefore searches **82+**, while
an ilvl 78 mace still searches **78+**. No maximum is added to the search.

These are general-purpose normal-modifier thresholds, not a claim about every
special crafting method, sockets, implicit modifiers, or market premium.
Essence, desecration, corruption, socketable, and other special pools are excluded.
PoE2DB warns that modifier weights cannot be obtained from game files; this
snapshot does not use its weights to infer roll probabilities.
Unverified/new classes retain the actual item level, not an invented cap.
Waystones retain the existing tier-based behavior. Non-equipment such as Wombgifts
does not gain automatic item-level selection. Unique items do not gain it either.

Unidentified items select the **Unidentified** filter, including tiered items.
Whenever an unidentified tier is present, its minimum-tier filter is selected too.
Useful item levels are selected for unidentified nonunique items. Identified
flask/charm filters remain optional. Both filters remain editable.

Ctrl+D's locked-mode auto-search now applies to every item when enabled. The
quick/hold-mode heuristic, auto-search opt-out, unique resolver, and manual search
after changing filters are preserved.

To verify the snapshot without modifying it:

```text
node dataParser/check-item-level-caps.mjs main/dist/ilvl-research
node dataParser/check-item-level-caps.mjs --fetch
```

The first command uses saved HTML; the second fetches the same PoE2DB pages.
Any changed cap or pool requires review, not an automatic update at app startup.
