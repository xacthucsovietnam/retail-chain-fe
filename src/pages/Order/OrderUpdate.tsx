import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Package,
  Trash2,
  PlusCircle
} from 'lucide-react';
import Select from 'react-select';
import toast from 'react-hot-toast';
import {
  getOrderDetail,
  updateOrder,
  getCustomerDropdownData,
  getEmployeeDropdownData,
  getProductDropdownData,
  getOrderStateDropdownData,
  type OrderDetail,
  type CustomerDropdownItem,
  type EmployeeDropdownItem,
  type ProductDropdownItem,
  type OrderStateDropdownItem,
  type UpdateOrderProduct
} from '../../services/order';
import { createPartner } from '../../services/partner';
import { getSession } from '../../utils/storage';
import { getProductDetail, type ProductDetail } from '../../services/product';

interface FormData {
  id: string;
  number: string;
  title: string;
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
    lineNumber: number;
    availableUnits: Array<{ id: string; presentation: string; coefficient: number }>;
    imageUrl?: string;
  }>;
}

export default function OrderUpdate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const session = getSession();
  const defaultValues = session?.defaultValues || {};

  const [formData, setFormData] = useState<FormData>({
    id: '',
    number: '',
    title: '',
    customerId: '',
    customerName: '',
    employeeId: defaultValues.employeeResponsible?.id || '',
    employeeName: defaultValues.employeeResponsible?.presentation || '',
    orderState: '',
    deliveryAddress: '',
    comment: '',
    products: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [customers, setCustomers] = useState<CustomerDropdownItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeDropdownItem[]>([]);
  const [products, setProducts] = useState<ProductDropdownItem[]>([]);
  const [orderStates, setOrderStates] = useState<OrderStateDropdownItem[]>([]);
  const [showCreateCustomerPopup, setShowCreateCustomerPopup] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        toast.error('Order ID is missing');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const [orderData, customerData, employeeData, productData, orderStateData] = await Promise.all([
          getOrderDetail(id),
          getCustomerDropdownData(),
          getEmployeeDropdownData(),
          getProductDropdownData(),
          getOrderStateDropdownData()
        ]);

        setCustomers(customerData);
        setEmployees(employeeData);
        setProducts(productData);
        setOrderStates(orderStateData);

        // Map order data to form, including product details
        const productsWithDetails = await Promise.all(
          orderData.products.map(async (p) => {
            const productDetail = await getProductDetail(p.productId);
            const fileStorageURL = session?.fileStorageURL || '';
            const imageUrl = productDetail.imageUrl && productDetail.images.length > 0 
              ? `${fileStorageURL}${productDetail.images[0].id}`
              : undefined;

            // Tìm đơn vị tính khớp với dữ liệu đơn hàng
            const selectedUnit = productDetail.uoms.find(u => u.id === p.unit || u.presentation === p.unit) || 
                               productDetail.uoms[0] || { id: '', presentation: '', coefficient: 1 };

            return {
              id: p.productId,
              name: p.productName,
              sku: p.sku,
              unitId: selectedUnit.id,
              unitName: selectedUnit.presentation,
              quantity: p.quantity,
              price: p.price,
              total: p.total,
              coefficient: selectedUnit.coefficient,
              lineNumber: p.lineNumber,
              availableUnits: productDetail.uoms,
              imageUrl
            };
          })
        );

        // Tìm customer khớp với dữ liệu đơn hàng
        const selectedCustomer = customerData.find(c => c.id === orderData.customer || c.name === orderData.customer);
        
        // Tìm orderState khớp với dữ liệu đơn hàng
        const selectedOrderState = orderStateData.find(s => s.id === orderData.orderState || s.name === orderData.orderState);

        // Tìm employee khớp với dữ liệu đơn hàng
        const selectedEmployee = employeeData.find(e => e.id === orderData.employeeResponsible || e.presentation === orderData.employeeResponsible);

        setFormData({
          id: orderData.id || '',
          number: orderData.number || '',
          title: orderData.title || '',
          customerId: selectedCustomer?.id || orderData.customer || '',
          customerName: selectedCustomer?.name || orderData.customer || '',
          employeeId: selectedEmployee?.id || orderData.employeeResponsible || defaultValues.employeeResponsible?.id || '',
          employeeName: selectedEmployee?.presentation || orderData.employeeResponsible || defaultValues.employeeResponsible?.presentation || '',
          orderState: selectedOrderState?.id || orderData.orderState || '',
          deliveryAddress: orderData.deliveryAddress || '',
          comment: orderData.comment || '',
          products: productsWithDetails
        });
      } catch (error) {
        toast.error('Không thể tải dữ liệu đơn hàng');
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id]);

  const calculateProductTotal = (product: FormData['products'][0]) => {
    if (product.unitName === 'c') {
      return product.quantity * product.price;
    } else if (product.unitName.toLowerCase().includes('ri')) {
      return product.quantity * product.coefficient * product.price;
    }
    return product.quantity * product.price;
  };

  const calculateTotal = () => {
    return formData.products.reduce((sum, product) => sum + calculateProductTotal(product), 0);
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
          coefficient: 1,
          lineNumber: prev.products.length + 1,
          availableUnits: []
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

  const handleProductChange = async (index: number, selectedOption: any) => {
    if (!selectedOption) return;

    try {
      const productDetail = await getProductDetail(selectedOption.value);
      const defaultUnit = productDetail.uoms[0] || { id: '', presentation: '', coefficient: 1 };
      const fileStorageURL = session?.fileStorageURL || '';
      const imageUrl = productDetail.imageUrl && productDetail.images.length > 0 
        ? `${fileStorageURL}${productDetail.images[0].id}`
        : undefined;

      setFormData(prev => {
        const newProducts = [...prev.products];
        newProducts[index] = {
          id: productDetail.id,
          name: productDetail.name,
          sku: productDetail.code,
          unitId: defaultUnit.id,
          unitName: defaultUnit.presentation,
          quantity: 1,
          price: productDetail.price,
          total: calculateProductTotal({
            unitName: defaultUnit.presentation,
            quantity: 1,
            price: productDetail.price,
            coefficient: defaultUnit.coefficient
          }),
          coefficient: defaultUnit.coefficient,
          lineNumber: newProducts[index].lineNumber,
          availableUnits: productDetail.uoms,
          imageUrl
        };
        return { ...prev, products: newProducts };
      });
    } catch (error) {
      toast.error('Không thể tải chi tiết sản phẩm');
      console.error('Error fetching product detail:', error);
    }
  };

  const handleUnitChange = (index: number, selectedOption: any) => {
    if (!selectedOption) return;

    setFormData(prev => {
      const newProducts = [...prev.products];
      const selectedUnit = newProducts[index].availableUnits.find(u => u.id === selectedOption.value);
      if (selectedUnit) {
        newProducts[index] = {
          ...newProducts[index],
          unitId: selectedUnit.id,
          unitName: selectedUnit.presentation,
          coefficient: selectedUnit.coefficient,
          total: calculateProductTotal({
            ...newProducts[index],
            unitName: selectedUnit.presentation,
            coefficient: selectedUnit.coefficient,
            quantity: newProducts[index].quantity,
            price: newProducts[index].price
          })
        };
      }
      return { ...prev, products: newProducts };
    });
  };

  const handleFieldChange = (index: number, field: keyof FormData['products'][0], value: any) => {
    setFormData(prev => {
      const newProducts = [...prev.products];
      newProducts[index] = {
        ...newProducts[index],
        [field]: value,
        total: calculateProductTotal({
          ...newProducts[index],
          [field]: value
        })
      };
      return { ...prev, products: newProducts };
    });
  };

  const validateForm = (): boolean => {
    if (!formData.customerId) {
      toast.error('Vui lòng chọn khách hàng');
      return false;
    }

    if (!formData.orderState) {
      toast.error('Vui lòng chọn trạng thái đơn hàng');
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
        toast.error('Đơn giá chiếc không được âm');
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
      setIsSaving(true);

      const orderProducts: UpdateOrderProduct[] = formData.products.map(product => ({
        lineNumber: product.lineNumber,
        productId: product.id,
        productName: product.name,
        quantity: product.quantity,
        price: product.price,
        unitId: product.unitId,
        unitName: product.unitName,
        coefficient: product.coefficient,
        sku: product.sku
      }));

      await updateOrder({
        id: formData.id,
        number: formData.number,
        title: formData.title,
        customerId: formData.customerId,
        customerName: formData.customerName,
        employeeId: formData.employeeId,
        employeeName: formData.employeeName,
        orderState: formData.orderState,
        deliveryAddress: formData.deliveryAddress,
        comment: formData.comment,
        documentAmount: calculateTotal(),
        products: orderProducts,
        date: new Date().toISOString(),
        contractId: '',
        contractName: '',
        externalAccountId: '',
        externalAccountName: '',
        cashAmount: 0,
        transferAmount: 0,
        postPayAmount: 0,
        paymentNotes: ''
      });

      toast.success('Cập nhật đơn hàng thành công');
      navigate(`/orders/${formData.id}`);
    } catch (error) {
      toast.error('Không thể cập nhật đơn hàng');
      console.error('Error updating order:', error);
    } finally {
      setIsSaving(false);
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

  const productOptions = products.map(product => ({
    value: product.id,
    label: product.name
  }));

  const orderStateOptions = orderStates.map(state => ({
    value: state.id,
    label: state.name
  }));

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

  const handleOrderStateChange = (selectedOption: any) => {
    setFormData(prev => ({
      ...prev,
      orderState: selectedOption ? selectedOption.value : ''
    }));
  };

  const handleCloseCreateCustomerPopup = () => {
    setShowCreateCustomerPopup(false);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
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
        address: customerAddress,
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

      const updatedCustomers = [...customers, { id: newCustomer.id, name: customerName, code: newCustomer.code || '' }];
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

  if (isLoading) {
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
          <h1 className="text-lg font-semibold text-gray-900">Cập nhật đơn hàng</h1>
          <p className="text-sm text-gray-500">#{formData.number}</p>
        </div>
      </div>

      <div className="pt-2 px-4">
        <div className="space-y-4 mb-6">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Người bán
            </label>
            <input
              type="text"
              value={formData.employeeName || 'Không xác định'}
              disabled
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái *
            </label>
            <Select
              options={orderStateOptions}
              value={orderStateOptions.find(option => option.value === formData.orderState) || null}
              onChange={handleOrderStateChange}
              placeholder="Chọn trạng thái"
              isSearchable
              className="text-sm"
              classNamePrefix="select"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Địa chỉ giao hàng
            </label>
            <textarea
              value={formData.deliveryAddress || ''}
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
              value={formData.comment || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
              rows={2}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Nhập ghi chú..."
            />
          </div>
        </div>

        <div>
          <h2 className="text-base font-medium text-gray-900 mb-4">Danh sách sản phẩm</h2>

          <div className="space-y-4">
            {formData.products.map((product, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex gap-3 mb-3">
                  <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextSibling?.removeAttribute('style');
                        }}
                      />
                    ) : null}
                    <Package className={`h-8 w-8 text-gray-400 ${product.imageUrl ? 'hidden' : ''}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Select
                      options={productOptions}
                      value={productOptions.find(option => option.value === product.id) || null}
                      onChange={(option) => handleProductChange(index, option)}
                      placeholder="Chọn sản phẩm..."
                      isSearchable
                      className="text-sm"
                      classNamePrefix="select"
                    />
                    <p className="text-xs text-gray-500 mt-1">{product.sku || 'SKU'}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveProduct(index)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Số lượng
                    </label>
                    <input
                      type="number"
                      value={product.quantity}
                      onChange={(e) => handleFieldChange(index, 'quantity', Number(e.target.value))}
                      min="1"
                      className="w-full text-sm text-gray-900 border border-gray-300 rounded-md px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                      inputMode="numeric"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Đơn giá chiếc
                    </label>
                    <input
                      type="number"
                      value={product.price}
                      onChange={(e) => handleFieldChange(index, 'price', Number(e.target.value))}
                      min="0"
                      step="1000"
                      className="w-full text-sm text-gray-900 border border-gray-300 rounded-md px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                      inputMode="numeric"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">
                      Đơn vị tính
                    </label>
                    <Select
                      options={product.availableUnits.map(unit => ({
                        value: unit.id,
                        label: unit.presentation
                      }))}
                      value={
                        product.availableUnits
                          .map(unit => ({ value: unit.id, label: unit.presentation }))
                          .find(option => option.value === product.unitId) || null
                      }
                      onChange={(option) => handleUnitChange(index, option)}
                      placeholder="Chọn đơn vị tính..."
                      className="text-sm"
                      classNamePrefix="select"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">Thành tiền</span>
                  <span className="text-sm font-medium text-blue-600">
                    {product.total.toLocaleString()} đ
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <button
              onClick={handleAddProduct}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Thêm sản phẩm
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
      </div>

      <div className="fixed bottom-4 left-0 right-0 px-4 z-50">
        <div className="flex justify-between items-center max-w-screen-xl mx-auto">
          <button
            onClick={() => navigate(`/orders/${id}`)}
            className="p-3 bg-gray-600 text-white rounded-full shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Save className="h-6 w-6" />
          </button>
        </div>
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Xác nhận cập nhật đơn hàng
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Bạn có chắc chắn muốn cập nhật đơn hàng này không?
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
                disabled={isSaving}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md disabled:opacity-50"
              >
                {isSaving ? 'Đang xử lý...' : 'Xác nhận'}
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
    </div>
  );
}