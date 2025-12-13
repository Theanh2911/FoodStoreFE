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
import { Building2, Copy, Check, Edit2, X, Loader2, AlertCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { apiService, BankInfo } from "@/lib/api";

interface BankingInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BankingInfoDialog({ open, onOpenChange }: BankingInfoDialogProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState<string | null>(null);
  const [bankData, setBankData] = React.useState<BankInfo | null>(null);
  const [allBanks, setAllBanks] = React.useState<BankInfo[]>([]);
  const [editingInfo, setEditingInfo] = React.useState({
    bankName: "",
    accountNumber: "",
    accountHolder: "",
  });
  const [qrCodeFile, setQrCodeFile] = React.useState<File | null>(null);
  const [qrCodePreview, setQrCodePreview] = React.useState<string | null>(null);
  const [showDeactivateDialog, setShowDeactivateDialog] = React.useState(false);

  // Fetch bank info when dialog opens
  React.useEffect(() => {
    if (open) {
      fetchBankInfo();
    }
  }, [open]);

  const fetchBankInfo = async () => {
    setIsLoading(true);
    setError(null);
    const result = await apiService.getActiveBanks();
    
    if (result.error) {
      setError(result.error);
      setBankData(null);
      setAllBanks([]);
    } else if (result.data && result.data.length > 0) {
      // Take the first active bank
      const bank = result.data[0];
      setBankData(bank);
      setAllBanks([]);
      setEditingInfo({
        bankName: bank.bankName,
        accountNumber: bank.accountNumber,
        accountHolder: bank.accountHolder,
      });
    } else {
      // No active banks found - fetch all banks to show deactivated ones
      setBankData(null);
      const allBanksResult = await apiService.getAllBanks();
      
      if (allBanksResult.error) {
        setError(allBanksResult.error);
        setAllBanks([]);
      } else {
        setAllBanks(allBanksResult.data);
        if (allBanksResult.data.length === 0) {
          setError("Không có tài khoản ngân hàng nào trong hệ thống");
        }
      }
    }
    setIsLoading(false);
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSave = async () => {
    if (!bankData) return;
    
    setIsLoading(true);
    setError(null);
    
    const result = await apiService.updateBank(bankData.id, {
      bankName: editingInfo.bankName,
      accountNumber: editingInfo.accountNumber,
      accountHolder: editingInfo.accountHolder,
      status: bankData.status,
      qrCodeImage: qrCodeFile || undefined,
    });
    
    if (result.error) {
      setError(result.error);
    } else {
      await fetchBankInfo();
      setIsEditing(false);
      setQrCodeFile(null);
      setQrCodePreview(null);
    }
    setIsLoading(false);
  };

  const handleQrCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setQrCodeFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrCodePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancel = () => {
    if (bankData) {
      setEditingInfo({
        bankName: bankData.bankName,
        accountNumber: bankData.accountNumber,
        accountHolder: bankData.accountHolder,
      });
    }
    setQrCodeFile(null);
    setQrCodePreview(null);
    setIsEditing(false);
  };

  const handleDeactivate = async () => {
    if (!bankData) return;
    
    setIsLoading(true);
    setError(null);
    
    const result = await apiService.deactivateBank(bankData.id);
    
    if (result.error) {
      setError(result.error);
    } else {
      await fetchBankInfo();
      setIsEditing(false);
    }
    setIsLoading(false);
    setShowDeactivateDialog(false);
  };

  const handleActivate = async (bankId: number) => {
    setIsLoading(true);
    setError(null);
    
    const result = await apiService.activateBank(bankId);
    
    if (result.error) {
      setError(result.error);
    } else {
      await fetchBankInfo();
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Building2 className="h-5 w-5" />
            Thông tin chuyển khoản
          </DialogTitle>
          <DialogDescription>
            Thông tin tài khoản ngân hàng để khách hàng chuyển khoản
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Đang tải...</span>
            </div>
          ) : !bankData && allBanks.length === 0 ? (
            <Card className="bg-gray-50">
              <CardContent className="pt-6 pb-6">
                <div className="text-center space-y-3">
                  <div className="mx-auto w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">
                    Không có tài khoản ngân hàng nào trong hệ thống
                  </p>
                  <p className="text-sm text-gray-500">
                    Vui lòng liên hệ quản trị viên để thêm tài khoản ngân hàng mới
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : !bankData && allBanks.length > 0 ? (
            <>
              {/* Show all banks (including deactivated) */}
              <div className="space-y-3">
                <p className="text-sm text-gray-600 font-medium">
                  Danh sách tài khoản ngân hàng ({allBanks.length})
                </p>
                {allBanks.map((bank) => (
                  <Card key={bank.id} className={bank.status === "ACTIVE" ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200" : "bg-gray-50 border-gray-200"}>
                    <CardContent className="pt-4 space-y-3">
                      {/* Bank Name with Status Badge */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-gray-600">Ngân hàng</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              bank.status === "ACTIVE" 
                                ? "bg-green-100 text-green-800" 
                                : "bg-gray-300 text-gray-700"
                            }`}>
                              {bank.status}
                            </span>
                          </div>
                          <p className="font-semibold text-gray-900">{bank.bankName}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(bank.bankName, `bankName-${bank.id}`)}
                        >
                          {copied === `bankName-${bank.id}` ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Số tài khoản</p>
                          <p className="font-semibold text-gray-900">{bank.accountNumber}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(bank.accountNumber, `accountNumber-${bank.id}`)}
                        >
                          {copied === `accountNumber-${bank.id}` ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Chủ tài khoản</p>
                          <p className="font-semibold text-gray-900">{bank.accountHolder}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(bank.accountHolder, `accountHolder-${bank.id}`)}
                        >
                          {copied === `accountHolder-${bank.id}` ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {/* Activate Button for Deactivated Banks */}
                      {bank.status === "DEACTIVATED" && (
                        <div className="pt-2">
                          <Button
                            onClick={() => handleActivate(bank.id)}
                            size="sm"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Kích hoạt lại
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : bankData && !isEditing ? (
            <>
              {/* Display Mode */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="pt-6 space-y-4">
                  {/* Bank Name */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Ngân hàng</p>
                      <p className="font-semibold text-gray-900">{bankData.bankName}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(bankData.bankName, "bankName")}
                    >
                      {copied === "bankName" ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Account Number */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Số tài khoản</p>
                      <p className="font-semibold text-lg text-gray-900">{bankData.accountNumber}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(bankData.accountNumber, "accountNumber")}
                    >
                      {copied === "accountNumber" ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Account Holder */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Chủ tài khoản</p>
                      <p className="font-semibold text-gray-900">{bankData.accountHolder}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(bankData.accountHolder, "accountHolder")}
                    >
                      {copied === "accountHolder" ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Status Badge */}
                  <div className="pt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {bankData.status}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* QR Code Image */}
              {bankData.qrCodeImageUrl && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 text-center">Mã QR chuyển khoản</p>
                      <div className="flex justify-center">
                        <img 
                          src={bankData.qrCodeImageUrl} 
                          alt="QR Code chuyển khoản"
                          className="max-w-full h-auto rounded-lg"
                          style={{ maxHeight: '300px' }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Edit Button */}
              <Button 
                onClick={() => setIsEditing(true)} 
                className="w-full"
                variant="outline"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Chỉnh sửa thông tin
              </Button>
            </>
          ) : (
            <>
              {/* Edit Mode */}
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Ngân hàng</Label>
                    <Input
                      id="bankName"
                      value={editingInfo.bankName}
                      onChange={(e) => setEditingInfo({ ...editingInfo, bankName: e.target.value })}
                      placeholder="Nhập tên ngân hàng"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Số tài khoản</Label>
                    <Input
                      id="accountNumber"
                      value={editingInfo.accountNumber}
                      onChange={(e) => setEditingInfo({ ...editingInfo, accountNumber: e.target.value })}
                      placeholder="Nhập số tài khoản"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountHolder">Chủ tài khoản</Label>
                    <Input
                      id="accountHolder"
                      value={editingInfo.accountHolder}
                      onChange={(e) => setEditingInfo({ ...editingInfo, accountHolder: e.target.value })}
                      placeholder="Nhập tên chủ tài khoản"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="qrCodeImage">Ảnh QR Code (tùy chọn)</Label>
                    <Input
                      id="qrCodeImage"
                      type="file"
                      accept="image/*"
                      onChange={handleQrCodeChange}
                    />
                    {qrCodePreview && (
                      <div className="mt-2 flex justify-center">
                        <img 
                          src={qrCodePreview} 
                          alt="QR Code preview"
                          className="max-w-full h-auto rounded-lg"
                          style={{ maxHeight: '200px' }}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button onClick={handleSave} className="flex-1" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Lưu thay đổi
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleCancel} className="flex-1" disabled={isLoading}>
                    <X className="h-4 w-4 mr-2" />
                    Hủy
                  </Button>
                </div>
                
                {/* Deactivate Button */}
                {bankData?.status === "ACTIVE" && (
                  <Button 
                    onClick={() => setShowDeactivateDialog(true)} 
                    variant="destructive" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Vô hiệu hóa tài khoản
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>

      {/* Deactivate Confirmation Dialog */}
      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Xác nhận vô hiệu hóa
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn vô hiệu hóa tài khoản ngân hàng này?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-4">
                <p className="text-sm text-gray-700">
                  Sau khi vô hiệu hóa, tài khoản này sẽ không còn hiển thị cho khách hàng và không thể sử dụng để nhận thanh toán.
                </p>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button 
                onClick={handleDeactivate} 
                variant="destructive" 
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Xác nhận
                  </>
                )}
              </Button>
              <Button 
                onClick={() => setShowDeactivateDialog(false)} 
                variant="outline" 
                className="flex-1"
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Hủy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}




