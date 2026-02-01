"use client";

import * as React from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Gift, Package, ShoppingCart, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { apiService, Product, Category, CreatePromotionRequest } from "@/lib/api";

interface CreatePromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PromotionType = 'PRODUCT' | 'ORDER' | null;

interface FormData {
  promotionType: PromotionType;
  productId: string;
  categoryId: string;
  discountPercentage: string;
  startDate: string;
  endDate: string;
  quantity: string;
  minOrderAmount: string;
}

export function CreatePromotionModal({ isOpen, onClose }: CreatePromotionModalProps) {
  const [step, setStep] = React.useState<'select' | 'form'>('select');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(false);

  const [formData, setFormData] = React.useState<FormData>({
    promotionType: null,
    productId: '',
    categoryId: '',
    discountPercentage: '',
    startDate: '',
    endDate: '',
    quantity: '',
    minOrderAmount: '',
  });

  React.useEffect(() => {
    if (isOpen && step === 'form') {
      fetchData();
    }
  }, [isOpen, step]);

  const fetchData = async () => {
    setIsLoadingData(true);
    const [productsResult, categoriesResult] = await Promise.all([
      apiService.getAllProducts(),
      apiService.getAllCategories(),
    ]);

    if (!productsResult.error) {
      setProducts(productsResult.data);
    }

    if (!categoriesResult.error) {
      setCategories(categoriesResult.data);
    }

    setIsLoadingData(false);
  };

  const handlePromotionTypeSelect = (type: PromotionType) => {
    setFormData(prev => ({ ...prev, promotionType: type }));
    setStep('form');
  };

  const handleBack = () => {
    setStep('select');
    setFormData({
      promotionType: null,
      productId: '',
      categoryId: '',
      discountPercentage: '',
      startDate: '',
      endDate: '',
      quantity: '',
      minOrderAmount: '',
    });
  };

  const handleClose = () => {
    setStep('select');
    setFormData({
      promotionType: null,
      productId: '',
      categoryId: '',
      discountPercentage: '',
      startDate: '',
      endDate: '',
      quantity: '',
      minOrderAmount: '',
    });
    onClose();
  };

  const formatPrice = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, "");
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const parseFormattedPrice = (value: string): number => {
    return parseInt(value.replace(/,/g, '')) || 0;
  };

  const validateForm = (): string | null => {
    if (!formData.discountPercentage) {
      return 'Vui lòng nhập phần trăm giảm giá';
    }

    const discount = parseFloat(formData.discountPercentage);
    if (isNaN(discount) || discount <= 0 || discount > 100) {
      return 'Phần trăm giảm giá phải từ 0 đến 100';
    }

    if (!formData.startDate) {
      return 'Vui lòng chọn ngày bắt đầu';
    }

    if (!formData.endDate) {
      return 'Vui lòng chọn ngày kết thúc';
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (endDate <= startDate) {
      return 'Ngày kết thúc phải sau ngày bắt đầu';
    }

    if (!formData.quantity) {
      return 'Vui lòng nhập số lượng mã';
    }

    const quantity = parseInt(formData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      return 'Số lượng mã phải lớn hơn 0';
    }

    if (!formData.minOrderAmount) {
      return 'Vui lòng nhập giá trị đơn hàng tối thiểu';
    }

    const minOrderAmount = parseFormattedPrice(formData.minOrderAmount);
    if (minOrderAmount < 0) {
      return 'Giá trị đơn hàng tối thiểu phải lớn hơn hoặc bằng 0';
    }

    if (formData.promotionType === 'PRODUCT' && !formData.productId) {
      return 'Vui lòng chọn sản phẩm';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData: CreatePromotionRequest = {
        promotionType: formData.promotionType!,
        discountPercentage: parseFloat(formData.discountPercentage),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        quantity: parseInt(formData.quantity),
        minOrderAmount: parseFormattedPrice(formData.minOrderAmount),
      };

      if (formData.promotionType === 'PRODUCT') {
        requestData.productId = formData.productId ? parseInt(formData.productId) : null;
        requestData.categoryId = formData.categoryId ? parseInt(formData.categoryId) : null;
      } else {
        requestData.productId = null;
        requestData.categoryId = null;
      }

      const result = await apiService.createPromotion(requestData);

      if (result.error) {
        toast.error('Có lỗi xảy ra khi tạo mã khuyến mãi');
      } else {
        toast.success('Tạo mã khuyến mãi thành công');
        handleClose();
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tạo mã khuyến mãi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSelectStep = () => (
    <>
      <DialogHeader>
        <DialogTitle className="text-xl font-bold flex items-center gap-2">
          <Gift className="h-5 w-5 text-purple-600" />
          Chọn loại khuyến mãi
        </DialogTitle>
        <DialogDescription>
          Chọn loại mã khuyến mãi bạn muốn tạo
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
        {/* Product Promotion Card */}
        <button
          onClick={() => handlePromotionTypeSelect('PRODUCT')}
          className="group relative p-6 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-lg transition-all cursor-pointer text-left"
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <Package className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">
                Khuyến mãi món
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Giảm giá cho sản phẩm cụ thể
              </p>
            </div>
          </div>
        </button>

        {/* Order Promotion Card */}
        <button
          onClick={() => handlePromotionTypeSelect('ORDER')}
          className="group relative p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer text-left"
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">
                Khuyến mãi đơn
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Giảm giá cho toàn bộ đơn hàng
              </p>
            </div>
          </div>
        </button>
      </div>
    </>
  );

  const renderFormStep = () => (
    <>
      <DialogHeader>
        <DialogTitle className="text-xl font-bold flex items-center gap-2">
          {formData.promotionType === 'PRODUCT' ? (
            <>
              <Package className="h-5 w-5 text-purple-600" />
              Tạo mã khuyến mãi món
            </>
          ) : (
            <>
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              Tạo mã khuyến mãi đơn
            </>
          )}
        </DialogTitle>
        <DialogDescription>
          Điền thông tin để tạo mã khuyến mãi mới
        </DialogDescription>
      </DialogHeader>

      {isLoadingData ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {/* Product Selection - Only for PRODUCT type */}
          {formData.promotionType === 'PRODUCT' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="product" className="text-sm font-medium">
                  Sản phẩm <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.productId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, productId: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn sản phẩm" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.productId} value={product.productId.toString()}>
                        {product.name} - {new Intl.NumberFormat('vi-VN').format(product.price)} VNĐ
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">
                  Danh mục (Không bắt buộc)
                </Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.categoryId} value={category.categoryId.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Discount Percentage */}
          <div className="space-y-2">
            <Label htmlFor="discount" className="text-sm font-medium">
              Phần trăm giảm giá <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="discount"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.discountPercentage}
                onChange={(e) => setFormData(prev => ({ ...prev, discountPercentage: e.target.value }))}
                placeholder="VD: 20"
                className="pr-8"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                %
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm font-medium">
                Ngày bắt đầu <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-sm font-medium">
                Ngày kết thúc <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-sm font-medium">
              Số lượng mã <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
              placeholder="VD: 100"
            />
          </div>

          {/* Minimum Order Amount */}
          <div className="space-y-2">
            <Label htmlFor="minOrderAmount" className="text-sm font-medium">
              Giá trị đơn hàng tối thiểu <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="minOrderAmount"
                value={formData.minOrderAmount}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  minOrderAmount: formatPrice(e.target.value) 
                }))}
                placeholder="VD: 100,000"
                className="pr-12"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                VNĐ
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                'Tạo mã khuyến mãi'
              )}
            </Button>
          </DialogFooter>
        </form>
      )}
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
        {step === 'select' ? renderSelectStep() : renderFormStep()}
      </DialogContent>
    </Dialog>
  );
}
