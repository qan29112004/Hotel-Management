# Voucher & Coupon Flow

This backend exposes a complete voucher life-cycle. Use the endpoints under `api/voucher/*`:

- `POST /api/voucher/` – admin creates a voucher (requires staff token).
- `PATCH /api/voucher/<uuid>/` – admin updates voucher settings, including hotel scope and limits.
- `POST /api/voucher/list/` – admin lists vouchers with Querykit filters.
- `POST /api/voucher/claim/` – customer claims a voucher by `code`.
- `GET /api/voucher/my/` – customer sees claimed vouchers plus remaining quota.
- `POST /api/voucher/preview/` – preview discount before checkout (`code`, `order_total`, optional `hotel_id`).
- `POST /api/voucher/redeem/` – apply voucher to a booking (`booking_uuid` required).
- `POST /api/voucher/revert/` – undo a voucher when booking is cancelled.

### Validation sequence
1. Voucher status & campaign window (`start_at`, `expire_at`, `relative_expiry_hours` per claim).
2. Global/user usage counters and hotel scoping.
3. Minimum order value and discount computation (fixed or percent with optional cap).
4. Atomic update: booking saved, claim usage incremented, usage log captured.

### Manual test recipe
1. Create a voucher, e.g. `code=NOEL50`, `discount_type=PERCENT`, `discount_percent=10`, `max_usage_per_user=2`, `relative_expiry_hours=72`.
2. As a normal user, call `claim/` then `my/` to confirm expiry time and usage counter.
3. Use `preview/` with an order total above `min_order_value` to see the discount.
4. Call `redeem/` with an existing `booking_uuid` to lock the voucher to that booking.
5. Cancel the booking via your normal flow, then hit `revert/` to return usage counts.
6. Repeat redeem until hitting `max_usage_per_user` or `max_usage_global` to ensure limits are enforced.

All responses follow `libs.response_handle.AppResponse`, so success payloads live under `data.data`. Use these checks while grading or demoing the graduation project.

