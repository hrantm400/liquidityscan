# Деплой фикса вебхука сигналов (4h/1d/1w, регистр + логи)

## Шаг 1. Локально: закоммитить и отправить на сервер (Git)

Выполни **на своём компьютере** в PowerShell по порядку:

```powershell
cd "c:\Users\hrant\Desktop\liquidityscan -MEGA"

git add liquidityscan-web/backend/src/signals/signals.controller.ts
git add liquidityscan-web/backend/src/signals/signals.service.ts
git add liquidityscan-web/backend/src/signals/dto/webhook-signal.dto.ts
git add liquidityscan-web/backend/docs/SIGNALS_WEBHOOK_FOR_PYTHON.md
git add liquidityscan-web/frontend/src/pages/MonitorSuperEngulfing.tsx

git status
git commit -m "fix: webhook 4h/1d/1w case-insensitive, detailed logs"
git push origin main
```

Если ветка не `main` — замени в последней команде на свою (например `master`).

---

## Шаг 2. Сервер: подключиться по SSH

На своём компе в терминале (PowerShell или CMD):

```bash
ssh root@173.249.3.156
```

(Или `ssh твой_пользователь@173.249.3.156`.)

---

## Шаг 3. На сервере: подтянуть код и перезапустить API

Выполни **на сервере** (после того как зашёл по SSH) по порядку:

```bash
cd /var/www/liquidityscan
git pull origin main

cd liquidityscan-web/backend
npm run db:push
npm install
npm run build
pm2 restart liquidityscan-api
```

Если имя процесса другое — смотри: `pm2 list`, и в последней команде подставь его вместо `liquidityscan-api`.

---

## Шаг 4. Фронт (по желанию)

Если нужно выкатить и фронт (убрали карточку 1H):

**На своём компьютере (PowerShell):**

```powershell
cd "c:\Users\hrant\Desktop\liquidityscan -MEGA"
.\deploy\build-and-deploy.ps1 -Domain "liquidityscan.io" -ServerUser "root" -ServerIP "173.249.3.156"
```

(Без `-SkipUpload` скрипт соберёт фронт и зальёт на сервер.)

**Или вручную на сервере:**

```bash
cd /var/www/liquidityscan/liquidityscan-web/frontend
npm install
npm run build
# Дальше скопировать содержимое dist в папку, которую отдаёт nginx (см. конфиг сайта)
```

---

## Все команды подряд (копируй по блокам)

**1. У себя на компе (PowerShell) — закоммитить и отправить в Git:**

```powershell
cd "c:\Users\hrant\Desktop\liquidityscan -MEGA"
git add liquidityscan-web/backend/src/signals/signals.controller.ts liquidityscan-web/backend/src/signals/signals.service.ts liquidityscan-web/backend/src/signals/dto/webhook-signal.dto.ts liquidityscan-web/backend/docs/SIGNALS_WEBHOOK_FOR_PYTHON.md liquidityscan-web/frontend/src/pages/MonitorSuperEngulfing.tsx
git commit -m "fix: webhook single-coin + batch, 4h/1d/1w, logs"
git push origin main
```

**2. Подключиться к серверу:**

```bash
ssh root@173.249.3.156
```

**3. На сервере — подтянуть код и перезапустить API:**

```bash
cd /var/www/liquidityscan
git pull origin main
cd liquidityscan-web/backend
npm run db:push
npm install
npm run build
pm2 restart liquidityscan-api
```

**4. Посмотреть логи:**

```bash
pm2 logs liquidityscan-api --lines 30
```

После вебхука в логах должно быть: `Webhook result: payload coins=1, parsed (4h/1d/1w)=1, accepted=1` (или больше).
