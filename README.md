# bolt.diy

AI-powered code editor with web and Android clients.

[![Build Android APK](https://github.com/aksri648/boltx/actions/workflows/android-build.yml/badge.svg)](https://github.com/aksri648/boltx/actions/workflows/android-build.yml)

## Project Structure

- **`frontend/`** — React + Vite web application
- **`mobile-frontend/`** — Capacitor-powered Android application (React + Vite + Tailwind + Zustand)
- **`backend/`** — Express.js API server

## Android Build

Push a tag to trigger the APK build and release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The workflow builds a debug APK (auto-signed with the default debug keystore) and uploads it as a GitHub release artifact.
