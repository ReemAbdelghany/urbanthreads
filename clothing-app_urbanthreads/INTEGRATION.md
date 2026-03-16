# UrbanThreads × Gameball — Integration Notes

## Overview

UrbanThreads is a fictional clothing e-commerce store built as a React + Vite mockup
to demonstrate a complete Gameball loyalty integration. The app covers the full customer
lifecycle: registration, behavioral events, checkout with point earning and redemption,
and a profile page showing balance, VIP tier, and badge progress — all powered by
Gameball's v4.0 REST API.

---

## APIs Used & Why

### Phase 1 — Customer Registration

**`POST /api/v4.0/integrations/customers`** · `apikey` only

Called immediately when the user submits the sign-up form. Registers the customer in
Gameball with a `customerId` derived deterministically from their email address, plus a
full `customerAttributes` object — `firstName`, `lastName`, `email`, `mobile`,
`joinDate`, and `source`. The endpoint is idempotent: calling it again with the same
`customerId` updates the profile rather than creating a duplicate. The response returns
a `gameballId` (Gameball's internal identifier) which we check to confirm the
registration succeeded.

> **Auth note:** This endpoint requires only the `apikey` header. The `secretkey` is
> not needed for customer creation.

---

### Phase 2 — Behavioral Events

**`POST /api/v4.0/integrations/events`** · `apikey` only

Used for two distinct events:

**`profile_completed`** — fired when the user fills in and saves their full profile
details from the profile page. The event metadata includes `display_name`, `email`,
`phone`, `date_of_birth`, `address`, `fields_filled`, and `completion_percentage`.
This allows a Reward Campaign in the Gameball dashboard to trigger on this event and
award bonus points for completing the profile.

**`write_review`** — fired when the user submits a product review. The metadata
includes `product_id`, `product_name`, `rating`, `review_text`, `has_image` (boolean),
`review_type` (`text_only` or `with_image`), and `platform`. The `has_image` and
`review_type` fields are what distinguish a photo review from a text review, allowing
separate Reward Campaigns to reward them differently — for example, awarding more
points for a review that includes a customer photo.

> **Important:** Events alone do not award points. They record customer behavior and
> feed into Reward Campaigns configured in the Gameball dashboard. A campaign must be
> active and tied to the event name for points to flow.

---

### Phase 3 — Checkout Flow

**`GET /api/v4.0/integrations/customers/{customerId}/balance`** · `apikey + secretkey`

Called when the checkout page mounts to fetch the customer's current points balance.
The response provides `avaliablePointsBalance` (note: this field name contains a typo
in the API response — the second 'a' in "available" is missing), `pendingPoints`, and
`totalEarnedPoints`. We display the available balance and the monetary equivalent so the
customer knows what they can spend before deciding whether to redeem.

**`GET /api/v4.0/integrations/configurations/redemption?customerId={id}`** · `apikey` only

Called in parallel with the balance fetch to load the active redemption rules configured
in the Gameball dashboard. Passing `customerId` as a query parameter ensures the rules
returned are personalized — filtered by the customer's tier, segment, and RFM profile.
Each rule includes `id`, `pointsToRedeem`, `coupon.couponType`, `coupon.discountValue`,
and display options. The UI renders these rules as selectable buttons so the customer
sees their available redemption options dynamically, with no hardcoded values in the app.

**`POST /api/v4.0/integrations/orders/cashback`** · `apikey` only

Called whenever the cart changes to preview how many points the customer will earn on
this order. Sends `totalPaid`, `totalDiscount`, `totalShipping`, and a full `lineItems`
array with `productId`, `quantity`, `price`, `sku`, `category`, and `title` per item.
Returns `totalPoints` — the estimated points to be earned. This call has no side effects
and awards no points — it is safe to call on every cart update.

**`POST /api/v4.0/integrations/coupons/predefined`** · `apikey + secretkey`

Called only when the customer explicitly selects a redemption rule. Sends `customerId`,
`ruleId` (the ID from the redemption configs response, cast to a number), `email`, and
`mobile`. The `email` and `mobile` fields are required if the account uses channel
merging — included by default. Returns a `code` string which is the coupon to apply at
checkout, along with `startDate` and `expiryDate`. Once generated, the coupon code is
stored in component state and passed to the Track Order call.

---

### Phase 4 — Order Placement

**`POST /api/v4.0/integrations/orders`** · `apikey + secretkey`

The most critical call in the entire integration. Called once the customer confirms
their order. This is the only call that actually awards points. The payload includes:

- `customerId` and `orderId` (a unique timestamp-based ID)
- `orderDate` (ISO 8601 timestamp)
- `totalPaid` — the actual amount paid after all discounts; this is what Gameball uses
  to calculate cashback, not `totalPrice`
- `totalPrice` — the pre-discount order value; stored for historical reference only
- `totalDiscount`, `totalShipping`, `totalTax`
- `email` and `channel` (`web`)
- `lineItems` — full array matching the cashback preview payload
- `redemption.couponCodes` — populated only if a coupon was generated in Phase 3

The response includes `rewardedPoints` (actual points awarded) and `redeemedPoints`
(points consumed by the redemption). Both values are passed to the confirmation page
via React Router's `location.state` so the customer sees real numbers from the API,
not estimates.

---

### Phase 5 — Order Verification

**`GET /api/v4.0/integrations/orders/{orderId}/transactions`** · `apikey + secretkey`

Available to verify what happened after an order is placed. Returns a `transactions`
array with each transaction's `transactionType` (`PaymentReward`, `Redemption`, etc.),
`amount`, and `equivalentPoints`. In the current mockup this is implemented in the API
layer and available in the Bruno collection but not yet surfaced in the UI — in a
production app it would power an order history or loyalty activity feed.

---

### Phase 6 — Customer Profile Page

Three calls run in parallel via `Promise.all` when the profile page mounts:

**`GET /api/v4.0/integrations/customers/{customerId}/balance`** · `apikey + secretkey`

Returns the full points balance breakdown: `avaliablePointsBalance`,
`avaliablePointsValue`, `pendingPoints`, `pendingPointsValue`, `totalEarnedPoints`, and
`nextExpiringPointsDate`. Pending points are earned but held during the configured
return window and become available once that window expires.

**`GET /api/v4.0/integrations/customers/{customerId}/tier-progress`** · `apikey + secretkey`

Returns the customer's `current` tier object, `next` tier object, and their `progress`
value toward the next tier. The `next.minPorgress` field (note: another API typo — the
'r' and 'o' are transposed) contains the threshold to reach the next tier. For this
account the progress metric is USD spent, so we display it as USD rather than points.
The tier name and icon URL come directly from the response and drive the tier badge UI.

**`GET /api/v4.0/integrations/customers/{customerId}/reward-campaigns-progress`** · `apikey + secretkey`

Returns the customer's progress across all active Reward Campaigns — the source of
truth for badges and achievements. Each item includes `rewardsCampaignName`,
`completionPercentage`, `achievedCount`, `canAchieve`, and
`rewardCampaignConfiguration.icon` (a CDN URL). Badge earned state is determined by
`achievedCount > 0` — not `isUnlocked`, which only indicates the customer is eligible
to participate, not that they have completed the campaign. Progress bars are driven
directly by `completionPercentage`. No badge data is hardcoded in the application.

---

## Assumptions

1. **No database or backend** — customer session and cart are held in React state and
   reset on page refresh. The `customerId` is derived deterministically from the user's
   email address so the same customer always maps to the same Gameball record across
   sessions without a database.

2. **API keys on the frontend** — `VITE_GB_API_KEY` and `VITE_GB_SECRET_KEY` are stored
   in `.env` and accessed via `import.meta.env`. This is acceptable for a front-end
   mockup but not for production (see Production Improvements below).

3. **Single currency, single region** — all values are USD. No locale conversion or
   multi-currency handling is applied.

4. **Points redemption via coupon only** — the integration uses `POST /coupons/predefined`
   to exchange points for a coupon code, which is then passed to Track Order via
   `redemption.couponCodes`. The `pointsHoldReference` flow (holding points directly)
   is documented in the Bruno collection but not implemented in the UI.

5. **Events need dashboard campaigns** — the integration fires `profile_completed` and
   `write_review` correctly, but these events will only award points if corresponding
   Reward Campaigns are active and configured in the Gameball dashboard. The app does
   not create or manage campaigns — that is a dashboard-side responsibility.

6. **`totalPaid` drives cashback** — the integration always passes `totalPaid` (the
   post-discount amount) as the value for reward calculation, not `totalPrice`. This
   matches Gameball's documented behavior.

7. **Coupon discount estimation is client-side** — after generating a coupon, the
   discount amount shown in the UI is calculated from `rule.coupon.discountValue` and
   `rule.coupon.couponType`. The actual discount enforcement happens in your own
   checkout system when the coupon is applied.

---

## Known API Behaviour to Be Aware Of

Two field names in Gameball's API responses contain typos that differ from their
documented names. These are not bugs in the integration — they are matched intentionally
to what the API actually returns:

- `avaliablePointsBalance` and `avaliablePointsValue` — the second 'a' in "available"
  is missing. Both `ProfilePage.jsx` and `CheckoutPage.jsx` reference these fields with
  the misspelled name as returned by the API.

- `minPorgress` on the tier `next` object — the 'r' and 'o' are transposed. The
  `ProfilePage.jsx` tier progress bar and label use `minPorgress` to match the actual
  response.

Always `console.log` the raw API response before mapping any fields. Do not assume the
response field names match the documentation spelling.

---

## What I Would Do Differently in Production

**1. Move all secretkey calls to a backend service.**
The `secretkey` must never be exposed to the browser. A thin backend layer — a Next.js
route handler, an Express endpoint, or a serverless function — would proxy all calls
that require `secretkey` (balance reads, order tracking, coupon generation). The
frontend would call your own backend, which calls Gameball. The `apikey` alone can
remain accessible on the frontend for lower-sensitivity calls like event sending and
cashback previews.

**2. Use a stable, database-backed customerId.**
In this mockup the `customerId` is derived from the user's email address. In production
it should be your internal user ID — the same one used across your database. This
guarantees a stable, collision-free identifier even if the user changes their email.

**3. Add idempotency handling on Track Order.**
Use your database's order ID as the `orderId` passed to Gameball, and add server-side
deduplication so retries or network failures don't result in double point awards. If the
user clicks Place Order twice, only one `POST /orders` should reach Gameball.

**4. Implement webhook listeners for async confirmation.**
The `POST /orders` HTTP response is not guaranteed to be received by the client — the
user may close the browser before it returns. In production, subscribe to Gameball's
webhooks (`order.completed`, `reward.granted`) and update your own database when Gameball
confirms the reward. This decouples point confirmation from the HTTP response lifecycle.

**5. Classify and surface errors properly.**
The current `safeFetch` function logs errors and returns null on failure, which results
in silent fallbacks in the UI. Production code should distinguish between 4xx errors
(surface a user-facing message — insufficient points, rule not eligible, etc.) and 5xx
errors (retry with exponential backoff, alert on-call if persistent).

**6. Debounce the cashback preview.**
`POST /orders/cashback` is currently called on every cart change via a `useEffect`. In
production this should be debounced (~400ms) to avoid firing on every keystroke during
quantity updates and to reduce unnecessary API calls.

**7. Fetch redemption rules at session start, not just on checkout mount.**
In a real app, showing the customer "Earn 200 pts and get 10% off your next order"
throughout their browsing experience — on the product page, in the cart drawer, in
emails — requires having redemption rule data available earlier than the checkout page.
Fetch and cache it once after login.

**8. Handle the return window for pending points.**
Gameball holds earned points in `pendingPoints` during a configured return window. Your
UI should show both available and pending points clearly, and explain to the customer
why they cannot redeem points they just earned. Use the `cashbackConfigurations.returnWindow`
field on the Track Order payload to align Gameball's hold period with your own return
policy.

**9. COD orders.**
Do not call `POST /orders` at the time of order placement for cash-on-delivery orders.
Call it only once the order is confirmed as delivered and paid. Points awarded on a
subsequently cancelled COD order are difficult to reverse and will degrade customer trust
in the loyalty program.
