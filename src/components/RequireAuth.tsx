import { useAuth } from "@/hooks/useAuth";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) return null;

  // Allow both authenticated and unauthenticated users
  return <>{children}</>;
}
