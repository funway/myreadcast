import { eq } from "drizzle-orm";
import bcrypt from 'bcrypt';
import { db } from "@/lib/server/db";
import { UserTable } from "./schema";
import { createId } from '@paralleldrive/cuid2';
import { generateRandomToken } from "../helpers";
import { PASSWORD_BCRYPT_SALT_ROUNDS } from "../constants";

// --- 类型定义 (利用 Drizzle 的类型推断) ---
export type User = typeof UserTable.$inferSelect;

type UserInsert = typeof UserTable.$inferInsert;
export type NewUser = {
  username: string;
  plainPassword: string;
} & Partial<Omit<UserInsert, "username" | "password">>;

/**
 * Creates a new user.
 *
 * @param data New user input:
 *  - `username`: The username (required).
 *  - `plainPassword`: The plain-text password (required).
 *  - Other fields (e.g. `id`, `token`, `role`, `image`, `permissions`): optional.
 *
 * @returns The newly inserted user record.
 */
export async function createUser(data: NewUser) {
  const hashPassword = await bcrypt.hash(
    data.plainPassword,
    PASSWORD_BCRYPT_SALT_ROUNDS);
  
  const userData = {
    ...data,
    id: data.id ?? createId(),
    token: data.token ?? generateRandomToken(),
    password: hashPassword,
  }
  const [user] = await db.insert(UserTable).values(userData).returning();
  return user;
}

export async function getUserById(id: string) {
  // query 写法
  return await db.query.UserTable.findFirst({
    where: eq(UserTable.id, id),
  });
}

export async function getUserByUsername(username: string) {
  // select 写法
  const [user] = await db.select().from(UserTable)
    .where(eq(UserTable.username, username));
  return user;
}

export async function updateUserToken(id: string, token: string) {
  const [user] = await db
    .update(UserTable)
    .set({ token })
    .where(eq(UserTable.id, id))
    .returning();
  return user;
}

export async function getAdmins() {
  return await db.query.UserTable.findMany(
    {
      where: eq(UserTable.role, 'admin'),
    }
  );
}