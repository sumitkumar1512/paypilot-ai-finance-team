# PayPilot — Your AI Finance Team

PayPilot is a full-stack finance command center for small businesses and D2C operators. It converts payment data into concrete answers: what changed in revenue, which payments are failing, who owes money, and what action to take next.

## Features

- Revenue dashboard with a Recharts trend visualisation
- Realistic seeded INR transactions across UPI, Cards and Net Banking
- Payment-health analysis by method with anomaly detection and estimated impact
- Receivables dashboard plus AI-generated payment reminders
- Ask PayPilot: tool-backed finance answers (`getRevenue`, `getFailedPayments`, `getReceivables`, `getCashPosition`, `getCustomers`)
- JWT login (demo account works out of the box)
- MongoDB data models ready for production persistence
- Razorpay Test Mode order creation and signature verification, with safe demo fallback if keys are absent

## Run locally

```bash
npm run install:all
cp .env.example .env
npm run dev
```

Open `http://localhost:5173` and sign in with:

```text
sumit@paypilot.demo
demo123
```

## Razorpay Test Mode

Create a Razorpay Test Mode account, then add these values to `.env`:

```text
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```

The API creates orders only on the server at `POST /api/payments/order`. In the absence of keys, it returns a labelled safe demo order so the hackathon demo stays functional.

## Deploy

Deploy the `client` as a static Vite build (`npm run build --prefix client`) and deploy `server` as a Node service (`npm run start --prefix server`). Set `CLIENT_URL`, `JWT_SECRET`, `MONGO_URI`, and Razorpay test keys in the deployment environment. Point the frontend `/api` proxy (or a production `VITE_API_URL` configuration) to the server service.

## Architecture

```text
React + Vite + Recharts  →  Express API  →  tool-backed finance analysis
                                      ↘  MongoDB models / Razorpay Test Mode
```
