import type { NextAuthConfig } from 'next-auth';
// next-auth sucks! 凸(-｡-;

export const authConfig = {
  // 在 auth.ts 中定义 providers, 保证 auth.config.ts 是 Edge-safe
  providers: [],
  
  callbacks: {
    // 在 jwt 回调中修改默认 jwt
    async jwt({ token, user }) {
      // user 实参是 authorize 成功返回的对象
      console.log("callback_jwt start:", token, user);
      if (user) {
        token.role = user.role;
      }
      console.log("callback_jwt end:", token, user);
      return token;
    },

    // 在 session 回调中修改默认 session
    async session({ session, token }) {
      console.log("callback_session start:", session, token);
      session.user.id = token.sub;
      session.user.role = token.role;
      console.log("callback_session end:", session, token);
      return session;
    }
  },

  pages: {
  }
} satisfies NextAuthConfig;
