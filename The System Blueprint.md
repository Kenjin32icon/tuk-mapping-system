# The System Blueprint (Copy & Paste this into a document)

    Project Title: TU-K Talent Pipeline & AI Career Mapping System

    1. Technology Stack

        Frontend: React.js (Vite), Tailwind CSS, Recharts (Data Visualization), HTML2PDF. Hosted on Vercel.

        Backend: Node.js, Express.js. Hosted on Render.

        Database: MongoDB Atlas (NoSQL) - Chosen for its flexibility with nested JSON objects.

        Authentication & Security: Firebase Auth (Google OAuth), Role-Based Access Control (RBAC) via custom MongoDB middleware.

        AI Processing Core: Groq SDK (Llama-3.3-70b-versatile model).

    2. System Architecture & File Structure
    The system utilizes a modular, decoupled architecture. The frontend isolates user roles to prevent unauthorized access:

        /shared/: Authentication, Navigation, and Global Settings.

        /student/: Onboarding workflows, File Uploads, AI Portfolio Generation.

        /admin/: Institutional Control Center, Global Student Directory, Automated Job Matching.

    3. Data Pipeline & Processing Workflows

        Ingestion: User uploads raw PDF/DOCX files. Multer handles the multipart form data, while pdf-parse and mammoth extract the raw text.

        Transformation: Raw text is injected into a highly engineered LLM prompt. The AI acts as a Career Strategist, converting unstructured text into a structured, standardized JSON schema.

        Materialized State (SSOT): To ensure data consistency across the Admin portal, the system consolidates multiple document analyses into a single "Single Source of Truth" (masterProfile) saved directly to the User's database document.

        Outreach: The Admin Job Matching workflow queries this materialized state, ranks candidates using AI, and utilizes Nodemailer to automatically dispatch interview invitations.