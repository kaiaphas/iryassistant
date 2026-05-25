"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export function LoginForm() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "로그인에 실패했습니다.");
      router.replace("/");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "로그인 요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="space-y-1 text-sm font-medium text-slate-700">
        이메일
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-9"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            required
          />
        </div>
      </label>
      <label className="space-y-1 text-sm font-medium text-slate-700">
        비밀번호
        <Input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="비밀번호"
          required
        />
      </label>
      <Button type="submit" className="w-full" disabled={loading} aria-busy={loading}>
        {loading ? <LoadingSpinner /> : null}
        {loading ? "로그인 중" : "로그인"}
      </Button>
      {message ? <p className="rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-700">{message}</p> : null}
      <p className="text-center text-sm text-slate-500">
        계정이 없으면 <Link href="/signup" className="font-semibold text-emerald-700">회원가입 요청</Link>
      </p>
    </form>
  );
}
