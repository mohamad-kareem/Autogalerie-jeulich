# CarDeluxe comparison: public evidence and next experiments

Research date: 25 September 2026. This supplements the existing real-time research.
This is a research result, not a newly measured performance improvement.

## What CarDeluxe actually documents

The [CarDeluxe website](https://www.cardeluxe.net/) advertises a one-to-two-second
search and marks new and reduced-price vehicles. That wording is not a documented
publication-to-delivery guarantee.

Its [developer-published Google Play description](https://play.google.com/store/apps/details?hl=de&id=com.cardeluxe.autosuchprogramm2)
says it searches mobile.de and AutoScout24 even while the app is not running.
This supports the inference that the mobile product has a server-side search or
notification component. It does not establish the Windows application's full
architecture, its Kleinanzeigen acquisition method, or its commercial contracts.
No public technical description found in this search establishes those details.

We should replicate useful observable behavior: independent sources, immediate
delivery of each discovered listing, stable deduplication, recovery, and distinct
new-listing versus price-change events. Our user's requirement remains to stop
acquisition when the page is inactive; copying offline monitoring is unnecessary.

## Alternatives examined

| Candidate | Evidence | Assessment |
| --- | --- | --- |
| Unofficial Kleinanzeigen mobile client | [Author README](https://github.com/monkrel/kleinanzeigen-api/blob/main/README.md) claims faster discovery using varying search page sizes; also describes sequential-ID discovery at high request volume | Unverified author measurements using a private mobile interface; not evidence of a supported public-web shortcut. No embedded credentials used and no ID sweep run. |
| Generic Kleinanzeigen monitor | [deal-finder](https://github.com/hummat/deal-finder) searches public pages and deduplicates results before notifications | Useful implementation patterns, but no demonstrated earlier discovery than our existing search. |
| AutoScout24 browser scraper | [Market-Scraper](https://github.com/RaresEduard-Tudor/Market-Scraper) uses Playwright and scheduled collection | Inventory extraction, not a documented publication stream. Replacing our parser with this would not establish a latency gain. |
| Kleinanzeigen Agent webhook | [Provider documentation](https://kleinanzeigen-agent.de/dokumentation) describes interval-based live searches, only the first page, up to 100 results, and no guarantee of complete capture | A downstream webhook is not proof of upstream push. Requires same-ad latency and coverage testing before purchase. |
| Native saved searches | [Kleinanzeigen's description](https://themen.kleinanzeigen.de/magazin/ratgeber/schnell-wohnung-finden/) documents push/email notifications | An independent timing reference; no measured vehicle-feed advantage or integration contract established. |
| AutoScout24 official Search API | [Official product page](https://www.autoscout24.de/haendlerportal/schnittstelle-search-api/) advertises GraphQL access and low latency | Supported candidate if access becomes available; low API response latency alone does not establish publication freshness. |

Other competitors' marketing is not implementation evidence. For example,
[Carspider](https://www.carspider.de/autosuchprogramm-funktionen.html) claims early
listing visibility without disclosing the acquisition method on that page.
[AutoBINGOOO's own FAQ](https://www.autobingooo.com/en/support/faqs) acknowledges
result caps and portal publication checks as possible reasons for missing cars.
Neither establishes an available feed that we can connect today.

## Best next public-access experiment

The unresolved question is whether different legitimate public search views
expose the same matching ad at different times. Prior small query-variant checks
did not prove an advantage. Do not label a cache-busting technique as a fix.

1. Compare the exact saved filter with a small number of disjoint, exhaustive
   price partitions whose union is the original filter. Respect inclusive
   boundaries and deduplicate at overlaps. Keep every other filter identical.
2. Keep the total request budget fixed between alternatives, alternate experiment
   order, honor rate limits, and stop on repeated refusals. More traffic would
   confound the comparison and could worsen AutoScout24 pauses.
3. Record ad ID, request start, first parsed availability, response completion,
   server emission and browser render. Track absence in a completed scan
   separately from an unavailable/failed scan.
4. Compare against CarDeluxe's actual first visible appearance, not just a label
   whose timestamp semantics are unknown. Use synchronized clocks.
5. Repeat across multiple active periods with enough matching arrivals to report
   sample counts and latency distributions. Track unique matches, false matches,
   duplicates and refusals as well as speed. No arrivals means inconclusive.

Partitioning may reduce result-window omissions; it might not improve freshness,
and under a fixed budget can increase time between checks of each partition.
Only retain it if the measured tradeoff is favorable.

## Architecture worth building independently of source choice

One acquisition coordinator per source, shared request limits, a durable record
of listing IDs and event times, immediate event delivery, and retryable recovery.
Start it under an active-page lease and stop it when no active page remains.
Classify original publication, first discovery, edits and price drops separately.
Do not delay real arrivals to manufacture a one-by-one visual animation.

These changes address our own reliability and delivery overhead. They do not
create earlier upstream access. No new provider was connected and no subscription
was purchased.

## Bounded public-search experiment actually run

On 25 September 2026, 11:44:07–11:45:58 UTC, the manual script
`scripts/compare-public-feed.mjs` completed 24 successful public HTML requests:
12 exact searches and 12 alternating partition searches, ten seconds per round.
Filters: Germany, private petrol cars, EUR 1500–12000, 10000–100000 km,
registration 2008–2024, damaged vehicles included. Partitions were EUR
1500–6750 and EUR 6750–12000, with ID deduplication at the shared boundary.

- Exact first page: 24 unique organic IDs across the run.
- Partition first pages combined: 49 unique organic IDs, including all exact IDs.
- Mean complete-fetch-and-parse duration: approximately 592 ms across both arms.
- New first-observed IDs after the union baseline: zero.

This demonstrates a larger initial inventory window under the same request
count, not earlier arrival of new advertisements. The 25 extra IDs are not
evidence of missing new uploads; they can be older inventory beyond page one.
No comparison with the application's existing page-two recovery was performed.
There is no meaningful discovery-latency result without new arrivals. The
short test cannot qualify reliability, sustained speed, or CarDeluxe parity.
Partitions remain experimental and have not replaced production acquisition.

Repeat manually with:

```powershell
node --experimental-default-type=module --experimental-vm-modules scripts/compare-public-feed.mjs
```

The script stops after twelve rounds or on the first failed round, writes a
uniquely named JSON report into the OS temporary directory, uses no account
credentials, and installs no background process.
