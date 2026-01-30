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

export default function DoAnThemPage() {
  return (
    <ProtectedRoute>
      <DoAnThemPageContent />
    </ProtectedRoute>
  );
}

function DoAnThemPageContent() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const [additionalItems, setAdditionalItems] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);

  const additionalCategories = ["Tráng miệng", "Ăn vặt", "Ăn kèm", "Gia vị", "Bánh kẹo", "Khác"];
  const isAdmin = user?.role === "ADMIN";

  // Fetch additional items from backend
  React.useEffect(() => {
    const fetchAdditionalItems = async () => {
      setIsLoading(true);
      setError(null);

      const result = await apiService.getProductsByCategory(CATEGORY_IDS.ADDITIONAL);

      if (result.error) {
        setError(result.error);
      } else {
        setAdditionalItems(result.data);
      }

      setIsLoading(false);
    };

    fetchAdditionalItems();
  }, []);

  const handleAddItem = async (formData: AddItemFormData) => {
    try {
      const productData = {
        name: formData.name,
        price: parseFloat(formData.price.replace(/,/g, '')),
        categoryId: CATEGORY_IDS.ADDITIONAL,
        image: formData.image || formData.imageUrl || "",
      };

      const addResult = await apiService.addProduct(productData);

      if (addResult.error) {
        toast.error(`Lỗi khi thêm món phụ: ${addResult.error}`);
        return;
      }
      toast.success("Đã thêm món phụ mới thành công!");

      // Refresh the product list from backend
      const refreshResult = await apiService.getProductsByCategory(CATEGORY_IDS.ADDITIONAL);
      if (!refreshResult.error) {
        setAdditionalItems(refreshResult.data);
      }

    } catch (error) {
      toast.error("Có lỗi xảy ra khi thêm món phụ. Vui lòng thử lại.");
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const handleEditItem = async (formData: UpdateFormData) => {
    try {

      const productData = {
        productId: formData.productId,
        name: formData.name || editingProduct?.name || "",
        price: formData.price ? parseFloat(formData.price.replace(/,/g, '')) : editingProduct?.price || 0,
        cost: formData.cost ? parseFloat(formData.cost.replace(/,/g, '')) : editingProduct?.cost || 0,
        defaultDailyLimit: formData.defaultDailyLimit ? parseInt(formData.defaultDailyLimit) : (editingProduct?.defaultDailyLimit ?? null),
        image: formData.image || formData.imageUrl || editingProduct?.image || "",
        categoryId: formData.categoryId || editingProduct?.category.categoryId || CATEGORY_IDS.ADDITIONAL,
      };

      const updateResult = await apiService.updateProduct(formData.productId, productData);

      if (updateResult.error) {
        toast.error(`Lỗi khi cập nhật món phụ: ${updateResult.error}`);
        return;
      }

      toast.success("Đã cập nhật món phụ thành công!");

      const refreshResult = await apiService.getProductsByCategory(CATEGORY_IDS.ADDITIONAL);
      if (!refreshResult.error) {
        setAdditionalItems(refreshResult.data);
      }

      setIsEditModalOpen(false);
      setEditingProduct(null);

    } catch (error) {
      toast.error("Có lỗi xảy ra khi cập nhật món phụ. Vui lòng thử lại.");
    }
  };

  const handleDeleteClick = async (productId: number) => {
    const confirmed = await confirm({
      title: "Xác nhận xóa món phụ",
      description: "Bạn có chắc chắn muốn xóa món phụ này không? Hành động này không thể hoàn tác.",
      confirmText: "Xóa",
      cancelText: "Huỷ",
      variant: "destructive"
    });

    if (!confirmed) {
      return;
    }

    try {
      // Call the backend API to delete the product
      const deleteResult = await apiService.deleteProduct(productId);

      if (deleteResult.error) {
        toast.error(`Lỗi khi xóa món phụ: ${deleteResult.error}`);
        return;
      }

      toast.success("Đã xóa món phụ thành công!");

      // Refresh the product list from backend
      const refreshResult = await apiService.getProductsByCategory(CATEGORY_IDS.ADDITIONAL);
      if (!refreshResult.error) {
        setAdditionalItems(refreshResult.data);
      }

    } catch (error) {
      toast.error("Có lỗi xảy ra khi xóa món phụ. Vui lòng thử lại.");
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
              Đồ ăn thêm
            </h1>
            <p className="text-gray-600">
              Quản lý các món ăn kèm, tráng miệng và gia vị
            </p>
          </div>
          {isAdmin && (
            <Button
              className="mt-4 sm:mt-0 w-full sm:w-auto"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm món phụ
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

        {/* Additional Items Grid */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {additionalItems.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                Chưa có món phụ nào. Hãy thêm món phụ mới!
              </div>
            ) : (
              additionalItems.map((item) => (
                <Card key={item.productId} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <ProductImage
                          imageUrl={item.image}
                          productName={item.name}
                          categoryName={item.category.name}
                          className="w-12 h-12"
                        />
                        <div>
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                          <p className="text-sm text-gray-500">{item.category.name}</p>
                        </div>
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(item)}
                            title="Chỉnh sửa món phụ"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteClick(item.productId)}
                            title="Xóa món phụ"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </main>

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Thêm món phụ mới"
        categories={additionalCategories}
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
