# UrbanThreads × Gameball — Integration Demo

A fictional clothing store mockup built to demonstrate a full end-to-end Gameball loyalty integration. The app covers customer registration, behavioral events, order earning, points redemption, and a live profile page — all wired to Gameball's v4.0 REST API.

> **This is a demo application.** It requires a Gameball account and API credentials to be functional. Without them the UI will load but no loyalty features will work.

---

## What This Demo Covers

- **Customer Registration** — signing up registers the customer in Gameball via `POST /customers`
- **Events** — profile completion and product reviews fire `POST /events` with metadata
- **Checkout** — live points preview via `POST /orders/cashback`, redemption rules loaded from `GET /configurations/redemption`, coupon generation via `POST /coupons/predefined`
- **Order Tracking** — placing an order calls `POST /orders` and awards real points
- **Profile Page** — balance, VIP tier progress, and badges fetched live from Gameball APIs

---

## Prerequisites

1. **A Gameball account** — sign up at [app.gameball.co](https://app.gameball.co)
2. **API credentials** — found in your Gameball dashboard under Settings → API Keys
3. **Node.js 18+** — [nodejs.org](https://nodejs.org)

---

## Setup

**1. Clone the repository**
```bash
git clone https://github.com/ReemAbdelghany/urbanthreads.git
cd urbanthreads/clothing-app_urbanthreads
```

**2. Install dependencies**
```bash
npm install
```

**3. Configure environment variables**

Create a `.env` file in the `clothing-app_urbanthreads` directory:
```bash
cp .env.example .env
```

Or create it manually and add the following:
```env
VITE_GB_API_KEY=your_gameball_api_key_here
VITE_GB_SECRET_KEY=your_gameball_secret_key_here
VITE_GB_BASE_URL=https://api.gameball.co/api/v4.0/integrations
```

Replace `your_gameball_api_key_here` and `your_gameball_secret_key_here` with your credentials from the Gameball dashboard.

> **Use your Test environment keys during development** — never point a development or staging setup at your live keys. Test keys are clearly labelled in the Gameball dashboard under Settings → API Keys.

**4. Run the app**
```bash
npm run dev
```

**5. Open in browser**
```
http://localhost:5173
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `VITE_GB_API_KEY` | Yes | Your Gameball API key. Used for customer registration, events, and cashback previews. |
| `VITE_GB_SECRET_KEY` | Yes | Your Gameball Secret key. Used for order tracking, balance reads, and coupon generation. Never expose this in a production frontend. |
| `VITE_GB_BASE_URL` | Yes | Gameball API base URL. Set to `https://api.gameball.co/api/v4.0/integrations`. |

---

## Gameball Dashboard Setup

For the full demo to work end-to-end you will also need:

- **A cashback rule configured** — go to Programs → Cashback in your Gameball dashboard and set a points-per-dollar earning rate. Without this, `POST /orders` will return `rewardedPoints: 0`.
- **At least one active redemption rule** — go to Programs → Redemption to create a rule. Without this the "Redeem Your Points" section at checkout will be empty.
- **Reward Campaigns for events** (optional) — to award points for `profile_completed` and `write_review` events, create Reward Campaigns in the dashboard tied to those event names.

---

## Project Structure
```
clothing-app_urbanthreads/
├── src/
│   ├── api/
│   │   └── gameball.js        # All Gameball API calls
│   ├── pages/
│   │   ├── CheckoutPage.jsx   # Earning + redemption flow
│   │   ├── ProfilePage.jsx    # Balance, tier, badges
│   │   ├── ProductPage.jsx    # Cashback preview + review event
│   │   └── ...
│   ├── components/
│   └── data/                  # Static mock data
├── .env                       # Your credentials (not committed)
└── vite.config.js
```

---

## Resources

- [Gameball API Documentation](https://developer.gameball.co)
- [Integration Notes](https://github.com/ReemAbdelghany/urbanthreads/blob/main/clothing-app_urbanthreads/INTEGRATION.md) — full explanation of every API used, assumptions, and production recommendations
- [Bruno Collection](./gameball/) — API test collection you can import to test every endpoint in isolation before running the app
