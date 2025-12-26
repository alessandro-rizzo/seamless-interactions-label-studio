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
      {user.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.image}
          alt={user.name || "User"}
          className="w-8 h-8 rounded-full"
        />
      )}
      <div className="flex flex-col">
        <span className="text-sm font-medium">{user.name}</span>
        <span className="text-xs text-muted-foreground">{user.email}</span>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/auth/signin" })}
        className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-accent transition-colors"
        aria-label="Sign out"
      >
        <LogOut size={16} />
      </button>
    </div>
  );
}
