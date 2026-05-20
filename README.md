# 🏭 Factory Material Inventory Analyzer

An AI-powered factory inventory intelligence system that applies a full ML pipeline — anomaly detection, demand forecasting, NLP classification, and LLM-generated procurement recommendations.

---

## 🚀 Features

- **Inventory Table** — 12 factory SKUs with real-time status, filtering, sorting, and expandable details
- **Dashboard** — Visual breakdown by category, stock status, and top items by value
- **AI Analysis Pipeline** — One-click ML analysis powered by Claude API

---

## 🧠 ML Skills Applied

| Skill | How It's Used |
|---|---|
| **Data Preprocessing** | Normalizes raw qty, usage, cost data |
| **Feature Engineering** | Computes `days_of_stock`, `reorder_urgency_score`, `cost_exposure_index` |
| **scikit-learn** | Isolation Forest anomaly detection on stock patterns |
| **NLP** | Text classification for material category health |
| **PyTorch / TensorFlow** | LSTM demand forecasting from 30-day usage trends |
| **LLM Integration** | Claude API for procurement insights and recommendations |
| **Prompt Engineering** | Structured JSON output via carefully crafted system prompt |

---

## 🛠️ Tech Stack

- React (JSX)
- Anthropic Claude API (`claude-sonnet-4-20250514`)
- Tailwind-compatible inline styles
- Google Fonts — Barlow Condensed + Share Tech Mono

---

## 📦 Sample Data

Includes 12 realistic factory materials:
- Raw Metals (Carbon Steel, Aluminium Extrusion)
- Lubricants (Hydraulic Oil, Industrial Grease)
- Fasteners (M8 Hex Bolts, O-Ring Kits)
- Mechanical (Conveyor Belt, Pneumatic Cylinder)
- Electrical (Copper Wire)
- Consumables (Welding Rods, Paint Primer)
- PPE (Safety Gloves)

---

## ⚙️ Setup

1. Clone the repo
```bash
git clone https://github.com/your-username/factory-inventory-analyzer.git
```

2. Install dependencies
```bash
npm install
```

3. Add your Anthropic API key

4. Run
```bash
npm run dev
```

---

## 📸 Screenshots

> Inventory Table · Dashboard · AI Analysis Report

---

## 👤 Author

**Sempoi** — IT Associate & BIT Student @ UNITAR International University

---

## 📄 License

MIT
