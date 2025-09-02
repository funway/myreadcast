import { eq } from "drizzle-orm";
import bcrypt from 'bcrypt';
import { db } from "@/lib/server/db";
import { UserTable } from "./schema";
import { generateRandomToken, generateId } from "../helpers";
import { PASSWORD_BCRYPT_SALT_ROUNDS } from "../constants";
import { logger } from "../logger";

// --- 类型定义 (利用 Drizzle 的类型推断) ---
export type User = typeof UserTable.$inferSelect;

export type UserNew = {
  username: string;
  plainPassword: string;
} & Partial<Omit<User, "password" | "updatedAt" | "createdAt">>;

export type UserUpdate = {
  id: string;
} & Partial<Omit<User, "updatedAt" | "createdAt">>;

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
export async function createUser(data: UserNew) {
  const { plainPassword, ...rest } = data;
  const hashPassword = await bcrypt.hash(
    plainPassword,
    PASSWORD_BCRYPT_SALT_ROUNDS);
  
  const userData = {
    ...rest,
    id: data.id ?? generateId(),
    token: data.token ?? generateRandomToken(),
    password: hashPassword,
  }
  logger.debug('Create user with data:', userData);
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

export async function getAdmins() {
  return await db.query.UserTable.findMany(
    {
      where: eq(UserTable.role, 'admin'),
    }
  );
}

export async function getUsers() {
  return await db.query.UserTable.findMany();
}

export async function updateUser(userUpdates: UserUpdate) {
  const { id, ...rest } = userUpdates;
  if (rest.password) {
    rest.password = await bcrypt.hash(rest.password, PASSWORD_BCRYPT_SALT_ROUNDS);
  }
  
  const [user] = await db
    .update(UserTable)
    .set({
      ...rest,
      updatedAt: new Date(),
    })
    .where(eq(UserTable.id, id))
    .returning();
  return user;
}

export async function updateUserToken(id: string, token: string) {
  return await updateUser({ id, token });
}

export async function deleteUser(id: string) {
  const [user] = await db
    .delete(UserTable)
    .where(eq(UserTable.id, id))
    .returning();
  return user;
}