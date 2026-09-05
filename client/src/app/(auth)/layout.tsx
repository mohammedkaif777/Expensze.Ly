import Link from "next/link";
import { Wallet } from "lucide-react";
import { RedirectIfAuthed } from "@/components/auth-guards";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <RedirectIfAuthed>
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-10">
        <Link href="/login" className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wallet className="size-5" />
          </span>
          <span className="text-xl font-semibold tracking-tight">
            Expenze.Ly
          </span>
        </Link>
        {children}
      </div>
    </RedirectIfAuthed>
  );
}