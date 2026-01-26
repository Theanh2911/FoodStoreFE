"use client";

import * as React from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Star, User, Calendar, ShoppingCart, DollarSign } from "lucide-react";
import { apiService, formatPrice, formatDateTime, Rating } from "@/lib/api";
import { ProtectedRoute } from "@/components/protected-route";
import { RoleProtectedRoute } from "@/components/role-protected-route";
import Image from "next/image";

export default function DanhGiaPage() {
  return (
    <ProtectedRoute>
      <RoleProtectedRoute allowedRoles={["ADMIN"]}>
        <DanhGiaPageContent />
      </RoleProtectedRoute>
    </ProtectedRoute>
  );
}

function DanhGiaPageContent() {
  const [ratings, setRatings] = React.useState<Rating[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadRatings();
  }, []);

  const loadRatings = async () => {
    setIsLoading(true);
    setError(null);
    
    const result = await apiService.getAllRatings();
    
    if (result.error) {
      setError(result.error);
    } else if (result.data && result.data.data) {
      setRatings(result.data.data);
    }
    
    setIsLoading(false);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-lg font-semibold text-gray-700">
          {rating}/5
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />

      <main className="container mx-auto p-3 sm:p-4 lg:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Đánh giá từ khách hàng
            </h1>
            <p className="text-gray-600">
              Tổng số đánh giá: <span className="font-semibold">{ratings.length}</span>
            </p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Đang tải đánh giá...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center justify-center py-8">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <span className="ml-2 text-red-600">Lỗi: {error}</span>
          </div>
        )}

        {/* Ratings List */}
        {!isLoading && !error && (
          <div className="space-y-4">
            {ratings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Chưa có đánh giá nào.
              </div>
            ) : (
              ratings.map((rating) => (
                <Card key={rating.ratingId} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col space-y-3">
                      {/* Rating Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                          <CardTitle className="text-lg">
                            Đánh giá #{rating.ratingId}
                          </CardTitle>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Đơn hàng #{rating.orderId}
                          </Badge>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDateTime(rating.createdAt)}</span>
                        </div>
                      </div>

                      {/* Star Rating */}
                      <div className="flex items-center space-x-4">
                        {renderStars(rating.rating)}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Customer Comment */}
                    {rating.comment && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Nhận xét:</p>
                        <p className="text-gray-900">{rating.comment}</p>
                      </div>
                    )}

                    {/* Review Images */}
                    {rating.imageUrls && rating.imageUrls.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Hình ảnh đánh giá:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {rating.imageUrls.map((imageUrl, index) => (
                            <div
                              key={index}
                              className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200"
                            >
                              <Image
                                src={imageUrl}
                                alt={`Review image ${index + 1}`}
                                fill
                                className="object-cover hover:scale-110 transition-transform cursor-pointer"
                                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Order Details */}
                    {rating.orderDetails && (
                      <div className="border-t border-gray-200 pt-4">
                        <p className="text-sm font-medium text-gray-700 mb-3">Thông tin đơn hàng:</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                          <div className="flex items-center space-x-2 text-sm">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">Khách hàng:</span>
                            <span className="font-medium text-gray-900">
                              {rating.orderDetails.customerName || "Không có tên"}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <ShoppingCart className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">Bàn số:</span>
                            <span className="font-medium text-gray-900">
                              {rating.orderDetails.tableNumber}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">Thời gian đặt:</span>
                            <span className="font-medium text-gray-900">
                              {formatDateTime(rating.orderDetails.orderTime)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <DollarSign className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">Tổng tiền:</span>
                            <span className="font-medium text-green-600">
                              {formatPrice(rating.orderDetails.totalAmount)}
                            </span>
                          </div>
                        </div>

                        {/* Order Items */}
                        {rating.orderDetails.items && rating.orderDetails.items.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Món đã đặt:
                            </p>
                            <div className="space-y-2">
                              {rating.orderDetails.items.map((item) => (
                                <div
                                  key={item.orderItemId}
                                  className="flex justify-between items-center text-sm"
                                >
                                  <div className="flex-1">
                                    <span className="text-gray-900">{item.productName}</span>
                                    <span className="text-gray-500 ml-2">x{item.quantity}</span>
                                    {item.note && (
                                      <span className="text-blue-600 text-xs ml-2">
                                        ({item.note})
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-medium text-gray-900">
                                    {formatPrice(item.productPrice * item.quantity)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
