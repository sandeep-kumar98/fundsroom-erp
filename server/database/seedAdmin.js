"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = __importDefault(require("../src/config/database"));
const seedAdmin = async () => {
    try {
        const password = "Admin@123";
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        await database_1.default.query(`INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`, [
            "System Admin",
            "admin@fundsroom.com",
            hashedPassword,
            "ADMIN"
        ]);
        console.log("Admin user created successfully");
        await database_1.default.end();
    }
    catch (error) {
        console.error("Error creating admin:", error);
        process.exit(1);
    }
};
seedAdmin();
