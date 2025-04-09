import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Package,
  Trash2,
  PlusCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Select from 'react-select';
import toast from 'react-hot-toast';
import { getSupplierInvoiceDetail, updateSupplierInvoice, getSupplierDropdownData } from '../../services/supplierInvoice';
import { getProducts, createProduct, type Product } from '../../services/product';
import type { SupplierInvoiceDetail, SupplierProduct, UpdateSupplierInvoiceData } from '../../services/supplierInvoice';
import { getSession } from '../../utils/storage';
import { getCurrencies } from '../../services/currency';
import { createPartner } from '../../services/partner';

interface ProductItem {
  id: string;
  name: string;
  code?: string;
  price: number;
  riCoefficient?: number;
  baseUnitId?: string;
  baseUnit?: string;
}

interface FormData {
  id: string;
  number: string;
  title: string;
  date: string;
  counterpartyId: string;
  counterpartyName: string;
  currencyId: string;
  currencyName: string;
  comment: string;
  employeeId: string;
  employeeName: string;
  structuralUnitId: string;
  structuralUnitName: string;
  amount: number;
  products: SupplierProduct[];
}

interface Supplier {
  id: string;
  name: string;
}

interface Currency {
  id: string;
  name: string;
}

export default function SupplierInvoiceUpdate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const defaultValues = getSession()?.defaultValues || {};
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isFetchingSuppliers, setIsFetchingSuppliers] = useState(false);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isFetchingCurrencies, setIsFetchingCurrencies] = useState(false);
  const [showCreateSupplierPopup, setShowCreateSupplierPopup] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');

  const session = getSession();

  const [formData, setFormData] = useState<FormData>({
    id: '',
    number: '',
    title: '',
    date: new Date().toISOString().slice(0, 16),
    counterpartyId: '',
    counterpartyName: '',
    currencyId: '',
    currencyName: '',
    comment: '',
    employeeId: defaultValues.employeeResponsible?.id || '',
    employeeName: defaultValues.employeeResponsible?.presentation || '',
    structuralUnitId: defaultValues.externalAccount?.id || '',
    structuralUnitName: defaultValues.externalAccount?.presentation || '',
    amount: 0,
    products: [],
  });

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isFetchingProducts, setIsFetchingProducts] = useState(false);

  const fetchInvoiceDetail = async () => {
    if (!id) {
      setError('ID đơn nhận hàng không tồn tại');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await getSupplierInvoiceDetail(id);
      console.log('Dữ liệu nhận được khi vào màn hình SupplierInvoiceUpdate:', data);

      setFormData({
        id: data.id,
        number: data.number,
        title: `#${data.number}`,
        date: data.date.slice(0, 16),
        counterpartyId: data.counterparty.id,
        counterpartyName: data.counterparty.presentation,
        currencyId: data.documentCurrency.id,
        currencyName: data.documentCurrency.presentation,
        comment: data.comment || '',
        employeeId: data.employeeResponsible.id || defaultValues.employeeResponsible?.id || '',
        employeeName: data.employeeResponsible.presentation || defaultValues.employeeResponsible?.presentation || '',
        structuralUnitId: data.structuralUnit.id || defaultValues.externalAccount?.id || '',
        structuralUnitName: data.structuralUnit.presentation || defaultValues.externalAccount?.presentation || '',
        amount: data.documentAmount,
        products: data.inventory.map((product, index) => ({
          lineNumber: product.lineNumber || index + 1,
          product: { _type: 'XTSObjectId', dataType: 'XTSProduct', id: product.product.id, presentation: product.product.presentation },
          characteristic: product.characteristic,
          uom: product.uom,
          quantity: product.quantity,
          price: product.price,
          amount: product.amount,
          discountsMarkupsAmount: product.discountsMarkupsAmount,
          vatAmount: product.vatAmount,
          vatRate: product.vatRate,
          total: product.total,
          sku: product.sku,
          coefficient: product.coefficient,
          priceOriginal: product.priceOriginal,
          vatRateRate: product.vatRateRate,
          picture: product.picture,
          comment: product.comment,
        })),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể tải thông tin đơn nhận hàng';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    setIsFetchingSuppliers(true);
    try {
      const response = await getSupplierDropdownData();
      setSuppliers(response || []);
    } catch (error) {
      toast.error('Không thể tải danh sách nhà cung cấp');
      console.error('Error fetching suppliers:', error);
    } finally {
      setIsFetchingSuppliers(false);
    }
  };

  const fetchCurrencies = async () => {
    setIsFetchingCurrencies(true);
    try {
      const response = await getCurrencies();
      setCurrencies(response.items || []);
    } catch (error) {
      toast.error('Không thể tải danh sách loại tiền tệ');
      console.error('Error fetching currencies:', error);
    } finally {
      setIsFetchingCurrencies(false);
    }
  };

  const fetchProductsOnce = async () => {
    setIsFetchingProducts(true);
    try {
      const response = await getProducts('', '', 1, 10000);
      setProducts(response.items || []);
    } catch (error) {
      toast.error('Không thể tải danh sách sản phẩm');
      console.error('Error fetching products:', error);
    } finally {
      setIsFetchingProducts(false);
    }
  };

  useEffect(() => {
    fetchInvoiceDetail();
    fetchSuppliers();
    fetchCurrencies();
    fetchProductsOnce();
  }, [id]);

  const calculateTotal = () => {
    return formData.products.reduce((sum, product) => sum + product.total, 0);
  };

  const handleAddProduct = () => {
    setFormData((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        {
          lineNumber: prev.products.length + 1,
          product: { _type: 'XTSObjectId', dataType: 'XTSProduct', id: '', presentation: '' },
          characteristic: null,
          uom: null,
          quantity: 1,
          price: 0,
          amount: 0,
          discountsMarkupsAmount: null,
          vatAmount: null,
          vatRate: null,
          total: 0,
          sku: '',
          coefficient: 1,
          priceOriginal: 0,
          vatRateRate: null,
          picture: null,
        },
      ],
    }));
  };

  const handleRemoveProduct = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index).map((p, i) => ({ ...p, lineNumber: i + 1 })),
    }));
  };

  const handleProductChange = (index: number, field: string, value: any) => {
    setFormData((prev) => {
      const newProducts = [...prev.products];
      newProducts[index] = {
        ...newProducts[index],
        [field]: value,
      };

      if (field === 'quantity' || field === 'price') {
        newProducts[index].total = newProducts[index].quantity * newProducts[index].price;
        newProducts[index].amount = newProducts[index].quantity * newProducts[index].price;
      }

      if (field === 'product') {
        const selected = products.find((p) => p.id === value);
        if (selected) {
          newProducts[index].product = { _type: 'XTSObjectId', dataType: 'XTSProduct', id: selected.id, presentation: selected.name };
          newProducts[index].sku = selected.code || '';
          newProducts[index].price = selected.price;
          newProducts[index].coefficient = selected.riCoefficient || 1;
          newProducts[index].uom = selected.baseUnitId ? { _type: 'XTSObjectId', dataType: 'XTSMeasurementUnit', id: selected.baseUnitId, presentation: selected.baseUnit || '' } : null;
          newProducts[index].total = selected.price * newProducts[index].quantity;
          newProducts[index].amount = selected.price * newProducts[index].quantity;
          newProducts[index].priceOriginal = selected.price;
        }
      }

      return { ...prev, products: newProducts, amount: calculateTotal() };
    });
  };

  const validateForm = (): boolean => {
    if (!formData.counterpartyId) {
      toast.error('Vui lòng chọn nhà cung cấp');
      return false;
    }

    if (formData.products.length === 0) {
      toast.error('Vui lòng thêm ít nhất một sản phẩm');
      return false;
    }

    for (const product of formData.products) {
      if (!product.product.id) {
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
      setIsSaving(true);

      let formattedDate = formData.date;
      if (formattedDate.length === 16) { // Kiểm tra nếu chỉ có YYYY-MM-DDTHH:mm
        formattedDate += ':00'; // Thêm :ss (giây mặc định là 00)
      }

      const invoiceData: UpdateSupplierInvoiceData = {
        id: formData.id,
        number: formData.number,
        title: formData.title,
        date: formattedDate,
        posted: false,
        operationKindId: 'ReceiptFromSupplier',
        operationKindPresentation: 'Mua hàng từ nhà cung cấp',
        companyId: defaultValues.company.id,
        companyName: defaultValues.company.presentation,
        counterpartyId: formData.counterpartyId,
        counterpartyName: formData.counterpartyName,
        contractId: '',
        contractName: '',
        currencyId: formData.currencyId,
        currencyName: formData.currencyName,
        amount: calculateTotal(),
        vatTaxationId: defaultValues.vatTaxation?.id || 'NotTaxableByVAT',
        vatTaxationName: defaultValues.vatTaxation?.presentation || 'Không chịu thuế (không thuế GTGT)',
        rate: 1,
        multiplicity: 1,
        comment: formData.comment,
        employeeId: formData.employeeId,
        employeeName: formData.employeeName,
        structuralUnitId: formData.structuralUnitId,
        structuralUnitName: formData.structuralUnitName,
        products: formData.products,
      };

      console.log('Request data:', invoiceData);

      await updateSupplierInvoice(invoiceData);
      toast.success('Cập nhật đơn nhận hàng thành công');
      navigate(`/supplier-invoices/${formData.id}`);
    } catch (error) {
      toast.error('Không thể cập nhật đơn nhận hàng');
    } finally {
      setIsSaving(false);
      setShowConfirmation(false);
    }
  };

  const supplierOptions = [
    { value: 'create-supplier', label: 'Tạo nhà cung cấp', isCreateOption: true },
    ...suppliers.map((supplier) => ({
      value: supplier.id,
      label: supplier.name,
    })),
  ];

  const productOptions = [
    ...products.map((product) => ({
      value: product.id,
      label: product.name,
    })),
    ...formData.products
      .filter((p) => p.product.id && !products.some((mp) => mp.id === p.product.id))
      .map((p) => ({
        value: p.product.id,
        label: p.product.presentation,
      })),
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

  const handleSupplierChange = (selectedOption: any) => {
    if (selectedOption?.value === 'create-supplier') {
      setShowCreateSupplierPopup(true);
      return;
    }

    const selectedSupplier = suppliers.find((s) => s.id === selectedOption?.value);
    setFormData((prev) => ({
      ...prev,
      counterpartyId: selectedOption ? selectedOption.value : '',
      counterpartyName: selectedSupplier ? selectedSupplier.name : '',
    }));
  };

  const handleCloseCreateSupplierPopup = () => {
    setShowCreateSupplierPopup(false);
    setSupplierName('');
    setSupplierPhone('');
    setSupplierAddress('');
  };

  const handleConfirmCreateSupplier = async () => {
    if (!supplierName.trim()) {
      toast.error('Vui lòng nhập Tên Nhà cung cấp');
      return;
    }

    try {
      const newSupplier = await createPartner({
        name: supplierName,
        fullName: '',
        dateOfBirth: '',
        phone: supplierPhone,
        email: '',
        address: supplierAddress,
        notes: '',
        gender: '',
        picture: '',
        counterpartyKindId: defaultValues.counterpartyKind?.id || '',
        counterpartyKindPresentation: defaultValues.counterpartyKind?.presentation || '',
        employeeResponsibleId: defaultValues.employeeResponsible?.id || '',
        employeeResponsiblePresentation: defaultValues.employeeResponsible?.presentation || '',
        taxIdentifactionNumber: '',
        invalid: false,
        isCustomer: false,
        isVendor: true,
        otherRelations: false,
        margin: 0,
        doOperationsByContracts: false,
        doOperationsByOrders: false,
        doOperationsByDocuments: false,
      });

      const updatedSuppliers = [...suppliers, { id: newSupplier.id, name: supplierName }];
      setSuppliers(updatedSuppliers);

      setFormData((prev) => ({
        ...prev,
        counterpartyId: newSupplier.id,
        counterpartyName: supplierName,
      }));

      toast.success('Tạo nhà cung cấp thành công');
      handleCloseCreateSupplierPopup();
    } catch (error) {
      toast.error('Không thể tạo nhà cung cấp');
      console.error('Error creating supplier:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{error}</h2>
          <button
            onClick={() => navigate('/supplier-invoices')}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="px-4">
        <div className="space-y-4 mb-6">
          <div>
            <p className="text-sm font-medium text-gray-700">Đơn hàng: {formData.number}</p>
            <span className="text-sm font-medium text-gray-700">
              Ngày tạo: <span className="text-gray-900">{new Date(formData.date).toLocaleString()}</span>
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nhà cung cấp *</label>
            <Select
              options={supplierOptions}
              value={supplierOptions.find((option) => option.value === formData.counterpartyId) || null}
              onChange={handleSupplierChange}
              placeholder="Chọn nhà cung cấp"
              isClearable
              isSearchable
              className="text-sm"
              classNamePrefix="select"
              isDisabled={isFetchingSuppliers}
              components={{ Option: CustomOption }}
            />
          </div>

          <div>
            <span className="text-sm font-medium text-gray-700">
              Loại tiền tệ: <span className="text-gray-900">{formData.currencyName}</span>
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData((prev) => ({ ...prev, comment: e.target.value }))}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Nhập ghi chú..."
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-medium text-gray-900">Danh sách sản phẩm</h2>
            <button
              onClick={handleAddProduct}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Thêm sản phẩm
            </button>
          </div>

          <div className="space-y-4">
            {formData.products.map((product, index) => {
              const selectedProduct = products.find((p) => p.id === product.product.id);
              const code = selectedProduct?.code || product.sku || 'N/A';
              const riCoefficient = selectedProduct?.riCoefficient || product.coefficient || 1;

              return (
                <div key={index} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex gap-3 mb-3">
                    <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      {product.picture?.id ? (
                        <img
                          src={`${import.meta.env.VITE_FILE_BASE_URL}/${product.picture.id}`}
                          alt={product.product.presentation}
                          className="h-full w-full object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc';
                            e.currentTarget.alt = 'Hình ảnh mặc định';
                          }}
                        />
                      ) : (
                        <Package className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Select
                        options={productOptions}
                        value={productOptions.find((option) => option.value === product.product.id) || null}
                        onChange={(selectedOption) => {
                          handleProductChange(index, 'product', selectedOption ? selectedOption.value : '');
                        }}
                        placeholder="Chọn sản phẩm"
                        isClearable
                        isSearchable
                        className="text-sm"
                        classNamePrefix="select"
                        isDisabled={isFetchingProducts}
                      />
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm text-gray-500">Mã sản phẩm:</span>
                        <span className="text-sm text-gray-900">{code}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm text-gray-500">Hệ số ri:</span>
                        <span className="text-sm text-gray-900">{riCoefficient}</span>
                      </div>
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
                      <label className="block text-xs text-gray-500 mb-1">Số lượng</label>
                      <input
                        type="number"
                        value={product.quantity}
                        onChange={(e) => handleProductChange(index, 'quantity', Number(e.target.value))}
                        min="1"
                        className="w-full text-sm text-gray-900 bg-transparent border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        inputMode="numeric"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Đơn giá</label>
                      <input
                        type="number"
                        value={product.price}
                        onChange={(e) => handleProductChange(index, 'price', Number(e.target.value))}
                        min="0"
                        step="1000"
                        className="w-full text-sm text-gray-900 bg-transparent border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        inputMode="numeric"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500">Thành tiền</span>
                    <span className="text-sm font-medium text-blue-600">
                      {product.total.toLocaleString()} {formData.currencyName}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {formData.products.length > 0 && (
            <div className="mt-4 bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">Tổng cộng</span>
                <span className="text-base font-semibold text-blue-600">
                  {calculateTotal().toLocaleString()} {formData.currencyName}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-4 right-4 flex flex-row gap-2 z-50">
        <button
          onClick={() => navigate(`/supplier-invoices/${id}`)}
          className="p-2 bg-gray-600 text-white rounded-full shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
          title="Quay lại chi tiết"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          title="Lưu thay đổi"
        >
          <Save className="h-5 w-5" />
        </button>
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Xác nhận cập nhật đơn nhận hàng</h3>
            <p className="text-sm text-gray-500 mb-4">Bạn có chắc chắn muốn cập nhật đơn nhận hàng này không?</p>
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

      {showCreateSupplierPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tạo nhà cung cấp mới</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên Nhà cung cấp *</label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập tên nhà cung cấp"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập số điện thoại"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                <input
                  type="text"
                  value={supplierAddress}
                  onChange={(e) => setSupplierAddress(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập địa chỉ"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={handleCloseCreateSupplierPopup}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
              >
                Đóng
              </button>
              <button
                onClick={handleConfirmCreateSupplier}
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