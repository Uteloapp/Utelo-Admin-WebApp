"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { token, setAuth } = useAuthStore();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  useEffect(() => {
    if (token) {
      router.replace("/dashboard");
    }
  }, [token, router]);

  const onSubmit = async (data: LoginForm) => {
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/api/admin/auth/login", data);
      setAuth(res.data.admin, res.data.token);
      router.push("/dashboard");
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { error?: string } } }).response?.data?.error === "string"
      ) {
        setError((err as { response: { data: { error: string } } }).response.data.error);
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-[var(--radius-card)] bg-primary mb-4">
            <span className="text-white text-xl font-bold">U</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            UTLO Admin
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Sign in to your admin console
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface rounded-[var(--radius-card)] border border-border shadow-[var(--shadow-card)] p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="admin@utelo.com"
              error={errors.email?.message}
              {...register("email", { required: "Email is required" })}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register("password", { required: "Password is required" })}
            />

            {error && (
              <div className="bg-danger/8 text-danger text-sm px-3 py-2 rounded-[var(--radius-badge)]">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full mt-2">
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
