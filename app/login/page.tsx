import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8faf9] px-4">
      <section className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-soft">
        <div className="mb-6">
          <p className="text-2xl font-bold text-emerald-800">
            irytour<span className="font-normal text-emerald-700">.com</span>
          </p>
          <h1 className="mt-4 text-xl font-bold text-slate-950">인천로열투어 관리자 로그인</h1>
          <p className="mt-2 text-sm text-slate-500">승인된 계정의 이메일과 비밀번호로 로그인합니다.</p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
