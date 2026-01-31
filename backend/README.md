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

## 🏗 Architecture & Data Flow

 The system is designed using a **modular MVC architecture** to separate concerns between the API layer and the business logic.

### **1. Request Lifecycle**
When a request hits the system (e.g., `POST /api/analyze`), it follows this path:

1.  **Entry (`server.js`)**: The request is intercepted by middleware (Helmet for headers, CORS, JSON parsing) before being routed.
2.  **Routing (`routes/detectionRoutes.js`)**: The router directs the request to the specific controller method.
3.  **Controller (`controllers/detectionController.js`)**: 
    *   Validates input integrity (checks for required fields like `dob`, `email`, `deviceId`).
    *   Instantiates the `DetectionEngine`.
    *   Orchestrates the analysis by passing the input data and the reference dataset (Legitimate Users) to the engine.
    *   Formats the final JSON response with scores and headers.
4.  **Service (`services/detectionEngine.js`)**:
    *   This is the "brain" of the operation.
    *   **Rule Execution**: Iterates through all 8 risk rules for the record.
    *   **Scoring**: Aggregates weights from triggered rules (e.g., Critical = 60pts, High = 40pts).
    *   **Decision**: Marks identity as `isSynthetic` if the score checks out (>70) or critical rules are met.
5.  **Reference Data (`data/legitimateUsers.json`)**: Static JSON database used to check for data collisions (e.g., is this phone number already used by User A, B, and C?).

### **2. Component Breakdown**

*   **`DetectionEngine` Class**:
    *   *State*: Maintains `correlationMap` for rapid lookup of email/phone frequencies.
    *   *Methods*: Modular methods for each rule (e.g., `calculateNameEntropy`, `checkNetworkDensity`) make it easy tounit test or add new rules.
    *   *Vector Analysis*: Includes basic cosine similarity math for vector comparison of face embeddings.

*   **REST API Design**:
    *   Stateless architecture.
    *   Standard HTTP status codes (200 for success, 400 for bad input, 500 for server error).

### **3. Data Flow Diagram (Conceptual)**

```
Client (Frontend/Script) 
       ⬇️ JSON Payload
[ API Endpoint /analyze ]
       ⬇️
[ Controller Validation ] ❌ Reject Malformed
       ⬇️
[ Detection Engine ] 
       First Pass:
       ├── 1. Entropy & Format Checks (Name, Email)
       ├── 2. Logic Checks (Age vs Doc Date)
       ├── 3. Biometric Checks (Face Vectors)
       ⬇️
       Second Pass (Context Awareness):
       ├── 4. Velocity Check (vs Global DB)
       ├── 5. Network Density Check (vs Batch/Global)
       ⬇️
[ Scoring System ] ➡️ Sum Weights
       ⬇️
Response { "riskScore": 85, "isSynthetic": true }
```

## 🌍 Real World Impact

Integrating this **Detection Engine** into a financial or service platform addresses critical security challenges:

### **1. Financial Loss Prevention (Bank/Fintech)**
*   **Problem**: Fraudsters create synthetic identities to build credit scores over years before "busting out" (maxing out limits and vanishing).
*   **Solution**: By checking **Phone Velocity**, **Document Age**, and **Network Density** at the *onboarding* stage, we prevent these sleeper accounts from ever being created.
*   **Impact**: Potentially saves millions in bad debt write-offs.

### **2. Platform Integrity (Gig Economy/Social)**
*   **Problem**: Bot farms create thousands of fake driver/host/user accounts to manipulate ratings or abuse referral bonuses.
*   **Solution**: **Face Matching** (1:N search) and **Name Entropy** checks ensure that one human = one account, regardless of how many emails they generate.
*   **Impact**: Preserves trust in marketplace ecosystems (e.g., stopping fake Uber drivers or Airbnb hosts).

### **3. Regulatory Compliance (KYC/AML)**
*   **Problem**: Banks must adhere to "Know Your Customer" laws. Onboarding a fake person is a compliance violation.
*   **Solution**: **Document Validation** (DOB vs Issue Date) and **Age Mismatch** (Bio-age vs Stated Age) act as automated sanity checks before manual review.
*   **Impact**: Reduces risk of heavy regulatory fines.

### **4. Operational Efficiency**
*   **Problem**: Manual review teams are overwhelmed by false positives.
*   **Solution**: The **Risk Score (0-100)** allows for tiered automation: 
    *   *Low Risk (<20)*: Auto-approve.
    *   *Medium Risk (20-70)*: Step-up auth (OTP/Selfie).
    *   *High Risk (>70)*: Manual review/Block.
*   **Impact**: Reduces manual review volume by up to 80%.

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
