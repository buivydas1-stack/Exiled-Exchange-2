# Modifier auto-selection exclusions

Settings → Price check → **Exclude modifiers from automatic selection (regex)**.
Enter one case-insensitive JavaScript regex per line, without `/` delimiters.
For example, `stun|light radius` excludes displayed modifiers containing either
phrase. Regexes match displayed text (including pseudo stats), so use the language
and wording shown by EE2. Invalid lines are reported and ignored individually.

Save settings, then price-check the item again. Exclusions run once when presets
are created, after EE2's normal automatic selection and before initial search.
They apply to every preset in both quick and locked modes. They only uncheck
matching visible stat filters; they do not hide them, enable unrelated filters,
or prevent manual selection. Item-level, unidentified/tier, gem-level/socket and
other non-stat filters are untouched. Existing settings migrate to an empty list.

Adapted from the user's [PoE1 select-visible-stats customization](https://github.com/buivydas1-stack/awakened-poe-trade/blob/d33209cb3fb6a071d4abd2dbfbb787d546263f16/renderer/src/web/price-check/filters/select-visible-stats.ts).
That implementation also resets overall stat selection and handles PoE1-only
mercenary groups/base percentiles. Those parts were deliberately not ported.
EE2 keeps its own defaults and adds invalid-regex feedback. PoE1 patterns are not
copied automatically because the two games have different modifier wording.
