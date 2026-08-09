import bcrypt from "bcryptjs";
import pool from "../src/config/database";

const seedAdmin = async () => {
  try {
    const password = "Admin@123";

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      [
        "System Admin",
        "admin@fundsroom.com",
        hashedPassword,
        "ADMIN"
      ]
    );

    console.log("Admin user created successfully");

    await pool.end();
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
};

seedAdmin();