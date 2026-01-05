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
import { Users, Plus, Trash2, Edit2, Check, X, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { apiService, Employee } from "@/lib/api";
import { toast } from "sonner";

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmployeeDialog({ open, onOpenChange }: EmployeeDialogProps) {
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isAdding, setIsAdding] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [newEmployee, setNewEmployee] = React.useState({
    name: "",
    phoneNumber: "",
    password: "",
  });
  const [editingEmployee, setEditingEmployee] = React.useState<Employee | null>(null);

  // Fetch employees when dialog opens
  React.useEffect(() => {
    if (open) {
      fetchEmployees();
    }
  }, [open]);

  const fetchEmployees = async () => {
    setIsLoading(true);
    setError(null);
    const result = await apiService.getAllEmployees();

    if (result.error) {
      setError(result.error);
    } else {
      console.log('Employees data:', result.data); // Debug: xem structure của data
      setEmployees(result.data);
    }
    setIsLoading(false);
  };

  const handleAddEmployee = async () => {
    if (newEmployee.name && newEmployee.phoneNumber && newEmployee.password) {
      setIsLoading(true);
      setError(null);
      const result = await apiService.createEmployee({
        name: newEmployee.name,
        phoneNumber: newEmployee.phoneNumber,
        password: newEmployee.password,
        role: "STAFF", // Default role, will be ignored by backend
      });

      if (result.error) {
        setError(result.error);
      } else {
        await fetchEmployees();
        setNewEmployee({ name: "", phoneNumber: "", password: "" });
        setIsAdding(false);
      }
      setIsLoading(false);
    }
  };

  const handleDeleteEmployee = async (_id: number) => {
    toast.info("Chức năng xóa nhân viên chưa có API từ backend");
    // TODO: Implement when API is available
    // if (confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) {
    //   setIsLoading(true);
    //   const result = await apiService.deleteEmployee(userId);
    //   
    //   if (result.error) {
    //     setError(result.error);
    //   } else {
    //     await fetchEmployees();
    //   }
    //   setIsLoading(false);
    // }
  };

  const handleEditEmployee = (_employee: Employee) => {
    toast.info("Chức năng chỉnh sửa nhân viên chưa có API từ backend");
    // TODO: Implement when API is available
    // setEditingId(employee.id);
    // setEditingEmployee({ ...employee });
  };

  const handleSaveEdit = async () => {
    if (editingEmployee) {
      setIsLoading(true);
      const result = await apiService.updateEmployee(editingEmployee.id, {
        name: editingEmployee.name,
        phoneNumber: editingEmployee.phoneNumber,
        role: editingEmployee.role,
      });

      if (result.error) {
        setError(result.error);
      } else {
        await fetchEmployees();
        setEditingId(null);
        setEditingEmployee(null);
      }
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingEmployee(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto scrollbar-hide">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="h-5 w-5" />
            Quản lý nhân viên
          </DialogTitle>
          <DialogDescription>
            Thêm, sửa, xóa thông tin nhân viên trong hệ thống
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
          {isLoading && !isAdding && !editingId ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Đang tải...</span>
            </div>
          ) : (
            <>
              {/* Add Employee Button */}
              {!isAdding && (
                <Button
                  onClick={() => setIsAdding(true)}
                  className="w-full"
                  variant="outline"
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm nhân viên mới
                </Button>
              )}

              {/* Add Employee Form */}
              {isAdding && (
                <Card className="border-2 border-blue-200 bg-blue-50">
                  <CardContent className="pt-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-name">Tên nhân viên</Label>
                      <Input
                        id="new-name"
                        value={newEmployee.name}
                        onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                        placeholder="Nhập tên nhân viên"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-phone">Số điện thoại</Label>
                      <Input
                        id="new-phone"
                        value={newEmployee.phoneNumber}
                        onChange={(e) => setNewEmployee({ ...newEmployee, phoneNumber: e.target.value })}
                        placeholder="Nhập số điện thoại"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Mật khẩu</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newEmployee.password}
                        onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                        placeholder="Nhập mật khẩu"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddEmployee} className="flex-1" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Đang lưu...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Lưu
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsAdding(false);
                          setNewEmployee({ name: "", phoneNumber: "", password: "" });
                        }}
                        className="flex-1"
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Hủy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Employee List */}
              <div className="space-y-3">
                {employees.length === 0 && !isLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    Chưa có nhân viên nào trong hệ thống
                  </div>
                ) : (
                  employees.map((employee, index) => (
                    <Card key={employee.id || employee.userId || `employee-${index}`}>
                      <CardContent className="pt-4">
                        {editingId === employee.id && editingEmployee ? (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Tên nhân viên</Label>
                              <Input
                                value={editingEmployee.name}
                                onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Số điện thoại</Label>
                              <Input
                                value={editingEmployee.phoneNumber}
                                onChange={(e) => setEditingEmployee({ ...editingEmployee, phoneNumber: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Vai trò</Label>
                              <select
                                value={editingEmployee.role}
                                onChange={(e) => setEditingEmployee({ ...editingEmployee, role: e.target.value })}
                                className="w-full border border-gray-300 rounded-md p-2"
                              >
                                <option value="STAFF">STAFF</option>
                                <option value="ADMIN">ADMIN</option>
                              </select>
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={handleSaveEdit} size="sm" className="flex-1" disabled={isLoading}>
                                {isLoading ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Đang lưu...
                                  </>
                                ) : (
                                  <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Lưu
                                  </>
                                )}
                              </Button>
                              <Button variant="outline" onClick={handleCancelEdit} size="sm" className="flex-1" disabled={isLoading}>
                                <X className="h-4 w-4 mr-2" />
                                Hủy
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">{employee.name}</p>
                              <p className="text-sm text-gray-600">{employee.phoneNumber}</p>
                              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 mt-1 inline-block">
                                {employee.role}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditEmployee(employee)}
                                disabled={isLoading}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteEmployee(employee.id)}
                                className="text-red-600 hover:bg-red-50"
                                disabled={isLoading}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}





