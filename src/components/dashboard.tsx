"use client";

import * as React from "react";
import { DashboardNav } from "./dashboard-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, ShieldAlert } from "lucide-react";
import { apiService, formatPrice, Order, parseOrderTime } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

export function Dashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Only fetch orders if user is ADMIN
    if (user?.role !== "ADMIN") {
      setIsLoading(false);
      return;
    }

    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);
      
      const result = await apiService.getAllOrders();
      
      if (result.error) {
        setError(result.error);
      } else {
        setOrders(result.data);
      }
      
      setIsLoading(false);
    };

    fetchOrders();
  }, [user]);

  const calculateOrderTotal = (order: Order) => {
    return order.items.reduce((total, item) => total + (item.productPrice * item.quantity), 0);
  };

  const getTodayOrders = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return orders.filter(order => {
      const orderDate = parseOrderTime(order.orderTime);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime() && order.status.toUpperCase() === 'PAID';
    });
  };

  const getTodayRevenue = () => {
    const todayOrders = getTodayOrders();
    return todayOrders.reduce((total, order) => total + calculateOrderTotal(order), 0);
  };

  const getTotalOrders = () => {
    return orders.filter(order => order.status.toUpperCase() === 'PAID').length;
  };

  const getTotalRevenue = () => {
    return orders.filter(order => order.status.toUpperCase() === 'PAID').reduce((total, order) => total + calculateOrderTotal(order), 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <DashboardNav />
      
      {/* Main Dashboard Content */}
      <main className="container mx-auto p-3 sm:p-4 lg:p-6 pb-20">
        {/* STAFF Role - Restricted Access Message */}
        {user?.role === "STAFF" && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                  <ShieldAlert className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Quyền truy cập hạn chế</h2>
              <p className="text-gray-600">
                Bạn đang đăng nhập với vai trò <span className="font-semibold text-blue-600">STAFF</span>.
              </p>
              <p className="text-sm text-gray-500">
                Vui lòng sử dụng menu điều hướng để truy cập:
              </p>
              <ul className="text-left text-sm text-gray-600 space-y-2 bg-gray-50 p-4 rounded-lg">
                <li className="flex items-center">
                  <span className="text-green-600 mr-2">✓</span>
                  Menu (Đồ ăn, Đồ uống, Đồ ăn thêm)
                </li>
                <li className="flex items-center">
                  <span className="text-green-600 mr-2">✓</span>
                  Đơn hàng
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* ADMIN Role - Full Dashboard Access */}
        {user?.role === "ADMIN" && (
          <>
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="flex items-center justify-center py-8">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <span className="ml-2 text-red-600">Lỗi: {error}</span>
              </div>
            )}

            {/* Dashboard Cards */}
            {!isLoading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                {/* Total Orders */}
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg">Tổng quan đơn hàng</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xl sm:text-2xl font-bold text-blue-600">{getTotalOrders()}</p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Tổng số đơn hàng</p>
                    <p className="text-xs sm:text-sm text-blue-600 mt-1">Hôm nay: {getTodayOrders().length} đơn</p>
                  </CardContent>
                </Card>

                {/* Revenue */}
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg">Doanh thu</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-lg sm:text-2xl font-bold text-green-600">{formatPrice(getTotalRevenue())}</p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Tổng doanh thu</p>
                    <p className="text-xs sm:text-sm text-green-600 mt-1">Hôm nay: {formatPrice(getTodayRevenue())}</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
