# Prompt: Key page ("Schlüssel") for a used-car dealer system

Build the **key page** of an internal system for a used-car dealer, exactly as described below. All texts in the app are in **German**.

The page shows which key belongs to which car: key number, number of keys, key colour, and whether the car is sold. It is made for a screen at the key board, so it works by tapping, resets itself, and switches to a waiting screen when nobody uses it.

---

## 1. Data

The page only reads data. Nothing can be changed here.

- **Cars from the vehicle management.** Per car:
  - car name
  - chassis number (FIN)
  - key number
  - number of keys (2 if not set)
  - key colour
  - key note
  - sold or not
- **Website ads:** only used for the car photo, matched by chassis number. Chassis numbers are compared ignoring spaces, dashes and upper/lower case.

**Hidden cars:** sold cars whose key was taken off the board never appear on this page. That means a sold car that either:
- has no key number (empty or "–") and 0 keys, or
- was removed from the dashboard after handover

If loading fails: "Fehler beim Laden der Schlüssel- und Fahrzeugliste".

---

## 2. Layout (top to bottom)

1. **Brand logos** (filter)
2. **Key table** (left) and **car preview** (right). On the phone they are stacked.
3. **Footer**

### 2.1 Brand logos

A grid of large, tappable brand logos with the brand name under each. 4 per row on the phone, up to 7 on large screens.

**Tapping a logo**
- Shows only cars of that brand and scrolls down to the table.
- Tapping it again removes the filter.
- The active logo is highlighted.

**How a car is matched:** its name must contain the brand name or one of its other names:
- Volkswagen: "Volkswagen", "VW"
- Mercedes: "Mercedes", "Mercedes-Benz"
- Mini: "Mini", "MiniCooper"

**The logos are already in the project folder `public/logos`.** Use them in this order:

| Brand | Logo file |
|---|---|
| BMW | `/logos/bmw.png` |
| Citroen | `/logos/citroen1.png` |
| Volkswagen | `/logos/vw2.png` |
| Fiat | `/logos/fiattest.png` |
| Ford | `/logos/ford.png` |
| Opel | `/logos/opel44.png` |
| Dacia | `/logos/Dacia1.png` |
| Honda | `/logos/honda1.png` |
| Mercedes | `/logos/Mercedes2.png` |
| Suzuki | `/logos/suzuki.jpg` |
| Renault | `/logos/Renault.png` |
| Skoda | `/logos/skodaa.png` |
| Hyundai | `/logos/hyundia.png` |
| Peugeot | `/logos/peugeot1.png` |
| Mazda | `/logos/mazdaa.png` |
| Nissan | `/logos/nissan.png` |
| Seat | `/logos/seat1.png` |
| Kia | `/logos/kia1.png` |
| Toyota | `/logos/Toyota1.png` |
| Mini | `/logos/minicooper1.png` |
| Audi | `/logos/audi1.png` |

### 2.2 Key table

| Column | Shows |
|---|---|
| **Fahrzeug** | a small round dot in the key colour (if set), the car name, and the key note in small text below |
| **Schl.Nr.** | key number, or "–" |
| **Anzahl** | number of keys |
| **Status** | badge **"Verkauft"** (red) or **"Verfügbar"** (green); hidden on the phone |

- **Sold cars:** the car name is shown in the sold colour.
- **Brand filter active:** a small ✕ next to "Fahrzeug" removes it ("Markenfilter zurücksetzen").
- **Status header:** tapping it shows **only sold cars**; tapping again shows all. The header is highlighted and shows a filter icon while active ("Klicken, um nur verkaufte Fahrzeuge anzuzeigen").
- **Tapping a row** selects the car, highlights the row, and scrolls to the preview.
- **Selection:** the first car in the list is always selected automatically when nothing is selected, or when the selected car is filtered out.
- **While loading:** 8 grey placeholder rows.
- **Empty state:**
  - "Keine Fahrzeuge gefunden"
  - below it, either "Passen Sie Ihre Filterkriterien an." (when a filter is on) or "Es sind noch keine Schlüssel-Daten hinterlegt."

### 2.3 Car preview ("Fahrzeugvorschau")

A card with the header **"Fahrzeugvorschau"** (camera icon).

**With a photo**
- the first photo of the car's website ad, 4:3
- at the bottom, over the photo: make and model, and the key note

**Without a photo**
- a camera icon, the car name and the text:
  - when a car is selected: "Kein Bild verfügbar" and "Für dieses Fahrzeug ist aktuell kein Bild in der Datenbank hinterlegt."
  - when no car is selected: "Noch kein Fahrzeug ausgewählt" and "Wählen Sie links in der Tabelle ein Fahrzeug aus, um Details zu sehen."
- the key note, if any ("Notiz: …")

**Sold cars:** a red diagonal ribbon **"VERKAUFT"** in the top-right corner.

**Below the photo, two boxes:**
- **"Schlüssel:"** with the key number, large and bold
- **"FIN:"** with the chassis number

### 2.4 Footer

- A link **"Dashboard"** (with a back arrow) to the dashboard.
- The text "Automatische Filterrücksetzung nach 60 Sekunden Inaktivität."

---

## 3. Automatic behaviour

**Filter reset:** the brand filter and the "only sold" filter switch off by themselves **60 seconds** after they were set.

**Waiting screen:** after **10 seconds** without any touch, mouse movement, key press or scrolling, the page switches to a full-screen waiting screen:
- dark, elegant background with soft light effects
- the dealer's logo, floating gently up and down
- the dealer's name, appearing letter by letter in two lines (first line white, second line with a colour gradient)

Any touch or movement brings the key page back.

---

## 4. Look

- **Light and dark mode:** follows the user's saved choice, otherwise the device setting.
- **Background:** light grey; table and preview are white cards with rounded corners and a soft shadow.
- **Text size:** grows with the screen. Small on the phone; large logos and readable text on a wall screen.
- **Colours:**
  - red: "Verkauft"
  - green: "Verfügbar"
  - highlight: the selected row and the active logo
