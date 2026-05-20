"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <Button 
      variant="ghost" 
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
    >
      <LogOut className="w-4 h-4 mr-2" />
      Wyloguj
    </Button>
  );
}