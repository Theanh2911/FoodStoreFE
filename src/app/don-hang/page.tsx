"use client";

import * as React from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, AlertCircle, Clock, CheckCircle, Filter, Check, ChefHat, CreditCard, Wifi, WifiOff, PartyPopper } from "lucide-react";
import { apiService, formatPrice, Order, formatDateTime, parseOrderTime } from "@/lib/api";
import { ProtectedRoute } from "@/components/protected-route";

export default function DonHangPage() {
  return (
    <ProtectedRoute>
      <DonHangPageContent />
    </ProtectedRoute>
  );
}

function DonHangPageContent() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = React.useState<Order[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = React.useState<"connecting" | "connected" | "disconnected">("connecting");
  const [activeFilter, setActiveFilter] = React.useState<"all" | "pending" | "served" | "paid">("all");
  const [confirmDialog, setConfirmDialog] = React.useState<{
    isOpen: boolean;
    orderId: number | null;
    currentStatus: string;
    newStatus: string;
    actionText: string;
  }>({ isOpen: false, orderId: null, currentStatus: "", newStatus: "", actionText: "" });
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);
  const [paymentSuccessModal, setPaymentSuccessModal] = React.useState<{
    isOpen: boolean;
    order: Order | null;
  }>({ isOpen: false, order: null });
  const previousOrdersRef = React.useRef<Order[]>([]);
  const manualUpdateOrderIdsRef = React.useRef<Set<number>>(new Set());

  React.useEffect(() => {
    setIsLoading(true);
    setError(null);
    setConnectionStatus("connecting");

    const cleanup = apiService.connectToOrdersStream(
      (ordersData: Order[]) => {
        if (Array.isArray(ordersData)) {
          setOrders(ordersData);
          setIsLoading(false);
          setError(null);
          setConnectionStatus("connected");
        } else {
          setError('Invalid data format received from server');
        }
      },
      (errorMessage: string) => {
        setError(errorMessage);
        setConnectionStatus("disconnected");
        setIsLoading(false);
      },
      () => {
        setConnectionStatus("connected");
        setError(null);
      }
    );

    return cleanup;
  }, []);

  React.useEffect(() => {
    if (!Array.isArray(orders)) {
      setFilteredOrders([]);
      return;
    }

    switch (activeFilter) {
      case "pending":
        setFilteredOrders(orders.filter(order => order.status === "PENDING"));
        break;
      case "served":
        setFilteredOrders(orders.filter(order => order.status === "SERVED"));
        break;
      case "paid":
        setFilteredOrders(orders.filter(order => order.status === "PAID"));
        break;
      default:
        setFilteredOrders(orders);
    }
  }, [orders, activeFilter]);

  // Detect SERVED → PAID transitions for payment success modal
  React.useEffect(() => {
    if (previousOrdersRef.current.length === 0) {
      previousOrdersRef.current = orders;
      return;
    }

    // Check each current order for status change
    orders.forEach(currentOrder => {
      const previousOrder = previousOrdersRef.current.find(
        prev => prev.orderId === currentOrder.orderId
      );

      // Detect SERVED → PAID transition (online payment)
      if (
        previousOrder &&
        previousOrder.status === "SERVED" &&
        currentOrder.status === "PAID" &&
        !manualUpdateOrderIdsRef.current.has(currentOrder.orderId)
      ) {
        // Show payment success modal
        setPaymentSuccessModal({
          isOpen: true,
          order: currentOrder,
        });
      }
    });

    // Clear manual update tracking after processing
    manualUpdateOrderIdsRef.current.clear();
    previousOrdersRef.current = orders;
  }, [orders]);

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Đang chờ
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Hoàn thành
          </Badge>
        );
      case "SERVED":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <ChefHat className="h-3 w-3 mr-1" />
            Đã phục vụ
          </Badge>
        );
      case "PAID":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CreditCard className="h-3 w-3 mr-1" />
            Đã thanh toán
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Đã hủy
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  // formatDateTime is now imported from api.ts

  const calculateOrderTotal = (order: Order) => {
    return order.items.reduce((total, item) => total + (item.productPrice * item.quantity), 0);
  };

  const handleStatusChange = (order: Order, newStatus: string, actionText: string) => {
    setConfirmDialog({
      isOpen: true,
      orderId: order.orderId,
      currentStatus: order.status,
      newStatus,
      actionText
    });
  };

  const confirmStatusChange = async () => {
    if (!confirmDialog.orderId) return;

    setIsUpdatingStatus(true);
    const result = await apiService.updateOrderStatus(confirmDialog.orderId, confirmDialog.newStatus);

    if (result.error) {
      setError(`Lỗi cập nhật trạng thái: ${result.error}`);
    } else {
      // Mark this order as manually updated to prevent payment success modal
      manualUpdateOrderIdsRef.current.add(confirmDialog.orderId);

      // Update the orders list with the new status
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.orderId === confirmDialog.orderId
            ? { ...order, status: confirmDialog.newStatus }
            : order
        )
      );
    }

    setIsUpdatingStatus(false);
    setConfirmDialog({ isOpen: false, orderId: null, currentStatus: "", newStatus: "", actionText: "" });
  };

  const getStatusActionButton = (order: Order) => {
    if (order.status === "PENDING") {
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleStatusChange(order, "SERVED", "đánh dấu là đã phục vụ")}
          className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs sm:text-sm whitespace-nowrap"
        >
          <ChefHat className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          Đã phục vụ
        </Button>
      );
    }

    if (order.status === "SERVED") {
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleStatusChange(order, "PAID", "đánh dấu là đã thanh toán")}
          className="text-green-600 border-green-200 hover:bg-green-50 text-xs sm:text-sm whitespace-nowrap"
        >
          <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          Đã thanh toán
        </Button>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />

      <main className="container mx-auto p-3 sm:p-4 lg:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Đơn hàng
              </h1>
              <div className="flex items-center space-x-1">
              </div>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
            <Button
              variant={activeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("all")}
              className="flex items-center justify-center space-x-1 text-xs sm:text-sm min-w-0"
            >
              <Filter className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">Tất cả</span>
              <Badge variant="secondary" className="ml-1 text-xs flex-shrink-0">
                {Array.isArray(orders) ? orders.length : 0}
              </Badge>
            </Button>
            <Button
              variant={activeFilter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("pending")}
              className="flex items-center justify-center space-x-1 text-xs sm:text-sm min-w-0"
            >
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">Đang chờ</span>
              <Badge variant="secondary" className="ml-1 text-xs flex-shrink-0">
                {Array.isArray(orders) ? orders.filter(order => order.status === "PENDING").length : 0}
              </Badge>
            </Button>
            <Button
              variant={activeFilter === "served" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("served")}
              className="flex items-center justify-center space-x-1 text-xs sm:text-sm min-w-0"
            >
              <ChefHat className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">Đã phục vụ</span>
              <Badge variant="secondary" className="ml-1 text-xs flex-shrink-0">
                {Array.isArray(orders) ? orders.filter(order => order.status === "SERVED").length : 0}
              </Badge>
            </Button>
            <Button
              variant={activeFilter === "paid" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("paid")}
              className="flex items-center justify-center space-x-1 text-xs sm:text-sm min-w-0"
            >
              <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">Đã thanh toán</span>
              <Badge variant="secondary" className="ml-1 text-xs flex-shrink-0">
                {Array.isArray(orders) ? orders.filter(order => order.status === "PAID").length : 0}
              </Badge>
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Đang tải đơn hàng...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <span className="ml-2 text-red-600">
                {connectionStatus === "disconnected"
                  ? "Mất kết nối với server. Đang thử kết nối lại..."
                  : `Lỗi: ${error}`
                }
              </span>
            </div>
            {connectionStatus === "disconnected" && (
              <div className="text-sm text-gray-500 text-center">
                <p>Hệ thống sẽ tự động thử kết nối lại sau 3 giây.</p>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => window.location.reload()}
                >
                  Tải lại trang
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Orders List */}
        {!isLoading && !error && (
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {activeFilter === "pending"
                  ? "Không có đơn hàng đang chờ nào."
                  : activeFilter === "served"
                    ? "Không có đơn hàng đã phục vụ nào."
                    : activeFilter === "paid"
                      ? "Không có đơn hàng đã thanh toán nào."
                      : "Chưa có đơn hàng nào."
                }
              </div>
            ) : (
              filteredOrders.map((order) => (
                <Card key={order.orderId} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                        <CardTitle className="text-lg">
                          Đơn hàng #{order.orderId}
                        </CardTitle>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="text-sm text-gray-500 space-y-1">
                        <div>Bàn số: {order.tableNumber}</div>
                        <div>{formatDateTime(order.orderTime)}</div>
                        {order.customerName && (
                          <div>Khách hàng: {order.customerName}</div>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Order Note */}
                    {order.note && (
                      <div className="mb-4 text-sm text-gray-600">
                        <span className="font-medium">Ghi chú:</span> {order.note}
                      </div>
                    )}

                    {/* Order Items */}
                    <div className="space-y-2 mb-4">
                      <h4 className="font-medium text-gray-700 mb-2">Chi tiết đơn hàng:</h4>
                      {order.items.map((item) => (
                        <div key={item.orderItemId} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{item.productName}</div>
                            <div className="text-sm text-gray-500">
                              {formatPrice(item.productPrice)} x {item.quantity}
                              {item.note && (
                                <span className="ml-2 text-blue-600">({item.note})</span>
                              )}
                            </div>
                          </div>
                          <div className="font-medium text-gray-900">
                            {formatPrice(item.productPrice * item.quantity)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Total and Action Button */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-4 border-t border-gray-200 space-y-3 sm:space-y-0">
                      <div className="flex flex-col">
                        <span className="text-lg font-bold text-gray-700">Tổng cộng:</span>
                        <span className="text-xl font-bold text-green-600">
                          {formatPrice(calculateOrderTotal(order))}
                        </span>
                      </div>
                      <div className="flex justify-end sm:justify-start">
                        {getStatusActionButton(order)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </main>

      {/* Status Change Confirmation Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && setConfirmDialog({ isOpen: false, orderId: null, currentStatus: "", newStatus: "", actionText: "" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận thay đổi trạng thái</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn {confirmDialog.actionText} cho đơn hàng #{confirmDialog.orderId}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ isOpen: false, orderId: null, currentStatus: "", newStatus: "", actionText: "" })}
              disabled={isUpdatingStatus}
            >
              Hủy
            </Button>
            <Button
              onClick={confirmStatusChange}
              disabled={isUpdatingStatus}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUpdatingStatus ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                "Xác nhận"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Success Modal */}
      <Dialog
        open={paymentSuccessModal.isOpen}
        onOpenChange={(open) => !open && setPaymentSuccessModal({ isOpen: false, order: null })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl text-green-600">
              Thanh toán thành công!
            </DialogTitle>
            <DialogDescription className="text-center">
              Đơn hàng đã được thanh toán online
            </DialogDescription>
          </DialogHeader>

          {paymentSuccessModal.order && (
            <div className="space-y-4 py-4">
              {/* Table Number */}
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-600 font-medium">Bàn số:</span>
                <span className="text-lg font-bold text-gray-900">
                  {paymentSuccessModal.order.tableNumber}
                </span>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Món đã đặt:</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {paymentSuccessModal.order.items.map((item) => (
                    <div
                      key={item.orderItemId}
                      className="flex justify-between items-center text-sm py-1"
                    >
                      <span className="text-gray-600">
                        {item.productName} <span className="text-gray-400">x {item.quantity}</span>
                      </span>
                      <span className="font-medium text-gray-900">
                        {formatPrice(item.productPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Amount */}
              <div className="flex justify-between items-center pt-3 border-t-2 border-gray-200">
                <span className="text-lg font-bold text-gray-700">Tổng cộng:</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatPrice(calculateOrderTotal(paymentSuccessModal.order))}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-center">
            <Button
              onClick={() => setPaymentSuccessModal({ isOpen: false, order: null })}
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
