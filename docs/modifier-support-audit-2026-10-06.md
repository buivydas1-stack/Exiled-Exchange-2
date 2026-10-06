# EE2 recent unique modifier support audit — 2026-10-06

The verified English sample set contains **74 uniques, 391 modifier blocks, and 187 additional Grip of Kulemak/Loreweave pool rows**. After this change, every sample clipboard parses without unknown modifiers, and every audited modifier has a corresponding current trade stat ID, including option IDs. This is a scoped recognition audit, not a claim of complete support for every modifier in the game.

## Sources and versions

- Public game patch checked: [0.5.5e](https://www.pathofexile.com/forum/view-thread/4009785), separately from EE2 version **0.16.3** and the internal game-data tree version.
- Recent additions and changes: official [0.5.0 patch notes](https://www.pathofexile.com/forum/view-thread/3932540), [0.5.2 notes](https://www.pathofexile.com/forum/view-thread/3960375/filter-account-type/staff), [0.5.3 notes](https://www.pathofexile.com/forum/view-thread/3968601/filter-account-type/staff), and [0.5.5 notes](https://www.pathofexile.com/forum/view-thread/4000864). The 0.5.3 Grip of Kulemak additions are covered by the additional pool review.
- Current filter and item names: GGG's [trade stat catalogue](https://www.pathofexile.com/api/trade2/data/stats) and [trade item catalogue](https://www.pathofexile.com/api/trade2/data/items), fetched on the audit date.
- Exact public sample text and pool rows: the item pages linked in the catalogue below. These are database samples, not live item drops. Recognition checks reconstruct English clipboard text with modifier headers and without continuation-line indentation.
- The private modifier lookup supplied the initial recent-unique list. Its pinned RePoE tree version **4.5.5.2** is an internal source identifier, not public patch 0.5.5e. That snapshot was not refreshed by this task.

## Gaps found and fixed

| Item or pattern | Existing failure | Result |
| --- | --- | --- |
| Redemption | The bundled two-line matcher expected a space after its line break; the supplied game text has none. The grenade-use roll was also marked higher-is-better. | Both lines are recognized as one modifier; fewer required grenade uses are treated as better. Uses current ID explicit.stat_4128965096. |
| Multiline descriptions | Copied text and stored descriptions could disagree on indentation or CRLF line endings. | Index generation, bundled lookup, and downloaded trade lookup use the same normalization. All bundled multiline matchers were checked in nine supported languages. |
| Gravebind and Loreweave rarity modifier | The generic first-line rarity matcher won before the full two-line modifier was checked. | Longest valid multiline matches are preferred. The combined trade IDs explicit.stat_1602191394 and explicit.stat_2261942307 are retained. Unrelated modifiers and unknown text stay separate. |
| Spell projectile chains, including the right-ring-slot variant | Copied positive values lost their plus sign during number substitution, while the stored matcher retained it. | Positive numeric placeholders are normalized consistently. IDs explicit.stat_1517628125 and explicit.stat_1555918911 are recognized. |
| Facebreaker | The public sample/trade wording includes a plus sign before the fixed armour-per-Strength value; the existing game-description matcher omitted it. | Added the verified English trade matcher, preserving the original wording. ID explicit.stat_1291132817 is retained. The generator also retains this alias. |
| Eshtera's Path, Safrin's Resolve, Zaida's Longevity, Reverie | Five English unique records had no name or reference name after the public item renames. | Added the current verified names, bases, and icons, including Reverie's Runemastered base. The generator now preserves trade names when its Words table lacks the new name. Existing translations are retained. |

## Supported set and remaining uncertainty

All 74 reviewed samples and all 187 pool rows now pass recognition and trade-ID checks. Mageblood's Legacy options were checked with their option suffixes. Pool rows include database-listed alternatives and may include legacy entries; parser support does not establish current obtainability or roll probability. One hidden Blackflame implementation line was excluded from clipboard text while its visible modifier was still tested.

Farrow's Gift and Gatecrasher appear in the official additions, but neither supplied a complete usable public sample for this audit, and neither was in the current trade item catalogue. Farrow's Gift returned no usable item page; Gatecrasher's page supplied no sample item JSON. Their current obtainable forms and complete copied modifiers remain **unverified**. No guessed item records or trade IDs were added.

| Reviewed unique | Sampled modifier blocks | After change |
| --- | ---: | --- |
| [Ab Aeterno](https://poe2db.tw/us/Ab_Aeterno) | 5 | Recognized; trade IDs present |
| [Apep's Supremacy](https://poe2db.tw/us/Apep's_Supremacy) | 5 | Recognized; trade IDs present |
| [Atziri's Acuity](https://poe2db.tw/us/Atziri's_Acuity) | 5 | Recognized; trade IDs present |
| [Berek's Grip](https://poe2db.tw/us/Berek's_Grip) | 5 | Recognized; trade IDs present |
| [Berek's Pass](https://poe2db.tw/us/Berek's_Pass) | 5 | Recognized; trade IDs present |
| [Berek's Respite](https://poe2db.tw/us/Berek's_Respite) | 5 | Recognized; trade IDs present |
| [Blackflame](https://poe2db.tw/us/Blackflame) | 7 | Recognized; trade IDs present |
| [Blistering Bond](https://poe2db.tw/us/Blistering_Bond) | 7 | Recognized; trade IDs present |
| [Brutus' Lead Sprinkler](https://poe2db.tw/us/Brutus'_Lead_Sprinkler) | 5 | Recognized; trade IDs present |
| [Carnage Heart](https://poe2db.tw/us/Carnage_Heart) | 6 | Recognized; trade IDs present |
| [Cat O' Nine Tails](https://poe2db.tw/us/Cat_O'_Nine_Tails) | 7 | Recognized; trade IDs present |
| [Chober Chaber](https://poe2db.tw/us/Chober_Chaber) | 6 | Recognized; trade IDs present |
| [Death's Harp](https://poe2db.tw/us/Death's_Harp) | 5 | Recognized; trade IDs present |
| [Decree of Acuity](https://poe2db.tw/us/Decree_of_Acuity) | 5 | Recognized; trade IDs present |
| [Decree of Flight](https://poe2db.tw/us/Decree_of_Flight) | 6 | Recognized; trade IDs present |
| [Decree of Loyalty](https://poe2db.tw/us/Decree_of_Loyalty) | 6 | Recognized; trade IDs present |
| [Duality](https://poe2db.tw/us/Duality) | 6 | Recognized; trade IDs present |
| [Eyes of the Runefather](https://poe2db.tw/us/Eyes_of_the_Runefather) | 5 | Recognized; trade IDs present |
| [Elevore](https://poe2db.tw/us/Elevore) | 4 | Recognized; trade IDs present |
| [Eshtera's Path](https://poe2db.tw/us/Eshtera's_Path) | 4 | Recognized; trade IDs present |
| [Eventide Petals](https://poe2db.tw/us/Eventide_Petals) | 5 | Recognized; trade IDs present |
| [Facebreaker](https://poe2db.tw/us/Facebreaker) | 6 | Recognized; trade IDs present |
| [Forgotten Warden](https://poe2db.tw/us/Forgotten_Warden) | 5 | Recognized; trade IDs present |
| [Geofri's Sanctuary](https://poe2db.tw/us/Geofri's_Sanctuary) | 7 | Recognized; trade IDs present |
| [Glowswarm](https://poe2db.tw/us/Glowswarm) | 5 | Recognized; trade IDs present |
| [Gravebind](https://poe2db.tw/us/Gravebind) | 6 | Recognized; trade IDs present |
| [Grip of Kulemak](https://poe2db.tw/us/Grip_of_Kulemak) | 8 | Recognized; trade IDs present |
| [Hyrri's Ire](https://poe2db.tw/us/Hyrri's_Ire) | 6 | Recognized; trade IDs present |
| [Horror's Flight](https://poe2db.tw/us/Horror's_Flight) | 5 | Recognized; trade IDs present |
| [Immaculate Adherence](https://poe2db.tw/us/Immaculate_Adherence) | 7 | Recognized; trade IDs present |
| [Ironbound](https://poe2db.tw/us/Ironbound) | 7 | Recognized; trade IDs present |
| [Keeper of the Arc](https://poe2db.tw/us/Keeper_of_the_Arc) | 4 | Recognized; trade IDs present |
| [Levinstone](https://poe2db.tw/us/Levinstone) | 5 | Recognized; trade IDs present |
| [Liminal Coil](https://poe2db.tw/us/Liminal_Coil) | 6 | Recognized; trade IDs present |
| [Loreweave](https://poe2db.tw/us/Loreweave) | 10 | Recognized; trade IDs present |
| [Mageblood](https://poe2db.tw/us/Mageblood) | 7 | Recognized; trade IDs present |
| [Mastered Domain](https://poe2db.tw/us/Mastered_Domain) | 2 | Recognized; trade IDs present |
| [Megalomaniac](https://poe2db.tw/us/Megalomaniac) | 0 | Recognized; trade IDs present |
| [Nightfall](https://poe2db.tw/us/Nightfall) | 6 | Recognized; trade IDs present |
| [Opportunity](https://poe2db.tw/us/Opportunity) | 7 | Recognized; trade IDs present |
| [Periphery](https://poe2db.tw/us/Periphery) | 5 | Recognized; trade IDs present |
| [Plaguefinger](https://poe2db.tw/us/Plaguefinger) | 5 | Recognized; trade IDs present |
| [Prized Pain](https://poe2db.tw/us/Prized_Pain) | 5 | Recognized; trade IDs present |
| [Radiant Grief](https://poe2db.tw/us/Radiant_Grief) | 4 | Recognized; trade IDs present |
| [Redemption](https://poe2db.tw/us/Redemption) | 5 | Recognized; trade IDs present |
| [Reverie](https://poe2db.tw/us/Reverie) | 5 | Recognized; trade IDs present |
| [Runeseeker's Call](https://poe2db.tw/us/Runeseeker's_Call) | 3 | Recognized; trade IDs present |
| [Sadist's Mercy](https://poe2db.tw/us/Sadist's_Mercy) | 5 | Recognized; trade IDs present |
| [Safrin's Resolve](https://poe2db.tw/us/Safrin's_Resolve) | 4 | Recognized; trade IDs present |
| [Seed of Cataclysm](https://poe2db.tw/us/Seed_of_Cataclysm) | 6 | Recognized; trade IDs present |
| [Serle's Grit](https://poe2db.tw/us/Serle's_Grit) | 6 | Recognized; trade IDs present |
| [Sierran Inheritance](https://poe2db.tw/us/Sierran_Inheritance) | 6 | Recognized; trade IDs present |
| [Sylvan's Effigy](https://poe2db.tw/us/Sylvan's_Effigy) | 5 | Recognized; trade IDs present |
| [Sine Aequo](https://poe2db.tw/us/Sine_Aequo) | 4 | Recognized; trade IDs present |
| [Soul Mantle](https://poe2db.tw/us/Soul_Mantle) | 6 | Recognized; trade IDs present |
| [Spiteful Floret](https://poe2db.tw/us/Spiteful_Floret) | 5 | Recognized; trade IDs present |
| [Split Personality](https://poe2db.tw/us/Split_Personality) | 1 | Recognized; trade IDs present |
| [Surge of the Tide](https://poe2db.tw/us/Surge_of_the_Tide) | 5 | Recognized; trade IDs present |
| [Svalinn](https://poe2db.tw/us/Svalinn) | 4 | Recognized; trade IDs present |
| [The Auspex](https://poe2db.tw/us/The_Auspex) | 5 | Recognized; trade IDs present |
| [The Brass Dome](https://poe2db.tw/us/The_Brass_Dome) | 4 | Recognized; trade IDs present |
| [The Hollow Mask](https://poe2db.tw/us/The_Hollow_Mask) | 6 | Recognized; trade IDs present |
| [The Ordained](https://poe2db.tw/us/The_Ordained) | 6 | Recognized; trade IDs present |
| [The Raven's Flock](https://poe2db.tw/us/The_Raven's_Flock) | 5 | Recognized; trade IDs present |
| [The Sunken Vessel](https://poe2db.tw/us/The_Sunken_Vessel) | 6 | Recognized; trade IDs present |
| [The Taming](https://poe2db.tw/us/The_Taming) | 5 | Recognized; trade IDs present |
| [The Unleashed](https://poe2db.tw/us/The_Unleashed) | 5 | Recognized; trade IDs present |
| [Twisted Empyrean](https://poe2db.tw/us/Twisted_Empyrean) | 7 | Recognized; trade IDs present |
| [Uhtred's Chalice](https://poe2db.tw/us/Uhtred's_Chalice) | 5 | Recognized; trade IDs present |
| [Veilpiercer](https://poe2db.tw/us/Veilpiercer) | 7 | Recognized; trade IDs present |
| [Vestige of Darkness](https://poe2db.tw/us/Vestige_of_Darkness) | 5 | Recognized; trade IDs present |
| [Voices](https://poe2db.tw/us/Voices) | 1 | Recognized; trade IDs present |
| [Zaida's Longevity](https://poe2db.tw/us/Zaida's_Longevity) | 4 | Recognized; trade IDs present |
| [Zerphi's Genesis](https://poe2db.tw/us/Zerphi's_Genesis) | 8 | Recognized; trade IDs present |

## Chaos equivalents

Every existing parenthesized currency-equivalent display now uses Chaos, including ordinary listings priced in Vaal or other currencies, Divine/Exalted listings, and owned/full-stack estimates. The actual listing currency remains visible. Conversion uses the unrounded quote before automatic currency selection. Every equivalent displays exactly two decimal places; amounts below 0.01 Chaos display 0.00c. Missing or invalid exchange rates omit the equivalent.

## Validation

- 470 renderer/parser/pricing regression tests passed; renderer and main-process TypeScript checks and production builds passed.
- Two focused data-generator checks passed: missing-word unique names remain usable, and the Facebreaker alias preserves existing matchers without duplicates. The full data-generation pipeline was not rerun.
- The Windows portable package passed startup and data-index checks. Its rendered UI recognized Redemption, generated an enabled grenade-use filter with maximum 2, and displayed Chaos equivalents for Vaal, Divine, and Exalted test listings, including values below 0.01. Market responses were mocked; no live trade search was made by this UI check.
- The permanent installed executable was backed up, replaced, and restarted. Its executable hash matched the built portable package, its running application payload matched the built payload, and the settings file remained unchanged. Local verification receipts are under main/dist/modifier-audit-20261006.
