# Neue Angebote: active-page delivery

The page searches only while the user has started it, the tab is visible and
the browser is online. Pause, navigation away, hiding the tab and disconnecting
stop its timers and cancel browser requests. Returning resumes immediately.
There is no installed Windows service, scheduled task or offline collector.
An already-running shared server request may finish its bounded portal fetch;
it never schedules another search on its own.

## Delivery and coverage

- Each portal has its own live loop. Default starts are three seconds apart
  where response time permits. Explicit refusals retain a five-minute cooldown.
- Portal HTML is consumed incrementally. Kleinanzeigen publishes each complete
  article; AutoScout24 publishes as soon as its listing JSON is complete. The
  existing NDJSON response forwards these batches without waiting for the footer.
- Partial startup batches remain a quiet baseline until the source completes.
  Later batches are deduplicated by source and ad ID, including out-of-order IDs.
- A separate lower-priority check scans page two about every ten seconds.
  If it sees no previously known organic ad, it continues through further pages.
  First-page polling continues independently. Failures retain the recovery page
  for retry; incomplete scans and the page limit have visible warnings.
- The initial page-two scan records existing stock without displaying it. That
  baseline survives reloads in this search's local storage. It is not a complete
  inventory download. Old stock is not shown in a separate section.
- Detailed ad-page lookups happen on demand. New-arrival bursts no longer
  automatically launch up to ten competing detail requests.

## What this cannot guarantee

Discovery time is not upload time. Ads absent from the portal's returned search
cannot be delivered yet. Search pages can be cached, blocked, reordered or
truncated, and the first baseline intentionally hides existing stock. Overlapping
pagination reduces losses but is not an atomic snapshot of the marketplace.
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
