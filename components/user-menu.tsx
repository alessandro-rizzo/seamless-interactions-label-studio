"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 px-3 py-1.5 h-10">
        {user.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt={user.name || "User"}
            className="w-6 h-6 rounded-full"
          />
        )}
        <div className="flex flex-col">
          <span className="text-sm font-medium leading-tight">{user.name}</span>
          <span className="text-xs text-muted-foreground leading-tight">
            {user.email}
          </span>
        </div>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/auth/signin" })}
        className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
        aria-label="Sign out"
      >
        <LogOut size={18} />
      </button>
    </div>
  );
}
