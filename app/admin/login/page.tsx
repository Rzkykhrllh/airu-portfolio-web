"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Logo from "@/components/ui/Logo";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const success = await login(username, password);

      if (success) {
        router.push("/admin/photos");
      } else {
        setError("Invalid username or password");
        setIsLoading(false);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
      return;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <Logo size="md" animated={false} />
          <h1 className="mt-6 text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Sign in to admin
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage photos, collections and messages.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 p-6 rounded-2xl shadow-sm"
        >
          <Input
            label="Username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          <Link href="/" className="hover:text-gray-900 dark:hover:text-white">← Back to site</Link>
        </p>
      </div>
    </div>
  );
}
