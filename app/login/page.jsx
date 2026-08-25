"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Login failed");
      }

      const data = await response.json();
      localStorage.setItem("token", data.token);
      router.push("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="rounded-2xl shadow-lg">
          <CardContent className="space-y-6 p-6">
            <div className="text-right space-y-2">
              <h1 className="text-2xl font-bold text-red-600">סטודנט דלקוק</h1>
              <p className="text-gray-600 text-sm">לא מחובר</p>
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-xl font-semibold text-red-600">התחברות לאתר סטודנט</h2>
              <p className="text-gray-500 text-sm">הזן את פרטי ההתחברות שלך</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-right">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  שם משתמש
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@example.com"
                  disabled={loading}
                  className="text-center"
                  required
                />
              </div>

              <div className="text-right">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  סיסמה
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="text-center"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full rounded-2xl bg-red-600 hover:bg-red-700 text-white text-lg h-10"
              >
                {loading ? "טוען..." : "התחבר"}
              </Button>
            </form>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm text-center"
              >
                {error.startsWith("Failed") ? "שניצית רשת" : error}
              </motion.div>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-xs text-gray-500 mt-8 text-right">
          <p>© 2026 קישור יומות עסקיות 2007 - כל הזכויות שמורות | גרסה 2.1.0</p>
        </div>
      </motion.div>
    </div>
  );
}
