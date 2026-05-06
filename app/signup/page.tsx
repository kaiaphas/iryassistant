import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8faf9] px-4">
      <section className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-soft">
        <div className="mb-6">
          <p className="text-2xl font-bold text-emerald-800">
            irytour<span className="font-normal text-emerald-700">.com</span>
          </p>
          <h1 className="mt-4 text-xl font-bold text-slate-950">회원가입 요청</h1>
          <p className="mt-2 text-sm text-slate-500">관리자 승인 후 로그인할 수 있습니다.</p>
        </div>
        <SignupForm />
      </section>
    </main>
  );
}
