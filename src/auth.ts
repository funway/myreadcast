import NextAuth from 'next-auth';
import CredentialsProvider from "next-auth/providers/credentials";
import { db, initializeDatabase } from "@/lib/db/init";
import { UserTable as userTable } from "@/lib/db/schema";
import { authConfig } from '@/auth.config';
import { sql } from "drizzle-orm";
import bcrypt from 'bcrypt';
import { createId } from '@paralleldrive/cuid2';
import { generateRandomToken } from './lib/helpers';

export const { 
  handlers, 
  auth, 
  signIn, 
  signOut 
} = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text", placeholder: "GeorgeOrwell" },
        password: { label: "Password", type: "password", placeholder: "---" }
      },
      async authorize(credentials) {
        console.log("😤 ");
        if (!credentials?.username || !credentials.password) { 
          throw new Error("Username or Password can not be empty");
        }
        const username = credentials.username;
        const password = credentials.password;

        // 1. 确保数据库已初始化
        await initializeDatabase();

        // 2. 检查 user 表是否为空
        const userCountResult = await db.select({ count: sql<number>`count(*)` }).from(userTable);
        const userCount = userCountResult[0].count;

        // 3. 如果 user 表为空，创建第一个用户作为 root
        if (userCount === 0) {
          console.log("No users found. Creating first user as root...");
          const hashedPassword = await bcrypt.hash(password, 10);
          const token = generateRandomToken();
          const newUser = {
            id: createId(),
            username: username,
            password: hashedPassword,
            token: token,
            role: "root",
            image: null,
          }
          
          await db.insert(userTable).values(newUser);
          console.log("First user created:", newUser.username);
          
          // 直接返回新创建的用户信息以完成登录
          return { id: newUser.id, name: newUser.username, role: newUser.role };
        }

        // 4. 如果表不为空，执行正常的登录验证
        const existingUser = await db.query.user.findFirst({
          where: (user, { eq }) => eq(user.username, credentials.username as string),
        });

        if (!existingUser) {
          console.log("User not found:", credentials.username);
          return null; // 用户不存在
        }

        const passwordMatch = await bcrypt.compare(credentials.password as string, existingUser.password);

        if (!passwordMatch) {
          console.log("Password mismatch for user:", credentials.username);
          return null; // 密码不匹配
        }

        console.log("Login successful for user:", existingUser.username);
        // 登录成功，返回用户信息
        return { id: existingUser.id, name: existingUser.username, role: existingUser.role };
      }
    })
  ]
});