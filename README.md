# Birdly UI

Birdly identifies a bird species from a square crop of an uploaded photograph. The browser creates the crop. The application sends only the generated crop to the Birdly API.

## Local development

Requirements:

- Node.js 20.9 or later
- npm

Copy `.env.example` to `.env.local`. Set `NEXT_PUBLIC_BIRDLY_API_URL` to the public base URL of the Birdly API. Do not add `/predict` to the value.

Then run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Checks

```bash
npm run format
npm run lint
npm run typecheck
npm test
npm run build
```

## Vercel deployment

1. Import this repository into Vercel.
2. Add `NEXT_PUBLIC_BIRDLY_API_URL` in the Vercel project environment variables.
3. Add the Vercel site origin to the Birdly API CORS allowlist.
4. Deploy the project with the default Next.js settings.

Do not store the production API URL or other secrets in this repository.
