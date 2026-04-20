# TUK Skills Map Frontend

This is the frontend application for the TUK Skills Map system, built using React, Vite, and Tailwind CSS.

## Overview

The application provides an interactive talent portal for students and administrators at TUK. Core functionality includes:

- Google sign-in authentication via Firebase
- Guest demo mode for exploration without an account
- Resume/document upload for skill extraction and AI-powered profile synthesis
- Master profile generation with skills, market alignment, and service recommendations
- Student dashboard for skills and portfolio insights
- Admin portal and developer panel for higher-level system access

## Project Structure

- `public/`: static assets, including the main `tuk-skills-map-logo.png` branding asset
- `src/`: application source code
  - `src/App.jsx`: main app entrypoint and route/view selection
  - `src/firebase.js`: Firebase authentication setup
  - `src/components/shared/`: shared UI components like `Navbar`, `LandingView`, and `ProfileSettings`
  - `src/components/student/`: student-facing views and modules
  - `src/components/admin/`: admin-facing dashboards and management views

## Setup

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Environment

The frontend expects a backend API URL via the `VITE_API_URL` environment variable.
If not provided, it defaults to `http://localhost:5000`.

Example `.env` file:

```env
VITE_API_URL=https://your-backend.example.com
```

## Authentication

Firebase is used for sign-in, with the config defined in `src/firebase.js`.
The frontend uses Google authentication and synchronizes the signed-in user with the backend via JWT tokens.

## Key Dependencies

- `react` / `react-dom`
- `vite`
- `tailwindcss`
- `firebase`
- `axios`
- `html2pdf.js`
- `lucide-react`
- `recharts`
- `react-hot-toast`

## Notes

- The main branding logo is stored in `public/tuk-skills-map-logo.png`.
- The home page and navigation bar are already wired to display the TUK Skills Map logo.
- If the backend API changes, update `VITE_API_URL` accordingly.

## Deployment

Deploy this app as a static frontend on Vercel, Netlify, or any static host supporting Vite builds.
Make sure the `VITE_API_URL` points to the deployed backend service.
