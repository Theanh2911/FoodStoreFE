"use client";

import * as React from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function RoleProtectedRoute({ children, allowedRoles }: RoleProtectedRouteProps) {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    return null;
  }

  const hasAccess = allowedRoles.includes(user.role);

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Truy cập bị từ chối</h2>
          <p className="text-gray-600">
            Bạn không có quyền truy cập trang này. Chỉ có {allowedRoles.join(", ")} mới có thể truy cập.
          </p>
          <p className="text-sm text-gray-500">
            Vai trò của bạn: <span className="font-semibold text-blue-600">{user.role}</span>
          </p>
          <Button onClick={() => router.push("/")} className="w-full">
            Quay lại trang chủ
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}







