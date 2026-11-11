# Prompt: Red number plates ("Rote Kennzeichen") for a used-car dealer system

Build the **red-plate page** of an internal system for a used-car dealer, exactly as described below. All texts in the app are in **German**.

The dealer's red plates are **not fixed**. The dealer sets up their own plates; the page shows one tab per plate.

---

## 1. What the page is for

The page has two jobs:

1. **Rotbuch:** each red plate has its own book with numbered places **1 to 20**. A car that may run on a plate gets a fixed number in that plate's book.
2. **Fahrtenbuch (logbook):** every use of a red plate is one trip entry:
   - which plate
   - start and end
   - vehicle type
   - manufacturer
   - chassis number (FIN)
   - route
   - driver

   Each trip also shows the car's Rotbuch number.

The cars come from the dealer's **vehicle management**. Only cars marked there for red plates can be used.

---

## 2. Header

From left to right:

- **Plate tabs:** one button per plate, drawn like a German number plate:
  - blue EU strip with "D"
  - the plate number in red

  The active plate is larger with a red border; the others are greyed out. Switching the plate clears the selection and any row being edited.
- **Period:** a "from" month and a "to" month (Jan … Dez), with "bis" between them. Both start at the current month. Trips are shown by the month of their start date.
- **Sort:** switches between **"Nach Datum"** (default) and **"Nach Rotbuch-Nr."**.
  - By Rotbuch number, trips are sorted by number, then date; trips without a number come last.
  - Unsaved new rows always stay at the bottom.
- **"Rotbuch":** opens and closes the Rotbuch panel on the right.
- **"Fahrzeuge wählen":** opens the dialog to assign cars to the plates.
- **"Löschen (n)":** shown only when rows are selected.
- **"Word":** exports the logbook.

---

## 3. Trip table

Shows the trips of the active plate within the chosen months.

| Column | Shows | When editing |
|---|---|---|
| (checkbox) | selects the row; the header box selects all | – |
| Nr. | the trip's Rotbuch number, or "-" | not editable |
| Datum/Uhrzeit | "dd.mm.yyyy HH:MM bis HH:MM" | start and end (date and time) |
| Art | vehicle type | choice: "PKW" |
| Herst. | first word of the car name, e.g. "BMW" | text field "Auswählen oder manuell eingeben" with a ▼ list of the red-plate cars |
| FZ-Nr | chassis number | text field |
| Fahrstrecke | route | text field |
| Fahrer | driver | text field, with save (✓) and cancel (✕) buttons |

**Row actions:** when a row's checkbox is ticked, three icons appear in the driver cell:
- **"Eintrag markieren"**
- **"Bearbeiten"**
- **"Löschen"**

**Below the table:** button **"Neue Zeile"**.

**Empty state:** "Keine Einträge für diesen Monat."

### Row colours

**Red**
- "⚠ Zeit- oder Fahrerüberschneidung":
  - the same plate at overlapping times
  - the same driver at overlapping times, also across plates
- "⚠ Vor Ankaufdatum benutzt": the trip starts before the car's purchase date.
- **Wrong plate:** the car is assigned to another plate. A red triangle appears next to the manufacturer with the hint "Falsches Kennzeichen: …". Clicking it explains: "… ist für X eingetragen. Dieser Eintrag befindet sich unter Y."

**Yellow**
- The row is marked.

**Grey**
- The row is selected.

---

## 4. Entering a trip

### "Neue Zeile"

- Adds a row for the active plate, type PKW, opens it for editing and selects it.
- **Start time:**
  - now, if the current month is in the chosen period
  - otherwise the end of the latest trip shown
  - otherwise 08:00 on the 1st of the "to" month
- **End time:** empty.

### Car picker (Herst.)

- A list of all cars marked for red plates, sorted A–Z.
- Picking a car fills in the name and the chassis number.
- Typing a name that exactly matches a car also fills in its chassis number.
- If the car is assigned only to another plate, a warning appears: "… ist für X eingetragen, nicht für Y."
- Empty list: "Keine Fahrzeuge gefunden".

### Saving a trip (✓)

**Checks that stop the save**
- Start and end are needed: "Bitte Start- und Endzeit eingeben."
- End after start: "Die Endzeit muss nach der Startzeit liegen."
- No time overlap with another trip on the same plate: "Zeitüberschneidung: Dieses Fahrzeug/Kennzeichen ist in diesem Zeitraum bereits unterwegs."
- Not before the car's purchase date: "Dieses Fahrzeug kann nicht vor dem Ankaufdatum im Rotbuch benutzt werden."

**Only a warning**
- Wrong plate. A driver overlap colours the row red after saving.

**Required fields**
- Car, chassis number, route and driver are optional.

**Rotbuch number**
- A new trip, or a trip whose car was changed, takes the car's current number on that plate.
- After that, the number stays with the trip.

**Messages**
- "Gespeichert"
- "Speichern fehlgeschlagen"

### Marking and notes

- **"Eintrag markieren"** colours the row yellow and saves at once.
  - On an unsaved row: "Bitte zuerst speichern, dann markieren."
  - Unmarking removes the note.
- On marked rows a note icon opens **"Markierungsnotiz"**:
  - text up to 1000 characters, with a counter
  - hint: "Die Notiz ist nur bei gelber Markierung sichtbar."
  - buttons "Abbrechen" / "Speichern" → "Notiz gespeichert"
- The icon shows a small dot when a note exists.

### Deleting

- One row: "Diesen Eintrag wirklich löschen?" → "Eintrag gelöscht".
- Several rows: "n Einträge wirklich löschen?"

---

## 5. Rotbuch panel (right side, read only)

- Title **"Rotbuch"** and "N Fahrzeuge mit Rotkennzeichen".
- Lists every car marked for red plates, on all plates.
- **Per car, a card with:**
  - the first photo of the car's website ad, or a book icon
  - a **"Verkauft"** stamp when the car is sold, with the sale date when there is no photo
  - "FIN: …" and "Ankaufdatum: …"
  - a small plate badge for each assigned plate, with "Nr. X"
  - a green "Verkauft am dd.mm.yyyy"
- **Empty state:** "Keine Fahrzeuge mit Rotkennzeichen gefunden", with "Schließen".

---

## 6. "Fahrzeuge wählen" (assign cars to plates)

All changes are a draft until **"Speichern"**. "Abbrechen", Escape or a click outside discard them.

### Step 1: "Kennzeichen wählen"

- One card per plate: "N Fahrzeug(e) · M / 20 Rotbuch-Nummern".
- Button **"Dieses Kennzeichen bearbeiten"**.

### Step 2: one plate

**Toolbar**
- plate badge and "N Fzg. · M/20 Nr."
- "Wechseln": back to step 1
- search "Fahrzeug oder FIN suchen …"
- filter "Alle" / "Zugeordnet" / "Nicht zugeordnet"
- **"Neues Rotbuch – zurücksetzen"**
- close (✕)

**List of all cars from the vehicle management**

| Column | Content |
|---|---|
| Zugeordnet | checkbox, "Ja" / "Nein"; assigned rows are light green |
| Fahrzeug | name (or "Unbekanntes Fahrzeug") and chassis number |
| Weiteres Kennzeichen | e.g. "auch [anderes Kennzeichen] · Nr. X", or "–" |
| Rotbuch-Nr. | choice 1–20, only for assigned cars; numbers already used in this book are greyed out |
| Ankaufdatum | date, editable for cars on any plate; also changes the purchase date in the vehicle management |

**Sorting:** assigned cars first, then A–Z. **Empty:** "Keine Fahrzeuge gefunden."

**Rules for assigning**
- A car can be assigned to **several plates**, with its own number in each book.
- Unticking a car on this plate:
  - removes it from this plate only, and clears this plate's number
  - if it isn't on any other plate, also removes its red-plate mark
- A number is not required.

### "Neues Rotbuch – zurücksetzen"

- Confirmation: "Neues Rotbuch für [Kennzeichen]?"
- Text:
  - "Das Kennzeichen und alle Rotbuch-Nummern werden bei N Fahrzeug(en) entfernt."
  - "Fahrzeuge mit weiteren Kennzeichen behalten diese."
  - "Wirksam erst nach „Speichern“."
- Buttons "Abbrechen" / "Zurücksetzen".
- Message: "Rotbuch … zurückgesetzt – mit „Speichern“ übernehmen".

### Saving

- **Checks:**
  - each number between 1 and 20
  - each number only once per book

  The first problem is shown, e.g.:
  - "…: Rotbuch-Nr. (…) muss zwischen 1 und 20 liegen."
  - "Rotbuch-Nr. 5 (…) ist doppelt vergeben."
- **Messages:** "Rotbuch aktualisiert" / "Fehler beim Speichern".
- **What is saved on each car in the vehicle management:**
  - red-plate mark
  - assigned plates
  - Rotbuch number per plate
  - purchase date

---

## 7. Word export

**File name:** `Fahrtenbuch_<Kennzeichen>_<von>_bis_<bis>.docx`.

**Content:**
- heading "Fahrtenbuch"
- "Kennzeichen: …"
- "Zeitraum: Monat X bis Y"
- a table:
  - Nr.
  - Datum Beginn / Ende
  - Art
  - Herst.
  - FZ-Ident.Nr
  - Fahrstrecke
  - Fahrer

  Empty values show "-".

**Rows:** exactly the trips shown, in the current order.

**Messages:**
- "Keine Einträge zum Exportieren."
- "Word-Datei wurde erstellt."
- "Export nach Word fehlgeschlagen."

---

## 8. Connections to the rest of the system

- **Vehicle management:**
  - provides the cars, chassis numbers, purchase dates and sold status
  - stores which plates a car is on and its Rotbuch number per plate
- **Website ads:** provide the car photos in the Rotbuch panel (matched by chassis number).
- **Trips** are linked to cars by the chassis number.
- **Login:** saving, changing and deleting need a login.
