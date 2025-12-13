"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, CreditCard, Star, UtensilsCrossed, Coffee, Plus, ShoppingCart, User, LogOut, Users, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { EmployeeDialog } from "@/components/employee-dialog";
import { BankingInfoDialog } from "@/components/banking-info-dialog";

export function DashboardNav() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [selectedMenuItem, setSelectedMenuItem] = React.useState<string | null>(null);
  const [showEmployeeDialog, setShowEmployeeDialog] = React.useState(false);
  const [showBankingDialog, setShowBankingDialog] = React.useState(false);

  const handleMenuItemClick = (item: string, route: string) => {
    setSelectedMenuItem(item);
    router.push(route);
  };

  const handleRevenueClick = () => {
    router.push("/doanh-thu");
  };

  const handleOrdersClick = () => {
    router.push("/don-hang");
  };

  const handleReviewClick = () => {
    console.log("Navigating to reviews page");
    // Add navigation logic here when reviews page is created
  };

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between p-3 sm:p-4 bg-white border-b border-gray-200 shadow-sm">
      {/* Logo/Brand (Left side) */}
      <div className="flex items-center">
        <h1 
          className="text-lg sm:text-xl font-bold text-gray-800 truncate cursor-pointer hover:text-blue-600 transition-colors"
          onClick={() => router.push("/")}
        >
          <span className="hidden sm:inline">Food Store Dashboard</span>
          <span className="sm:hidden">Food Store</span>
        </h1>
      </div>

      {/* Navigation Items (Right side) */}
      <div className="flex items-center space-x-1 md:space-x-4">
        {/* Menu Dropdown - Accessible by both ADMIN and STAFF */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="flex items-center space-x-1 md:space-x-2 hover:bg-gray-100 transition-colors px-2 md:px-3"
              title="Menu"
            >
              <UtensilsCrossed className="h-4 w-4" />
              <span className="hidden md:inline">Menu</span>
              <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 sm:w-48">
            <DropdownMenuItem 
              className="cursor-pointer flex items-center space-x-2 hover:bg-gray-50 py-2 sm:py-3"
              onClick={() => handleMenuItemClick("Đồ ăn", "/do-an")}
            >
              <UtensilsCrossed className="h-4 w-4" />
              <span>Đồ ăn</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer flex items-center space-x-2 hover:bg-gray-50 py-2 sm:py-3"
              onClick={() => handleMenuItemClick("Đồ uống", "/do-uong")}
            >
              <Coffee className="h-4 w-4" />
              <span>Đồ uống</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer flex items-center space-x-2 hover:bg-gray-50 py-2 sm:py-3"
              onClick={() => handleMenuItemClick("Đồ ăn thêm", "/do-an-them")}
            >
              <Plus className="h-4 w-4" />
              <span>Đồ ăn thêm</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Đơn hàng Button - Accessible by both ADMIN and STAFF */}
        <Button 
          variant="ghost" 
          size="sm"
          className="flex items-center space-x-1 md:space-x-2 hover:bg-gray-100 transition-colors px-2 md:px-3"
          onClick={handleOrdersClick}
          title="Đơn hàng"
        >
          <ShoppingCart className="h-4 w-4" />
          <span className="hidden md:inline">Đơn hàng</span>
        </Button>

        {/* Doanh thu Button - ADMIN ONLY */}
        {user?.role === "ADMIN" && (
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center space-x-1 md:space-x-2 hover:bg-gray-100 transition-colors px-2 md:px-3"
            onClick={handleRevenueClick}
            title="Doanh thu"
          >
            <CreditCard className="h-4 w-4" />
            <span className="hidden md:inline">Doanh thu</span>
          </Button>
        )}

        {/* Đánh giá Button - ADMIN ONLY */}
        {user?.role === "ADMIN" && (
          <Button 
            variant="ghost" 
            size="sm"
            className="flex items-center space-x-1 md:space-x-2 hover:bg-gray-100 transition-colors px-2 md:px-3"
            onClick={handleReviewClick}
            title="Đánh giá"
          >
            <Star className="h-4 w-4" />
            <span className="hidden md:inline">Đánh giá</span>
          </Button>
        )}

        {/* User Profile Dropdown with Logout */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="flex items-center space-x-1 md:space-x-2 hover:bg-gray-100 transition-colors px-2 md:px-3"
              title={user?.name || "User"}
            >
              <User className="h-4 w-4" />
              <span className="hidden md:inline max-w-24 truncate">{user?.name || "User"}</span>
              <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-2 text-sm">
              <p className="font-semibold text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.phoneNumber}</p>
              <p className="text-xs text-blue-600 mt-1">{user?.role}</p>
            </div>
            <DropdownMenuSeparator />
            
            {/* Nhân viên - ADMIN ONLY */}
            {user?.role === "ADMIN" && (
              <DropdownMenuItem 
                className="cursor-pointer flex items-center space-x-2 hover:bg-gray-50 py-2"
                onClick={() => setShowEmployeeDialog(true)}
              >
                <Users className="h-4 w-4" />
                <span>Nhân viên</span>
              </DropdownMenuItem>
            )}
            
            {/* Thông tin chuyển khoản - ADMIN ONLY */}
            {user?.role === "ADMIN" && (
              <DropdownMenuItem 
                className="cursor-pointer flex items-center space-x-2 hover:bg-gray-50 py-2"
                onClick={() => setShowBankingDialog(true)}
              >
                <Building2 className="h-4 w-4" />
                <span>TT Chuyển khoản</span>
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer flex items-center space-x-2 hover:bg-red-50 text-red-600 py-2"
              onClick={() => logout()}
            >
              <LogOut className="h-4 w-4" />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {selectedMenuItem && (
        <div className="absolute top-14 md:top-16 right-2 md:right-4 bg-blue-100 text-blue-800 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm z-40">
          <span className="hidden md:inline">Đang xem: </span>
          {selectedMenuItem}
        </div>
      )}

      {/* Dialogs */}
      <EmployeeDialog open={showEmployeeDialog} onOpenChange={setShowEmployeeDialog} />
      <BankingInfoDialog open={showBankingDialog} onOpenChange={setShowBankingDialog} />
    </nav>
  );
}
