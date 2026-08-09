# FundsRoom ERP

Mini ERP + CRM Operations Portal built for the Full Stack Developer Case Study.

## Live Links

- Frontend: `https://fundsroom-erp-ecru.vercel.app/`
- Backend API: `https://fundsroom-erp-api-gohl.onrender.com`
- GitHub: `https://github.com/sandeep-kumar98/fundsroom-erp`

## Features

- JWT authentication
- Role-based access
- Admin, Sales, Warehouse and Accounts roles
- Customer management
- Customer search and follow-ups
- Product management
- Stock management
- Stock IN / OUT movements
- Sales challans
- Draft / Confirmed / Cancelled challans
- Automatic challan numbers
- Stock validation before challan confirmation
- PostgreSQL database
- REST APIs
- Responsive React UI

## Tech Stack

**Frontend**
- React
- TypeScript
- Vite
- Tailwind CSS
- Axios
- React Router

**Backend**
- Node.js
- TypeScript
- Express.js
- JWT
- bcryptjs

**Database**
- PostgreSQL
- Neon

**Deployment**
- Vercel
- Render
- Neon

## Roles

| Role | Access |
|---|---|
| Admin | Full access |
| Sales | Customers, Products, Challans |
| Warehouse | Products, Stock, Challans |
| Accounts | Products, Stock, Challans |

## Project Structure

```text
fundsroom-erp/
├── client/          # React frontend
├── server/          # Express backend
├── postman/         # API/Postman files
├── .postman/
└── README.md
```

## Run Locally

### Backend

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=5000
DATABASE_URL=your_postgresql_url
JWT_SECRET=your_jwt_secret
```

Start backend:

```bash
npm run dev
```

### Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Frontend normally runs on:

```text
http://localhost:5173
```

## Database

Database schema:

```text
server/database/schema.sql
```

Main tables:

```text
users
customers
follow_ups
products
stock_movements
challans
challan_items
```

## Important Business Logic

When a challan is **confirmed**:

- Stock is reduced.
- Stock cannot become negative.
- If stock is insufficient, the API returns an error.
- Challan items store product snapshot information.

## API Examples

```text
POST /api/auth/login

GET  /api/customers
POST /api/customers

GET  /api/products
POST /api/products

GET  /api/challans
POST /api/challans

GET  /api/products/:id/stock-movements
POST /api/products/:id/stock
```

Postman files are included in the repository.

## Environment Variables

Backend requires:

```env
DATABASE_URL=
JWT_SECRET=
PORT=
```

Do not commit `.env` files or passwords to GitHub.

## Test Credentials

Add the evaluator test accounts here:

```text
ADMIN
Email: admin@fundsroom.com
Password: Admin@123

SALES
Email: karan@fundsroom.com
Password: Sales@123

WAREHOUSE
Email: warehouse@fundsroom.com
Password: Warehouse@123

ACCOUNTS
Email: accounts@fundsroom.com
Password: Accounts@123
```

## Deployment

- Frontend deployed on Vercel
- Backend deployed on Render
- PostgreSQL database hosted on Neon

## Known Limitations

This project focuses on the core requirements of the case study.

Optional features such as:

- Docker
- GitHub Actions
- PDF invoice export
- AWS S3 product image upload

are not implemented.

## Author

**Sandeep Kumar**

B.Tech Computer Science & Engineering
