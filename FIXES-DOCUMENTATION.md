# Abu Arsam - Car Rental Management Module Fixes & QA Changelog

This document provides a comprehensive technical breakdown of all 10 issues and bug fixes implemented for the Abu Arsam Car Rental Management System (`/admin` and `/qms`).

---

## Item 1: Mobile Landscape Rotation Support
* **Issue Description:** When rotating mobile devices sideways, the UI stayed locked in portrait orientation or broke layout bounds.
* **Root Cause:** The `public/manifest.json` web app manifest file specified `"orientation": "portrait"`, instructing mobile browsers to enforce vertical orientation.
* **Resolution:** 
  - Updated `public/manifest.json` to set `"orientation": "any"`.
  - Responsive Tailwind flex and grid utilities adjusted across `/admin` UI components to adapt dynamically to landscape width.
* **Affected Files:**
  - `public/manifest.json`

---

## Item 2: Dedicated Admin PWA Application
* **Issue Description:** Installing the Progressive Web App (PWA) from `/admin` defaulted to the user-facing home route without admin navigation.
* **Root Cause:** A single unified `manifest.json` served both root marketing and admin routes.
* **Resolution:**
  - Created `public/manifest-admin.json` specifically tailored for the admin dashboard (`start_url: "/admin"`).
  - Created `app/admin/layout.tsx` to dynamically link `/manifest-admin.json` in `<head>`.
* **Affected Files:**
  - `public/manifest-admin.json`
  - `app/admin/layout.tsx`

---

## Item 3: Persian and Arabic Digit Keyword Parsing
* **Issue Description:** Entering numbers using Persian or Arabic soft keyboards (`۰-۹` / `٠-٩`) caused validation errors or `NaN` in numeric inputs (e.g., daily rates, rental days).
* **Root Cause:** HTML standard number inputs and native JavaScript `parseFloat` expect ASCII digits (`0-9`).
* **Resolution:**
  - Added utility functions `toEnglishDigits`, `normalizeDigits`, and `parseFormattedNumber` in `lib/utils.ts`.
  - Wrapped form input handlers across reservation and car modal components with digit sanitization.
* **Affected Files:**
  - `lib/utils.ts`
  - `components/cars-screen.tsx`

---

## Item 4: Car Handover & Return Protocol Form
* **Issue Description:** The "Register New Handover Protocol" button triggered a plain toast message instead of opening a functional handover modal.
* **Root Cause:** Unimplemented placeholder handler in `cars-screen.tsx`.
* **Resolution:**
  - Implemented `HandoverModal` with fields for initial/return odometer readings (KM), fuel level (Full, 3/4, 1/2, 1/4, Reserve), and vehicle condition checklist.
  - Linked handover data to rental contract rendering.
* **Affected Files:**
  - `components/cars-screen.tsx`
  - `components/car-contract-modal.tsx`

---

## Item 5: Automated Chain (Reservation -> Contract -> Accounting)
* **Issue Description:** Creating a car reservation did not produce an associated contract record or accounting entry, requiring manual duplicate entry.
* **Root Cause:** Disconnected data workflows in memory/state store.
* **Resolution:**
  - Updated reservation creation logic in `cars-screen.tsx` to automatically generate a corresponding rental contract (`CNT-...`) and register a revenue transaction under accounting.
* **Affected Files:**
  - `components/cars-screen.tsx`

---

## Item 6: Separation of Security Deposit Liabilities from Net Revenue
* **Issue Description:** Total rental income stats incorrectly summed up security deposits (`120 OMR`) into net profit, misrepresenting liabilities as revenue.
* **Root Cause:** Financial aggregators summed all positive transaction values regardless of category.
* **Resolution:**
  - Updated `accountingStats` calculation logic in `cars-screen.tsx` to isolate rental revenue from deposit holdings.
  - Added dedicated metric card: "Deposit Held (Liability)" (`ودیعه نزد شرکت`).
* **Affected Files:**
  - `components/cars-screen.tsx`

---

## Item 7: High-Precision Percentage Discount Calculation (3-Decimal OMR Baisa)
* **Issue Description:** Percentage discounts were rounded to whole integers using `Math.round()`, creating pricing discrepancies in Omani Rials (which use 3 decimal places for Baisa).
* **Root Cause:** `Math.round()` truncation in discount calculation helpers.
* **Resolution:**
  - Updated pricing logic to retain 3 decimal places using `parseFloat(val.toFixed(3))`.
* **Affected Files:**
  - `components/cars-screen.tsx`

---

## Item 8: Printable Bilingual PDF Contract Enhancement
* **Issue Description:** Printed PDF contracts omitted delivery/return KM, fuel readings, final settlement summary, and used inconsistent English formatting.
* **Root Cause:** Incomplete printable contract template in `car-contract-modal.tsx`.
* **Resolution:**
  - Enhanced printable contract document template to display initial & return KM, fuel status, full settlement breakdown table (Total Rental, Deposit Received, Deductions, Refundable Amount), standard contract serial `CNT-101`, and English text/digits in the English column.
* **Affected Files:**
  - `components/car-contract-modal.tsx`

---

## Item 9: Sample Data & Fleet Synchronization Cleanup
* **Issue Description:** Sample data contained invalid non-fleet vehicles (Dodge Charger GT) and non-Omani license plate formats (Dubai plates).
* **Root Cause:** Default mock seeds in `data/cars-db.json` and `lib/db-cars.ts`.
* **Resolution:**
  - Replaced sample mock seed with valid fleet vehicle data matching Oman registration standards (MG GT 2026 #1, Plate `48123`).
* **Affected Files:**
  - `data/cars-db.json`
  - `lib/db-cars.ts`

---

## Item 10: UX Modals & Calendar Auto-Refresh Improvements
* **Issue Description:** Modals remained open after successful submission, overlay backdrop blocked first clicks, and calendar view failed to update automatically.
* **Root Cause:** Missing explicit state reset handlers upon form submit completion.
* **Resolution:**
  - Added auto-close handlers for all modals upon submit.
  - Added reactive state re-render triggers for the calendar reservation bar.
  - Added loading indicator state to submit buttons (`در حال ثبت...`).
* **Affected Files:**
  - `components/cars-screen.tsx`
