const API_BASE_URL = 'https://api.yenhafood.site/api';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('foodstore_auth');
    if (stored) {
      const authData = JSON.parse(stored);
      return authData.token;
    }
  } catch (error) {
    console.error('Failed to get auth token:', error);
  }
  return null;
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('foodstore_auth');
    if (stored) {
      const authData = JSON.parse(stored);
      return authData.refreshToken;
    }
  } catch (error) {
    console.error('Failed to get refresh token:', error);
  }
  return null;
}

function updateAuthTokens(newToken: string, newRefreshToken: string): void {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem('foodstore_auth');
    if (stored) {
      const authData = JSON.parse(stored);
      authData.token = newToken;
      authData.refreshToken = newRefreshToken;
      localStorage.setItem('foodstore_auth', JSON.stringify(authData));
    }
  } catch (error) {
    console.error('Failed to update auth tokens:', error);
  }
}

async function refreshAuthToken(): Promise<boolean> {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      console.error('No refresh token available');
      return false;
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      console.error('Token refresh failed:', response.status);
      return false;
    }

    const data = await response.json();
    
    // Update tokens in localStorage
    if (data.token && data.refreshToken) {
      updateAuthTokens(data.token, data.refreshToken);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Token refresh error:', error);
    return false;
  }
}

export interface Product {
  productId: number;
  name: string;
  price: number;
  image: string | null;
  category: {
    categoryId: number;
    name: string;
  };
}

export interface OrderItem {
  orderItemId: number;
  productId: number;
  productName: string;
  productPrice: number;
  quantity: number;
  note: string | null;
}

export interface Order {
  orderId: number;
  customerName: string | null;
  tableNumber: number;
  totalAmount: number;
  orderTime: string;
  status: string;
  items: OrderItem[];
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface Employee {
  id: number;
  userId?: number; // Optional for backward compatibility
  name: string;
  phoneNumber: string;
  role: string;
}

export interface CreateEmployeeRequest {
  name: string;
  phoneNumber: string;
  password: string;
  role: string;
}

export interface BankInfo {
  id: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  qrCodeImageUrl: string | null;
  status: string;
}

class ApiService {
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
  }> = [];

  private async fetchWithErrorHandling<T>(
    url: string, 
    options?: RequestInit,
    isRetry: boolean = false
  ): Promise<ApiResponse<T>> {
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options?.headers as Record<string, string>,
      };
      
      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, {
        headers,
        ...options,
      });

      // Handle 401 Unauthorized - Token expired
      if (response.status === 401 && !isRetry) {
        console.log('Token expired, attempting refresh...');
        
        const refreshSuccess = await refreshAuthToken();
        
        if (refreshSuccess) {
          console.log('Token refreshed successfully, retrying request...');
          // Retry the original request with new token
          return this.fetchWithErrorHandling<T>(url, options, true);
        } else {
          // Refresh failed - logout user
          console.error('Token refresh failed, logging out...');
          this.handleAuthFailure();
          throw new Error('Session expired. Please login again.');
        }
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('API Request failed:', error);
      return { 
        data: [] as unknown as T, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  private handleAuthFailure(): void {
    // Clear auth data and redirect to login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('foodstore_auth');
      window.location.href = '/login';
    }
  }

  async getAllProducts(): Promise<ApiResponse<Product[]>> {
    return this.fetchWithErrorHandling<Product[]>(`${API_BASE_URL}/menu/products/getAll`);
  }

  async getProductsByCategory(categoryId: number): Promise<ApiResponse<Product[]>> {
    const result = await this.getAllProducts();
    if (result.error) {
      return result;
    }
    
    const filteredProducts = result.data.filter(product => product.category.categoryId === categoryId);
    return { data: filteredProducts };
  }

  private async fetchWithFormData<T>(
    url: string,
    formData: FormData,
    method: string = 'POST',
    isRetry: boolean = false
  ): Promise<ApiResponse<T>> {
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {};

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, {
        method,
        headers,
        body: formData,
      });

      // Handle 401 Unauthorized - Token expired
      if (response.status === 401 && !isRetry) {
        console.log('Token expired, attempting refresh...');
        const refreshSuccess = await refreshAuthToken();
        
        if (refreshSuccess) {
          console.log('Token refreshed successfully, retrying request...');
          return this.fetchWithFormData<T>(url, formData, method, true);
        } else {
          console.error('Token refresh failed, logging out...');
          this.handleAuthFailure();
          throw new Error('Session expired. Please login again.');
        }
      }

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('API Request failed:', error);
      return { 
        data: {} as T, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  async addProduct(productData: {
    name: string;
    price: number;
    categoryId: number;
    image?: File | string;
  }): Promise<ApiResponse<Product>> {
    const formData = new FormData();
    formData.append('name', productData.name);
    formData.append('price', productData.price.toString());
    formData.append('categoryId', productData.categoryId.toString());
    
    if (productData.image instanceof File) {
      formData.append('image', productData.image);
    }
    
    return this.fetchWithFormData<Product>(
      `${API_BASE_URL}/menu/products/create-with-image`,
      formData,
      'POST'
    );
  }

  async updateProduct(productId: number, productData: {
    productId: number;
    name: string;
    price: number;
    image?: File | string;
    categoryId: number;
  }): Promise<ApiResponse<Product>> {
    const formData = new FormData();
    formData.append('name', productData.name);
    formData.append('price', productData.price.toString());
    formData.append('categoryId', productData.categoryId.toString());
    
    if (productData.image instanceof File) {
      formData.append('image', productData.image);
    }
    
    return this.fetchWithFormData<Product>(
      `${API_BASE_URL}/menu/products/update-with-image/${productId}`,
      formData,
      'PUT'
    );
  }

  async deleteProduct(productId: number): Promise<ApiResponse<void>> {
    return this.fetchWithErrorHandling<void>(`${API_BASE_URL}/menu/products/delete/${productId}`, {
      method: 'DELETE',
    });
  }

  async getAllOrders(): Promise<ApiResponse<Order[]>> {
    
    return this.fetchWithErrorHandling<Order[]>(`${API_BASE_URL}/orders/getAll`);
  }

  async updateOrderStatus(orderId: number, status: string): Promise<ApiResponse<Order>> {
    
    return this.fetchWithErrorHandling<Order>(`${API_BASE_URL}/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Employee Management APIs
  async getAllEmployees(): Promise<ApiResponse<Employee[]>> {
    const token = getAuthToken();
    console.log('Token for getAllEmployees:', token ? 'exists' : 'missing');
    
    return this.fetchWithErrorHandling<Employee[]>(`${API_BASE_URL}/auth/get-users-by-roles`, {
      method: 'POST',
      body: JSON.stringify(["ADMIN", "STAFF"]),
    });
  }

  async createEmployee(employeeData: CreateEmployeeRequest): Promise<ApiResponse<Employee>> {
    return this.fetchWithErrorHandling<Employee>(`${API_BASE_URL}/auth/admin-register`, {
      method: 'POST',
      body: JSON.stringify({
        name: employeeData.name,
        password: employeeData.password,
        phoneNumber: employeeData.phoneNumber,
      }),
    });
  }

  async updateEmployee(userId: number, employeeData: Partial<Employee>): Promise<ApiResponse<Employee>> {
    // TODO: Add actual API endpoint when available
    return this.fetchWithErrorHandling<Employee>(`${API_BASE_URL}/users/update/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(employeeData),
    });
  }

  async deleteEmployee(userId: number): Promise<ApiResponse<void>> {
    // TODO: Add actual API endpoint when available
    return this.fetchWithErrorHandling<void>(`${API_BASE_URL}/users/delete/${userId}`, {
      method: 'DELETE',
    });
  }

  // Bank Info APIs
  async getActiveBanks(): Promise<ApiResponse<BankInfo[]>> {
    return this.fetchWithErrorHandling<BankInfo[]>(`${API_BASE_URL}/banks/active`);
  }

  async getAllBanks(): Promise<ApiResponse<BankInfo[]>> {
    return this.fetchWithErrorHandling<BankInfo[]>(`${API_BASE_URL}/banks`);
  }

  async deactivateBank(bankId: number): Promise<ApiResponse<BankInfo>> {
    return this.fetchWithErrorHandling<BankInfo>(`${API_BASE_URL}/banks/${bankId}/status?status=DEACTIVATED`, {
      method: 'PATCH',
    });
  }

  async activateBank(bankId: number): Promise<ApiResponse<BankInfo>> {
    return this.fetchWithErrorHandling<BankInfo>(`${API_BASE_URL}/banks/${bankId}/status?status=ACTIVE`, {
      method: 'PATCH',
    });
  }

  async updateBank(bankId: number, bankData: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    status: string;
    qrCodeImage?: File;
  }): Promise<ApiResponse<BankInfo>> {
    const formData = new FormData();
    
    // Create bank object as JSON
    const bankInfo = {
      bankName: bankData.bankName,
      accountNumber: bankData.accountNumber,
      accountHolder: bankData.accountHolder,
      status: bankData.status,
    };
    
    // Add bank info as JSON blob with correct content type
    const bankBlob = new Blob([JSON.stringify(bankInfo)], { type: 'application/json' });
    formData.append('bank', bankBlob);
    
    // Add image if provided
    if (bankData.qrCodeImage) {
      formData.append('qrCodeImage', bankData.qrCodeImage);
    }
    
    return this.fetchWithFormData<BankInfo>(
      `${API_BASE_URL}/banks/${bankId}`,
      formData,
      'PUT'
    );
  }

  connectToOrdersStream(
    onData: (orders: Order[]) => void,
    onError: (error: string) => void,
    onConnect?: () => void
  ): () => void {
    let currentOrders: Order[] = [];
    let controller: AbortController | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let shouldReconnect = true;

    const connect = async (isRetry: boolean = false) => {
      try {
        const token = getAuthToken();

        controller = new AbortController();
        
        const headers: Record<string, string> = {
          'Accept': 'text/event-stream',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        } else {
          console.log('Can not connect to SSE: No auth token found');
        }

        const response = await fetch(`${API_BASE_URL}/orders/stream`, {
          method: 'GET',
          headers,
          signal: controller.signal,
        });

        // Handle 401 Unauthorized - Token expired
        if (response.status === 401 && !isRetry) {
          console.log('SSE auth failed, attempting token refresh...');
          const refreshSuccess = await refreshAuthToken();
          
          if (refreshSuccess) {
            console.log('Token refreshed, reconnecting SSE...');
            return connect(true);
          } else {
            console.error('Token refresh failed, logging out...');
            this.handleAuthFailure();
            return;
          }
        }

        if (!response.ok) {
          throw new Error(`SSE connection failed: ${response.status} ${response.statusText}`);
        }

        onConnect?.();

        const initialOrders = await this.getAllOrders();
        if (!initialOrders.error) {
          console.log(initialOrders.data.length, 'orders loaded initially');
          currentOrders = initialOrders.data;
          onData(currentOrders);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        if (!reader) {
          throw new Error('Response body is not readable');
        }

        console.log('SSE: Starting to read stream...');
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('Disconnected ');
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let currentEvent = '';
          let currentData = '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            console.log('SSE line:', JSON.stringify(line), 'trimmed:', JSON.stringify(trimmedLine));
            
            if (trimmedLine.startsWith('event:')) {
              currentEvent = trimmedLine.substring(6).trim();
              console.log('SSE: SET currentEvent =', JSON.stringify(currentEvent));
            } else if (trimmedLine.startsWith('data:')) {
              currentData = trimmedLine.substring(5).trim();
              console.log('SSE: SET currentData =', currentData.substring(0, 50) + '...');
            } else if (trimmedLine === '') {
              console.log('SSE: Empty line. BEFORE processing - currentEvent:', JSON.stringify(currentEvent), 'hasData:', !!currentData);
              if (currentData && currentEvent) {
                console.log('SSE: ✅ PROCESSING - event:', currentEvent, 'dataLength:', currentData.length);
                processSSEMessage(currentEvent, currentData, currentOrders, onData, onError);
                console.log('SSE: ✅ DONE processing, resetting...');
                currentEvent = '';
                currentData = '';
              } else {
                console.log('SSE: ❌ SKIPPING - event:', JSON.stringify(currentEvent), 'hasData:', !!currentData);
              }
            }
          }
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Aborted');
          return;
        }
        onError(error instanceof Error ? error.message : 'Connection error');

        if (shouldReconnect) {
          reconnectTimeout = setTimeout(() => {
            console.log('Reconnect');
            connect();
          }, 3000);
        }
      }
    };

    const processSSEMessage = (
      eventType: string,
      data: string,
      orders: Order[],
      onDataCallback: (orders: Order[]) => void,
      onErrorCallback: (error: string) => void
    ) => {
      try {
        if (data === 'Connected to order updates') {
          return;
        }

        const eventData = JSON.parse(data);

        switch (eventType) {

          case 'order-created':
            if (Array.isArray(eventData)) {
              currentOrders = eventData;
              onDataCallback(currentOrders);
            } else if (eventData && typeof eventData === 'object' && eventData.orderId) {
              const existingIndex = currentOrders.findIndex(order => order.orderId === eventData.orderId);
              if (existingIndex >= 0) {
                currentOrders[existingIndex] = eventData;
              } else {
                currentOrders = [...currentOrders, eventData];
              }
              onDataCallback([...currentOrders]);
            }
            break;

          case 'order-updated':
            if (Array.isArray(eventData)) {
              currentOrders = eventData;
              onDataCallback(currentOrders);
            } else if (eventData && typeof eventData === 'object' && eventData.orderId) {
              const existingIndex = currentOrders.findIndex(order => order.orderId === eventData.orderId);
              if (existingIndex >= 0) {
                currentOrders[existingIndex] = eventData;
                onDataCallback([...currentOrders]);
              } else {
              }
            }
            break;

          case 'connected':
            if (Array.isArray(eventData)) {
              onDataCallback(eventData);
            }
            break;

          default:
            if (Array.isArray(eventData)) {
              onDataCallback(eventData);
            }
            break;
        }
      } catch (error) {
        console.error('SSE processSSEMessage ERROR:', error);
        console.error('Event type:', eventType, 'Data:', data.substring(0, 100));
        onErrorCallback('Failed to parse server data');
      }
    };

    connect();

    return () => {
      shouldReconnect = false;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (controller) {
        controller.abort();
        console.log('SSE closed');
      }
    };
  }
}

export const apiService = new ApiService();

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';
};

export const getPlaceholderImage = (categoryName: string): string => {
  const placeholders: Record<string, string> = {
    'Đồ ăn': '',
    'Đồ uống': '',
    'Đồ ăn thêm': '',
  };
  return placeholders[categoryName.toLowerCase()] || '🍽️';
};

export const parseOrderTime = (dateTimeString: string): Date => {
  try {
    const dateWithTimezone = dateTimeString.includes('T') && !dateTimeString.includes('Z') && !dateTimeString.includes('+')
      ? `${dateTimeString}+07:00`
      : dateTimeString;
    
    const date = new Date(dateWithTimezone);

    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateTimeString);
      return new Date();
    }
    
    return date;
  } catch (error) {
    console.error('Error parsing date:', dateTimeString, error);
    return new Date();
  }
};

export const formatDateTime = (dateTimeString: string): string => {
  try {
    const date = parseOrderTime(dateTimeString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Error formatting date:', dateTimeString, error);
    return 'Invalid Date';
  }
};

export const CATEGORY_IDS = {
  FOOD: 1,
  DRINKS: 2,
  ADDITIONAL: 3,
} as const;

