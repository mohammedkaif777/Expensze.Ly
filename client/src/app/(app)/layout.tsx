import { RequireAuth } from "@/components/auth-guards";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}