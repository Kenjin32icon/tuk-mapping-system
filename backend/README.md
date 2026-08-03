# TUK Mapping System Backend

> 🔙 **[Back to Main Project README](../README.md)**

This is the Node.js (Express) backend for the TUK Skills Mapping System. It handles database connections (MongoDB/Firebase), processes data mapping with AI APIs (Groq/Ollama), and serves the API for the frontend.

## 🔑 Environment Variables Setup

The backend requires several environment variables to function correctly, particularly API keys for cloud services.

### 1. Create a `.env` file
Copy the provided `.env.example` file and rename it to `.env`:
```bash
cp .env.example .env
```

### 2. Getting a Groq API Key
The system uses the Groq API (which runs LLaMA models quickly) to parse and map skills intelligently. You need a free Groq API key:

1. **Create an Account:** Go to the [GroqCloud Console](https://console.groq.com/login) and sign up for a free account.
2. **Navigate to API Keys:** Once logged in, click on "API Keys" in the left sidebar.
3. **Create Key:** Click the "Create API Key" button.
4. **Copy the Key:** Copy the generated key (it usually starts with `gsk_...`).
5. **Add to `.env`:** Open your `.env` file and replace the `GROQ_API_KEY` placeholder with your actual key:
   ```env
   GROQ_API_KEY=gsk_your_actual_key_here
   ```

### 3. Other Required Variables
You will also need to configure:
- `MONGODB_URI`: Your MongoDB connection string.
- `FIREBASE_SERVICE_ACCOUNT`: A JSON string of your Firebase service account credentials for authentication.
- `GOOGLE_SHEETS_KEY`: If using the Google Sheets integration.
- `PORT`: Usually defaults to `5000`.
- `FRONTEND_URL`: URL of the running frontend, usually `http://localhost:5173`.

> **Note:** Never commit your actual `.env` file to version control. The repository ignores `.env` by default.

## 🚀 Running the Backend

```bash
# Install dependencies
npm install

# Start the server (development mode)
npm run dev
```

The server should start on the specified `PORT` (e.g., `http://localhost:5000`).
