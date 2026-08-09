import bcrypt from "bcryptjs";
import pool from "../config/database";

const users = [
  {
    name: "System Admin",
    email: "admin@fundsroom.com",
    password: "Admin@123",
    role: "ADMIN",
  },

  // SALES USERS
  {
    name: "Rahul Kumar",
    email: "rahul@fundsroom.com",
    password: "Sales@123",
    role: "SALES",
  },
  {
    name: "Amit Sharma",
    email: "amit@fundsroom.com",
    password: "Sales@123",
    role: "SALES",
  },
  {
    name: "Priya Singh",
    email: "priya@fundsroom.com",
    password: "Sales@123",
    role: "SALES",
  },
  {
    name: "Neha Verma",
    email: "neha@fundsroom.com",
    password: "Sales@123",
    role: "SALES",
  },
  {
    name: "Rohit Kumar",
    email: "rohit@fundsroom.com",
    password: "Sales@123",
    role: "SALES",
  },
  {
    name: "Ankit Sharma",
    email: "ankit@fundsroom.com",
    password: "Sales@123",
    role: "SALES",
  },
  {
    name: "Pooja Singh",
    email: "pooja@fundsroom.com",
    password: "Sales@123",
    role: "SALES",
  },
  {
    name: "Vikas Kumar",
    email: "vikas@fundsroom.com",
    password: "Sales@123",
    role: "SALES",
  },
  {
    name: "Sneha Verma",
    email: "sneha@fundsroom.com",
    password: "Sales@123",
    role: "SALES",
  },
  {
    name: "Karan Singh",
    email: "karan@fundsroom.com",
    password: "Sales@123",
    role: "SALES",
  },

  // WAREHOUSE
  {
    name: "Warehouse Manager",
    email: "warehouse@fundsroom.com",
    password: "Warehouse@123",
    role: "WAREHOUSE",
  },

  // ACCOUNTS
  {
    name: "Accounts Manager",
    email: "accounts@fundsroom.com",
    password: "Accounts@123",
    role: "ACCOUNTS",
  },
];

async function seedUsers() {
  try {
    for (const user of users) {
      const existingUser =
        await pool.query(
          `SELECT id
           FROM users
           WHERE email = $1`,
          [user.email]
        );

      if (existingUser.rows.length > 0) {
        console.log(
          `Already exists: ${user.email}`
        );
        continue;
      }

      const hashedPassword =
        await bcrypt.hash(
          user.password,
          10
        );

      await pool.query(
        `INSERT INTO users
          (name, email, password, role)
         VALUES
          ($1, $2, $3, $4)`,
        [
          user.name,
          user.email,
          hashedPassword,
          user.role,
        ]
      );

      console.log(
        `Created: ${user.email} (${user.role})`
      );
    }

    console.log(
      "\nUser seeding completed."
    );
  } catch (error) {
    console.error(
      "User seeding failed:",
      error
    );
  } finally {
    await pool.end();
  }
}

seedUsers();