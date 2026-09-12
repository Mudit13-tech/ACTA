# ACTA — Agentic Commerce & AI Payment Automation

The trust and transaction layer for AI agents. You state a goal and your
boundaries; the agent searches, compares, decides, waits for the right price,
and pays only inside the limits you wrote.

```
Understand → Search → Compare → Decide → Monitor
→ Prepare → Request approval → Execute → Verify
```

## Running it

Two processes. The backend owns the loop; the frontend is its phone client.

```bash
# 1. API  (http://127.0.0.1:8000)
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_catalog      # loads the demo connector inventory
python manage.py runserver

# 2. App  (http://localhost:5173)
cd frontend
npm install
npm run dev
```

Point the client elsewhere with `VITE_API_URL`.

## How it fits together

| | |
| --- | --- |
| `backend/agent/engine.py` | The action loop and the ranking. One stage per call. |
| `backend/agent/models.py` | Offers, policies, runs, activity. |
| `backend/agent/views.py` | The API the phone talks to. |
| `frontend/src/services/api.ts` | The only place the client touches the network. |
| `frontend/src/context/` | Policy and run state, paced against the server. |

The client polls `POST /api/runs/<id>/advance/` while a task is live, so the
loop you watch on screen is the server's, not a local imitation.

There is no sign-in yet. Each browser generates a device key, sends it as
`X-ACTA-Device`, and the backend scopes policy, runs and activity to it. JWT
endpoints (`/api/token/`) are wired for when real accounts land — the `user`
foreign keys already exist, nullable.

## The trust layer

Every payment passes `check_policy` before it happens:

- **Auto-approve limit** — pay without asking at or below this amount
- **Daily cap** — a task that would cross it is blocked, not queued
- **Hard ceiling** — never executed, approval or not
- **Always ask** — new vendors, and bookings that cost money to cancel
- **Trusted vendors** — skip the new-vendor check, nothing else

Each decision carries the reason it was made, and the agent cannot step outside
these rules for a better deal.

## Tests

```bash
cd backend && python manage.py test agent    # 21 tests: the loop + every boundary
cd frontend && npm run build && npm run lint
```

Vendors, prices and payments are simulated. `frontend/src/services/api.ts` and
`backend/agent/models.py` are where real merchant connectors attach.
