# Electron CD Packaging Guide

This guide details how to bundle the TUK Mapping System into a portable Electron app that can run directly from a CD without installation. Since a CD is a read-only medium, the application cannot install or write to its own directory. Therefore, we compile it into portable single-file executables (`.exe` for Windows, `.AppImage` for Linux).

## Step 1: Set Up the Electron Wrapper Project

Create a new directory at the root of your project called `electron-app` (or similar) to act as the Electron wrapper:

```bash
mkdir electron-app
cd electron-app
npm init -y
```

Install Electron and Electron Builder:
```bash
npm install electron --save-dev
npm install electron-builder --save-dev
```

## Step 2: Configure `package.json`

Modify the `package.json` in your `electron-app` directory. Make sure to define the `build` configuration to output portable apps:

```json
{
  "name": "tuk-mapping-system",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build:win": "electron-builder --win portable",
    "build:linux": "electron-builder --linux AppImage"
  },
  "build": {
    "appId": "com.tuk.mappingsystem",
    "win": {
      "target": ["portable"]
    },
    "linux": {
      "target": ["AppImage"]
    },
    "directories": {
      "buildResources": "assets",
      "output": "dist"
    }
  }
}
```

## Step 3: Create `main.js`

In the `electron-app` folder, create `main.js`. This script will launch the Electron browser window and load your application.

> **Important:** To bundle the frontend into this Electron app, you must build the frontend (`npm run build` in the `/frontend` directory) and copy the contents of `/frontend/dist` into the `electron-app` directory (e.g., into a folder named `frontend-dist`).

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Load the built frontend index.html
  win.loadFile(path.join(__dirname, 'frontend-dist', 'index.html'));
  
  // NOTE: If your backend needs to run locally, you will have to 
  // spawn it as a child process here, or package it into the app.
  // Since the live frontend is deployed at Vercel, it might be easier
  // to load the live URL directly if the user has internet:
  // win.loadURL('https://tuk-mapping-system-frontend.vercel.app/');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

## Step 4: Build the Portable Application

Run the build commands to generate your executables:

```bash
# Build for Windows
npm run build:win

# Build for Linux
npm run build:linux
```

This will generate `TUK-Mapping-System.exe` and `TUK-Mapping-System.AppImage` inside the `electron-app/dist` directory.

## Step 5: Preparing the CD

1. Burn the generated `TUK-Mapping-System.exe` and `TUK-Mapping-System.AppImage` files to the root of your CD.
2. Copy the `run_windows.bat` and `run_linux.sh` scripts (from `cd_scripts/`) to the root of your CD.
3. Users can now simply insert the CD and double click the respective run script (or executable directly) to start the application entirely in memory!
