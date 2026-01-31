# Synthetic Identity Detection Backend

This is the backend API for the Synthetic Identity Detection application. It provides a robust engine for analyzing user identity records to detect potential fraud, specifically focusing on "synthetic identities"—fake identities created by combining real and fake information.

## 🚀 Overview

The backend is built with **Node.js** and **Express.js** and follows a modular **MVC (Model-View-Controller)** architecture. It processes identity records (either in batches or individually) and cross-references them against a database of known legitimate users to identify anomalies and high-risk patterns.

## 🛠 Features & Detection Rules

The core of the system is the `DetectionEngine`, which now implements **8 advanced detection layers**:

### 1. 🧠 Name Entropy & Anomaly Detection
*   **Logic:** Calculates Shannon Entropy of the name string.
*   **Trigger:** Flags names that are too random (high entropy, e.g., "Xqkzjwvy") or too repetitive (low entropy, e.g., "aaaaaaa").
*   **Why:** Detects bot-generated random names or lazy fraudster inputs.

### 2. 📧 Email Risk Assessment
*   **Logic:** Checks email domain and structure.
*   **Trigger:** Flags **Disposable Domains** (e.g., `tempmail.com`), **Plus Addressing** (`user+tag@...`), or **Excessive Dots** (`u.s.e.r@...`).
*   **Why:** Fraudsters use these techniques to bypass "unique email" constraints without managing real accounts.

### 3. 📅 Document Age Validation
*   **Logic:** Cross-references `dob` (Date of Birth) with `docIssueDate`.
*   **Trigger:** Flags if the document was issued *before* the user was born or at an impossible young age.
*   **Why:** Catches chronological inconsistencies common in synthetic IDs constructed from mismatched data fragments.

### 4. 📱 Phone Velocity Check
*   **Logic:** Tracks how many distinct identities (`userIds`) share the same phone number.
*   **Trigger:** **High Warning** if > 2 identities share a number.
*   **Why:** A single phone number associated with multiple identities is a strong indicator of an organized ring.

### 5. 🕸️ Network Density (IP/Device Clustering)
*   **Logic:** Analyzes the density of identities sharing a precise `IP` + `DeviceID` combination.
*   **Trigger:** **Critical Warning** if multiple identities stem from the exact same device signature.
*   **Why:** Highly indicative of a "fraud farm" or botnet operation.

### 6. 🎭 Face Pattern Matching
*   **Logic:** Compares the user's facial embedding vector against a blacklist of known fraud embeddings using Cosine Similarity.
*   **Trigger:** **Critical Warning** if similarity > 0.9.
*   **Why:** Prevents known bad actors from re-registering under new names.

### 7. 🎂 Age Mismatch Detection (Visual vs. Data)
*   **Logic:** Compares the user's provided DOB with their estimated `faceAge` from biometric analysis.
*   **Trigger:** If the variance exceeds ±5 years.
*   **Why:** Synthetic identities often use stolen real DOBs that don't match the fraudster's actual appearance.

### 8. 🤖 Behavioral Pattern Analysis
*   **Logic:** Monitor's form completion time (`formTime`).
*   **Trigger:** If completion time is impossible for a human (< 2 seconds).
*   **Why:** Flag's automated scripts/bots.

---

## 🏗 Architecture

The codebase is refactored into a clean, maintainable structure:

*   **`server.js`**: Application entry point with security middleware (CORS, Helmet).
*   **`routes/`**: API endpoint definitions.
*   **`controllers/`**: Request orchestration and validation.
*   **`services/`**: 
    *   `detectionEngine.js`: The "Brain" containing all 8 detailed algorithms and scoring logic.
*   **`data/`**: Reference data sources.
*   **`demo/`**: Sandbox for testing and demonstration (contains usage scripts).

## 🔌 API Endpoints

### 1. Analyze Records
**POST** `/api/analyze`

Analyzes user data for synthetic fraud.

**Input Format (Single Record):**
```json
{
  "record": {
    "name": "John Doe",
    "dob": "1990-01-01",
    "email": "john@example.com",
    "phone": "555-0199",
    "faceAge": 33,
    "deviceId": "uuid-v4-hash",
    "ip": "192.168.1.1",
    "formTime": 5000,
    "userId": "NEW_USER_123",
    "docIssueDate": "2015-06-20",
    "faceEmbedding": [0.1, 0.2, ...]
  }
}
```

**Response:**
Returns a `riskScore` (0-100), `isSynthetic` (boolean), and a detailed list of triggered `rules`.

### 2. Health Check
**GET** `/api/health`
Returns system status.

## 🧪 Demo & Usage

We have included a built-in demo script to showcase the detection capabilities.

1.  **Run the Demo:**
    This script reads test cases from `demo/input/test_cases.json` covering various fraud scenarios, processes them through the engine, and outputs the results.

    ```bash
    npm run demo
    # OR
    node demo/run_demo.js
    ```

2.  **View Results:**
    *   **Console:** Real-time analysis logs.
    *   **JSON:** `demo/output/results.json`
    *   **Summary:** `demo/output/summary.txt`

## ⚙️ Setup & Installation

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Run Development Server:**
    ```bash
    npm run dev
    # Runs on http://localhost:3001
    ```
