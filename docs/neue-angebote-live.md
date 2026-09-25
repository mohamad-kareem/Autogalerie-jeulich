# Neue Angebote: active-page delivery

The page searches while the user has started it, the tab remains open and
the browser is online, including when another tab or Windows app is foreground.
Switching tabs no longer cancels requests or stops the live loops. Pause,
navigation away from the page, closing it and disconnecting stop the search.
Returning to a visible tab also checks promptly if its next request is overdue.
Browser tab suspension and computer sleep can still interrupt execution; this
is not a native background service and cannot guarantee delivery while suspended.
There is no installed Windows service, scheduled task or offline collector.
An already-running shared server request may finish its bounded portal fetch;
it never schedules another search on its own.

## Delivery and coverage

- Each portal has its own live loop. Default starts are three seconds apart
  where response time permits. Refusals start with a 30-second cooldown, doubling
  on repeated refusals to five minutes. Longer portal Retry-After values win.
  A successful check after expiry resets the backoff. Detail-page refusals only
  pause detail lookups; detail lookups respect a search pause too.
  After a refusal, successful checks retain a 10-second recovery interval for
  ten minutes. Further refusals raise that interval to 20 then 30 seconds.
  Catch-up scans retain their place and use four times the recovery interval.
  This avoids immediately returning to the request rate that triggered a block.
- Portal HTML is consumed incrementally. Kleinanzeigen publishes each complete
  article; AutoScout24 publishes as soon as its listing JSON is complete. The
  existing NDJSON response forwards these batches without waiting for the footer.
  Once AutoScout24's complete JSON is parsed, the remaining HTTP body is cancelled
  so a slow footer cannot hold the live request lock or delay the next check.
- Partial startup batches remain a quiet baseline until the source completes.
  Later batches are deduplicated by source and ad ID, including out-of-order IDs.
- A separate lower-priority check scans page two about every ten seconds.
  If it sees no previously known organic ad, it continues through further pages.
  Live, manual and catch-up requests share one in-flight slot per portal in
  this page, preventing overlapping requests. Other portals remain independent.
  Bursts cannot reset the catch-up deadline during recovery; repeated successful
  live checks also do not continually postpone that deadline.
  Failures retain the recovery page
  for retry; incomplete scans and the page limit have visible warnings.
- The initial page-two scan records existing stock without displaying it. That
  baseline survives reloads in this search's local storage. It is not a complete
  inventory download. Old stock is not shown in a separate section.
- Detailed ad-page lookups happen on demand. New-arrival bursts no longer
  automatically launch up to ten competing detail requests.

## What this cannot guarantee

Alternative-source trial (not connected to production):
`scripts/compare-feed-sources.mjs` compares the public website with the independent
kleinanzeigen-agent.de API, using the user's own `KLAZ_API_KEY` from `.env.local`.
Run with `node --experimental-vm-modules --env-file=.env.local scripts/compare-feed-sources.mjs`.
It makes at most 12 API searches, ten seconds apart, stops on errors, and writes
`feed-source-comparison.json` to the OS temporary directory. Both searches use
Germany, private cars, EUR 1,500–12,000. This broader discovery comparison does
not validate the final vehicle filters. Original publication dates, complete
coverage, and CarDeluxe-equivalent speed are not established by this trial.
There is no live API result until the user provides trial access; website query
variants tested so far have not demonstrated earlier matching cars.

Client stream completion now releases its polling lock without waiting for the
HTTP connection or cancellation to finish. The request deadline also rejects
independently of whether the transport honors AbortSignal. These bounded wait
fixes do not establish a reduction in the portal's discovery delay.

Live comparison on 24 September 2026, using the signed-in deployed page:

- Germany, private petrol, EUR 1,500–12,000, 10,000–100,000 km, 2008–2024,
  including damaged cars. Healthy portal responses were about 0.3–0.5 seconds
  with a three-second selected polling interval.
- AutoScout24 returned HTTP 429 repeatedly during this observation. The recovery
  pacing above was added afterwards; its production effectiveness is unmeasured.
- CarDeluxe displayed BMW 116 `efaea3d0-c742-410d-aa61-0128024b1398` with time
  22:34:00. The deployed feed's discovery time was 22:34:03: a three-second gap.
- CarDeluxe displayed Opel Vectra `3522339353` with time 22:31:58; the deployed
  feed discovered it at 22:33:38: a 100-second gap. A fetched broad public search
  before that discovery omitted it, while a later focused Opel Vectra search
  included it. These sequential samples do not prove a cache lifetime or that
  keyword searches consistently provide a faster source. The Kleinanzeigen gap
  remains unresolved; no claim of a real-time fix follows from these changes.

Freshness correction (Twingo `3515465635`, detail date 17 September 2026):
unseen does not mean newly uploaded. Each search combination now keeps a fixed
initial Kleinanzeigen ID floor and a session time cutoff (rounded to the minute
because portal timestamps have minute precision). Older IDs are excluded even
if their displayed date is refreshed. Available dates must pass the cutoff;
an empty ID baseline requires a recent date. The floor does not advance during
live checks, allowing newer uploads to be indexed out of order. This is a
conservative heuristic, not proof of original publication: older IDs newly
activated later can be excluded. Existing v1 saved cards are discarded by the
v2 storage key. Dates are displayed with their calendar day and dated arrivals
are ordered by portal time instead of detection time. AutoScout24 search results
have no publication timestamp; their badge says "Neu gefunden", and their
original upload age remains unverified. No extra network requests were added.

Discovery time is not upload time. Ads absent from the portal's returned search
cannot be delivered yet. Search pages can be cached, blocked, reordered or
truncated, and the first baseline intentionally hides existing stock. Overlapping
pagination reduces losses but is not an atomic snapshot of the marketplace.

Listings are deduplicated only by portal and ad ID. The same vehicle advertised
on Kleinanzeigen and AutoScout24 remains two separate arrivals. No cross-portal
vehicle matching delays delivery. Request coordination above is page-local;
multiple tabs and server instances do not share a global request budget.
There is no claim that every matching upload is captured or that latency matches
CarDeluxe until measured side by side with identical active filters.

## Research checked on 24 September 2026

- [CarDeluxe's description](https://www.cardeluxe.net/) advertises automatic
  search and notifications for fresh cars, plus reduced-price markings. The
  installed version 3.2.4.0 exposes a connected results list, sorting and search
  filters. Neither establishes the implementation of its proprietary feed.
- [Kleinanzeigen client author's notes](https://github.com/monkrel/kleinanzeigen-api)
  report cached search responses and describe a private app API. These are
  independent observations, not an official delivery guarantee. That private
  API and its credentials have not been integrated.
- [Kleinanzeigen pagination observations](https://github.com/IIxauII/kleinanzeigen-mcp/blob/main/CONTEXT.md)
  describe duplicates and omissions while result pages move during a sweep.
- [mobile.de Search API](https://services.mobile.de/docs/search-api.html) provides
  authenticated search. This application's mobile.de adapter still requires
  enabled Search API credentials. Germany remains the requested country.

## Validation

Run `node --experimental-default-type=module --experimental-vm-modules --test tests/feed-live.test.mjs`.
The tests cover chunk delivery before response completion, split UTF-8, silent
startup, deduplication, independent searches, recovery pagination and cooldowns.
Set `FEED_LIVE_FIXTURES` to a directory containing `feed-autoscout.html` and
`feed-kleinanzeigen.html` to include downloaded-page parser validation.

For a live comparison, record the same listing URL, the time CarDeluxe displays
it, the time the portal search first exposes it, and our `gefunden` time. That
separates source delay from our fetch/render delay without mistaking an older
or differently filtered listing for a missed upload.

## Mondeo investigation, 24 September 2026

The user supplied ad `3522302331` and their exact Kleinanzeigen search URL.
That URL includes petrol, private sellers, EUR 1,500–12,000, registration
2008–2024 and 20,000–100,000 km. It does **not** exclude damaged vehicles.
The ad's returned card says 14,400 km and 08/2018. A focused search includes
the ad; adding the user's mileage range excludes it. The application's parser
retains the ad when the portal includes it. Its damage status is therefore not
the explanation for this user's active search.

Normal and fresh-query requests to the exact user search at approximately
19:40 UTC both returned their newest dated results at 19:38 UTC. The added
query parameter did not improve this sample. This observation does not measure
upload-to-index latency or prove a universal two-minute cache lifetime.

Two rotating paid placements in that response were previously misclassified
as organic: the site renders their TOP badges as SVG outside `<article>`.
Detection now uses Astro's explicit `topAd` metadata when present and recognizes
the observed outer SVG badge in early streamed fragments. This prevents those
placements from generating fresh-ad alerts or acting as catch-up anchors.

The unauthenticated mobile API request returned HTTP 401. No credentials from
the unofficial repository were used. Removing the remaining acquisition delay
requires verified faster source access; these parsing corrections do not
establish CarDeluxe-equivalent latency.
