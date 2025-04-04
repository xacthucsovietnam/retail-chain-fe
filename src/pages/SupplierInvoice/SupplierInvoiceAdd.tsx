// src/pages/SupplierInvoiceAdd.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Package,
  Trash2,
  Upload,
  X,
  PlusCircle
} from 'lucide-react';
import Select from 'react-select';
import toast from 'react-hot-toast';
import { createSupplierInvoice, getSupplierDropdownData } from '../../services/supplierInvoice';
import { handleProcessImages, ProcessedImageData } from '../../utils/imageProcessing';
import { getProducts, createProduct, type Product, getProductDetail } from '../../services/product';
import ProductPreviewPopup from './ProductPreviewPopup';
import ProductAddPopup from '../../components/ProductAddPopup';
import type { CreateSupplierInvoiceProduct, CreateSupplierInvoiceData } from '../../services/supplierInvoice';
import { getSession } from '../../utils/storage';
import { getCurrencies } from '../../services/currency';
import { createPartner } from '../../services/partner';

interface Product {
  id: string;
  name: string;
  code?: string;
  price: number;
  riCoefficient?: number;
  availableQuantity?: number; // Thêm để giới hạn số lượng trả
}

interface FormData {
  date: string;
  customerId: string;
  customerName: string;
  currencyId: string;
  currencyName: string;
  comment: string;
  employeeId: string;
  employeeName: string;
  externalAccountId: string;
  externalAccountName: string;
  amount: number;
  originalOrderId?: string; // Thêm để lưu ID đơn hàng gốc
  originalOrderNumber?: string; // Thêm để lưu số đơn hàng gốc
  products: Array<{
    productId: string;
    productName: string;
    unitId: string;
    unitName: string;
    quantity: number;
    price: number;
    coefficient: number;
    total: number;
    availableQuantity?: number; // Thêm để giới hạn số lượng trả
  }>;
}

interface Supplier {
  id: string;
  name: string;
}

interface Currency {
  id: string;
  name: string;
}

interface XTSFoundObject {
  _type: "XTSFoundObject";
  lineNumber: number;
  attributeValue: string;
  objects: any[];
  selectedObject?: any;
}

export default function SupplierInvoiceAdd() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [isSavingFromPopup, setIsSavingFromPopup] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [previewData, setPreviewData] = useState<{
    generalInfo: { date: string; documentAmount: string; documentQuantity: string; number: string; contactInfo: string; comment: string; supplier: string };
    notExist: ProcessedImageData[];
    existed: XTSFoundObject[];
  } | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isFetchingSuppliers, setIsFetchingSuppliers] = useState(false);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isFetchingCurrencies, setIsFetchingCurrencies] = useState(false);
  const [showCreateSupplierPopup, setShowCreateSupplierPopup] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [showProductAddPopup, setShowProductAddPopup] = useState(false);
  const [currentProductIndex, setCurrentProductIndex] = useState<number | null>(null);
  const [isReturnOrder, setIsReturnOrder] = useState(false); // Đánh dấu là đơn trả hàng
  const [originalProducts, setOriginalProducts] = useState<Product[]>([]); // Danh sách sản phẩm từ đơn gốc

  const session = getSession();
  const defaultValues = session?.defaultValues || {};

  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().slice(0, 16),
    customerId: '',
    customerName: '',
    currencyId: '',
    currencyName: '',
    comment: '',
    employeeId: defaultValues.employeeResponsible?.id || '',
    employeeName: defaultValues.employeeResponsible?.presentation || '',
    externalAccountId: defaultValues.externalAccount?.id || '',
    externalAccountName: defaultValues.externalAccount?.presentation || '',
    amount: 0,
    products: []
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [isFetchingProducts, setIsFetchingProducts] = useState(false);

  // Load dữ liệu từ sessionStorage khi là đơn trả hàng
  useEffect(() => {
    const preloadData = sessionStorage.getItem('newSupplierInvoiceData');
    if (preloadData) {
      const parsedData = JSON.parse(preloadData);
      setIsReturnOrder(parsedData.isReturnOrder || false);
      setOriginalProducts(parsedData.originalProducts || []);
      setFormData(prev => ({
        ...prev,
        customerId: parsedData.supplierId || '',
        customerName: parsedData.supplierName || '',
        employeeId: parsedData.employeeId || prev.employeeId,
        employeeName: parsedData.employeeName || prev.employeeName,
        comment: `Trả hàng từ đơn #${parsedData.originalOrderNumber || ''}`,
        originalOrderId: parsedData.originalOrderId || '',
        originalOrderNumber: parsedData.originalOrderNumber || '',
        products: parsedData.originalProducts.map((p: any) => ({
          productId: p.productId,
          productName: p.productName,
          unitId: '5736c39c-5b28-11ef-a699-00155d058802',
          unitName: p.unit,
          quantity: 0, // Mặc định số lượng là 0, người dùng sẽ nhập
          price: p.price,
          coefficient: p.coefficient,
          total: 0,
          availableQuantity: p.availableQuantity
        }))
      }));
      // Xóa dữ liệu sau khi sử dụng
      sessionStorage.removeItem('newSupplierInvoiceData');
    }
  }, []);

  const fetchSuppliers = async () => {
    setIsFetchingSuppliers(true);
    try {
      const response = await getSupplierDropdownData();
      const supplierList = response || [];
      setSuppliers(supplierList);
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
      const cnyCurrency = response.items.find(currency => currency.name === 'CNY');
      if (cnyCurrency) {
        setFormData(prev => ({
          ...prev,
          currencyId: cnyCurrency.id,
          currencyName: cnyCurrency.name
        }));
      }
    } catch (error) {
      toast.error('Không thể tải danh sách loại tiền tệ');
      console.error('Error fetching currencies:', error);
    } finally {
      setIsFetchingCurrencies(false);
    }
  };

  const fetchProductsOnce = async () => {
    if (!isReturnOrder) {
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
    } else {
      setProducts(originalProducts); // Chỉ sử dụng sản phẩm từ đơn gốc
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchCurrencies();
    fetchProductsOnce();
  }, []);

  const calculateTotal = () => {
    return formData.products.reduce((sum, product) => sum + product.total, 0);
  };

  const handleAddProduct = () => {
    if (isReturnOrder && formData.products.length >= originalProducts.length) {
      toast.error('Không thể thêm sản phẩm mới cho đơn trả hàng');
      return;
    }
    setFormData(prev => ({
      ...prev,
      products: [
        ...prev.products,
        {
          productId: '',
          productName: '',
          unitId: '5736c39c-5b28-11ef-a699-00155d058802',
          unitName: 'c',
          quantity: 0,
          price: 0,
          coefficient: 1,
          total: 0,
          availableQuantity: 0
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
      newProducts[index] = {
        ...newProducts[index],
        [field]: value
      };

      if (field === 'quantity') {
        const maxQuantity = newProducts[index].availableQuantity || Infinity;
        newProducts[index].quantity = Math.min(Number(value), maxQuantity);
        newProducts[index].total = newProducts[index].quantity * newProducts[index].price;
      }

      if (field === 'price') {
        newProducts[index].total = newProducts[index].quantity * Number(value);
      }

      if (field === 'productId') {
        if (value === 'create-product' && !isReturnOrder) {
          setCurrentProductIndex(index);
          setShowProductAddPopup(true);
          return prev;
        }

        const selected = products.find(p => p.id === value);
        if (selected) {
          newProducts[index].productName = selected.name;
          newProducts[index].price = selected.price;
          newProducts[index].coefficient = selected.riCoefficient || 1;
          newProducts[index].total = selected.price * newProducts[index].quantity;
          newProducts[index].availableQuantity = selected.availableQuantity || Infinity;
        } else {
          newProducts[index].productName = '';
          newProducts[index].price = 0;
          newProducts[index].coefficient = 1;
          newProducts[index].total = 0;
          newProducts[index].availableQuantity = 0;
        }
      }

      return { ...prev, products: newProducts };
    });
  };

  const handleProductAdded = async (newProduct: { id: string; presentation: string }) => {
    try {
      const productDetail = await getProductDetail(newProduct.id);
      const defaultUnit = productDetail.uoms[0] || { id: '5736c39c-5b28-11ef-a699-00155d058802', presentation: 'c', coefficient: 1 };

      const newProductOption: Product = {
        id: productDetail.id,
        name: productDetail.name,
        code: productDetail.code,
        price: productDetail.price,
        riCoefficient: productDetail.riCoefficient || 1
      };
      setProducts(prev => [...prev, newProductOption]);

      if (currentProductIndex !== null) {
        setFormData(prev => {
          const newProducts = [...prev.products];
          newProducts[currentProductIndex] = {
            productId: productDetail.id,
            productName: productDetail.name,
            unitId: defaultUnit.id,
            unitName: defaultUnit.presentation,
            quantity: 1,
            price: productDetail.price,
            coefficient: defaultUnit.coefficient,
            total: productDetail.price * 1
          };
          return { ...prev, products: newProducts };
        });
      }

      setShowProductAddPopup(false);
      setCurrentProductIndex(null);
      toast.success('Sản phẩm đã được thêm vào đơn nhận hàng');
    } catch (error) {
      toast.error('Không thể tải chi tiết sản phẩm vừa thêm');
      console.error('Error fetching new product detail:', error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files).slice(0, 5 - uploadedImages.length);
      setUploadedImages(prev => [...prev, ...newImages]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleProcessImagesClick = async () => {
    if (uploadedImages.length === 0) {
      toast.error('Vui lòng tải lên ít nhất 1 ảnh');
      return;
    }
    setIsProcessingImages(true);
    try {
      const result = await handleProcessImages(uploadedImages);
      setPreviewData({
        generalInfo: {
          date: result.generalInfo.date,
          documentAmount: result.generalInfo.documentAmount,
          documentQuantity: result.generalInfo.documentQuantity,
          number: result.generalInfo.number,
          contactInfo: result.generalInfo.contactInfo,
          comment: result.generalInfo.comment,
          supplier: result.generalInfo.supplier,
        },
        notExist: result.notExist,
        existed: result.existed,
      });
      setShowPopup(true);
    } catch (error) {
      toast.error('Không thể xử lý ảnh');
    } finally {
      setIsProcessingImages(false);
    }
  };

  const handlePopupClose = () => {
    setShowPopup(false);
  };

  const handleSaveFromPopup = async (
    updatedNotExist: ProcessedImageData[],
    updatedExisted: XTSFoundObject[],
    updatedGeneralInfo: any
  ) => {
    setIsSavingFromPopup(true);
    let processedNotExist = [...updatedNotExist];

    const customerId = formData.customerId || updatedGeneralInfo.supplierId;
    const customerName = formData.customerName || updatedGeneralInfo.supplier;

    if (updatedNotExist.length > 0 && !isReturnOrder) {
      try {
        const createPromises = updatedNotExist.map(async (item) => {
          const adjustedPrice = Number(item.price);
          const adjustedCoefficient = Number(item.coefficient) || 1;
          const createProductData = {
            code: item.productCode || `NEW-${item.lineNumber}`,
            name: item.productDescription || `Sản phẩm ${item.lineNumber}`,
            category: "5736c39a-5b28-11ef-a699-00155d058802",
            purchasePrice: adjustedPrice,
            sellingPrice: adjustedPrice,
            measurementUnit: "5736c39c-5b28-11ef-a699-00155d058802",
            riCoefficient: adjustedCoefficient,
            description: item.productCharacteristic || '',
            images: []
          };

          const { id, presentation } = await createProduct(createProductData);
          const newProduct = {
            id,
            name: presentation,
            code: item.productCode || `NEW-${item.lineNumber}`,
            price: adjustedPrice,
            riCoefficient: adjustedCoefficient
          };
          setProducts(prev => [...prev, newProduct]);
          return { ...item, id, name: presentation, price: adjustedPrice.toString() };
        });

        processedNotExist = await Promise.all(createPromises);
      } catch (error) {
        toast.error('Không thể tạo sản phẩm mới');
        console.error('Error creating products:', error);
        setIsSavingFromPopup(false);
        return;
      }
    }

    const combinedProducts = [
      ...updatedExisted.map(item => {
        const selectedObj = item.selectedObject;
        const adjustedPrice = Number(selectedObj.price || 0);
        const adjustedCoefficient = Number(selectedObj.coefficient || selectedObj._uomCoefficient || 1);
        return {
          productId: selectedObj.objectId.id || '',
          productName: selectedObj.objectId.presentation || '',
          unitId: '5736c39c-5b28-11ef-a699-00155d058802',
          unitName: 'c',
          quantity: Number(selectedObj.quantity) || 1,
          price: adjustedPrice,
          coefficient: adjustedCoefficient,
          total: Number(selectedObj.total) || (Number(selectedObj.quantity) * adjustedPrice)
        };
      }),
      ...processedNotExist.map(item => {
        const adjustedPrice = Number(item.price);
        const adjustedCoefficient = Number(item.coefficient) || 1;
        return {
          productId: item.id || '',
          productName: item.name || item.productDescription,
          unitId: '5736c39c-5b28-11ef-a699-00155d058802',
          unitName: 'c',
          quantity: Number(item.quantity) || 1,
          price: adjustedPrice,
          coefficient: adjustedCoefficient,
          total: Number(item.total) || (Number(item.quantity) * adjustedPrice)
        };
      })
    ];

    setFormData(prev => ({
      ...prev,
      date: updatedGeneralInfo?.date || prev.date,
      customerId: customerId,
      customerName: customerName,
      comment: updatedGeneralInfo?.comment || prev.comment,
      amount: Number(updatedGeneralInfo?.documentAmount) || prev.amount,
      products: combinedProducts.map(item => ({
        productId: item.productId,
        productName: item.productName,
        unitId: item.unitId,
        unitName: item.unitName,
        quantity: item.quantity,
        price: item.price,
        coefficient: item.coefficient,
        total: item.total
      }))
    }));

    setShowPopup(false);
    setIsSavingFromPopup(false);
  };

  const validateForm = (): boolean => {
    if (!formData.customerId) {
      toast.error('Vui lòng chọn nhà cung cấp');
      return false;
    }

    if (formData.products.length === 0) {
      toast.error('Vui lòng thêm ít nhất một sản phẩm');
      return false;
    }

    for (const product of formData.products) {
      if (!product.productId && !product.productName) {
        toast.error('Vui lòng chọn hoặc nhập tên sản phẩm');
        return false;
      }

      if (product.quantity < 0) {
        toast.error('Số lượng không được âm');
        return false;
      }

      if (isReturnOrder && product.quantity > (product.availableQuantity || 0)) {
        toast.error(`Số lượng trả của ${product.productName} vượt quá số lượng trong đơn gốc`);
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

      const invoiceData: CreateSupplierInvoiceData = {
        date: formData.date,
        customerId: formData.customerId,
        customerName: formData.customerName,
        currencyId: formData.currencyId,
        currencyName: formData.currencyName,
        comment: formData.comment,
        employeeId: formData.employeeId,
        employeeName: formData.employeeName,
        externalAccountId: formData.externalAccountId,
        externalAccountName: formData.externalAccountName,
        amount: calculateTotal(),
        products: formData.products.map(product => ({
          productId: product.productId,
          productName: product.productName,
          unitId: product.unitId,
          unitName: product.unitName,
          quantity: product.quantity,
          price: product.price,
          coefficient: product.coefficient
        }))
      };

      const result = await createSupplierInvoice(invoiceData);
      toast.success('Tạo đơn nhận hàng thành công');
      navigate(`/supplier-invoices/${result.id}`);
    } catch (error) {
      toast.error('Không thể tạo đơn nhận hàng');
    } finally {
      setIsLoading(false);
      setShowConfirmation(false);
    }
  };

  const supplierOptions = [
    { value: 'create-supplier', label: 'Tạo nhà cung cấp', isCreateOption: true },
    ...suppliers.map(supplier => ({
      value: supplier.id,
      label: supplier.name
    }))
  ];

  const currencyOptions = currencies.map(currency => ({
    value: currency.id,
    label: currency.name
  }));

  const productOptions = [
    ...(isReturnOrder ? [] : [{ value: 'create-product', label: 'Thêm mới sản phẩm', isCreateOption: true }]),
    ...products.map(product => ({
      value: product.id,
      label: `${product.name} (Tồn: ${product.availableQuantity || 'N/A'})`
    })),
    ...formData.products
      .filter(p => p.productId && !products.some(mp => mp.id === p.productId))
      .map(p => ({
        value: p.productId,
        label: p.productName
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

  const handleSupplierChange = (selectedOption: any) => {
    if (selectedOption?.value === 'create-supplier') {
      setShowCreateSupplierPopup(true);
      return;
    }

    const selectedSupplier = suppliers.find(s => s.id === selectedOption?.value);
    setFormData(prev => ({
      ...prev,
      customerId: selectedOption ? selectedOption.value : '',
      customerName: selectedSupplier ? selectedSupplier.name : ''
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
        doOperationsByDocuments: false
      });

      const updatedSuppliers = [...suppliers, { id: newSupplier.id, name: supplierName }];
      setSuppliers(updatedSuppliers);

      setFormData(prev => ({
        ...prev,
        customerId: newSupplier.id,
        customerName: supplierName
      }));

      toast.success('Tạo nhà cung cấp thành công');
      handleCloseCreateSupplierPopup();
    } catch (error) {
      toast.error('Không thể tạo nhà cung cấp');
      console.error('Error creating supplier:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">
            {isReturnOrder ? `Trả hàng từ đơn #${formData.originalOrderNumber}` : 'Thêm mới'}
          </h1>
        </div>
      </div>

      <div className="pt-4 px-4">
        <div className="space-y-4 mb-6">
          {!isReturnOrder && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tải lên hình ảnh hoá đơn
              </label>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Tải ảnh
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadedImages.length === 5 || isProcessingImages}
                  />
                </label>
                {uploadedImages.length > 0 && (
                  <button
                    onClick={handleProcessImagesClick}
                    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    disabled={isProcessingImages}
                  >
                    Xử lý ảnh
                  </button>
                )}
              </div>
              {uploadedImages.length > 0 && (
                <div className="mt-2 overflow-x-auto flex gap-2">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative flex-shrink-0">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Uploaded ${index}`}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                        disabled={isProcessingImages}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày tạo *
            </label>
            <input
              type="datetime-local"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              disabled={isProcessingImages}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nhà cung cấp *
            </label>
            <Select
              options={supplierOptions}
              value={supplierOptions.find(option => option.value === formData.customerId) || null}
              onChange={handleSupplierChange}
              placeholder="Chọn nhà cung cấp"
              isClearable={!isReturnOrder} // Không cho xóa khi là đơn trả hàng
              isSearchable
              className="text-sm"
              classNamePrefix="select"
              isDisabled={isFetchingSuppliers || isProcessingImages || isReturnOrder} // Khóa khi là đơn trả hàng
              components={{ Option: CustomOption }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại tiền tệ
            </label>
            <Select
              options={currencyOptions}
              value={currencyOptions.find(option => option.value === formData.currencyId) || null}
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
              onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Nhập ghi chú..."
              disabled={isProcessingImages}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-medium text-gray-900">Danh sách sản phẩm</h2>
            {!isReturnOrder && (
              <button
                onClick={handleAddProduct}
                className="text-sm text-blue-600 hover:text-blue-700"
                disabled={isProcessingImages}
              >
                Thêm sản phẩm
              </button>
            )}
          </div>

          <div className="space-y-4">
            {formData.products.map((product, index) => {
              const selectedProduct = products.find(p => p.id === product.productId);
              const code = selectedProduct?.code || 'N/A';
              const riCoefficient = selectedProduct?.riCoefficient || product.coefficient || 1;

              return (
                <div key={index} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex gap-3 mb-3">
                    <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Select
                        options={productOptions}
                        value={productOptions.find(option => option.value === product.productId) || null}
                        onChange={(selectedOption) => {
                          handleProductChange(index, 'productId', selectedOption ? selectedOption.value : '');
                        }}
                        placeholder="Chọn sản phẩm"
                        isClearable={!isReturnOrder}
                        isSearchable
                        className="text-sm"
                        classNamePrefix="select"
                        isDisabled={isFetchingProducts || isProcessingImages}
                        components={{ Option: CustomOption }}
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
                      disabled={isProcessingImages}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Số lượng {isReturnOrder ? `(Tối đa: ${product.availableQuantity})` : ''}
                      </label>
                      <input
                        type="number"
                        value={product.quantity}
                        onChange={(e) => handleProductChange(index, 'quantity', Number(e.target.value))}
                        min="0"
                        max={isReturnOrder ? product.availableQuantity : undefined}
                        className="w-full text-sm text-gray-900 bg-transparent border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        inputMode="numeric"
                        disabled={isProcessingImages}
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
                        className="w-full text-sm text-gray-900 bg-transparent border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        inputMode="numeric"
                        disabled={isProcessingImages || isReturnOrder} // Khóa giá khi là đơn trả hàng
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
              );
            })}
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

      <div className="fixed bottom-4 right-4 flex flex-row gap-2 z-50">
        <button
          onClick={() => navigate('/supplier-invoices')}
          className="p-2 bg-gray-600 text-white rounded-full shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
          disabled={isProcessingImages || isSavingFromPopup}
          title="Quay lại danh sách"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        
        <button
          onClick={handleSubmit}
          disabled={isLoading || isProcessingImages || isSavingFromPopup}
          className="p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          title="Lưu đơn nhận hàng"
        >
          <Save className="h-5 w-5" />
        </button>
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Xác nhận tạo đơn nhận hàng
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Bạn có chắc chắn muốn tạo đơn nhận hàng này không?
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

      {showCreateSupplierPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Tạo nhà cung cấp mới
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên Nhà cung cấp *
                </label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập tên nhà cung cấp"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
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

      {showPopup && previewData && (
        <ProductPreviewPopup
          generalInfo={previewData.generalInfo}
          notExist={previewData.notExist}
          existed={previewData.existed}
          suppliers={suppliers}
          onClose={handlePopupClose}
          onSave={handleSaveFromPopup}
        />
      )}

      {showProductAddPopup && (
        <ProductAddPopup
          onClose={() => {
            setShowProductAddPopup(false);
            setCurrentProductIndex(null);
          }}
          onProductAdded={handleProductAdded}
        />
      )}

      {isProcessingImages && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="flex flex-col items-center">
            <svg
              className="animate-spin h-10 w-10 text-white mb-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-white text-sm">Đang xử lý ảnh...</span>
          </div>
        </div>
      )}

      {isSavingFromPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="flex flex-col items-center">
            <svg
              className="animate-spin h-10 w-10 text-white mb-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-white text-sm">Đang lưu dữ liệu...</span>
          </div>
        </div>
      )}
    </div>
  );
}