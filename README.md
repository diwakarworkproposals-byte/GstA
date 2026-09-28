# 🌌 Gemini Local Ledger (GstA)

> **Lightning-fast, offline-first, zero-cloud desktop/web application inspired by Google Gemini with dynamic adaptive schema engine, natural language parsing (Hinglish/Hindi/English), and GST purchase bill OCR scanner.**

[![Offline First](https://img.shields.io/badge/Architecture-100%25%20Offline-success.svg)](#)
[![Zero Cloud](https://img.shields.io/badge/Cloud%20Dependency-Zero-blue.svg)](#)
[![Database](https://img.shields.io/badge/Storage-IndexedDB%20%2B%20Dexie-indigo.svg)](#)
[![OCR](https://img.shields.io/badge/OCR-Tesseract.js%20(Local)-orange.svg)](#)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](#)

---

## 🌟 Key Architectural Highlights

1. **100% Local & Zero Third-Party Cloud Dependency:**
   - Runs self-contained in the browser or as a desktop PWA/Electron container.
   - Zero required external sign-ups, API authentications, or remote servers.
   - High-throughput persistence powered by browser **IndexedDB** via Dexie.js.

2. **Free-Hand Dynamic & Adaptive Schema (No Hardcoding):**
   - Whether you input sales with employee incentives, supplier ledgers, cloth bundles, daily tea expenses, freight/transport, or any unique custom business scenario:
   - The NLP parsing layer automatically infers the business context, creates new tabs and columns on the fly, and updates metadata adaptively without runtime errors.

3. **Google Gemini-Inspired UX/UI:**
   - Spacious layout with dark/light mode toggle.
   - **Split-Screen Workspace:** Interactive conversational chat on one side, live dynamic table inspector on the other side.
   - **Bottom Command Hub:** Sleek floating capsule with voice dictation (Web Speech API supporting Hindi/English), image scanner, and natural language command parser.

4. **Offline GST Bill Vision & OCR:**
   - In-browser image pre-processing with Canvas contrast enhancement.
   - Client-side Tesseract.js optical character recognition.
   - Automatic extraction of GSTIN, Invoice Number, Date, Vendor Name, Taxable Value, CGST/SGST, and Total Amount.
   - One-click instant demo mode with a realistic simulated Indian GST tax invoice.

5. **Smart Conversational Query Engine:**
   - Real-time calculations across local records:
     - *"What is Rohit's remaining balance?"*
     - *"Show last month's transport expenses"*
     - *"Ashok sales and incentives"*
     - Aggregates debits, credits, balances, category totals, and produces clean tabular responses with metric chips.

---

## 🚀 Live Demo / Quick Start

### Prerequisites
- Node.js (v18+)
- npm or pnpm

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/diwakarworkproposals-byte/GstA.git
cd GstA

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

Open `http://localhost:5173` in your browser.

---

## 💬 Example Natural Language Commands

| Scenario | Input Command | What Happens |
|---|---|---|
| **Sales & Incentive** | `Ashok sold 30000, 400 incentive` | Extracts employee: Ashok, Sale: ₹30,000, Incentive: ₹400; stores in *Sales & Incentives* table. |
| **Supplier Ledger** | `Paid supplier Rohit 15000 for sofa` | Extracts supplier: Rohit, Item: Sofa, Paid: ₹15,000, Balance: ₹10,000; stores in *Supplier Ledgers*. |
| **Tea & Petty Cash** | `Tea & snacks expense 250` | Classifies as Pantry/Refreshments expense, stores in *Expenses & Petty Cash*. |
| **Dynamic Tab (Cloth)** | `50 cloth bundles 12500 from Surat` | Dynamically spawns *Cloth Bundles & Textiles* table with quantity, rate, and amount columns. |
| **Transport & Freight** | `Transport tempo freight 1800 paid` | Stores in logistics category with auto-detected vehicle/delivery details. |
| **Smart Balance Query** | `What is Rohit's remaining balance?` | Queries IndexedDB across transactions, computes balance due, and returns ledger card. |
| **Smart Expense Query** | `Show last month's transport expenses` | Sums transport expenses and displays itemized breakdown. |

---

## 🛠️ Tech Stack

- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS v4 + Lucide React Icons
- **Local Database:** IndexedDB + Dexie.js
- **OCR Engine:** Tesseract.js (Client-side) + HTML5 Canvas
- **Speech Recognition:** Web Speech API (`en-IN`, `hi-IN`)
- **Animations:** Canvas Confetti

---

## 🔒 Security & Privacy

Your data never leaves your device. Everything—transactions, invoices, bills, speech dictation, and customer ledgers—is processed and kept securely on your local machine.

---

## 📄 License

MIT License. Designed and engineered for high-performance offline business accounting.
