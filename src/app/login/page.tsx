import Link from "next/link";
import { LoginForm } from "@/components/customer/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-paper px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-md">
        <Link className="text-sm font-medium text-moss" href="/">
          返回首页
        </Link>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}

