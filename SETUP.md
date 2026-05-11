# ⚙️ SportoTrack Setup Guide

This guide explains how to run SportoTrack locally on your system.

---

# 📋 Prerequisites

Make sure the following are installed:

* Node.js
* npm
* MongoDB Atlas account
* Git

---

# 📥 Clone Repository

```bash
git clone https://github.com/Chaitanss/Sporto_Track.git
cd Sporto_Track
```

---

# 🚀 Frontend Setup

## Navigate to Client Folder

```bash
cd client
```

## Install Dependencies

```bash
npm install
```

## Run Frontend

```bash
npm run dev
```

Frontend runs on:

```bash
http://localhost:5173
```

---

# ⚡ Backend Setup

## Navigate to Server Folder

```bash
cd server
```

## Install Dependencies

```bash
npm install
```

---

# 🔑 Environment Variables

Create a `.env` file inside the `server` directory.

Add:

```env
PORT=5000
MONGO_URL=your_mongodb_connection
JWT_SECRET=your_secret_key
GROQ_API_KEY=your_groq_api_key
```

---

# ▶️ Run Backend

```bash
npm start
```

Backend runs on:

```bash
http://localhost:5000
```

---

# 🌐 Deployment

## Frontend Deployment

* Platform: Vercel

## Backend Deployment

* Platform: Render

## Database

* MongoDB Atlas

---

# 🛠️ Common Commands

## Install Dependencies

```bash
npm install
```

## Start Backend

```bash
npm start
```

## Run Frontend

```bash
npm run dev
```

---

# 📌 Notes

* Ensure MongoDB Atlas IP access is enabled.
* Configure all environment variables correctly.
* Use production backend URL when deploying frontend.

---

# ✅ Project Status

SportoTrack is actively maintained and continuously improved with new AI-powered features and analytics modules.
