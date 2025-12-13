"use client";

import * as React from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, AlertCircle, UtensilsCrossed } from "lucide-react";

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [showErrorDialog, setShowErrorDialog] = React.useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(phoneNumber, password);

    if (result.success) {
      router.push("/");
    } else {
      setShowErrorDialog(true);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center pb-4">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
              <UtensilsCrossed className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">Food Store</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Số điện thoại</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="tel"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                "Đăng nhập"
              )}
            </Button>

          </form>
        </CardContent>
      </Card>

      {/* Login Failed Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center sm:text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-center">Đăng nhập thất bại</DialogTitle>
            <DialogDescription className="text-center">
              Số điện thoại hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại thông tin đăng nhập.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setShowErrorDialog(false)}>
              Thử lại
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

