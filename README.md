# PolyGlot 🌍

PolyGlot is a simple AI-powered translation web application that translates user input into multiple languages using an OpenAI-compatible API.

## Features

- Translate text into:
  - 🇫🇷 French
  - 🇯🇵 Japanese
  - 🇪🇸 Spanish

- Fast and responsive interface
- AI-powered translations
- Express backend with OpenAI-compatible API integration
- Vite-powered frontend

## Tech Stack

### Frontend

- HTML
- CSS
- JavaScript
- Vite

### Backend

- Node.js
- Express.js
- OpenAI SDK

## Project Structure

```text
PolyGlot/
├── client/
│   ├── public/
│   │   └── assets/
│   ├── src/
│   ├── index.html
│   └── vite.config.js
│
├── server/
│   └── server.js
│
├── dist/
├── package.json
└── .env
```

## Installation

Clone the repository:

```bash
git clone <repository-url>
cd PolyGlot
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root:

```env
AI_URL=your_api_url
AI_KEY=your_api_key
AI_MODEL=your_model_name
```

## Running Locally

Start the development environment:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:3001
```
