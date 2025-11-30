# GPTShare Server (NestJS scaffold)

This folder contains a minimal NestJS scaffold for the GPTShare backend. It provides two small modules:

- `summary` — text summarization endpoint using OpenRouter TypeScript SDK (official SDK: `@openrouter/sdk`).
- `shares` — create/list/get share links with simple file-based persistence under `server/data/`.

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set your OpenRouter API key (optional; falls back to local summarizer if not set):
   ```bash
   export OPENROUTER_API_KEY="sk_..."
   ```

3. Build:
   ```bash
   npm run build
   ```

4. Run:
   ```bash
   npm start          # production build
   npm run start:dev  # dev mode with hot reload
   ```

## API Endpoints

### POST /summary
Summarizes text using OpenRouter or falls back to local summarizer.

**Request:**
```json
{
  "text": "Your text here...",
  "options": {
    "model": "gpt-4o-mini",        // optional
    "maxTokens": 180,               // optional
    "temperature": 0.2              // optional
  }
}
```

**Response:**
```json
{
  "summary": "Concise summary of the text..."
}
```

### POST /shares
Create a new share.

**Request:**
```json
{
  "title": "Share title",
  "summary": "Pre-generated summary",
  "selectionIds": ["id1", "id2"],
  "fullConversationText": "Full conversation text"
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "...",
  "summary": "...",
  "selectionIds": [...],
  "fullConversationText": "...",
  "createdAt": "2025-11-07T..."
}
```

### GET /shares
List all shares.

**Response:**
```json
[
  { share objects... }
]
```

### GET /shares/:id
Get a specific share by ID.

## OpenRouter Integration

The `SummaryService` uses the official OpenRouter TypeScript SDK (`@openrouter/sdk`):

- **SDK Docs**: https://openrouter.ai/docs/sdks/typescript/completions
- **API Call**: `openRouter.completions.generate({ prompt, model, maxTokens, temperature })`
- **Environment Variable**: `OPENROUTER_API_KEY`

If no API key is set or the API call fails, the service falls back to a simple local summarizer (first 2 sentences or first 240 chars).

## Production Notes

For production deployment, consider:
- Add input validation using class-validator and NestJS DTOs
- Switch to a proper database (PostgreSQL + TypeORM, MongoDB, etc.)
- Add authentication & authorization
- Add rate limiting
- Add structured logging
- Set up monitoring and error tracking
- Secure API key management with secrets manager

