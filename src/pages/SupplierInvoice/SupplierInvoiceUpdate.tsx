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
  Plus,
  Minus,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Select from 'react-select';
import toast from 'react-hot-toast';
import { 
  getSupplierInvoiceDetail, 
  updateSupplierInvoice, 
  getSupplierDropdownData,
  getProductDropdownData 
} from '../../services/supplierInvoice';
import { getProductDetail, getMeasurementUnits } from '../../services/product';
import type { SupplierInvoiceDetail, SupplierProduct, UpdateSupplierInvoiceData } from '../../services/supplierInvoice';
import { getSession } from '../../utils/storage';
import { getCurrencies } from '../../services/currency';
import { createPartner } from '../../services/partner';
import ProductAddPopup from '../../components/ProductAddPopup';

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

interface MeasurementUnit {
  id: string;
  presentation: string;
}

export default function SupplierInvoiceUpdate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const session = getSession();
  const defaultValues = session?.defaultValues || {};
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isFetchingSuppliers, setIsFetchingSuppliers] = useState(false);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isFetchingCurrencies, setIsFetchingCurrencies] = useState(false);
  const [measurementUnits, setMeasurementUnits] = useState<MeasurementUnit[]>([]);
  const [isFetchingMeasurementUnits, setIsFetchingMeasurementUnits] = useState(false);
  const [showCreateSupplierPopup, setShowCreateSupplierPopup] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [showProductAddPopup, setShowProductAddPopup] = useState(false);
  const [showCreateProductPopup, setShowCreateProductPopup] = useState(false);
  const [newProduct, setNewProduct] = useState<SupplierProduct | null>(null);
  const [isInvoiceInfoExpanded, setIsInvoiceInfoExpanded] = useState(true);
  const [isProductListExpanded, setIsProductListExpanded] = useState(true);

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isFetchingProducts, setIsFetchingProducts] = useState(false);

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
    products: []
  });

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

      const updatedProducts = await Promise.all(
        data.inventory.map(async (product, index) => {
          let updatedProduct = { ...product };
          if (!product.uom?.id && product.product.id) {
            try {
              const productDetail = await getProductDetail(product.product.id);
              updatedProduct = {
                ...product,
                uom: productDetail.uoms[0] ? {
                  _type: 'XTSObjectId',
                  dataType: 'XTSUOMClassifier',
                  id: productDetail.uoms[0].id,
                  presentation: productDetail.uoms[0].presentation
                } : null,
                coefficient: productDetail.riCoefficient || 1,
              };
            } catch (error) {
              console.error(`Failed to fetch details for product ${product.product.id}:`, error);
            }
          }
          return {
            ...updatedProduct,
            lineNumber: product.lineNumber || index + 1,
            product: {
              _type: 'XTSObjectId',
              dataType: 'XTSProduct',
              id: product.product.id,
              presentation: product.product.presentation
            },
          };
        })
      );

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
        products: updatedProducts,
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

  const fetchMeasurementUnits = async () => {
    setIsFetchingMeasurementUnits(true);
    try {
      const response = await getMeasurementUnits();
      setMeasurementUnits(response || []);
    } catch (error) {
      toast.error('Không thể tải danh sách đơn vị đo lường');
      console.error('Error fetching measurement units:', error);
    } finally {
      setIsFetchingMeasurementUnits(false);
    }
  };

  const fetchProducts = async () => {
    setIsFetchingProducts(true);
    try {
      const response = await getProductDropdownData();
      setProducts(response.map(item => ({
        id: item.id,
        name: item.name,
        code: item.code,
        price: item.price || 0,
        riCoefficient: item.riCoefficient || 1,
        baseUnitId: item.baseUnitId || '',
        baseUnit: item.baseUnit || ''
      })));
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
    fetchMeasurementUnits();
    fetchProducts();
  }, [id]);

  const calculateTotal = () => {
    return formData.products.reduce((sum, product) => sum + product.total, 0);
  };

  const handleAddProduct = () => {
    setNewProduct({
      lineNumber: formData.products.length + 1,
      product: { _type: 'XTSObjectId', dataType: 'XTSProduct', id: '', presentation: '' },
      characteristic: null,
      uom: { _type: 'XTSObjectId', dataType: 'XTSUOMClassifier', id: '', presentation: '' },
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
      picture: null
    });
    setShowProductAddPopup(true);
  };

  const handleRemoveProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index).map((p, i) => ({ ...p, lineNumber: i + 1 })),
      amount: prev.products.filter((_, i) => i !== index).reduce((sum, p) => sum + p.total, 0)
    }));
  };

  const handleProductChange = async (index: number, selectedOption: any) => {
    if (!selectedOption) return;

    if (selectedOption.value === 'create-product') {
      setShowCreateProductPopup(true);
      return;
    }

    try {
      const productDetail = await getProductDetail(selectedOption.value);
      const defaultUnit = productDetail.uoms[0] || { id: '', presentation: '', coefficient: 1 };
      const productSource = {
        id: productDetail.id,
        name: productDetail.name,
        code: productDetail.code,
        price: productDetail.price,
        riCoefficient: productDetail.riCoefficient || defaultUnit.coefficient,
        baseUnitId: defaultUnit.id,
        baseUnit: defaultUnit.presentation
      };

      setFormData(prev => {
        const updatedProducts = [...prev.products];
        const currentProduct = updatedProducts[index];
        updatedProducts[index] = {
          ...currentProduct,
          product: { _type: 'XTSObjectId', dataType: 'XTSProduct', id: productSource.id, presentation: productSource.name },
          sku: productSource.code || '',
          price: productSource.price,
          priceOriginal: productSource.price,
          coefficient: productSource.riCoefficient || defaultUnit.coefficient,
          total: productSource.price * currentProduct.quantity,
          amount: productSource.price * currentProduct.quantity,
          uom: {
            _type: 'XTSObjectId',
            dataType: 'XTSUOMClassifier',
            id: productSource.baseUnitId || defaultUnit.id,
            presentation: productSource.baseUnit || defaultUnit.presentation
          }
        };
        return {
          ...prev,
          products: updatedProducts,
          amount: updatedProducts.reduce((sum, p) => sum + p.total, 0)
        };
      });
    } catch (error) {
      toast.error('Không thể tải chi tiết sản phẩm');
      console.error('Error fetching product detail:', error);
    }
  };

  const handleNewProductChange = async (selectedOption: any) => {
    if (!selectedOption || !newProduct) return;

    if (selectedOption.value === 'create-product') {
      setShowProductAddPopup(false);
      setShowCreateProductPopup(true);
      return;
    }

    try {
      const productDetail = await getProductDetail(selectedOption.value);
      const defaultUnit = productDetail.uoms[0] || { id: '', presentation: '', coefficient: 1 };
      const productSource = {
        id: productDetail.id,
        name: productDetail.name,
        code: productDetail.code,
        price: productDetail.price,
        riCoefficient: productDetail.riCoefficient || defaultUnit.coefficient,
        baseUnitId: defaultUnit.id,
        baseUnit: defaultUnit.presentation
      };

      setNewProduct(prev => ({
        ...prev!,
        product: { _type: 'XTSObjectId', dataType: 'XTSProduct', id: productSource.id, presentation: productSource.name },
        sku: productSource.code || '',
        price: productSource.price,
        priceOriginal: productSource.price,
        coefficient: productSource.riCoefficient || defaultUnit.coefficient,
        total: productSource.price * prev!.quantity,
        amount: productSource.price * prev!.quantity,
        uom: {
          _type: 'XTSObjectId',
          dataType: 'XTSUOMClassifier',
          id: productSource.baseUnitId || defaultUnit.id,
          presentation: productSource.baseUnit || defaultUnit.presentation
        }
      }));
    } catch (error) {
      toast.error('Không thể tải chi tiết sản phẩm');
      console.error('Error fetching product detail:', error);
    }
  };

  const handleFieldChange = (field: keyof Supplier | keyof SupplierProduct, value: any) => {
  const newValue = value === '' ? 0 : Number(value);

    setNewProduct(prev => {
      if (!prev) return prev;
      const updatedProduct = {
        ...prev,
        [field]: newValue,
        total: (field === 'quantity' ? newValue : prev.quantity) * (field === 'price' ? newValue : prev.price),
        amount: (field === 'quantity' ? newValue : prev.quantity) * (field === 'price' ? newValue : prev.price)
      };
  
      if (field === 'price') {
        updatedProduct.priceOriginal = newValue;
      }
  
      return updatedProduct;
    });
  };

  const handleQuantityAdjust = (adjustment: number) => {
    setNewProduct(prev => {
      if (!prev) return prev;
      const newQuantity = Math.max(1, prev.quantity + adjustment);
      return {
        ...prev,
        quantity: newQuantity,
        total: newQuantity * prev.price,
        amount: newQuantity * prev.price
      };
    });
  };

  const handleSaveProduct = () => {
    if (!newProduct || !newProduct.product.id) {
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
      amount: calculateTotal() + newProduct.total
    }));

    setShowProductAddPopup(false);
    setNewProduct(null);
    toast.success('Đã thêm sản phẩm vào đơn hàng');
  };

  const handleProductFieldChange = (index: number, field: keyof SupplierProduct, value: string) => {
    const newValue = value === '' ? 0 : Number(value);

    if (field === 'quantity' && newValue <= 0) {
      toast.error('Số lượng phải lớn hơn 0');
      return;
    }

    if (field === 'price' && newValue < 0) {
      toast.error('Đơn giá không được âm');
      return;
    }

    setFormData(prev => {
      const updatedProducts = [...prev.products];
      const product = updatedProducts[index];
      updatedProducts[index] = {
        ...product,
        [field]: newValue,
        total: (field === 'quantity' ? newValue : product.quantity) * (field === 'price' ? newValue : product.price),
        amount: (field === 'quantity' ? newValue : product.quantity) * (field === 'price' ? newValue : product.price),
        priceOriginal: field === 'price' ? newValue : product.priceOriginal
      };
      return {
        ...prev,
        products: updatedProducts,
        amount: updatedProducts.reduce((sum, p) => sum + p.total, 0)
      };
    });
  };

  const handleProductAdded = async (newProductData: { id: string; presentation: string }) => {
    try {
      const productDetail = await getProductDetail(newProductData.id);
      const defaultUnit = productDetail.uoms[0] || { id: '', presentation: '', coefficient: 1 };

      const newProductOption: ProductItem = {
        id: productDetail.id,
        name: productDetail.name,
        code: productDetail.code,
        price: productDetail.price,
        riCoefficient: productDetail.riCoefficient || 1,
        baseUnitId: defaultUnit.id,
        baseUnit: defaultUnit.presentation
      };

      setProducts(prev => [...prev, newProductOption]);

      setNewProduct({
        lineNumber: formData.products.length + 1,
        product: { _type: 'XTSObjectId', dataType: 'XTSProduct', id: productDetail.id, presentation: productDetail.name },
        characteristic: null,
        uom: { _type: 'XTSObjectId', dataType: 'XTSUOMClassifier', id: defaultUnit.id, presentation: defaultUnit.presentation },
        quantity: 1,
        price: productDetail.price,
        amount: productDetail.price,
        discountsMarkupsAmount: null,
        vatAmount: null,
        vatRate: null,
        total: productDetail.price,
        sku: productDetail.code || '',
        coefficient: productDetail.riCoefficient || defaultUnit.coefficient,
        priceOriginal: productDetail.price,
        vatRateRate: null,
        picture: null
      });

      setShowCreateProductPopup(false);
      setShowProductAddPopup(true);
      toast.success('Sản phẩm đã được thêm');
    } catch (error) {
      toast.error('Không thể tải chi tiết sản phẩm vừa thêm');
      console.error('Error fetching new product detail:', error);
    }
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

      if (!product.uom?.id) {
        toast.error('Sản phẩm chưa có đơn vị tính');
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
      if (formattedDate.length === 16) {
        formattedDate += ':00';
      }

      const validatedProducts = await Promise.all(
        formData.products.map(async (product) => {
          if (!product.uom?.id && product.product.id) {
            try {
              const productDetail = await getProductDetail(product.product.id);
              return {
                ...product,
                uom: productDetail.uoms[0] ? {
                  _type: 'XTSObjectId',
                  dataType: 'XTSUOMClassifier',
                  id: productDetail.uoms[0].id,
                  presentation: productDetail.uoms[0].presentation
                } : {
                  _type: 'XTSObjectId',
                  dataType: 'XTSUOMClassifier',
                  id: '',
                  presentation: ''
                },
              };
            } catch (error) {
              console.error(`Failed to fetch UOM for product ${product.product.id}:`, error);
              return product;
            }
          }
          return product;
        })
      );

      const invoiceData: UpdateSupplierInvoiceData = {
        id: formData.id,
        number: formData.number,
        title: formData.title,
        date: formattedDate,
        posted: false,
        operationKindId: defaultValues.operationKind?.id || 'ReceiptFromSupplier',
        operationKindPresentation: defaultValues.operationKind?.presentation || 'Mua hàng từ nhà cung cấp',
        companyId: defaultValues.company.id,
        companyName: defaultValues.company.presentation,
        counterpartyId: formData.counterpartyId,
        counterpartyName: formData.counterpartyName,
        contractId: defaultValues.contract?.id || '',
        contractName: defaultValues.contract?.presentation || '',
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
        products: validatedProducts,
      };

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
    { value: 'create-product', label: 'Thêm mới sản phẩm', isCreateOption: true },
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
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
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
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">Cập nhật đơn nhận hàng</h1>
          <p className="text-sm text-gray-500">#{formData.number}</p>
        </div>
      </div>

      <div className="pt-2 px-4">
        {/* Nhóm 1: Thông tin hóa đơn */}
        <div className="mb-6 bg-white rounded-lg shadow-sm">
          <div 
            className="flex justify-between items-center px-4 py-3 cursor-pointer"
            onClick={() => setIsInvoiceInfoExpanded(!isInvoiceInfoExpanded)}
          >
            <h2 className="text-base font-medium text-gray-900">Thông tin hóa đơn</h2>
            {isInvoiceInfoExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-600" />
            )}
          </div>
          {isInvoiceInfoExpanded && (
            <div className="px-4 pb-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày tạo *
                </label>
                <input
                  type="datetime-local"
                  value={formData.date}
                  onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nhà cung cấp *
                </label>
                <Select
                  options={supplierOptions}
                  value={supplierOptions.find(option => option.value === formData.counterpartyId) || null}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại tiền tệ
                </label>
                <Select
                  options={currencies.map(currency => ({ value: currency.id, label: currency.name }))}
                  value={currencies.map(currency => ({ value: currency.id, label: currency.name }))
                    .find(option => option.value === formData.currencyId) || null}
                  onChange={() => {}}
                  placeholder="Chọn loại tiền tệ"
                  isDisabled={true}
                  className="text-sm"
                  classNamePrefix="select"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  value={formData.comment}
                  onChange={e => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                  rows={3}
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
              <div className="space-y-4">
                {formData.products.map((product, index) => {
                  const selectedProduct = products.find(p => p.id === product.product.id);
                  const code = selectedProduct?.code || product.sku || 'N/A';
                  const riCoefficient = product.coefficient || 1;
                  const baseUnit = product.uom?.presentation || 'N/A';

                  return (
                    <div key={index} className="bg-white rounded-lg shadow-sm p-4">
                      <div className="flex gap-3 mb-3">
                        <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          {product.picture?.id ? (
                            <img
                              src={`${import.meta.env.VITE_FILE_BASE_URL}/${product.picture.id}`}
                              alt={product.product.presentation}
                              className="h-full w-full object-cover rounded-lg"
                              onError={e => {
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
                            value={productOptions.find(option => option.value === product.product.id) || null}
                            onChange={(selectedOption) => handleProductChange(index, selectedOption)}
                            placeholder="Chọn sản phẩm"
                            isClearable
                            isSearchable
                            className="text-sm"
                            classNamePrefix="select"
                            components={{ Option: CustomOption }}
                          />
                          {product.product.id && (
                            <>
                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-sm text-gray-500">Mã sản phẩm:</span>
                                <span className="text-sm text-gray-900">{code}</span>
                              </div>
                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-sm text-gray-500">Hệ số ri:</span>
                                <span className="text-sm text-gray-900">{riCoefficient}</span>
                              </div>
                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-sm text-gray-500">Đơn vị tính:</span>
                                <span className="text-sm text-gray-900">{baseUnit}</span>
                              </div>
                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-sm text-gray-500">Giá bán:</span>
                                <span className="text-sm text-gray-900">{product.price.toLocaleString()}</span>
                              </div>
                            </>
                          )}
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
                            value={product.quantity === 0 ? '' : product.quantity}
                            onChange={(e) => handleProductFieldChange(index, 'quantity', e.target.value)}
                            min="1"
                            className="w-full text-sm text-gray-900 bg-transparent border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            inputMode="numeric"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Đơn giá</label>
                          <input
                            type="number"
                            value={product.price === 0 ? '' : product.price}
                            onChange={(e) => handleProductFieldChange(index, 'price', e.target.value)}
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
                      {calculateTotal().toLocaleString()} {formData.currencyName}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-4 left-0 right-0 flex justify-between px-4 z-50">
        <button
          onClick={() => navigate(`/supplier-invoices/${id}`)}
          className="p-3 bg-gray-600 text-white rounded-full shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
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

      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Xác nhận cập nhật đơn nhận hàng</h3>
            <p className="text-sm text-gray-500 mb-4">Bạn có chắc chắn muốn cập nhật đơn nhận hàng này không?</p>
            <div className="flex justify-end gage-2">
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
                  value={productOptions.find(option => option.value === newProduct.product.id) || null}
                  onChange={handleNewProductChange}
                  placeholder="Chọn sản phẩm..."
                  isSearchable
                  className="text-sm"
                  classNamePrefix="select"
                  components={{ Option: CustomOption }}
                />
                <p className="text-xs text-gray-500 mt-1">{newProduct.sku || 'Code'}</p>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">
                    Đơn giá
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
                    Số lượng
                  </label>
                  <div className="flex items-center">
                    <button
                      onClick={() => handleQuantityAdjust(-1)}
                      className="p-1 bg-gray-200 rounded-l-md hover:bg-gray-300"
                      disabled={newProduct.quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      value={newProduct.quantity === 0 ? '' : newProduct.quantity}
                      onChange={(e) => handleFieldChange('quantity', e.target.value)}
                      onFocus={(e) => e.target.value = ''}
                      min="1"
                      className="w-full text-sm text-gray-900 border-t border-b border-gray-300 px-2 py-1 focus:ring-blue-500 focus:border-blue-500 text-center"
                      inputMode="numeric"
                    />
                    <button
                      onClick={() => handleQuantityAdjust(1)}
                      className="p-1 bg-gray-200 rounded-r-md hover:bg-gray-300"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">Thành tiền</span>
                <span className="text-sm font-medium text-blue-600">
                  {newProduct.total.toLocaleString()} {formData.currencyName}
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
                onClick={handleSaveProduct}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
              >
                Thêm vào đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateProductPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 px-4">
          <ProductAddPopup
            onClose={() => {
              setShowCreateProductPopup(false);
              setShowProductAddPopup(true);
            }}
            onProductAdded={handleProductAdded}
          />
        </div>
      )}
    </div>
  );
}