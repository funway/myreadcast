'use client';

import { signOutAction } from "@/lib/server/actions";

const LogoutButton = () => { 
  return (
    <button className="w-full text-left" onClick={ () => signOutAction('/user/login') }>
      Logout
    </button>
  );
}

export const LogoutForm = () => { 
  return (
    <form action="/api/auth/logout" method="POST">
      <button type="submit" className="w-full text-left cursor-pointer">
        Logout
      </button>
    </form>
  );
}

export default LogoutButton;