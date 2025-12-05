"use client";

/**
 * Logout page - handles signout and redirects to login
 * 
 * This page exists to handle the signout process without causing
 * UI flashing in the authenticated layout. The user is redirected
 * here immediately, then signOut() is called, then redirected to /login.
 */

import { useEffect } from "react";
import { signOut } from "~/lib/auth-client";

export default function LogoutPage() {
  useEffect(() => {
    const doSignOut = async () => {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = "/login";
          },
        },
      });
    };
    void doSignOut();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 mx-auto animate-spin rounded-full border-4 border-olive border-t-transparent" />
        <p className="text-gray-600 dark:text-gray-400">Signing out...</p>
      </div>
    </div>
  );
}
