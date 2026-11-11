# Prompt: The car-selling part of a used-car dealer system

Build the **car-selling part** of an internal system for a used-car dealer. This prompt describes what the dealer needs: the pages, what they show and do, and how they work together. The technical solution is up to you. All texts in the app are in **German**.

---

## 1. Goal

Selling a car should take **one form**. Everything else follows from it automatically:
- contract number
- customer record
- the car's status in the vehicle management
- tasks for the team
- the website ad
- the dashboard

Nobody enters anything twice, and everyone always sees the same state of a car.

---

## 2. Building blocks

| Block | What it is |
|---|---|
| **Website ad** | The car as visitors see it: photos, price, data. Can show "Verkauft". |
| **Vehicle file (Fahrzeugakte)** | The internal record of a car (details below). |
| **Purchase contract (Kaufvertrag)** | The sale: buyer, car, price, payment, warranty, agreements. |
| **Customer** | The buyer, with contact details and the cars they bought. |

The vehicle file holds:
- chassis number (FIN)
- key number and number of keys
- phase: Werkstatt, Aufbereitung, Auf dem Platz, TÜV, Verkauft
- inspection status (TÜV)
- open tasks
- a photo of the registration document

The **chassis number** connects all four blocks.

---

## 3. How a sale runs

1. On the website, a logged-in employee clicks **"Kaufvertrag"** on a car.
2. If the dealer has more than one company or owner, the employee chooses **who issues the contract**. Each has its own header, bank details and number sequence. With only one, this step is skipped.
3. The **contract form** opens with the car already filled in. Next to it, the car's **vehicle file** is shown.
4. The employee adds:
   - the buyer
   - price and down payment
   - payment method
   - warranty
   - special agreements

   Then they **save**. A **PDF** is created that can be printed or e-mailed to the buyer.
5. Saving does all of this at once:
   - the contract gets the next contract number
   - the buyer is saved as a customer, or linked if already known
   - the vehicle file switches to **"Verkauft"**, with buyer and sale date; the one-year warranty starts
   - each special agreement becomes a **task** on the car, plus a TÜV task if needed
   - the website ad shows **"Verkauft"**
   - the car appears on the **dashboard**
6. The team works through the tasks. When none are left, the dashboard shows **"Bereit zur Abholung"**.
7. At handover, the employee clicks **"Übergeben"**:
   - the handover date is saved
   - the key number becomes free
   - the car leaves the dashboard, but stays sold with a running warranty
8. Bookkeeping uses the contract list: payment status, cancellations, and the yearly archive.

---

## 4. Pages

### 4.1 Website (extra buttons for employees)

- Visitors only see the cars.
- Logged-in employees also see on each car:
  - **"Kaufvertrag"**
  - **"Als verkauft markieren"** / **"Wieder verfügbar"**, for cars sold without a contract in the system
- Sold cars carry a red **"Verkauft"** ribbon and can no longer be enquired about.

### 4.2 Contract form

**The contract (A4 layout)**

*Header and buyer*
- Header with the issuing company: logo, name, address, contact details.
- **Käufer:** name, street, postal code, city, phone, e-mail, ID card number.
  - Name and phone are required.
  - Typing the name or phone suggests **existing customers**, which can be taken over.

*Contract data*
- **Contract number** (assigned on save) and **date** (today by default).

*Vehicle*
- type, chassis number, first registration, mileage. Filled in from the ad; can be changed.

*Warranty and agreements*
- **Gewährleistung:** 12 months from the date of sale, or excluded.
- **Besondere Vereinbarungen:** a list to add to and remove from, e.g. "Neue Bremsen vorne", "Neuer TÜV". Each item becomes a task.

*Handover and payment*
- **Übergabe:** Kfz-Brief and Kfz-Schein (yes/no), TÜV until, number of keys. The TÜV date and number of keys come from the vehicle file.
- **Money:** total price and down payment; the **remaining amount** is calculated. Shown as 12.500,00 €.
- **Payment method:** cash on pickup, bank transfer, or financing.

*Fixed contract text*
- **Payment terms:**
  - margin taxation under §25a UStG, no VAT shown
  - the car stays the seller's property until fully paid
  - the date of service is the handover date
  - the amount is due immediately
  - the contract number is the payment reference
- Signature lines for seller and buyer, and "Restbetrag erhalten".
- Footer with the company's bank details and tax number.

**Vehicle file (side panel, screen only)**
- phase, chassis number (click to copy), price and mileage from the ad, link to the ad
- photo of the registration document
- **Warnings that stop mistakes:**
  - already sold (when, to whom, with a link to that contract)
  - TÜV failed or expired
  - tank empty
  - no vehicle file found for this chassis number
- keys, red number plate, days in stock
- the car's task list, which can be ticked off here

**Buttons**
- **"Speichern"** saves the contract and opens it.
- **"Entwurf speichern"** keeps an unfinished contract without a number and without changing the car.

### 4.3 Contract view

- The saved contract as a **PDF**, ready to **print** or **send to the buyer by e-mail**.
- **Payment status:** "Restbetrag offen" or "Bezahlt", with a date.
- **Admin only:**
  - **Korrigieren**: corrects mistakes. Changes to the buyer or the car also update the customer and the vehicle file. Every change is logged with who and when.
  - **Stornieren**: cancels the contract. The number is kept and the contract is marked "Storniert". The system asks whether the car should be available again; if yes, the vehicle file and the website go back to available.
- Contracts are **never deleted**: a contract number, once given, stays.

### 4.4 Contract list ("Kaufverträge")

- All contracts of the current year, newest first.
- Tabs:
  - **Alle**
  - **Offen** (remaining amount not paid)
  - **Markiert** (a personal star for follow-up; the number does not change)
  - **Storniert**
  - **Entwürfe**
- Search over everything; filter by **month and year** and by company.
- Columns:
  - date
  - contract number
  - buyer
  - car
  - chassis number
  - amount
  - payment status
- A click opens the contract.
- **"Neuer Vertrag"** starts a contract without a car.
- **Export** of the filtered list (for the tax advisor).

### 4.5 Archive ("Archiv") – admin only

- Contracts of **past years**. A new year starts a fresh list; nothing has to be archived by hand.
- Same search, filters and export as the list. Read only, except payment status.
- Each admin can be limited to the contracts of their own company.

### 4.6 Vehicle management ("Fahrzeugverwaltung") – the selling-related parts

- **Tabs by phase**, each with a count:
  - Alle
  - Werkstatt
  - Aufbereitung
  - Auf dem Platz
  - TÜV
  - **Verkauft**
- **Search** by name or chassis number.
- **Sold cars** show the buyer, sale date, handover date, warranty end ("Garantie noch 120 Tage" / "abgelaufen") and a link to the contract.
- **Warranty claims (Reklamationen):** date, what, where repaired, cost; with a running total per car.
- **Setting a car to "Verkauft" by hand** (without a contract) asks for the buyer and date, so the warranty and the dashboard still work. Setting it back makes it available again, also on the website.
- Tasks can be ticked off here too.

### 4.7 Dashboard – sold cars

**One compact card per car that is sold but not yet handed over**
- car name and sale date
- key number and chassis number
- buyer's phone (tap to call) and address (opens the map), when known
- footer:
  - **"Bereit zur Abholung"**, or **"3 offene Aufgaben"**
  - **"Aufgaben"** opens the task list
  - **"Übergeben"** finishes the handover

**Layout:** all cards in a row have the same height, with the footer always at the bottom.

### 4.8 Customers ("Kunden")

- Every buyer, added automatically from contracts, or by hand.
- **Each person appears once**, recognised by phone or e-mail.
- Per customer: contact details, bought cars, contracts, open amounts.
- Search, edit, and **merge duplicates**.

### 4.9 Menu

A group **"Verkauf"** with:
- Neuer Vertrag
- Kaufverträge
- Kunden
- Fahrzeugverwaltung
- Archiv (admin only)

---

## 5. Rules

### Contract numbers

- Format: **RE-** + year + running number, e.g. **RE-2026101**.
- Every issuing company has its own sequence, and the sequence restarts at 1 every new year.
- The number is assigned only when saving. **No gaps, no duplicates**, even when two people save at the same moment.
- A number never changes once given. Cancelled contracts keep their number and are marked "Storniert".

### One state everywhere

- The chassis number connects contract, vehicle file, website ad and customer. It is always compared without spaces and in upper case.
- A sale is all-or-nothing: if anything fails while saving, nothing is saved.
- If a car is sold again, the new buyer replaces the old one, and the old sale stays in the car's history.
- A task ticked off anywhere (contract panel, vehicle management, dashboard) is ticked off everywhere.

### Access

- Every page of this part requires a login.
- Correcting, cancelling, the archive and exports are for **admins only**. The system enforces this itself, not just by hiding buttons.
- Every change to a contract is logged: who, when, what.

---

## 6. Look and feel

- Compact and professional, no decoration.
- Neutral greys with one accent colour.
- Status colours:
  - green: done / paid
  - amber: open / warning / "Bereit zur Abholung"
  - red: sold ribbon / cancelled / errors
- Small, clear labels; amounts and dates aligned.
- Tables on the computer, cards on the phone.
- The contract PDF is a clean A4 page with the company's header and footer.

---

## 7. Done when

- [ ] "Kaufvertrag" on a website car opens the form with the car data and its vehicle file.
- [ ] A selling mistake is caught before saving: already sold, TÜV expired, no vehicle file.
- [ ] Saving gives the next RE- number of the chosen company; a new year starts at 1; numbers have no gaps and no duplicates.
- [ ] After saving:
  - [ ] the contract is in the list
  - [ ] the buyer is a customer, without duplicates
  - [ ] the car is "Verkauft" with buyer and warranty
  - [ ] the car has a dashboard card
  - [ ] the website shows "Verkauft"
- [ ] The agreements show up as tasks; ticking them anywhere updates everywhere; with none left the card says "Bereit zur Abholung".
- [ ] "Übergeben" saves the date, frees the key number and removes the card; the car stays sold.
- [ ] Cancelling keeps the number and can make the car available again.
- [ ] The PDF can be printed and e-mailed; the list can be exported.
- [ ] Without login nothing is reachable; non-admins can't correct, cancel, export or open the archive.
