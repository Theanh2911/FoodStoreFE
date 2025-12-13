"use client";

import * as React from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Filter, TrendingUp, Award, Loader2, AlertCircle } from "lucide-react";
import { apiService, formatPrice, Order, formatDateTime, parseOrderTime } from "@/lib/api";
import { ProtectedRoute } from "@/components/protected-route";
import { RoleProtectedRoute } from "@/components/role-protected-route";

interface OrderSummary {
  orderId: number;
  orderTime: string;
  totalAmount: number;
}

interface MonthlyRevenue {
  month: string;
  year: number;
  revenue: number;
  orderCount: number;
}

interface TopProduct {
  productName: string;
  quantitySold: number;
  totalRevenue: number;
  orderCount: number;
}

export default function DoanhThuPage() {
  return (
    <ProtectedRoute>
      <RoleProtectedRoute allowedRoles={["ADMIN"]}>
        <DoanhThuPageContent />
      </RoleProtectedRoute>
    </ProtectedRoute>
  );
}

function DoanhThuPageContent() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = React.useState<OrderSummary[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = React.useState<MonthlyRevenue[]>([]);
  const [topProducts, setTopProducts] = React.useState<TopProduct[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      const result = await apiService.getAllOrders();
      
      if (result.error) {
        setError(result.error);
      } else {
        setOrders(result.data);
        processOrderData(result.data);
      }
      
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const calculateOrderTotal = (order: Order) => {
    return order.items.reduce((total, item) => total + (item.productPrice * item.quantity), 0);
  };

  const processOrderData = (ordersData: Order[]) => {
    // Filter only PAID orders
    const paidOrders = ordersData.filter(order => order.status.toUpperCase() === 'PAID');

    // Convert paid orders to summary format with calculated totals
    const orderSummaries: OrderSummary[] = paidOrders.map(order => ({
      orderId: order.orderId,
      orderTime: order.orderTime,
      totalAmount: calculateOrderTotal(order), // Use calculated total instead of order.totalAmount
    }));

    // Process monthly revenue (only from PAID orders)
    const monthlyRevenueMap = new Map<string, { revenue: number; orderCount: number }>();
    
    paidOrders.forEach(order => {
      const date = parseOrderTime(order.orderTime);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const existing = monthlyRevenueMap.get(monthKey) || { revenue: 0, orderCount: 0 };
      const orderTotal = calculateOrderTotal(order);
      monthlyRevenueMap.set(monthKey, {
        revenue: existing.revenue + orderTotal,
        orderCount: existing.orderCount + 1,
      });
    });

    const monthlyRevenueArray: MonthlyRevenue[] = Array.from(monthlyRevenueMap.entries())
      .map(([monthKey, data]) => {
        const [year, month] = monthKey.split('-');
        return {
          month: new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }),
          year: parseInt(year),
          revenue: data.revenue,
          orderCount: data.orderCount,
        };
      })
      .sort((a, b) => b.year - a.year || b.month.localeCompare(a.month));

    // Process top products (only from PAID orders)
    const productMap = new Map<string, { quantitySold: number; totalRevenue: number; orderCount: number }>();
    
    paidOrders.forEach(order => {
      order.items.forEach(item => {
        const existing = productMap.get(item.productName) || { quantitySold: 0, totalRevenue: 0, orderCount: 0 };
        productMap.set(item.productName, {
          quantitySold: existing.quantitySold + item.quantity,
          totalRevenue: existing.totalRevenue + (item.productPrice * item.quantity),
          orderCount: existing.orderCount + 1,
        });
      });
    });

    const topProductsArray: TopProduct[] = Array.from(productMap.entries())
      .map(([productName, data]) => ({
        productName,
        quantitySold: data.quantitySold,
        totalRevenue: data.totalRevenue,
        orderCount: data.orderCount,
      }))
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);

    setFilteredOrders(orderSummaries);
    setMonthlyRevenue(monthlyRevenueArray);
    setTopProducts(topProductsArray);
  };

  const applyDateFilter = () => {
    if (!startDate || !endDate) {
      processOrderData(orders);
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Check if date range is more than 31 days
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 31) {
      setError('Khoảng thời gian không được vượt quá 31 ngày');
      return;
    }

    setError(null);
    
    const filteredOrdersData = orders.filter(order => {
      const orderDate = parseOrderTime(order.orderTime);
      return orderDate >= start && orderDate <= end;
    });

    processOrderData(filteredOrdersData);
  };

  const resetFilter = () => {
    setStartDate('');
    setEndDate('');
    processOrderData(orders);
  };

  // formatDateTime is now imported from api.ts

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNav />
        <main className="container mx-auto p-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Đang tải dữ liệu doanh thu...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      
      <main className="container mx-auto p-3 sm:p-4 lg:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Doanh thu
            </h1>
            <p className="text-gray-600">
              Theo dõi và phân tích doanh thu từ đơn hàng đã thanh toán
            </p>
          </div>
        </div>

        {/* Date Filter */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Lọc theo thời gian (Tối đa 31 ngày)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Từ ngày <span className="text-xs text-gray-500"></span>
                  </label>
                  <Input
                    type="text"
                    value={startDate}
                    onChange={(e) => {
                      // Allow only digits and forward slashes
                      const value = e.target.value.replace(/[^\d/]/g, '');
                      // Auto-format as dd/mm/yyyy
                      let formatted = value;
                      if (value.length >= 2 && !value.includes('/')) {
                        formatted = value.substring(0, 2) + '/' + value.substring(2);
                      }
                      if (value.length >= 5 && value.indexOf('/', 3) === -1) {
                        const parts = value.split('/');
                        if (parts.length === 2) {
                          formatted = parts[0] + '/' + parts[1].substring(0, 2) + '/' + parts[1].substring(2);
                        }
                      }
                      if (formatted.length <= 10) {
                        setStartDate(formatted);
                      }
                    }}
                    placeholder="dd/mm/yyyy"
                    maxLength={10}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Đến ngày <span className="text-xs text-gray-500"></span>
                  </label>
                  <Input
                    type="text"
                    value={endDate}
                    onChange={(e) => {
                      // Allow only digits and forward slashes
                      const value = e.target.value.replace(/[^\d/]/g, '');
                      // Auto-format as dd/mm/yyyy
                      let formatted = value;
                      if (value.length >= 2 && !value.includes('/')) {
                        formatted = value.substring(0, 2) + '/' + value.substring(2);
                      }
                      if (value.length >= 5 && value.indexOf('/', 3) === -1) {
                        const parts = value.split('/');
                        if (parts.length === 2) {
                          formatted = parts[0] + '/' + parts[1].substring(0, 2) + '/' + parts[1].substring(2);
                        }
                      }
                      if (formatted.length <= 10) {
                        setEndDate(formatted);
                      }
                    }}
                    placeholder="dd/mm/yyyy"
                    maxLength={10}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={applyDateFilter} 
                  disabled={!startDate || !endDate}
                  className="w-full sm:w-auto"
                >
                  Áp dụng
                </Button>
                <Button 
                  variant="outline" 
                  onClick={resetFilter}
                  className="w-full sm:w-auto"
                >
                  Đặt lại
                </Button>
              </div>
            </div>
            {error && (
              <div className="mt-4 flex items-center text-red-600">
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Orders List */}
          <Card>
            <CardHeader>
              <CardTitle>Danh sách đơn hàng đã thanh toán ({filteredOrders.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto space-y-3">
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Không có đơn hàng đã thanh toán nào trong khoảng thời gian này
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <div
                      key={order.orderId}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          Đơn hàng #{order.orderId}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDateTime(order.orderTime)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          {formatPrice(order.totalAmount)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Revenue Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Thống kê doanh thu theo tháng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto space-y-3">
                {monthlyRevenue.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Chưa có dữ liệu doanh thu theo tháng
                  </div>
                ) : (
                  monthlyRevenue.map((month, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 bg-blue-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {month.month}
                        </div>
                        <div className="text-sm text-gray-600">
                          {month.orderCount} đơn hàng
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600">
                          {formatPrice(month.revenue)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top 5 Best Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2" />
              Top 5 sản phẩm bán chạy nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Chưa có dữ liệu sản phẩm bán chạy
                </div>
              ) : (
                topProducts.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full flex items-center justify-center text-lg font-bold">
                      {index + 1}
                    </div>
                    <div>
                        <div className="font-semibold text-gray-900">
                          {product.productName}
                        </div>
                        <div className="text-sm text-gray-600">
                          Xuất hiện trong {product.orderCount} đơn hàng
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xl text-orange-600">
                        {product.quantitySold} bán
                      </div>
                      <div className="text-sm text-green-600 font-medium">
                        {formatPrice(product.totalRevenue)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}



