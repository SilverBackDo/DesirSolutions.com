# Desir Solutions Website

Production-ready React + Vite marketing site for Desir Solutions LLC.

## Stack

- React 19
- Vite 8
- Tailwind CSS 4
- NGINX container for production serving

## Pages

- Home
- Assessment Offer
- Services
- About
- Trust
- Contact

## Local development

```bash
npm install
npm run dev
```

Default local URL: `http://localhost:5173`

## Production build

```bash
npm run build
```

## Docker

```bash
docker compose up --build
```

Default container URL: `http://localhost:8080`

## Contact endpoint

The contact form posts to `VITE_CONTACT_ENDPOINT`, defaulting to `/api/contact`.
Use `.env.example` as the local reference file.
