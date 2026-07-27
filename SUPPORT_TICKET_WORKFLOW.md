# Customer Support Ticket Workflow

Cherish Baby Store now uses a full support ticket workflow with these statuses:

- `OPEN`
- `PENDING`
- `WAITING_FOR_CUSTOMER`
- `RESOLVED`
- `CLOSED`

## Migration

This project uses Mongoose schema updates instead of migration files. After deploying the backend code, run:

```bash
cd backend
npm run backfill:support-tickets
```

The script:

- assigns missing `CBS-000001` style ticket numbers to older support tickets
- normalizes old statuses such as `open`, `in_progress`, and `resolved`
- backfills first replies and activity entries where older tickets do not have them
- advances the ticket-number counter to the highest existing ticket sequence

## Environment Variables

Required for email:

```bash
EMAIL_PROVIDER=resend
RESEND_API_KEY=...
EMAIL_FROM=support@your-domain.com
EMAIL_FROM_NAME="Cherish Baby Store"
SUPPORT_EMAIL=support-team@example.com
FRONTEND_URL=http://localhost:5173
ADMIN_FRONTEND_URL=http://localhost:5174
```

Required for signed guest ticket links:

```bash
JWT_SECRET=...
SUPPORT_TICKET_LINK_SECRET=...
SUPPORT_TICKET_ACCESS_DAYS=60
```

`SUPPORT_TICKET_LINK_SECRET` is optional if `JWT_SECRET` is set, but using a separate value is recommended.

Required only when support attachments are uploaded:

```bash
CLOUDINARY_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

## Scheduler

The backend starts the support-ticket automation worker with the server by default.

```bash
SUPPORT_TICKET_AUTOMATION_ENABLED=true
SUPPORT_TICKET_AUTOMATION_INTERVAL_MS=86400000
```

The worker is idempotent and safe to run repeatedly. It:

- sends one reminder after three full days in `WAITING_FOR_CUSTOMER`
- closes tickets after seven full days in `WAITING_FOR_CUSTOMER`
- skips tickets where the customer replied after the latest support reply

For platforms that prefer hosted cron, call a backend job that invokes `processSupportTicketAutomation()` from `backend/services/supportTicketService.js`.

## Commands

Backend:

```bash
cd backend
npm install
npm run dev
npm test
```

Customer frontend:

```bash
cd user-frontend
npm install
npm run dev
npm run build
```

Admin frontend:

```bash
cd admin-frontend
npm install
npm run dev
npm run build
```

## API Summary

Customer:

- `POST /api/support/tickets`
- `GET /api/support/tickets/my`
- `GET /api/support/tickets/:ticketNumber`
- `POST /api/support/tickets/:ticketNumber/replies`
- `POST /api/support/tickets/:ticketNumber/reopen`

Admin:

- `GET /api/admin/support/tickets`
- `GET /api/admin/support/tickets/:ticketNumber`
- `POST /api/admin/support/tickets/:ticketNumber/replies`
- `PATCH /api/admin/support/tickets/:ticketNumber/status`
- `PATCH /api/admin/support/tickets/:ticketNumber/priority`
- `PATCH /api/admin/support/tickets/:ticketNumber/assignment`
- `POST /api/admin/support/tickets/:ticketNumber/internal-notes`
- `POST /api/admin/support/tickets/:ticketNumber/reopen`
