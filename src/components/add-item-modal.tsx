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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export interface AddItemFormData {
  name: string;
  price: string;
  imageUrl: string;
  image: File | string | null;
}

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  categories: string[];
  onSubmit: (data: AddItemFormData) => void;
}

export function AddItemModal({ isOpen, onClose, title, onSubmit }: AddItemModalProps) {
  const [formData, setFormData] = React.useState<AddItemFormData>({
    name: "",
    price: "",
    imageUrl: "",
    image: null,
  });
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    setIsSubmitting(true);

    try {
      // Use imageUrl if provided, otherwise use uploaded file
      const submitData = {
        ...formData,
        image: formData.imageUrl || formData.image,
      };

      await onSubmit(submitData);
      // Reset form
      setFormData({
        name: "",
        price: "",
        imageUrl: "",
        image: null,
      });
      setImagePreview(null);
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Có lỗi xảy ra khi thêm món. Vui lòng thử lại.");
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          <DialogDescription>
            Thêm món mới vào thực đơn. Vui lòng điền đầy đủ thông tin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              Nhập URL hình ảnh hoặc tải lên file bên dưới
            </p>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Hoặc tải lên hình ảnh</Label>

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
                  Chọn hình ảnh từ thiết bị
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
              {isSubmitting ? "Đang thêm..." : "Thêm món"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


