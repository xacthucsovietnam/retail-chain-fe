import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Package,
  Trash2,
  Search,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  createOrder, 
  getCustomerDropdownData, 
  getEmployeeDropdownData, 
  getProductDropdownData,
  type CustomerDropdownItem,
  type EmployeeDropdownItem,
  type ProductDropdownItem,
  type CreateOrderProduct
} from '../../services/order';

interface FormData {
  customerId: string;
  customerName: string;
  employeeId: string;
  employeeName: string;
  orderState: string;
  deliveryAddress: string;
  comment: string;
  products: Array<{
    id: string;
    name: string;
    sku: string;
    unitId: string;
    unitName: string;
    quantity: number;
    price: number;
    total: number;
    coefficient: number;
  }>;
}

const initialFormData: FormData = {
  customerId: '',
  customerName: '',
  employeeId: '',
  employeeName: '',
  orderState: 'Editing',
  deliveryAddress: '',
  comment: '',
  products: []
};

interface DropdownState {
  isOpen: boolean;
  search: string;
}

export default function OrderAdd() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [customers, setCustomers] = useState<CustomerDropdownItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeDropdownItem[]>([]);
  const [products, setProducts] = useState<ProductDropdownItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Dropdown states
  const [customerDropdown, setCustomerDropdown] = useState<DropdownState>({
    isOpen: false,
    search: ''
  });
  const [employeeDropdown, setEmployeeDropdown] = useState<DropdownState>({
    isOpen: false,
    search: ''
  });
  const [productDropdowns, setProductDropdowns] = useState<{[key: number]: DropdownState}>({});

  // Refs for click outside handling
  const customerRef = useRef<HTMLDivElement>(null);
  const employeeRef = useRef<HTMLDivElement>(null);
  const productRefs = useRef<{[key: number]: HTMLDivElement | null}>({});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Handle customer dropdown
      if (customerRef.current && !customerRef.current.contains(event.target as Node)) {
        setCustomerDropdown(prev => ({ ...prev, isOpen: false }));
      }
      
      // Handle employee dropdown
      if (employeeRef.current && !employeeRef.current.contains(event.target as Node)) {
        setEmployeeDropdown(prev => ({ ...prev, isOpen: false }));
      }
      
      // Handle product dropdowns
      Object.entries(productRefs.current).forEach(([index, ref]) => {
        if (ref && !ref.contains(event.target as Node)) {
          setProductDropdowns(prev => ({
            ...prev,
            [index]: { ...prev[index], isOpen: false }
          }));
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [customerData, employeeData, productData] = await Promise.all([
          getCustomerDropdownData(),
          getEmployeeDropdownData(),
          getProductDropdownData()
        ]);
        
        setCustomers(customerData);
        setEmployees(employeeData);
        setProducts(productData);
      } catch (error) {
        toast.error('Không thể tải dữ liệu. Vui lòng thử lại sau.');
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, []);

  const calculateTotal = () => {
    return formData.products.reduce((sum, product) => sum + product.total, 0);
  };

  const handleAddProduct = () => {
    setFormData(prev => ({
      ...prev,
      products: [
        ...prev.products,
        {
          id: '',
          name: '',
          sku: '',
          unitId: '',
          unitName: '',
          quantity: 1,
          price: 0,
          total: 0,
          coefficient: 1
        }
      ]
    }));
  };

  const handleRemoveProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  const handleProductChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newProducts = [...prev.products];
      
      if (field === 'id') {
        const selectedProduct = products.find(p => p.id === value);
        if (selectedProduct) {
          newProducts[index] = {
            ...newProducts[index],
            id: selectedProduct.id,
            name: selectedProduct.name,
            sku: selectedProduct.code,
            unitId: selectedProduct.baseUnitId,
            unitName: selectedProduct.baseUnit,
            price: selectedProduct.price,
            total: selectedProduct.price * newProducts[index].quantity
          };
        }
      } else {
        newProducts[index] = {
          ...newProducts[index],
          [field]: value
        };
        
        if (field === 'quantity' || field === 'price') {
          newProducts[index].total = newProducts[index].quantity * newProducts[index].price;
        }
      }
      
      return { ...prev, products: newProducts };
    });
  };

  const getFilteredCustomers = () => {
    const search = customerDropdown.search.toLowerCase();
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(search) ||
      customer.code.toLowerCase().includes(search)
    );
  };

  const getFilteredEmployees = () => {
    const search = employeeDropdown.search.toLowerCase();
    return employees.filter(employee => 
      employee.name.toLowerCase().includes(search)
    );
  };

  const getFilteredProducts = (index: number) => {
    const search = (productDropdowns[index]?.search || '').toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(search) ||
      product.code.toLowerCase().includes(search)
    );
  };

  const handleProductDropdownOpen = (index: number) => {
    setProductDropdowns(prev => ({
      ...prev,
      [index]: { isOpen: true, search: prev[index]?.search || '' }
    }));
  };

  const handleProductSearch = (index: number, value: string) => {
    setProductDropdowns(prev => ({
      ...prev,
      [index]: { ...prev[index], search: value }
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.customerId) {
      toast.error('Vui lòng chọn khách hàng');
      return false;
    }

    if (formData.products.length === 0) {
      toast.error('Vui lòng thêm ít nhất một sản phẩm');
      return false;
    }

    for (const product of formData.products) {
      if (!product.id) {
        toast.error('Vui lòng chọn sản phẩm');
        return false;
      }

      if (product.quantity <= 0) {
        toast.error('Số lượng phải lớn hơn 0');
        return false;
      }

      if (product.price < 0) {
        toast.error('Đơn giá không được âm');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    setShowConfirmation(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      setIsLoading(true);

      const orderProducts: CreateOrderProduct[] = formData.products.map(product => ({
        productId: product.id,
        productName: product.name,
        quantity: product.quantity,
        price: product.price,
        unitId: product.unitId,
        unitName: product.unitName,
        coefficient: product.coefficient,
        sku: product.sku
      }));

      const result = await createOrder({
        customerId: formData.customerId,
        customerName: formData.customerName,
        employeeId: formData.employeeId,
        employeeName: formData.employeeName,
        orderState: formData.orderState,
        deliveryAddress: formData.deliveryAddress,
        comment: formData.comment,
        documentAmount: calculateTotal(),
        products: orderProducts
      });

      toast.success('Tạo đơn hàng thành công');
      navigate(`/orders/${result.id}`);
    } catch (error) {
      toast.error('Không thể tạo đơn hàng');
    } finally {
      setIsLoading(false);
      setShowConfirmation(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">Thêm mới đơn hàng</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-2 px-4">
        {/* Order Information */}
        <div className="space-y-4 mb-6">
          {/* Customer Selection */}
          <div ref={customerRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Khách hàng *
            </label>
            <div 
              onClick={() => setCustomerDropdown(prev => ({ ...prev, isOpen: true }))}
              className="relative cursor-pointer"
            >
              <input
                type="text"
                value={customerDropdown.isOpen ? customerDropdown.search : formData.customerName || 'Chọn khách hàng...'}
                onChange={(e) => setCustomerDropdown(prev => ({ ...prev, search: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Tìm kiếm khách hàng..."
                readOnly={!customerDropdown.isOpen}
              />
              {formData.customerName && !customerDropdown.isOpen && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFormData(prev => ({ ...prev, customerId: '', customerName: '' }));
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
            {customerDropdown.isOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto">
                <div className="sticky top-0 bg-white p-2 border-b">
                  <div className="relative">
                    <input
                      type="text"
                      value={customerDropdown.search}
                      onChange={(e) => setCustomerDropdown(prev => ({ ...prev, search: e.target.value }))}
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Tìm kiếm..."
                      autoFocus
                    />
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
                {getFilteredCustomers().map(customer => (
                  <div
                    key={customer.id}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        customerId: customer.id,
                        customerName: customer.name
                      }));
                      setCustomerDropdown({ isOpen: false, search: '' });
                    }}
                  >
                    <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                    <div className="text-xs text-gray-500">{customer.code}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Employee Selection */}
          <div ref={employeeRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Người bán
            </label>
            <div 
              onClick={() => setEmployeeDropdown(prev => ({ ...prev, isOpen: true }))}
              className="relative cursor-pointer"
            >
              <input
                type="text"
                value={employeeDropdown.isOpen ? employeeDropdown.search : formData.employeeName || 'Chọn người bán...'}
                onChange={(e) => setEmployeeDropdown(prev => ({ ...prev, search: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Tìm kiếm người bán..."
                readOnly={!employeeDropdown.isOpen}
              />
              {formData.employeeName && !employeeDropdown.isOpen && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFormData(prev => ({ ...prev, employeeId: '', employeeName: '' }));
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
            {employeeDropdown.isOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto">
                <div className="sticky top-0 bg-white p-2 border-b">
                  <div className="relative">
                    <input
                      type="text"
                      value={employeeDropdown.search}
                      onChange={(e) => setEmployeeDropdown(prev => ({ ...prev, search: e.target.value }))}
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Tìm kiếm..."
                      autoFocus
                    />
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>
                {getFilteredEmployees().map(employee => (
                  <div
                    key={employee.id}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        employeeId: employee.id,
                        employeeName: employee.name
                      }));
                      setEmployeeDropdown({ isOpen: false, search: '' });
                    }}
                  >
                    <div className="text-sm text-gray-900">{employee.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <input
              type="text"
              value="Đang soạn"
              disabled
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
            />
          </div>

          {/* Delivery Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Địa chỉ giao hàng
            </label>
            <textarea
              value={formData.deliveryAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
              rows={2}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Nhập địa chỉ giao hàng..."
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú
            </label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
              rows={2}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Nhập ghi chú..."
            />
          </div>
        </div>

        {/* Products List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium text-gray-900">Danh sách sản phẩm</h2>
            <button
              onClick={handleAddProduct}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Thêm sản phẩm
            </button>
          </div>

          <div className="space-y-4">
            {formData.products.map((product, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-4">
                {/* Product Selection */}
                <div className="flex gap-3 mb-3">
                  <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                  <div 
                    ref={el => productRefs.current[index] = el}
                    className="flex-1 min-w-0 relative"
                  >
                    <div
                      onClick={() => handleProductDropdownOpen(index)}
                      className="cursor-pointer"
                    >
                      <input
                        type="text"
                        value={productDropdowns[index]?.isOpen 
                          ? productDropdowns[index].search 
                          : product.name || 'Chọn sản phẩm...'}
                        onChange={(e) => handleProductSearch(index, e.target.value)}
                        className="w-full text-sm text-gray-900 bg-transparent border-0 p-0 focus:ring-0"
                        placeholder="Tìm kiếm sản phẩm..."
                        readOnly={!productDropdowns[index]?.isOpen}
                      />
                    </div>
                    {productDropdowns[index]?.isOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto">
                        <div className="sticky top-0 bg-white p-2 border-b">
                          <div className="relative">
                            <input
                              type="text"
                              value={productDropdowns[index].search}
                              onChange={(e) => handleProductSearch(index, e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Tìm kiếm..."
                              autoFocus
                            />
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                        {getFilteredProducts(index).map(p => (
                          <div
                            key={p.id}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              handleProductChange(index, 'id', p.id);
                              setProductDropdowns(prev => ({
                                ...prev,
                                [index]: { isOpen: false, search: '' }
                              }));
                            }}
                          >
                            <div className="text-sm font-medium text-gray-900">{p.name}</div>
                            <div className="text-xs text-gray-500">{p.code}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{product.sku || 'SKU'}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveProduct(index)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                {/* Quantity and Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Số lượng
                    </label>
                    <input
                      type="number"
                      value={product.quantity}
                      onChange={(e) => handleProductChange(index, 'quantity', Number(e.target.value))}
                      min="1"
                      className="w-full text-sm text-gray-900 bg-transparent border-0 p-0 focus:ring-0"
                      inputMode="numeric"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Đơn giá
                    </label>
                    <input
                      type="number"
                      value={product.price}
                      onChange={(e) => handleProductChange(index, 'price', Number(e.target.value))}
                      min="0"
                      step="1000"
                      className="w-full text-sm text-gray-900 bg-transparent border-0 p-0 focus:ring-0"
                      inputMode="numeric"
                    />
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">Thành tiền</span>
                  <span className="text-sm font-medium text-blue-600">
                    {product.total.toLocaleString()} đ
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Total Amount */}
          {formData.products.length > 0 && (
            <div className="mt-4 bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">Tổng cộng</span>
                <span className="text-base font-semibold text-blue-600">
                  {calculateTotal().toLocaleString()} đ
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => navigate('/orders')}
          className="p-3 bg-gray-600 text-white rounded-full shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <Save className="h-6 w-6" />
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Xác nhận tạo đơn hàng
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Bạn có chắc chắn muốn tạo đơn hàng này không?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={isLoading}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md disabled:opacity-50"
              >
                {isLoading ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}