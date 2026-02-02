"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { apiService } from "@/lib/api";
import { toast } from "sonner";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showOldPassword, setShowOldPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [formData, setFormData] = React.useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      setFormData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setError(null);
      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate inputs
    if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Mật khẩu mới không khớp");
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    if (formData.oldPassword === formData.newPassword) {
      setError("Mật khẩu mới phải khác mật khẩu cũ");
      return;
    }

    setIsLoading(true);
    const result = await apiService.updatePassword(formData.oldPassword, formData.newPassword);

    if (result.error) {
      setError(result.error);
      toast.error("Đổi mật khẩu thất bại!");
      setIsLoading(false);
    } else {
      toast.success("Đổi mật khẩu thành công!");
      setIsLoading(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <KeyRound className="h-5 w-5" />
            Đổi mật khẩu
          </DialogTitle>
          <DialogDescription>
            Nhập mật khẩu cũ và mật khẩu mới để thay đổi
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Old Password */}
          <div className="space-y-2">
            <Label htmlFor="old-password">Mật khẩu cũ</Label>
            <div className="relative">
              <Input
                id="old-password"
                type={showOldPassword ? "text" : "password"}
                value={formData.oldPassword}
                onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                placeholder="Nhập mật khẩu cũ"
                disabled={isLoading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="new-password">Mật khẩu mới</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                disabled={isLoading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Nhập lại mật khẩu mới"
                disabled={isLoading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4 mr-2" />
                  Đổi mật khẩu
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Hủy
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
