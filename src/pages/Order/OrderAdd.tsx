// src/pages/orderAdd.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Package,
  Trash2,
  PlusCircle,
  Plus,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Select from 'react-select';
import toast from 'react-hot-toast';
import { 
  createOrder, 
  getCustomerDropdownData, 
  getEmployeeDropdownData, 
  getProductDropdownData,
  type CustomerDropdownItem,
  type EmployeeDropdownItem,
  type ProductDropdownItem,
  type CreateOrderProduct,
  type CreateOrderData
} from '../../services/order';
import { createPartner } from '../../services/partner';
import { getSession } from '../../utils/storage';
import { getProductDetail, type ProductDetail } from '../../services/product';
import ProductAddPopup from '../../components/ProductAddPopup';

interface FormData {
  customerId: string;
  customerName: string;
  employeeId: string;
  employeeName: string;
  orderState: string;
  deliveryAddress: string;
  comment: string;
  documentAmount: number; // Added to match CreateOrderData
  products: Array<{
    productId: string;
    productName: string;
    code: string; // Changed from sku
    unitId: string;
    unitName: string;
    quantity: number;
    price: number;
    coefficient: number;
    amount: number; // Added to match CreateOrderProduct
    automaticDiscountAmount: number; // Added to match CreateOrderProduct
    discountsMarkupsAmount: number; // Added to match CreateOrderProduct
    vatAmount: number; // Added to match CreateOrderProduct
    vatRateId: string; // Added to match CreateOrderProduct
    vatRateName: string; // Added to match CreateOrderProduct
    total: number; // Added to match CreateOrderProduct
    availableUnits?: Array<{ id: string; presentation: string; coefficient: number }>; // Optional for UI
    imageUrl?: string; // Optional for UI
  }>;
}

interface OrderPreloadData {
  customerId: string;
  customerName: string;
  employeeId: string;
  employeeName: string;
  deliveryAddress: string;
  isReturnOrder: boolean;
  originalProducts?: Array<{
    productId: string;
    productName: string;
    code: string; // Changed from sku
    unit: string;
    quantity: number;
    price: number;
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
  documentAmount: 0,
  products: []
};

export default function OrderAdd() {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getSession();
  const defaultValues = session?.defaultValues || {};

  const [formData, setFormData] = useState<FormData>({
    ...initialFormData,
    employeeId: defaultValues.employeeResponsible?.id || '',
    employeeName: defaultValues.employeeResponsible?.presentation || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [customers, setCustomers] = useState<CustomerDropdownItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeDropdownItem[]>([]);
  const [products, setProducts] = useState<ProductDropdownItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isReturnOrder, setIsReturnOrder] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<ProductDropdownItem[]>([]);
  const [showCreateCustomerPopup, setShowCreateCustomerPopup] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [showProductAddPopup, setShowProductAddPopup] = useState(false);
  const [currentProductIndex, setCurrentProductIndex] = useState<number | null>(null);
  const [isOrderInfoExpanded, setIsOrderInfoExpanded] = useState(true);
  const [isProductListExpanded, setIsProductListExpanded] = useState(true);
  const [newProduct, setNewProduct] = useState<FormData['products'][0] | null>(null);

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

        const savedData = sessionStorage.getItem('newOrderData');
        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData) as OrderPreloadData;
            
            const selectedCustomer = customerData.find(c => 
              c.id === parsedData.customerId || c.name === parsedData.customerName
            );

            setFormData(prev => ({
              ...prev,
              customerId: selectedCustomer?.id || parsedData.customerId || '',
              customerName: selectedCustomer?.name || parsedData.customerName || '',
              employeeId: parsedData.employeeId || defaultValues.employeeResponsible?.id || '',
              employeeName: parsedData.employeeName || defaultValues.employeeResponsible?.presentation || '',
              deliveryAddress: parsedData.deliveryAddress || '',
              products: []
            }));

            setIsReturnOrder(parsedData.isReturnOrder);

            if (parsedData.isReturnOrder && Array.isArray(parsedData.originalProducts)) {
              const filteredProducts = productData.filter(p => 
                parsedData.originalProducts?.some(op => op.productId === p.id)
              );
              setAvailableProducts(filteredProducts);
            }

            sessionStorage.removeItem('newOrderData');
          } catch (error) {
            console.error('Error parsing saved order data:', error);
          }
        }
      } catch (error) {
        toast.error('Không thể tải dữ liệu. Vui lòng thử lại sau.');
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, []);

  const calculateProductTotal = (product: FormData['products'][0]) => {
    return product.quantity * product.price * product.coefficient;
  };

  const calculateTotal = () => {
    return formData.products.reduce((sum, product) => sum + calculateProductTotal(product), 0);
  };

  const handleAddProduct = () => {
    setNewProduct({
      productId: '',
      productName: '',
      code: '',
      unitId: '',
      unitName: '',
      quantity: 1,
      price: 0,
      coefficient: 1,
      amount: 0,
      automaticDiscountAmount: 0,
      discountsMarkupsAmount: 0,
      vatAmount: 0,
      vatRateId: '',
      vatRateName: '',
      total: 0,
      availableUnits: []
    });
    setShowProductAddPopup(true);
    setIsOrderInfoExpanded(false);
  };

  const handleRemoveProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  const handleProductChange = async (selectedOption: any) => {
    if (!selectedOption) return;
  
    if (selectedOption.value === 'create-product') {
      setShowProductAddPopup(false);
      setCurrentProductIndex(0);
      setShowProductAddPopup(true);
      return;
    }
  
    try {
      const productDetail = await getProductDetail(selectedOption.value);
      const availableUnits = productDetail.uoms || [];
      const defaultUnit = availableUnits.length === 2 ? availableUnits[1] : availableUnits[0] || { id: '', presentation: '', coefficient: 1 };
      const fileStorageURL = session?.fileStorageURL || '';
      const imageUrl = productDetail.imageUrl && productDetail.images.length > 0 
        ? `${fileStorageURL}${productDetail.images[0].id}`
        : undefined;
  
      setNewProduct({
        productId: productDetail.id,
        productName: productDetail.name,
        code: productDetail.code,
        unitId: defaultUnit.id,
        unitName: defaultUnit.presentation,
        quantity: 1,
        price: productDetail.price,
        coefficient: defaultUnit.coefficient,
        amount: productDetail.price * 1,
        automaticDiscountAmount: 0,
        discountsMarkupsAmount: 0,
        vatAmount: 0,
        vatRateId: '',
        vatRateName: '',
        total: calculateProductTotal({
          quantity: 1,
          price: productDetail.price,
          coefficient: defaultUnit.coefficient
        }),
        availableUnits,
        imageUrl
      });
    } catch (error) {
      toast.error('Không thể tải chi tiết sản phẩm');
      console.error('Error fetching product detail:', error);
    }
  };

  const handleUnitChange = (selectedOption: any) => {
    if (!selectedOption || !newProduct) return;

    const selectedUnit = newProduct.availableUnits?.find(u => u.id === selectedOption.value);
    if (selectedUnit) {
      setNewProduct(prev => ({
        ...prev!,
        unitId: selectedUnit.id,
        unitName: selectedUnit.presentation,
        coefficient: selectedUnit.coefficient,
        amount: prev!.quantity * prev!.price,
        total: calculateProductTotal({
          ...prev!,
          coefficient: selectedUnit.coefficient,
          quantity: prev!.quantity,
          price: prev!.price
        })
      }));
    }
  };

  const handleFieldChange = (field: keyof FormData['products'][0], value: any) => {
    const newValue = value === '' ? 0 : Number(value);

    setNewProduct(prev => ({
      ...prev!,
      [field]: newValue,
      amount: field === 'quantity' || field === 'price' ? newValue * (field === 'quantity' ? prev!.price : prev!.quantity) : prev!.amount,
      total: calculateProductTotal({
        ...prev!,
        [field]: newValue
      })
    }));
  };

  const handleSaveProduct = () => {
    if (!newProduct || !newProduct.productId) {
      toast.error('Vui lòng chọn sản phẩm');
      return;
    }

    if (newProduct.quantity <= 0) {
      toast.error('Số lượng phải lớn hơn 0');
      return;
    }

    if (newProduct.price < 0) {
      toast.error('Đơn giá không được âm');
      return;
    }

    setFormData(prev => ({
      ...prev,
      products: [...prev.products, newProduct],
      documentAmount: calculateTotal() + calculateProductTotal(newProduct)
    }));
    setShowProductAddPopup(false);
    setNewProduct(null);
  };

  const handleProductAdded = async (newProductData: { id: string; presentation: string }) => {
    try {
      const productDetail = await getProductDetail(newProductData.id);
      const availableUnits = productDetail.uoms || [];
      const defaultUnit = availableUnits.length === 2 ? availableUnits[1] : availableUnits[0] || { id: '', presentation: '', coefficient: 1 };
      const fileStorageURL = session?.fileStorageURL || '';
      const imageUrl = productDetail.imageUrl && productDetail.images.length > 0 
        ? `${fileStorageURL}${productDetail.images[0].id}`
        : undefined;
  
      const newProductOption: ProductDropdownItem = {
        id: productDetail.id,
        name: productDetail.name
      };
      setProducts(prev => [...prev, newProductOption]);
      if (isReturnOrder) {
        setAvailableProducts(prev => [...prev, newProductOption]);
      }
  
      setNewProduct({
        productId: productDetail.id,
        productName: productDetail.name,
        code: productDetail.code,
        unitId: defaultUnit.id,
        unitName: defaultUnit.presentation,
        quantity: 1,
        price: productDetail.price,
        coefficient: defaultUnit.coefficient,
        amount: productDetail.price * 1,
        automaticDiscountAmount: 0,
        discountsMarkupsAmount: 0,
        vatAmount: 0,
        vatRateId: '',
        vatRateName: '',
        total: calculateProductTotal({
          quantity: 1,
          price: productDetail.price,
          coefficient: defaultUnit.coefficient
        }),
        availableUnits,
        imageUrl
      });
  
      setShowProductAddPopup(true);
      setCurrentProductIndex(null);
      toast.success('Sản phẩm đã được thêm');
    } catch (error) {
      toast.error('Không thể tải chi tiết sản phẩm vừa thêm');
      console.error('Error fetching new product detail:', error);
    }
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
        productId: product.productId,
        productName: product.productName,
        characteristic: null, // Assuming no characteristic in this context
        unitId: product.unitId,
        unitName: product.unitName,
        quantity: product.quantity,
        price: product.price,
        amount: product.amount,
        automaticDiscountAmount: product.automaticDiscountAmount,
        discountsMarkupsAmount: product.discountsMarkupsAmount,
        vatAmount: product.vatAmount,
        vatRateId: product.vatRateId,
        vatRateName: product.vatRateName,
        total: product.total,
        code: product.code,
        coefficient: product.coefficient
      }));

      const orderData: CreateOrderData = {
        customerId: formData.customerId,
        customerName: formData.customerName,
        employeeId: formData.employeeId,
        employeeName: formData.employeeName,
        orderState: formData.orderState,
        deliveryAddress: formData.deliveryAddress,
        comment: formData.comment,
        documentAmount: calculateTotal(),
        products: orderProducts
      };

      const result = await createOrder(orderData);

      toast.success('Tạo đơn hàng thành công');
      navigate(`/orders/${result.id}`);
    } catch (error) {
      toast.error('Không thể tạo đơn hàng');
    } finally {
      setIsLoading(false);
      setShowConfirmation(false);
    }
  };

  const customerOptions = [
    { value: 'create-customer', label: 'Tạo khách hàng', isCreateOption: true },
    ...customers.map(customer => ({
      value: customer.id,
      label: customer.name
    }))
  ];

  const productOptions = [
    { value: 'create-product', label: 'Thêm mới sản phẩm', isCreateOption: true },
    ...(isReturnOrder ? availableProducts : products).map(product => ({
      value: product.id,
      label: product.name
    }))
  ];

  const CustomOption = (props: any) => {
    const { data, innerRef, innerProps } = props;
    return (
      <div
        ref={innerRef}
        {...innerProps}
        className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100"
      >
        {data.isCreateOption ? (
          <>
            <PlusCircle className="h-4 w-4 mr-2 text-blue-600" />
            <span className="text-blue-600">{data.label}</span>
          </>
        ) : (
          <span>{data.label}</span>
        )}
      </div>
    );
  };

  const handleCustomerChange = (selectedOption: any) => {
    if (selectedOption?.value === 'create-customer') {
      setShowCreateCustomerPopup(true);
      return;
    }

    const selectedCustomer = customers.find(c => c.id === selectedOption?.value);
    setFormData(prev => ({
      ...prev,
      customerId: selectedOption ? selectedOption.value : '',
      customerName: selectedCustomer ? selectedCustomer.name : ''
    }));
  };

  const handleCloseCreateCustomerPopup = () => {
    setShowCreateCustomerPopup(false);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
  };

  const handleAddToOrder = () => {
    if (!newProduct || !newProduct.productId) {
      toast.error('Vui lòng chọn sản phẩm');
      return;
    }
  
    if (newProduct.quantity <= 0) {
      toast.error('Số lượng phải lớn hơn 0');
      return;
    }
  
    if (newProduct.price < 0) {
      toast.error('Đơn giá không được âm');
      return;
    }
  
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, newProduct],
      documentAmount: calculateTotal() + calculateProductTotal(newProduct)
    }));
    
    toast.success('Đã thêm sản phẩm vào đơn hàng');
    
    setNewProduct({
      productId: '',
      productName: '',
      code: '',
      unitId: '',
      unitName: '',
      quantity: 1,
      price: 0,
      coefficient: 1,
      amount: 0,
      automaticDiscountAmount: 0,
      discountsMarkupsAmount: 0,
      vatAmount: 0,
      vatRateId: '',
      vatRateName: '',
      total: 0,
      availableUnits: []
    });
  };

  const handleConfirmCreateCustomer = async () => {
    if (!customerName.trim()) {
      toast.error('Vui lòng nhập Tên khách hàng');
      return;
    }

    try {
      const newCustomer = await createPartner({
        name: customerName,
        fullName: '',
        dateOfBirth: '',
        phone: customerPhone,
        email: '',
        address: customerAddress || '',
        notes: '',
        gender: '',
        picture: '',
        counterpartyKindId: defaultValues.counterpartyKind?.id || '',
        counterpartyKindPresentation: defaultValues.counterpartyKind?.presentation || '',
        employeeResponsibleId: defaultValues.employeeResponsible?.id || '',
        employeeResponsiblePresentation: defaultValues.employeeResponsible?.presentation || '',
        taxIdentifactionNumber: '',
        invalid: false,
        isCustomer: true,
        isVendor: false,
        otherRelations: false,
        margin: 0,
        doOperationsByContracts: false,
        doOperationsByOrders: false,
        doOperationsByDocuments: false
      });

      const updatedCustomers = [...customers, { 
        id: newCustomer.id, 
        name: customerName, 
        code: newCustomer.code || '',
        phoneNumber: customerPhone || null,
        address: customerAddress || null
      }];
      setCustomers(updatedCustomers);

      setFormData(prev => ({
        ...prev,
        customerId: newCustomer.id,
        customerName: customerName
      }));

      toast.success('Tạo khách hàng thành công');
      handleCloseCreateCustomerPopup();
    } catch (error) {
      toast.error('Không thể tạo khách hàng');
      console.error('Error creating customer:', error);
    }
  };

  const selectedCustomer = customers.find(c => c.id === formData.customerId);

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
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">Thêm mới đơn hàng</h1>
        </div>
      </div>

      <div className="pt-2 px-4">
        {/* Nhóm 1: Thông tin đơn hàng */}
        <div className="mb-6 bg-white rounded-lg shadow-sm">
          <div 
            className="flex justify-between items-center px-4 py-3 cursor-pointer"
            onClick={() => setIsOrderInfoExpanded(!isOrderInfoExpanded)}
          >
            <div className="flex items-center gap-2">
              <h2 className="text-base font-medium text-gray-900">Thông tin đơn hàng</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Đang soạn
              </span>
            </div>
            {isOrderInfoExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-600" />
            )}
          </div>
          {isOrderInfoExpanded && (
            <div className="px-4 pb-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Khách hàng *
                </label>
                <Select
                  options={customerOptions}
                  value={customerOptions.find(option => option.value === formData.customerId) || null}
                  onChange={handleCustomerChange}
                  placeholder="Chọn khách hàng"
                  isClearable
                  isSearchable
                  className="text-sm"
                  classNamePrefix="select"
                  components={{ Option: CustomOption }}
                />
              </div>

              {selectedCustomer && (
                <>
                  <div>
                    <p className="text-sm text-gray-900">
                      Số điện thoại: {selectedCustomer.phoneNumber || 'Không có'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    </label>
                    <p className="text-sm text-gray-900">
                      Địa chỉ: {selectedCustomer.address || 'Không có'}
                    </p>
                  </div>
                </>
              )}

              <div>
                <p className="text-sm text-gray-900">
                  Người bán: {formData.employeeName || 'Không xác định'}
                </p>
              </div>

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
          )}
        </div>

        {/* Nhóm 2: Danh sách sản phẩm */}
        <div className="bg-white rounded-lg shadow-sm">
          <div 
            className="flex justify-between items-center px-4 py-3 cursor-pointer"
            onClick={() => setIsProductListExpanded(!isProductListExpanded)}
          >
            <h2 className="text-base font-medium text-gray-900">Danh sách sản phẩm</h2>
            {isProductListExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-600" />
            )}
          </div>
          {isProductListExpanded && (
            <div className="px-4 pb-4">
              <div className="space-y-2">
                {formData.products.map((product, index) => (
                  <div key={index} className={`flex items-center justify-between ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} rounded-lg p-3`}>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.productName} 
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextSibling?.removeAttribute('style');
                            }}
                          />
                        ) : null}
                        <Package className={`h-6 w-6 text-gray-400 ${product.imageUrl ? 'hidden' : ''}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          #{index + 1} {product.productName}
                        </p>
                        <p className="text-xs text-gray-500">
                          Code: {product.code}
                        </p>
                        <p className="text-xs text-gray-500">
                          {product.quantity} {product.unitName} x {product.price.toLocaleString()} đồng/chiếc
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-blue-600">
                        {product.total.toLocaleString()} đ
                      </p>
                      <button
                        onClick={() => handleRemoveProduct(index)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleAddProduct}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-5 w-5" />
                  <span className="text-base font-medium">Thêm sản phẩm</span>
                </button>
              </div>

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
          )}
        </div>
      </div>

      <div className="fixed bottom-4 left-0 right-0 flex justify-between px-4">
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

      {showCreateCustomerPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Tạo khách hàng mới
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên khách hàng *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập tên khách hàng"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập số điện thoại"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập địa chỉ"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={handleCloseCreateCustomerPopup}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
              >
                Đóng
              </button>
              <button
                onClick={handleConfirmCreateCustomer}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {showProductAddPopup && newProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Thêm sản phẩm
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sản phẩm *
                </label>
                <Select
                  options={productOptions}
                  value={productOptions.find(option => option.value === newProduct.productId) || null}
                  onChange={handleProductChange}
                  placeholder="Chọn sản phẩm..."
                  isSearchable
                  className="text-sm"
                  classNamePrefix="select"
                  components={{ Option: CustomOption }}
                />
                <p className="text-xs text-gray-500 mt-1">{newProduct.code || 'Code'}</p>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">
                    Đơn giá chiếc
                  </label>
                  <input
                    type="number"
                    value={newProduct.price === 0 ? '' : newProduct.price}
                    onChange={(e) => handleFieldChange('price', e.target.value)}
                    min="0"
                    step="1000"
                    className="w-full text-sm text-gray-900 border border-gray-300 rounded-md px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                    inputMode="numeric"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">
                    Đơn vị tính
                  </label>
                  <Select
                    options={newProduct.availableUnits?.map(unit => ({
                      value: unit.id,
                      label: unit.presentation
                    }))}
                    value={newProduct.availableUnits
                      ?.map(unit => ({ value: unit.id, label: unit.presentation }))
                      .find(option => option.value === newProduct.unitId) || null}
                    onChange={handleUnitChange}
                    placeholder="Chọn ..."
                    className="text-sm"
                    classNamePrefix="select"
                    styles={{
                      control: (provided) => ({
                        ...provided,
                        minHeight: 'auto',
                        height: '30px',
                        fontSize: '14px',
                      }),
                      valueContainer: (provided) => ({
                        ...provided,
                        padding: '2px 8px',
                      }),
                      indicatorsContainer: (provided) => ({
                        ...provided,
                        height: '30px',
                      }),
                      menu: (provided) => ({
                        ...provided,
                        zIndex: 9999,
                      }),
                    }}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">
                    Số lượng
                  </label>
                  <input
                    type="number"
                    value={newProduct.quantity === 0 ? '' : newProduct.quantity}
                    onChange={(e) => handleFieldChange('quantity', e.target.value)}
                    min="1"
                    className="w-full text-sm text-gray-900 border border-gray-300 rounded-md px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">Thành tiền</span>
                <span className="text-sm font-medium text-blue-600">
                  {newProduct.total.toLocaleString()} đ
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowProductAddPopup(false);
                  setNewProduct(null);
                }}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
              >
                Đóng
              </button>
              <button
                onClick={handleAddToOrder}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
              >
                Thêm vào đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}