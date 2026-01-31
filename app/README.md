# Synthetic Identity Detection - Frontend 🛡️

The frontend application for the **Synthetic Identity Detection System**. This modern, responsive web dashboard allows users to submit identity records for analysis, view real-time risk scores, and investigate detailed fraud flags including velocity checks and network density anomalies.

## 🚀 Overview

Built with **React 19** and **TypeScript**, this application provides a sleek user interface for interacting with the detection backend. It uses **Tailwind CSS** and **Shadcn/UI** for a premium, accessible design.

## 🛠 Tech Stack

*   **Framework:** [React](https://react.dev/) + [Vite](https://vitejs.dev/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Components:** [Shadcn/UI](https://ui.shadcn.com/) (Radix UI primitives)
*   **Icons:** [Lucide React](https://lucide.dev/)
*   **Forms & Validation:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
*   **Charts:** [Recharts](https://recharts.org/)
*   **Networking:** [Axios](https://axios-http.com/)

## ✨ Key Features

### 1. 📊 Interactive Dashboard
*   Real-time overview of analyzed records.
*   Summary statistics showing total records, synthetic count, and average risk scores.
*   Visual distribution of risk using interactive charts.

### 2. 📝 Record Submission
*   User-friendly forms to input identity details (Name, DOB, Email, etc.).
*   Support for analyzing batch data (implied by backend capabilities) or single operational records.

### 3. 🚨 Live Analysis Results
*   **Risk Scoring:** Displays a 0-100 fraud probability score for each record.
*   **Status Indicators:** clear visual cues for "Clean", "Suspicious", or "Synthetic".
*   **Comprehensive Table:** Sortable and filterable list of all analyzed identities.

### 4. 🔍 Detailed Investigation View
Clicking on a record reveals deep insights:
*   **Rule Breakdown:** See exactly *why* a record was flagged (e.g., "Phone Velocity > 2", "Document Age Invariant").
*   **Contextual Data:** displays the specific conflicting values (e.g., matching IPs or shared device IDs).

---

## 📂 Project Structure

```bash
src/
├── components/     # Reusable UI components (Buttons, Inputs, Cards)
│   └── ui/         # Shadcn/UI primitive components
├── sections/       # Main application views/containers
│   ├── Dashboard.tsx    # Main entry view & stats
│   ├── ResultsTable.tsx # Tabular data display
│   └── DetailView.tsx   # Drill-down analysis view
├── services/       # API integration
│   └── api.ts      # Axios client for backend endpoints
├── lib/            # Utilities (clsx/tailwind-merge helper)
├── hooks/          # Custom React hooks
└── types/          # TypeScript definitions
```

## ⚙️ Setup & Installation

Ensure the **backend server** is running on `http://localhost:3001` before starting the frontend.

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Start Development Server:**
    ```bash
    npm run dev
    ```
    The app will naturally open at `http://localhost:5173`.

## 🎨 UI Design System

*   **Color Palette:** Professional deep blues/slates for dashboard feel, with distinct Red/Orange/Green semaphores for risk levels.
*   **Typography:** Modern sans-serif (Inter/Geist) for clarity.
*   **Responsiveness:** Fully adaptive layout for desktop and tablet usage.

## 🔌 API Integration

The frontend communicates with the backend via:
*   `POST /api/analyze`: To send record data for processing.
*   `GET /api/health`: To verify system connectivity.
