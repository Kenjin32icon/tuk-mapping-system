# TUK Mapping System 🎓💼
> **MVP for 4th Year Innovation Project B**

## 📌 Project Title
**Develop an Intelligent Mapping System that translates University Acquired Skills into Marketable Service Offerings: A Case Study of The Technical University of Kenya (TUK).**

---

## 📖 Overview
The **TUK Mapping System** is designed to bridge the gap between academic theory and industry demand. Many students graduate with a wealth of knowledge but struggle to "package" those skills into services that clients or employers understand. 

This system uses intelligent mapping to analyze a student's coursework and projects, outputting a professional portfolio dashboard of **Marketable Service Offerings**.

### Core Objectives:
* **Skill Extraction:** Identify core competencies from TUK course units.
* **Market Translation:** Convert academic jargon into industry-standard service descriptions (e.g., "Database Systems" → "SQL Database Management & Optimization").
* **Gap Analysis:** Suggest trending industry skills based on the user's current trajectory.

---

## 🛠 Tech Stack (Suggested)
* **Frontend:** React.js 
* **Backend:** Node.js(Express js)
* **Database:** PostgreSQL / MongoDB
* **AI/ML:** Ollama Model:- llama3.2:1b LLM (for semantic mapping of skills)

---

## 🚀 Key Features (MVP)
1.  **Student Profile Portal:** Users input their completed course units and grades.
2.  **Mapping Engine:** The core algorithm that matches TUK curriculum data with real-world job market data.
3.  **Service Portfolio Generator:** Generates a downloadable "Service Catalog" the student can use for freelancing or job hunting.
4.  **Admin Dashboard:** For faculty to update curriculum data and track student skill trends.

---

## 🌐 Live Demo
> **[View the TUK Mapping System Live](https://tuk-mapping-system-frontend.vercel.app/)**

> [!WARNING]
> This application relies on cloud databases and external AI APIs. It **only works with an active internet connection**.

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/Kenjin32icon/tuk-mapping-system.git
cd tuk-mapping-system
```

### 2. Set Up the Backend
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```
Configure your environment variables as described in the [Backend README](./backend/README.md), then start the server:
```bash
npm run dev
```

### 3. Set Up the Frontend
Open a new terminal, navigate to the frontend directory, and install dependencies:
```bash
cd frontend
npm install
```
Start the frontend development server:
```bash
npm run dev
```

For more specific details on the frontend, refer to the [Frontend README](./frontend/README.md).

---

## 📂 Project Structure
```text
├── data/               # TUK Curriculum datasets & skill taxonomies
├── src/                # Source code
│   ├── backend/        # API and Mapping logic
│   └── frontend/       # User Interface
├── docs/               # Project B Documentation & Reports
└── README.md
```

---

## 📝 License
This project is part of the academic requirements for the Technical University of Kenya. All rights reserved.

---
