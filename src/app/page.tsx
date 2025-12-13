import { Dashboard } from "@/components/dashboard";
import { ProtectedRoute } from "@/components/protected-route";

export default function Home() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
