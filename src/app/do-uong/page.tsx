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

export default function DoUongPage() {
  return (
    <ProtectedRoute>
      <DoUongPageContent />
    </ProtectedRoute>
  );
}

function DoUongPageContent() {
  const { user } = useAuth();
  const [drinkItems, setDrinkItems] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  
  const drinkCategories = ["Cà phê", "Trà", "Nước ép", "Sinh tố", "Nước tự nhiên", "Bia", "Nước ngọt"];
  const isAdmin = user?.role === "ADMIN";

  // Fetch drink items from backend
  React.useEffect(() => {
    const fetchDrinkItems = async () => {
      setIsLoading(true);
      setError(null);
      
      const result = await apiService.getProductsByCategory(CATEGORY_IDS.DRINKS);
      
      if (result.error) {
        setError(result.error);
      } else {
        setDrinkItems(result.data);
      }
      
      setIsLoading(false);
    };

    fetchDrinkItems();
  }, []);

  const handleAddItem = async (formData: AddItemFormData) => {
    try {
      console.log("📝 Form data received:", formData);

      // Prepare data for API call
      const productData = {
        name: formData.name,
        price: parseFloat(formData.price.replace(/,/g, '')), // Remove commas and convert to number
        categoryId: CATEGORY_IDS.DRINKS,
        image: formData.image || formData.imageUrl || "", // Use uploaded file or image URL
      };

      console.log("🔄 Sending to API:", productData);

      // Call the backend API to add the product
      const addResult = await apiService.addProduct(productData);
      
      if (addResult.error) {
        console.error("❌ Failed to add product:", addResult.error);
        alert(`Lỗi khi thêm đồ uống: ${addResult.error}`);
        return;
      }

      console.log("✅ Product added successfully:", addResult.data);
      alert("Đã thêm đồ uống mới thành công!");

      // Refresh the product list from backend
      const refreshResult = await apiService.getProductsByCategory(CATEGORY_IDS.DRINKS);
      if (!refreshResult.error) {
        setDrinkItems(refreshResult.data);
        console.log("🔄 Product list refreshed");
      }

    } catch (error) {
      console.error("💥 Error adding item:", error);
      alert("Có lỗi xảy ra khi thêm đồ uống. Vui lòng thử lại.");
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const handleEditItem = async (formData: UpdateFormData) => {
    try {
      console.log("📝 Edit form data received:", formData);

      const productData = {
        productId: formData.productId,
        name: formData.name || editingProduct?.name || "",
        price: formData.price ? parseFloat(formData.price.replace(/,/g, '')) : editingProduct?.price || 0,
        image: formData.image || formData.imageUrl || editingProduct?.image || "",
        categoryId: formData.categoryId || editingProduct?.category.categoryId || CATEGORY_IDS.DRINKS,
      };

      console.log("🔄 Sending update to API:", productData);

      const updateResult = await apiService.updateProduct(formData.productId, productData);
      
      if (updateResult.error) {
        console.error("❌ Failed to update product:", updateResult.error);
        alert(`Lỗi khi cập nhật đồ uống: ${updateResult.error}`);
        return;
      }

      console.log("✅ Product updated successfully:", updateResult.data);
      alert("Đã cập nhật đồ uống thành công!");

      const refreshResult = await apiService.getProductsByCategory(CATEGORY_IDS.DRINKS);
      if (!refreshResult.error) {
        setDrinkItems(refreshResult.data);
        console.log("🔄 Product list refreshed");
      }

      setIsEditModalOpen(false);
      setEditingProduct(null);

    } catch (error) {
      console.error("💥 Error updating item:", error);
      alert("Có lỗi xảy ra khi cập nhật đồ uống. Vui lòng thử lại.");
    }
  };

  const handleDeleteClick = async (productId: number) => {
    // Show confirmation dialog
    const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa đồ uống này không?");
    
    if (!confirmDelete) {
      return;
    }

    try {
      console.log("🗑️ Deleting product:", productId);

      // Call the backend API to delete the product
      const deleteResult = await apiService.deleteProduct(productId);
      
      if (deleteResult.error) {
        console.error("❌ Failed to delete product:", deleteResult.error);
        alert(`Lỗi khi xóa đồ uống: ${deleteResult.error}`);
        return;
      }

      console.log("✅ Product deleted successfully");
      alert("Đã xóa đồ uống thành công!");

      // Refresh the product list from backend
      const refreshResult = await apiService.getProductsByCategory(CATEGORY_IDS.DRINKS);
      if (!refreshResult.error) {
        setDrinkItems(refreshResult.data);
        console.log("🔄 Product list refreshed");
      }

    } catch (error) {
      console.error("💥 Error deleting item:", error);
      alert("Có lỗi xảy ra khi xóa đồ uống. Vui lòng thử lại.");
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
              Đồ uống
            </h1>
            <p className="text-gray-600">
              Quản lý thực đơn đồ uống của cửa hàng
            </p>
          </div>
          {isAdmin && (
            <Button 
              className="mt-4 sm:mt-0 w-full sm:w-auto"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm đồ uống mới
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

        {/* Drink Items Grid */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {drinkItems.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                Chưa có đồ uống nào. Hãy thêm đồ uống mới!
              </div>
            ) : (
              drinkItems.map((item) => (
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
                      <div className="text-xl font-bold text-green-600">
                        {formatPrice(item.price)}
                      </div>
                      {isAdmin && (
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditClick(item)}
                            title="Chỉnh sửa đồ uống"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteClick(item.productId)}
                            title="Xóa đồ uống"
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
        title="Thêm đồ uống mới"
        categories={drinkCategories}
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
