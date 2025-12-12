import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import * as schema from "../shared/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function seedAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await db
      .select()
      .from(schema.admins)
      .where(eq(schema.admins.username, "admin"));

    if (existingAdmin.length > 0) {
      console.log("Admin user already exists");
      process.exit(0);
    }

    // Create default admin
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    const [admin] = await db
      .insert(schema.admins)
      .values({
        username: "admin",
        password: hashedPassword,
        role: "admin",
      })
      .returning();

    console.log("Admin user created successfully:");
    console.log("Username: admin");
    console.log("Password: admin123");
    console.log("(Please change this password in production!)");
    
    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
}

seedAdmin();
