"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SignupForm() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message ?? "회원가입 요청에 실패했습니다.");
      setMessage("회원가입 요청이 접수되었습니다. 관리자가 승인한 뒤 로그인할 수 있습니다.");
      setName("");
      setEmail("");
      setPassword("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "회원가입 요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="이름" required />
      <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="이메일" required />
      <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호" required minLength={6} />
      <Button type="submit" className="w-full" disabled={loading}>{loading ? "요청 중" : "회원가입 요청"}</Button>
      {message ? <p className="rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-700">{message}</p> : null}
      <p className="text-center text-sm text-slate-500">
        이미 계정이 있으면 <Link href="/login" className="font-semibold text-emerald-700">로그인</Link>
      </p>
    </form>
  );
}
