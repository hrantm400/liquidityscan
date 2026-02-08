# Webhook для отправки сигналов в LiquidityScan

Передай бэкенд-разработчику (Python) следующие данные.

---

## 1. URL webhook (куда слать POST)

- **Если Python-сервис на том же сервере:**  
  `http://127.0.0.1:3002/api/signals/webhook`

- **Если запросы идут снаружи и у LiquidityScan есть Nginx по IP/домену:**  
  `http://173.249.3.156/api/signals/webhook`  
  (или `https://...` если настроен SSL)

---

## 2. Секретный ключ (preferred secret key)

В заголовок каждого запроса нужно передавать секрет, который совпадает с тем, что задан у нас в `.env`:

- **Имя заголовка:** `x-webhook-secret`
- **Значение:** тот секрет, который ты укажешь в `.env` как `SIGNALS_WEBHOOK_SECRET` и передашь разработчику.

Рекомендуется сгенерировать длинный случайный ключ (например 32+ символа) и один раз прописать в `.env` и передать разработчику. Пример (замени на свой):

```
SIGNALS_WEBHOOK_SECRET=ls_webhook_a1b2c3d4e5f6g7h8i9j0
```

Разработчику передаёшь только **значение** (без переменной), например: `ls_webhook_a1b2c3d4e5f6g7h8i9j0`.

---

## 3. Метод и заголовки

- **Метод:** `POST`
- **Content-Type:** `application/json`
- **Заголовок:** `x-webhook-secret: <твой_секрет>`

---

## 4. Тело запроса (JSON)

Принимается **один объект** или **массив объектов**. Обрабатываются только сигналы с `strategyType: "SUPER_ENGULFING"` и `timeframe` из `["4h", "1d", "1w"]`.

**Обязательные поля одного сигнала:**

| Поле          | Тип    | Описание |
|---------------|--------|----------|
| `strategyType`| string | Строго `"SUPER_ENGULFING"` |
| `symbol`      | string | Тикер, например `"PEPEUSDT"` |
| `timeframe`   | string | Один из: `"4h"`, `"1d"`, `"1w"` |
| `signalType`  | string | `"BUY"` или `"SELL"` |
| `price`       | number | Цена на момент сигнала |

**Опционально:**

- `id` — строка (если нет, сгенерируем сами)
- `detectedAt` — строка (ISO дата/время)
- `status` — один из: `"ACTIVE"`, `"EXPIRED"`, `"FILLED"`, `"CLOSED"`
- `metadata` — объект с любыми доп. данными

**Пример одного сигнала:**

```json
{
  "strategyType": "SUPER_ENGULFING",
  "symbol": "PEPEUSDT",
  "timeframe": "4h",
  "signalType": "SELL",
  "price": 3.75e-06
}
```

**Пример массива:**

```json
[
  {
    "strategyType": "SUPER_ENGULFING",
    "symbol": "PEPEUSDT",
    "timeframe": "4h",
    "signalType": "SELL",
    "price": 3.75e-06
  },
  {
    "strategyType": "SUPER_ENGULFING",
    "symbol": "HMSTRUSDT",
    "timeframe": "4h",
    "signalType": "SELL",
    "price": 0.0001744
  }
]
```

Если у Python-разработчика данные в формате его API (например `signals_by_timeframe`, `"RUN+ Bear"` и т.д.), ему нужно перед отправкой преобразовать их в этот формат:  
- Bull → `signalType: "BUY"`, Bear → `signalType: "SELL"`  
- `strategyType: "SUPER_ENGULFING"`, `timeframe`: `"4h"` | `"1d"` | `"1w"`.

---

## 5. Ответ

- **Успех (200):** `{ "received": N }` — число принятых сигналов (только SUPER_ENGULFING с 4h/1d/1w).
- **401:** неверный или отсутствующий заголовок `x-webhook-secret`.

---

## 6. Где смотреть отправленные данные

- **Прямой запрос к API:**  
  `GET /api/signals` или `GET /api/signals?strategyType=SUPER_ENGULFING`  
  Пример: `http://localhost:3002/api/signals` (локально) или `http://173.249.3.156/api/signals` (на сервере через Nginx). В ответе — массив принятых сигналов.

- **В веб-приложении:**  
  Dashboard (сводка по сигналам), страница мониторинга Super Engulfing (список сигналов), клик по сигналу — страница деталей. Данные подтягиваются тем же `GET /api/signals`.
