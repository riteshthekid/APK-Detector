# APK-Detector

A Machine Learning powered Android Application (APK) Security and Malware Detection Analyzer.

## Overview
APK-Detector is a comprehensive web-application that allows users to upload `.apk` files, analyzes their permissions and intents, and utilizes a Machine Learning model to determine whether the application behaves suspiciously or contains malicious code. It gives you detailed security tips, threat cards, and lets you download a full report.

### Features
- **APK Upload & Analysis:** Seamless uploading of Android packages.
- **Machine Learning Detection:** Uses an ML model trained on malware datasets to classify APKs as Safe or Malicious.
- **Detailed Threat & Permission Analysis:** Decompiles and analyzes AndroidManifest.xml for risky permissions.
- **PDF Report Generation:** Get a comprehensive summary of the analysis to keep for your records.
- **Modern User Interface:** Built with React and Vite for a lightning-fast experience.

## Project Structure
This project is separated into a `frontend` and a `backend`:

- `frontend/`: The React web user interface.
- `backend/`: A Python-based server that handles APK extraction, static analysis, and runs the Machine Learning model.

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (for frontend)
- [Python 3](https://www.python.org/) (for backend)

### Installation

#### 1. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
pip install -r requirements.txt
```

To run the backend development server:
```bash
python main.py
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
```

To run the frontend development server:
```bash
npm run dev
```

## Technologies Used
- **Frontend:** React, Vite, TailwindCSS (or similar custom CSS)
- **Backend:** Python (FastAPI/Flask equivalent), Scikit-Learn (for ML), Androguard (typically for APK static analysis)

## Disclaimer
This tool is for educational and security analysis purposes. Always test APKs in a sandboxed environment if you suspect they contain malware.
