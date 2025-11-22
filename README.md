# E-निरीक्षण
> **Government Procurement Transparency Platform**

**E-निरीक्षण** (also known as E-Nirikshan) is a comprehensive platform designed to enhance transparency and accountability in government procurement projects in Nepal. It empowers citizens to track project progress, submit reviews with photographic evidence, and access detailed procurement information, while providing government officials with real-time analytics and oversight tools.

## 🏗️ Architecture

The platform consists of three main components:

1.  **Backend API (`/backend`)**: A robust FastAPI-based server that handles data management, user authentication, and core business logic. It uses PostgreSQL for data persistence.
2.  **Mobile Application (`/CMDTransparencyApp`)**: A React Native Expo mobile app for citizens to browse projects, view details, and submit reports.
3.  **RAG AI System (`/rag`)**: A Retrieval-Augmented Generation system powered by OpenAI and ChromaDB to provide an intelligent chatbot assistant ("E-maan") that answers queries about government procedures and laws.

## 🚀 Quick Start Guide

### Prerequisites
- **Python** 3.8+
- **Node.js** 16+ & **npm**
- **PostgreSQL** 12+
- **Expo CLI** (`npm install -g @expo/cli`)
- **OpenAI API Key** (for RAG features)

### 1. Backend Setup
Navigate to the `backend` directory and follow the [Backend README](backend/README.md) for detailed instructions.

```bash
cd backend
python -m venv venv
# Activate venv (Windows: venv\Scripts\activate, Mac/Linux: source venv/bin/activate)
pip install -r requirements.txt
# Configure .env (see backend/README.md)
python migrate_database.py # Run migrations
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. RAG System Setup
The RAG system provides the AI chatbot functionality.

```bash
cd rag
pip install -r requirements.txt
# Create .env with RAG_KEY=your_openai_api_key
python -m uvicorn api:app --reload --port 8090 --host 0.0.0.0
```

### 3. Mobile App Setup
Navigate to the `CMDTransparencyApp` directory and follow the [Mobile App README](CMDTransparencyApp/README.md).

```bash
cd CMDTransparencyApp
npm install
# Update API URLs in src/services/apiClient.ts if needed
npm start
```

## 📂 Project Structure

```
Arison/
├── backend/                # FastAPI Backend Application
│   ├── app/                # Application source code
│   ├── uploads/            # User uploaded content
│   └── ...
├── CMDTransparencyApp/     # React Native 
│   └── ...
├── rag/                    # RAG AI System
│   ├── chroma_db/          # Vector database storage
│   ├── pdfs/               # Source documents for RAG
│   └── api.py              # RAG API entry point
└── README.md               # This file
```

## ✨ Key Features

-   **Project Tracking**: Real-time monitoring of government projects (status, budget, timeline).
-   **Citizen Reporting**: Submit reviews with photos and geolocation to report issues or verify progress.
-   **AI Assistant (E-maan)**: Voice-enabled chatbot to answer questions about laws and procedures in Nepali/English.
-   **Data Visualization**: Interactive charts and maps for transparency metrics.
-   **Bilingual Support**: Designed for Nepali citizens with local language support.

## 🤝 Contributing

Contributions are welcome! Please see the individual `README.md` files in each directory for specific contribution guidelines.

## 📄 License

[MIT License](LICENSE)