# Signals Webhook (for Python / Grno)

## How to see if signals are received (logs)

On the server, API logs (e.g. `pm2 logs liquidityscan-api` or Docker logs) show:

| Log message | Meaning |
|-------------|--------|
| `Webhook POST /signals/webhook — request received` | Request reached the server (connection OK). |
| `Webhook rejected: invalid or missing x-webhook-secret` | Wrong or missing secret → 401. |
| `Webhook authenticated (secret OK)` | Secret is correct, payload will be processed. |
| `Webhook result: payload coins=48, parsed (4h/1d/1w)=12, accepted=12` | 48 items in `body.signals`, 12 had 4h/1d/1w, all 12 saved. |

- **coins** = number of elements in `body.signals`.
- **parsed** = signals with timeframe 4h, 1d or 1w (1h and others are ignored).
- **accepted** = how many were actually stored.

If you see `parsed=0` or `accepted=0` but Grno sends data, check: (1) payload has `signals` array, (2) each item has `signals_by_timeframe` with keys `4h`, `1d` or `1w` (case-insensitive).

---

## Endpoint

- **URL:** `POST https://liquidityscan.io/api/signals/webhook`
- **Headers:**
  - `Content-Type: application/json`
  - `x-webhook-secret: <your secret>` — value must match `SIGNALS_WEBHOOK_SECRET` on the server (no spaces/newlines).

## Supported payload format (Grno)

**Two formats are supported:**

1. **Batch:** one request with `signals` array: `{ "signals": [ { "symbol", "price", "signals_by_timeframe" }, ... ] }`.
2. **Single-coin:** one request per coin: body = single object `{ "symbol", "price", "signals_by_timeframe", ... }` (no top-level `signals` array).

Each item (or the single object) can have `signals_by_timeframe` with timeframes `4h`, `1d`, `1w`. Signal strings containing `"Bull"` are mapped to BUY, `"Bear"` to SELL. The backend converts this into internal signals automatically.

Example (batch):

```json
{
  "signals": [
    {
      "symbol": "ACAUSDT",
      "price": 0.0043,
      "signals_by_timeframe": {
        "1d": {
          "price": 0.0043,
          "signals": ["REV Bull"],
          "time": "2026-02-09 00:00",
          "volume": 190491507.14
        }
      },
      "volume_24h": 3125869337.33
    },
    {
      "symbol": "BABYUSDT",
      "price": 0.01371,
      "signals_by_timeframe": {
        "1d": {
          "price": 0.01371,
          "signals": ["RUN Bear"],
          "time": "2026-02-09 00:00",
          "volume": 18440749
        }
      },
      "volume_24h": 1086942340
    }
  ],
  "scanning": true,
  "last_update": null,
  "total_coins": 2
}
```

- **Timeframes:** only `4h`, `1d`, `1w` are processed (keys case-insensitive, e.g. `4H`/`4h`); `1h`, `5m`, `15m` etc. are ignored.
- **Signal type:** from the first string in `signals` — if it contains `"Bear"` → SELL, otherwise → BUY.
- **Price:** taken from the timeframe block `price` or the symbol-level `price`.

## Response

- **200:** `{ "received": <number> }` — number of signals accepted.
- **401:** invalid or missing `x-webhook-secret`.
