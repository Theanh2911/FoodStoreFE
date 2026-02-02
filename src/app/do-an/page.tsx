"use client";

import * as React from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddItemModal, AddItemFormData } from "@/components/add-item-modal";
import { EditItemModal, UpdateFormData } from "@/components/edit-item-modal";
import { Plus, Edit, Trash2, Loader2, AlertCircle } from "lucide-react";
import { apiService, formatPrice, CATEGORY_IDS, Product } from "@/lib/api";
import { ProductImage } from "@/components/product-image";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useInventory } from "@/contexts/inventory-context";

export default function DoAnPage() {
  return (
    <ProtectedRoute>
      <DoAnPageContent />
    </ProtectedRoute>
  );
}

function DoAnPageContent() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const [foodItems, setFoodItems] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const { inventory } = useInventory();

  const foodCategories = ["Món chính", "Ăn sáng", "Khai vị", "Món nướng", "Món chiên"];
  const isAdmin = user?.role === "ADMIN";

  // Fetch food items from backend
  React.useEffect(() => {
    const fetchFoodItems = async () => {
      setIsLoading(true);
      setError(null);

      const result = await apiService.getProductsByCategory(CATEGORY_IDS.FOOD);

      if (result.error) {
        setError(result.error);
      } else {
        setFoodItems(result.data);
      }

      setIsLoading(false);
    };

    fetchFoodItems();
  }, []);

  const handleAddItem = async (formData: AddItemFormData) => {
    try {
      // Prepare data for API call
      const productData = {
        name: formData.name,
        price: parseFloat(formData.price.replace(/,/g, '')), // Remove commas and convert to number
        categoryId: CATEGORY_IDS.FOOD,
        image: formData.image || formData.imageUrl || "", // Use uploaded file or image URL
      };

      // Call the backend API to add the product
      const addResult = await apiService.addProduct(productData);

      if (addResult.error) {
        toast.error(`Lỗi khi thêm món: ${addResult.error}`);
        return;
      }

      toast.success("Đã thêm món mới thành công!");

      // Refresh the product list from backend
      const refreshResult = await apiService.getProductsByCategory(CATEGORY_IDS.FOOD);
      if (!refreshResult.error) {
        setFoodItems(refreshResult.data);
      }

    } catch (error) {
      toast.error("Có lỗi xảy ra khi thêm món. Vui lòng thử lại.");
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const handleEditItem = async (formData: UpdateFormData) => {
    try {
      // Prepare data for API call - use form data or fallback to original product data
      const productData = {
        productId: formData.productId,
        name: formData.name || editingProduct?.name || "",
        price: formData.price ? parseFloat(formData.price.replace(/,/g, '')) : editingProduct?.price || 0,
        cost: formData.cost ? parseFloat(formData.cost.replace(/,/g, '')) : editingProduct?.cost || 0,
        defaultDailyLimit: formData.defaultDailyLimit ? parseInt(formData.defaultDailyLimit) : (editingProduct?.defaultDailyLimit ?? null),
        image: formData.image || formData.imageUrl || editingProduct?.image || "",
        categoryId: formData.categoryId || editingProduct?.category.categoryId || CATEGORY_IDS.FOOD,
      };

      // Call the backend API to update the product
      const updateResult = await apiService.updateProduct(formData.productId, productData);

      if (updateResult.error) {
        toast.error(`Lỗi khi cập nhật món: ${updateResult.error}`);
        return;
      }

      toast.success("Đã cập nhật món thành công!");

      // Refresh the product list from backend
      const refreshResult = await apiService.getProductsByCategory(CATEGORY_IDS.FOOD);
      if (!refreshResult.error) {
        setFoodItems(refreshResult.data);
      }

      setIsEditModalOpen(false);
      setEditingProduct(null);

    } catch (error) {
      toast.error("Có lỗi xảy ra khi cập nhật món. Vui lòng thử lại.");
    }
  };

  const handleDeleteClick = async (productId: number) => {
    const confirmed = await confirm({
      title: "Xác nhận xóa món ăn",
      description: "Bạn có chắc chắn muốn xóa món này không? Hành động này không thể hoàn tác.",
      confirmText: "Xóa",
      cancelText: "Huỷ",
      variant: "destructive"
    });

    if (!confirmed) {
      return;
    }

    try {
      const deleteResult = await apiService.deleteProduct(productId);

      if (deleteResult.error) {
        toast.error(`Lỗi khi xóa món: ${deleteResult.error}`);
        return;
      }

      toast.success("Đã xóa món thành công!");

      const refreshResult = await apiService.getProductsByCategory(CATEGORY_IDS.FOOD);
      if (!refreshResult.error) {
        setFoodItems(refreshResult.data);
      }

    } catch (error) {
      toast.error("Có lỗi xảy ra khi xóa món. Vui lòng thử lại.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />

      <main className="container mx-auto p-3 sm:p-4 lg:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Đồ ăn
            </h1>
            <p className="text-gray-600">
              Quản lý thực đơn đồ ăn của cửa hàng
            </p>
          </div>
          {isAdmin && (
            <Button
              className="mt-4 sm:mt-0 w-full sm:w-auto"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm món mới
            </Button>
          )}
        </div>

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
            <Button
              variant="outline"
              className="ml-4"
              onClick={() => window.location.reload()}
            >
              Thử lại
            </Button>
          </div>
        )}

        {/* Food Items Grid */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {foodItems.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                Chưa có món ăn nào. Hãy thêm món mới!
              </div>
            ) : (
              foodItems.map((item) => {
                const remainingQuantity = inventory[item.productId];
                const isOutOfStock = remainingQuantity !== undefined && remainingQuantity !== null && remainingQuantity === 0;
                const displayText = remainingQuantity !== undefined && remainingQuantity !== null 
                  ? (isOutOfStock ? "Hết hàng" : `Còn lại: ${remainingQuantity}`) 
                  : "Còn nguyên";
                const badgeClass = isOutOfStock 
                  ? "text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded whitespace-nowrap"
                  : "text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded whitespace-nowrap";
                
                return (
                  <Card key={item.productId} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3 flex-1">
                          <ProductImage
                            imageUrl={item.image}
                            productName={item.name}
                            categoryName={item.category.name}
                            className="w-12 h-12"
                          />
                          <div className="flex-1">
                            <CardTitle className="text-lg">{item.name}</CardTitle>
                            <p className="text-sm text-gray-500">{item.category.name}</p>
                          </div>
                        </div>
                        <div className={badgeClass}>
                          {displayText}
                        </div>
                      </div>
                    </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xl font-bold text-green-600">
                          {formatPrice(item.price)}
                        </div>
                        {item.cost !== undefined && item.cost > 0 && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            Chi phí: {formatPrice(item.cost)}
                          </div>
                        )}
                      </div>
                      {isAdmin && (
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditClick(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteClick(item.productId)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Thêm món ăn mới"
        categories={foodCategories}
        onSubmit={handleAddItem}
      />

      {/* Edit Item Modal */}
      <EditItemModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        onSubmit={handleEditItem}
      />
    </div>
  );
}
