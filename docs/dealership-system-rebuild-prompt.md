# Master prompt: used-car dealership management system

Recreate the management product below, including its pages, fields, actions, constraints, and connected workflows. Choose the technology stack independently. No language, framework, database, or hosting platform is prescribed.

Use configurable placeholders: [Dealership name], [Logo], [Company details], [Issuing company A/B], [Bank details], [Red plate A/B]. All interface text is German. Use German date and euro formatting, kilometres, PS, and Europe/Berlin business dates. Missing information remains unknown.

Only include the visible management pages listed here and their supporting screens. Preparation stages inside vehicle management remain in scope. A public-site redesign is outside scope; preserve relevant advert and enquiry connections.

## 1. Navigation, accounts, and shared rules

Visible menu:
- General: Übersicht, Rote Kennzeichen, Schlüssel.
- Verkauf: Kaufverträge, Kunden, Fahrzeugverwaltung.
- Anfragen & Planung: Ankauf bestätigen, Abholungen, Marktanalyse, Fahrzeug-Radar.
- Management: Anfragen, Ankauf, Trello, Einstellungen.

Use a collapsible desktop sidebar and mobile drawer. Highlight the current destination, including its child screens. Show counters for unread enquiries, unread seller offers, and open collections.

Provide employee login/logout, password recovery/reset, and profile support screens. Distinguish staff and administrators. Enforce permissions on the action itself, including direct access. Administrative contract correction/cancellation, archive, numbering controls, exports, user creation and bulk deletion require administrator permission where specified below.

Every page needs loading, genuine-empty, filtered-empty, validation, save-progress and failure states as appropriate. Preserve entered information after failure. Do not show unsaved changes as successfully persisted. Prevent double submissions.

FIN connects vehicle files, adverts, sale documents, keys, and customer associations. Normalise spaces, separators and case when matching. Names/models alone cannot establish vehicle identity. Do not invent a FIN for incomplete records.

Keep these separate: seller offer; potential purchase; confirmed purchase; collected stock; sold vehicle; handed-over vehicle. Customer collection of a sold car and dealership collection of a bought car are different workflows. A general board card and a vehicle agreement task are also distinct.

## 2. Übersicht

Purpose: daily operational work, notes/planning information, and sold vehicles awaiting customer collection.

On opening, load the sold-but-not-handed-over queue. Exclude vehicles already handed over or removed from this queue. An empty queue is valid.

Each vehicle card shows name, sale date, FIN, key number, buyer contact information when linked, callable phone, address/map action, task progress and related-record actions. Keep card footers aligned.

Workflow:
1. Open Aufgaben on a vehicle.
2. Review agreement/preparation/TÜV tasks and mark completed items.
3. Show the remaining count; when zero, show Bereit zur Abholung.
4. Click Übergeben and confirm. If work remains, explicitly show the count before allowing the employee to proceed.
5. Save handover date, remove the active dashboard card, and release the key-board assignment.

Readiness does not mean payment or handover occurred. Handover preserves sold status, buyer, contract and complaint history. Repeated handover must not create a second sale. Notes/planning changes persist after refresh.

Acceptance: two tasks produce “2 offene Aufgaben”; completing them shows readiness; handover removes the card while the sold record remains available.

## 3. Fahrzeugverwaltung

Purpose: the internal vehicle file used throughout sales, preparation, keys, plates and after-sales work.

List tabs: Alle, Werkstatt, Aufbereitung, Auf dem Platz, TÜV, Verkauft, with counts. Search by vehicle name or FIN. Provide creation, detail and editing actions.

Fields:
- Name, FIN, purchase date, previous-owner count, owner/company association.
- First registration, mileage, price, registration-document photo.
- General information note, work/notes, completed tasks and TÜV tasks.
- Key number, key count, key colour, key note, key sold state.
- Fuel-needed flag.
- Red-plate eligibility, plate assignments and independent Rotbuch number for each plate.
- Sale date, linked buyer, handover date and relevant contract.
- Complaint entries: date, what happened/work, repair location and cost.

Stages: Werkstatt, Aufbereitung, Auf dem Platz, TÜV, Verkauft. Allow explicit stage changes as work requires; do not force every car through a rigid sequence. Workshop details record where and what; lot details include notes/HU validity; inspection details include pass/fail and issues. Fuel need is independent.

Tasks can be added and completed. Sales agreements feed the vehicle’s work context. Completing the same vehicle task from another screen must be reflected here. Inspection issues must not become a passed inspection merely because a task was added.

Sale workflow: commercial sale links buyer/vehicle and sold information. Manual sale entry supports buyer/date without a system contract. Show sale, handover, contract and after-sales/warranty information where known. Returning to available is explicit and does not erase history.

Complaints remain attached after handover. Display accumulated complaint cost. A complaint does not change original sale price or restart warranty automatically.

Constraints: prevent duplicate nonempty normalised FIN; validate numeric mileage/prices and nonnegative key counts. Preserve photos on unrelated edits. Report upload/save errors. Key/plate edits update their dependent pages. Do not manufacture missing vehicle data.

## 4. Schlüssel

Purpose: touch-friendly read-only lookup beside the physical key board. All editing occurs in Fahrzeugverwaltung.

Layout: brand-logo filters, key table beside vehicle preview, dashboard link/footer. Stack appropriately on phones.

Data: vehicle name, FIN, key number/count/colour/note, sold state. Match advert photos by normalised FIN. Unspecified key count displays as two in the reference behaviour.

Visibility: retain sold cars while keys await handover. Exclude sold cars with no key number and zero keys, and cars removed from the dashboard following handover.

Columns: Fahrzeug, Schl.Nr., Anzahl, Status. Show colour dot and key note; dash for missing number; sold/available badges. The status column may be omitted on small screens.

Interactions:
- Tap a brand to filter; tap again to remove it. Recognise aliases such as VW/Volkswagen and Mercedes/Mercedes-Benz.
- Status-header tap toggles sold-only mode.
- Clear-filter action removes the brand filter.
- Row tap selects and previews the vehicle.
- If selection becomes invalid, automatically select the first visible result.

Preview: first advert photo, name, note, large key number and FIN. Sold cars have a red VERKAUFT ribbon. Missing photo shows Kein Bild verfügbar; no selection shows an instruction.

Automatic behaviour: reset filters after 60 seconds according to the reference screen’s reset behaviour. After 10 seconds without touch, movement, keyboard or scrolling, show a full-screen waiting display with the configured logo/name. Activity returns to the page. Idle behaviour never changes business records.

Distinguish no stored keys from no filter matches. Failed photos must not hide key information.

## 5. Rote Kennzeichen

Purpose: a stable Rotbuch vehicle allocation and a separate Fahrtenbuch trip history for each configured plate.

Header: plate tabs; month-from/to initially current month; date/Rotbuch-number sorting; Rotbuch-panel toggle; Fahrzeuge wählen; selected-row deletion; Word export. Plate switching clears selection/edit state.

Trip columns: selection, Rotbuch-Nr., start/end date/time, Art (PKW), manufacturer/vehicle, FIN, route, driver. Saved selected rows expose mark/edit/delete actions.

Neue Zeile adds an unsaved selected editable row for the active plate. Start defaults to now when current month is in the selected range; otherwise latest shown trip end; otherwise 08:00 on the first day of the ending month. End starts empty. Unsaved rows stay last.

Vehicle picker lists eligible cars alphabetically. Selection fills name/FIN; exact typed name may fill FIN too. Warn if the vehicle belongs only to another plate.

Blocking trip rules:
- Start/end required; end strictly later than start.
- No overlap with another trip on the same plate, excluding itself during editing.
- No use before the matched vehicle’s purchase date.
- Vehicle, FIN, route and driver are optional in the reference form; do not silently make them required.

Warning rules: wrong plate is a warning, not the same-plate conflict blocker. Overlapping use by the same driver, including across plates, is highlighted. Explain red conflict styling in text. Yellow means explicitly marked; grey indicates selection.

Number rule: new trip or changed vehicle takes the current allocation number for the active plate. Saved trip numbers remain historical snapshots when present allocations later change.

Marking: save before marking. Mark immediately persists. Marked rows allow a note up to 1,000 characters; show a note indicator. Unmarking removes that note. Confirm single/multiple deletion.

Rotbuch panel: read-only eligible-vehicle cards with photo/fallback, FIN, purchase date, plate/number badges and sold/date indication. Sold status does not erase trip history.

Allocation dialog:
1. Choose a plate; show vehicle/number usage.
2. Search by name/FIN; filter Alle/Zugeordnet/Nicht zugeordnet; assigned first, then A–Z.
3. Edit allocation checkbox, this plate’s number and purchase date; display other-plate allocations.
4. Validate and save, or discard through Cancel/Escape/close.

Allocation constraints: positions 1–20, integer, optional, unique per plate. Same position can exist in another plate. A car can belong to multiple plates. Removing one clears only its allocation/number; when none remain remove red-plate eligibility. Purchase-date changes update the vehicle file.

Neues Rotbuch – zurücksetzen requires confirmation and affects only the chosen plate. It remains a draft until Speichern; other plates persist.

Word export: exactly the shown period/order, plate/period heading, columns number/start/end/type/manufacturer/FIN/route/driver; empty values use a dash. No-data and export failures get clear feedback.

## 6. Kaufverträge

List defaults to current-year contracts. Tabs: Alle, Offen, Storniert, Privat. Search contract/buyer/vehicle information; month filtering; archive-year selection in the supporting archive. Columns include date, number, buyer, vehicle, FIN, total and payment/status. Row opens the correct commercial/private document.

Actions: Neuer Vertrag, next-number preview, administrator sequence adjustment, filtered export, supporting archive. Do not add archive as another top-level module.

Numbering: configurable independent issuing-company sequences. Support reference patterns sequence/YY and RE-YYYYsequence. Select issuer first. Preview is not issuance. Prevent duplicate numbers, including simultaneous saves; preserve issued identity on edits/cancellation. Administrator continuation after paper-issued contracts must be validated. Do not promise absolute gap-free numbering after every failed attempt.

### Contract form workflow

1. Choose commercial/private document and issuing identity as appropriate.
2. Prefill selected vehicle data, or allow starting independently.
3. Enter buyer name/address/phone/email/ID information; offer existing-customer suggestions.
4. Enter date, type, FIN, registration, mileage, warranty choice, special agreements, document handover, HU, key count, total, down payment and payment information.
5. Calculate remaining balance = total minus down payment; parse German numeric input consistently.
6. Review A4 document and vehicle-file side panel, then save.

Side panel: FIN/copy, stage, registration photo, mileage/price, keys, plates, stock-age information, tasks and advert link. Warn about already-sold cars, missing files, inspection issues and fuel need. Distinguish informational warnings from genuine blockers.

Commercial finalisation: save document/number; capture buyer contact information; locate or create the related vehicle file; mark sold; merge agreement tasks; update matching public availability. Do not pretend dependent updates succeeded when they failed. Match normalised FIN rather than creating duplicate vehicles.

Private paperwork has its own form/view/email workflow. Do not assume every private-document save has the same stock/customer side effects as a commercial contract.

### View and subsequent actions

- Printable A4, PDF download, explicit email action, optional configured stamp.
- Use configured issuer/header/footer/bank details and approved wording; never invent legal clauses or identity.
- Display open/paid and payment date. Calculated balance and recorded payment state are distinct.
- Administrator correction/cancellation records who/when/reason where applicable.
- Cancellation preserves contract identity and explicitly decides whether availability should be restored.
- Do not casually delete issued commercial contracts or recycle their numbers.
- Earlier years remain accessible through administrator archive with applicable search/export; preserve historic values when settings change.
- Supporting documents include registration authorisation, SEPA mandate, private paperwork and relevant collection/handover authorisations.

Do not invent draft/starred tabs, universal automatic customer merging or one universal numbering pattern based on older design notes.

## 7. Kunden

Purpose: customer contact records reused in sales and sold-vehicle association.

Fields: name, phone, street, postal code, city, vehicle name, FIN, first registration and note; retain email from connected records where available.

Workflow: load → search → sort supported columns → paginate (20 per page) → inspect/edit/add. Support single/selected-record deletion with confirmation. Changing search/page clears selection so hidden records are not accidentally deleted.

Editing prefills existing values; save persists, cancel discards. Customer suggestions reuse details without silently modifying unrelated records.

Constraints: stable IDs for associations; names are not unique identity. The reference does not provide a universal automatic duplicate-merge engine. Contact deletion does not erase issued historical documents. Show genuine-empty and filter-empty separately.

## 8. Anfragen

Purpose: general/customer vehicle enquiry inbox.

Tabs: Neu, In Bearbeitung, Erledigt, Archiv, Alle. Processing status is separate from read/unread.

List/detail: sender/contact, received time, message summary/full text and vehicle context where available. Missing/deleted advert must not make the enquiry unreadable.

Workflow: receive → unread counter → open/review → mark read → processing status → done/archive. Permit status changes without making a new message. Preserve available notes/handling information.

Actions: inspect, use contact details, change status, archive, permanently delete with confirmation. Opening or changing status does not automatically send a message.

An enquiry is not a reservation/sale. Archive is not deletion. Navigation counts follow persisted records.

## 9. Ankauf

Purpose: inbox for vehicles sellers submit to the dealership.

Tabs: Alle, Neu, In Prüfung, Angebot, Angekauft, Abgelehnt. Read state is independent. Older entries missing processing status behave as Neu.

Show seller name/phone/email, vehicle make/model/registration/mileage/fuel/transmission/power, HU, accident/condition, asking price, description, photographs, equipment and supplied extras: FIN, series, trim, doors/seats, emission class, colour/interior, drive type. Clearly show non-running/engine-damage declarations.

Workflow: open → review → In Prüfung → record offered price/internal note → Angebot → Angekauft or Abgelehnt. Retain handled-by/time information when captured.

Constraints: offered price differs from seller’s asking price; inbox status does not mean collection completed; missing attributes remain unknown. Deletion confirmation states that offer/photos will be removed. Reuse reviewed details in purchasing; do not create stock from every new submission.

## 10. Ankauf bestätigen

Purpose: prepare a reviewed purchase-confirmation email and associated pickup/delivery record.

Entry: supported portal URL, available pasted-text fallback, or manual form. Show helper detection/progress, missing-extension and blocked-page errors for import cases requiring the browser helper. Imported information stays editable.

Vehicle fields: source/link, name/make/model, registration, mileage, power, fuel, transmission, HU, colour, owners, accident status, defects, category, doors/seats, interior, displacement, advert price, image/location as available.

Seller: name, email, phone, street, postal/city. Purchase: positive negotiated amount and transfer/cash. Logistics: dealership pickup versus seller delivery, date/time and relevant notes.

Travel uses entered seller address before advert location. Missing travel result is not a zero-minute journey.

Email behaviour: generated subject/body follows form edits until manually edited. Preserve manual text; provide deliberate regeneration/reset. Offer a copy to dealership.

Send requires seller email and purchase price greater than zero plus fields needed for the final document. Confirm recipient before sending. Show progress/success/error; a send failure is not success.

Successful confirmation creates connected collection information using reviewed values. Avoid duplicate sends/collections on repeat clicks. Success offers access to collection planning.

## 11. Abholungen

Purpose: dealership collection of bought vehicles or seller deliveries. Customer collection belongs to Übersicht.

Views: open/completed with counts. Open sorts by schedule with undated last; completed sorts by completion time descending.

Fields: vehicle/link/photo; seller contact/address; negotiated amount; cash/transfer; pickup/delivery; date/time; registration state; red plate; driver; notes; completion date/person; internal vehicle link.

Editing: validate date/time; driver up to 60 characters; notes up to 2,000. Registered status and red-plate selection are mutually exclusive: registered clears red plate, selecting a plate implies unregistered unless explicitly changed together.

Mark done saves completion date/person, reuses an existing file by valid FIN or creates a Werkstatt file, and links it. Transfer known identity, registration, mileage, owners and purchase context. Do not fabricate a valid 17-character FIN. Repeated completion does not duplicate stock.

Reopen clears completion markers and returns to open; retains vehicle association. Explicit deletion removes planning, without silently deleting linked vehicles/contracts.

Supporting actions: seller contact, maps/travel, original advert, printable collection authorisation with relevant driver/vehicle information.

## 12. Marktanalyse

Purpose: explain a buying decision for one advert.

### Input/search

Accept genuine mobile.de, AutoScout24 and Kleinanzeigen vehicle URLs, private or dealer subject. Require make/model/first registration/mileage/usable asking price. Name missing core fields instead of inventing a value.

Desktop-helper portal reading shows progress/errors by source. Partial source success must not look like full coverage.

Search Germany-wide in up to three widening steps: registration approximately ±1/2/3 years, mileage ±20/30/40%, power ±10/15/20%, with minimum windows. Stop at ten good dealer comparisons or exhausted search.

### Comparison constraints

- Subject never compares to itself; deduplicate repeats/cross-portal copies.
- Market value uses appropriate undamaged dealers; private offers stay separate.
- Check model/generation, variant, fuel, gearbox, power, mileage, age and trim as available; explain exclusions.
- Avoid Euro-6 diesel against Euro-5/older; missing data is not confirmed equality.
- Exclude outliers; bound mileage/age adjustment to 25% per comparable.
- Learn depreciation only with sufficient observations (baseline 25); otherwise explicit defaults.
- Trim increments: base 0%, mid 4%, top 8%, sport 10%. Exclude base versus top/sport; reduce neighbouring/unknown-trim weights.
- Portal price ratings 4/5 are display-only; rating 3 has reduced weight.
- At least three counted dealers needed. Weighted median is value; weighted quartiles form range. Confidence considers count/spread/search widening; fewer than five means low confidence.

### Prices and verdict

Baseline now: 5% selling discount, €2,300 minimum margin, €3,000 target margin. Target cannot be below minimum.

Selling price = market value × (1 − discount) × (1 − applicable rule deductions), rounded to €50. Combined rule deductions cap at 20%.

Target = selling price − target margin − included costs, rounded down to €50. Limit = selling price − minimum margin − included costs, rounded down to €50. Expected margin = selling price − asking price − included costs.

Current repair policy: estimates are displayed but not automatically subtracted; included repair costs are zero under baseline. Do not add normal preparation/transport/HU/holding costs again as invented deductions.

Price verdict: at/below target Kaufen; above target up to limit Kaufen, knapp; above positive limit within negotiation zone Verhandeln; otherwise Finger weg. Negotiation baseline 10%, rule-adjustable up to 20%. Serious risks may downgrade; exclusion risks force Finger weg. Insufficient market data shows Keine Bewertung möglich.

### Findings/report/history

Recognise negated faults and completed repairs. Distinguish explicit defects, uncertain statements, positives, history and model-family checks. A family weakness is not a diagnosis. Timing-belt age can prompt a question without automatically charging repair costs.

Report: subject details, verdict/reasons, market range/confidence, selling price, ask, target/limit, expected margin, repairs, risks/positives, questions, timing/trim/generation facts, comparison/private/excluded lists, source links and available travel context.

Save and reopen history. Recalculation with settings must identify use of saved comparison data instead of pretending to perform a new search.

Gekauft records a manually entered actual positive purchase price; allow reversal. Show comparison to limit and expected margin. Do not automatically label all stock purchases as feedback.

Gehirn tabs: rules/counters, seller dictionary, models, generations, trims, timing belt/chain, market observations, unknown phrases and changes. Export observations/settings/counters/purchases. Unknown phrases never silently become active rules.

Observed listings support price/depreciation/duration indicators. Disappearance is not confirmed sale or sale price. Actual retail-profit learning requires actual recorded outcomes. Source-backed engine expansion is separately requested work, not a completed baseline claim.

Optional AI short conclusion: verdict/main reason; main risk/uncertainty; next action. Preserve calculated amounts, reject unsupported monetary claims. Failure leaves the base report usable.

Settings within this module: comparison portals (minimum one), margins, repair reference prices, mileage warning (150,000 km baseline), optional AI. Validate bounds; failed save retains previous settings.

## 13. Fahrzeug-Radar

Purpose: continuously observe new portal adverts.

Setup: sources; make/model; price/registration/mileage/power ranges; fuel; gearbox; seller category; location/radius supported by source. Apply draft filter changes explicitly. Explain unsupported source filters.

Monitoring: start/pause, interval, per-source health/last check/errors. Avoid overlapping concurrent requests to a source. Honour source-specific cadence; reference AutoScout24 minimum ten seconds. Do not promise identical portal freshness or instant discovery.

Feed: photo/title/price/EZ/km/PS/location/source/original link; expandable details. Maintain filter-specific history and seen-state across reloads; cap saved feed at 500.

Initial results form a baseline rather than triggering alerts for every existing advert. Notify once per new observed identifier. Repeated polls/reordering/recovery do not repeatedly alert for the same advert.

Alerts: visual/audio/browser notifications; request browser permission as required. Notification failure does not stop visible feed. Provide test/mute controls.

Recovery: distinguish paused/loading/healthy/stale/partial/blocked/unavailable, recover without erasing seen history. Partial missing results do not prove market removal. Reuse selected advert in analysis/purchase review; opening it is not a purchase.

## 14. Trello / Aufgabenboard

Purpose: shared internal board of lists and task cards. No external Trello account required.

Load saved board. Genuine empty board has no invented tasks; load failure is distinct from empty.

Lists: add nonempty title, rename, delete with clear effect on contained cards. Cards: nonempty text, edit text/colour, done toggle, delete, reorder and drag between lists. Invalid drop or unchanged position does nothing.

Colours: standard, blue, green, red, yellow, purple, pink, indigo. Colour does not inherently mean priority/due date.

Persist edits and restore on reload; show save failures and avoid silently overwriting another employee’s work. Board completion does not complete an unrelated vehicle task.

Preserve the shared board experience; multiple-project directory, assignees, deadlines and external sync are not assumed baseline features.

## 15. Einstellungen

Mein Profil: current employee account/profile information and supported edits/password fields, validated with save feedback. Profile editing cannot grant admin rights.

Firmenstempel: current configured stamp and supported upload/update/removal. Document usage remains explicit; missing stamp never invents a signature.

Browser-Erweiterung: checking/connected/unavailable, download/install package, recheck on returning to page. Explain portal-import purpose for analysis/confirmation. Reflect current connectivity rather than permanent remembered success.

Benutzer, admin only: create validated employee accounts and controlled roles; no unrestricted public staff signup.

Daten löschen, admin only: configured deletion scope, clear consequences and explicit final confirmation. Never delete on page load. Preserve records outside selected scope; report partial/failure accurately.

Market-analysis controls remain in its own settings interface. Do not invent global controls for every business assumption.

## 16. Cross-page acceptance journeys

1. Seller submission → unread Ankauf → reviewed offer/status → confirmed email → Abholungen → completed collection → linked Werkstatt vehicle.
2. Preparation → contract/customer → sold/tasks → dashboard ready → handover → key release and retained history.
3. Allocation draft → valid stable 1–20 number → trip conflict checks → historical number preservation → filtered Word export.
4. Radar baseline → one new alert → analysis with valid/excluded offers → saved report → recorded purchase feedback.
5. Enquiry → read/processing → done/archive → original context retained until explicit deletion.
6. Board edit/move/completion → reload restores state; failures are visible.

## 17. Delivery instructions

Before implementation, present page map and checklist mapped to this specification. Choose stack separately. Obtain business assets/approved wording through configuration.

For each page deliver working list/detail/form states, actions, validation, permissions, side effects, responsive layout, and error recovery. Clearly identify unanswered business decisions instead of inventing current behaviour.

Use labelled demonstration records for previews. Do not send emails, issue live documents or delete real data merely to demonstrate a workflow.

Verify persisted connected journeys, document output, numbering, calculations and access control. Report deliberate deviations. Additional modules/features require a separate product decision.
