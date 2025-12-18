"use client";

import * as React from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Product } from "@/lib/api";

export interface UpdateFormData {
  productId: number;
  name: string;
  price: string;
  imageUrl: string;
  categoryId: number;
  image: File | string | null;
}

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSubmit: (data: UpdateFormData) => void;
}

export function EditItemModal({ isOpen, onClose, product, onSubmit }: EditItemModalProps) {
  const [formData, setFormData] = React.useState<UpdateFormData>({
    productId: 0,
    name: "",
    price: "",
    imageUrl: "",
    categoryId: 0,
    image: null,
  });
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Initialize form data when product changes
  React.useEffect(() => {
    if (product) {
      setFormData({
        productId: product.productId,
        name: product.name,
        price: product.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), // Format with commas
        imageUrl: product.image || "",
        categoryId: product.category.categoryId,
        image: null,
      });
      setImagePreview(null);
    }
  }, [product]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image: null }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Use imageUrl if provided, otherwise use uploaded file, otherwise keep original
      const finalImageUrl = formData.imageUrl || (formData.image ? "uploaded-file" : (product?.image || ""));
      
      const submitData: UpdateFormData = {
        ...formData,
        imageUrl: finalImageUrl,
      };
      
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Có lỗi xảy ra khi cập nhật món. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (value: string) => {
    // Remove non-numeric characters except dots and commas
    const numericValue = value.replace(/[^\d]/g, "");
    // Format with thousands separator
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPrice(e.target.value);
    setFormData(prev => ({ ...prev, price: formatted }));
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Chỉnh sửa món ăn</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin món ăn. Các trường để trống sẽ giữ nguyên giá trị cũ.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product ID Display */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">
              <strong>ID:</strong> {product.productId} | <strong>Danh mục:</strong> {product.category.name}
            </div>
          </div>

          {/* Item Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Tên món <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="VD: Phở bò, Cà phê sữa đá..."
              className="w-full"
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price" className="text-sm font-medium">
              Giá tiền <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="price"
                value={formData.price}
                onChange={handlePriceChange}
                placeholder="VD: 50,000"
                className="pr-12"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                VNĐ
              </div>
            </div>
          </div>

          {/* Image URL Input */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl" className="text-sm font-medium">
              URL Hình ảnh
            </Label>
            <Input
              id="imageUrl"
              value={formData.imageUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
              placeholder="VD: https://example.com/image.jpg"
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Để trống để giữ hình ảnh hiện tại: {product.image || "Không có"}
            </p>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Hoặc tải lên hình ảnh mới</Label>
            
            {imagePreview ? (
              <div className="relative" style={{ height: '192px' }}>
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover rounded-lg border"
                  unoptimized
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 z-10"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-2">
                  Chọn hình ảnh mới từ thiết bị
                </p>
                <Button type="button" variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Tải lên
                </Button>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? "Đang cập nhật..." : "Cập nhật món"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

