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
import { Gift, Package, ShoppingCart, Loader2, ArrowLeft, List, Ban } from "lucide-react";
import { toast } from "sonner";
import { apiService, Product, CreatePromotionRequest, PromotionResponse } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

interface CreatePromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PromotionType = 'PRODUCT' | 'ORDER' | null;
type Step = 'select' | 'form' | 'manage';

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
  const [step, setStep] = React.useState<Step>('select');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [promotions, setPromotions] = React.useState<PromotionResponse[]>([]);
  const [isLoadingData, setIsLoadingData] = React.useState(false);
  const [isLoadingPromotions, setIsLoadingPromotions] = React.useState(false);

  const [formData, setFormData] = React.useState<FormData>({
    promotionType: null,
    productId: '',
    categoryId: '', // Kept for interface compatibility but not used in UI
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
    const productsResult = await apiService.getAllProducts();

    if (!productsResult.error) {
      setProducts(productsResult.data);
    }

    setIsLoadingData(false);
  };

  const fetchPromotions = async () => {
    setIsLoadingPromotions(true);
    const result = await apiService.getAllPromotions();

    if (!result.error) {
      setPromotions(result.data);
    } else {
      toast.error('Không thể tải danh sách mã khuyến mãi');
    }

    setIsLoadingPromotions(false);
  };

  const handleDeactivate = async (code: string) => {
    const result = await apiService.deactivatePromotion(code);

    if (!result.error) {
      toast.success('Vô hiệu hóa mã thành công');
      // Refresh promotions list
      fetchPromotions();
    } else {
      toast.error('Không thể vô hiệu hóa mã khuyến mãi');
    }
  };

  const handlePromotionTypeSelect = (type: PromotionType) => {
    setFormData(prev => ({ ...prev, promotionType: type }));
    setStep('form');
  };

  const handleManagePromotions = () => {
    setStep('manage');
    fetchPromotions();
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

    if (formData.startDate.length !== 10) {
      return 'Ngày bắt đầu phải đúng định dạng dd/mm/yyyy';
    }

    if (!formData.endDate) {
      return 'Vui lòng chọn ngày kết thúc';
    }

    if (formData.endDate.length !== 10) {
      return 'Ngày kết thúc phải đúng định dạng dd/mm/yyyy';
    }

    // Parse dd/mm/yyyy to Date object
    const parseDate = (dateStr: string): Date => {
      const [day, month, year] = dateStr.split('/').map(Number);
      return new Date(year, month - 1, day);
    };

    const startDate = parseDate(formData.startDate);
    const endDate = parseDate(formData.endDate);

    if (isNaN(startDate.getTime())) {
      return 'Ngày bắt đầu không hợp lệ';
    }

    if (isNaN(endDate.getTime())) {
      return 'Ngày kết thúc không hợp lệ';
    }

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
      // Parse dd/mm/yyyy and format to backend format: yyyy-MM-ddTHH:mm:ss
      const formatDateForBackend = (dateString: string, isEndDate: boolean = false): string => {
        const [day, month, year] = dateString.split('/');
        const hours = isEndDate ? '23' : '00';
        const minutes = isEndDate ? '59' : '00';
        const seconds = isEndDate ? '59' : '00';
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hours}:${minutes}:${seconds}`;
      };

      const requestData: CreatePromotionRequest = {
        promotionType: formData.promotionType!,
        discountPercentage: parseFloat(formData.discountPercentage),
        startDate: formatDateForBackend(formData.startDate, false),
        endDate: formatDateForBackend(formData.endDate, true),
        quantity: parseInt(formData.quantity),
        minOrderAmount: parseFormattedPrice(formData.minOrderAmount),
      };

      if (formData.promotionType === 'PRODUCT') {
        requestData.productId = formData.productId ? parseInt(formData.productId) : null;
        requestData.categoryId = null;
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

      {/* Manage Promotions Button */}
      <div className="border-t pt-4">
        <button
          onClick={handleManagePromotions}
          className="w-full flex items-center justify-center gap-2 p-3 border-2 border-gray-200 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all"
        >
          <List className="h-5 w-5 text-gray-600" />
          <span className="font-medium text-gray-700">Quản lý mã</span>
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
                type="text"
                value={formData.startDate}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d/]/g, '');
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
                    setFormData(prev => ({ ...prev, startDate: formatted }));
                  }
                }}
                placeholder="dd/mm/yyyy"
                maxLength={10}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-sm font-medium">
                Ngày kết thúc <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endDate"
                type="text"
                value={formData.endDate}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d/]/g, '');
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
                    setFormData(prev => ({ ...prev, endDate: formatted }));
                  }
                }}
                placeholder="dd/mm/yyyy"
                maxLength={10}
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

  const renderManageStep = () => (
    <>
      <DialogHeader>
        <DialogTitle className="text-xl font-bold flex items-center gap-2">
          <List className="h-5 w-5 text-gray-600" />
          Quản lý mã khuyến mãi
        </DialogTitle>
        <DialogDescription>
          Danh sách các mã khuyến mãi đã tạo
        </DialogDescription>
      </DialogHeader>

      {isLoadingPromotions ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
        </div>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          {promotions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Chưa có mã khuyến mãi nào
            </div>
          ) : (
            <div className="space-y-3">
              {promotions.map((promo) => (
                <div
                  key={promo.promotionId}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-purple-600">
                          {promo.code}
                        </span>
                        <Badge variant={promo.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {promo.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã vô hiệu'}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{promo.productName || 'Khuyến mãi đơn hàng'}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600">
                          Còn lại: <span className="font-semibold text-gray-900">{promo.remainingCount}/{promo.totalQuantity}</span>
                        </span>
                        <span className="text-gray-600">
                          Giảm: <span className="font-semibold text-green-600">{promo.discountPercentage}%</span>
                        </span>
                      </div>
                    </div>

                    {promo.status === 'ACTIVE' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeactivate(promo.code)}
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        Vô hiệu
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <DialogFooter className="pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
        {step === 'select' && renderSelectStep()}
        {step === 'form' && renderFormStep()}
        {step === 'manage' && renderManageStep()}
      </DialogContent>
    </Dialog>
  );
}
