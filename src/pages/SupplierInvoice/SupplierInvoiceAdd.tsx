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
  PlusCircle,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Select from 'react-select';
import toast from 'react-hot-toast';
import { createSupplierInvoice, getSupplierDropdownData, getProductDropdownData } from '../../services/supplierInvoice';
import { handleProcessImages, ProcessedImageData } from '../../utils/imageProcessing';
import { getProductDetail, getMeasurementUnits, type ProductDetail } from '../../services/product';
import ProductPreviewPopup from './ProductPreviewPopup';
import ProductAddPopup from '../../components/ProductAddPopup';
import type { SupplierProduct, CreateSupplierInvoiceData } from '../../services/supplierInvoice';
import { getSession } from '../../utils/storage';
import { getCurrencies } from '../../services/currency';
import { createPartner } from '../../services/partner';
import { createProduct } from '../../services/product';

interface ProductItem {
  id: string;
  name: string;
  code?: string;
  price: number;
  riCoefficient?: number;
  availableQuantity?: number;
  baseUnitId?: string;
  baseUnit?: string;
}

interface FormData {
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
  originalOrderId?: string;
  originalOrderNumber?: string;
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
  const [measurementUnits, setMeasurementUnits] = useState<MeasurementUnit[]>([]);
  const [isFetchingMeasurementUnits, setIsFetchingMeasurementUnits] = useState(false);
  const [showCreateSupplierPopup, setShowCreateSupplierPopup] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [showProductAddPopup, setShowProductAddPopup] = useState(false);
  const [currentProductIndex, setCurrentProductIndex] = useState<number | null>(null);
  const [isReturnOrder, setIsReturnOrder] = useState(false);
  const [originalProducts, setOriginalProducts] = useState<ProductItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isFetchingProducts, setIsFetchingProducts] = useState(false);
  const [newProduct, setNewProduct] = useState<SupplierProduct | null>(null);

  const session = getSession();
  const defaultValues = session?.defaultValues || {};

  const [formData, setFormData] = useState<FormData>({
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

  useEffect(() => {
    const preloadData = sessionStorage.getItem('newSupplierInvoiceData');
    if (preloadData) {
      const parsedData = JSON.parse(preloadData);
      setIsReturnOrder(parsedData.isReturnOrder || false);
      setOriginalProducts(parsedData.originalProducts || []);
      setFormData({
        date: new Date().toISOString().slice(0, 16),
        counterpartyId: parsedData.customerId || '',
        counterpartyName: parsedData.customerName || '',
        currencyId: '',
        currencyName: '',
        comment: `Trả hàng từ đơn #${parsedData.originalOrderNumber || ''}`,
        employeeId: parsedData.employeeId || defaultValues.employeeResponsible?.id || '',
        employeeName: parsedData.employeeName || defaultValues.employeeResponsible?.presentation || '',
        structuralUnitId: defaultValues.externalAccount?.id || '',
        structuralUnitName: defaultValues.externalAccount?.presentation || '',
        amount: 0,
        originalOrderId: parsedData.originalOrderId || '',
        originalOrderNumber: parsedData.originalOrderNumber || '',
        products: []
      });
      sessionStorage.removeItem('newSupplierInvoiceData');
    }
  }, []);

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
    if (!isReturnOrder) {
      setIsFetchingProducts(true);
      try {
        const response = await getProductDropdownData();
        setProducts(response.map(item => ({
          id: item.id,
          name: item.name,
          code: item.code,
          price: 0,
          riCoefficient: 1,
          baseUnitId: '',
          baseUnit: ''
        })));
      } catch (error) {
        toast.error('Không thể tải danh sách sản phẩm');
        console.error('Error fetching products:', error);
      } finally {
        setIsFetchingProducts(false);
      }
    } else {
      const mappedProducts = originalProducts.map(p => ({
        id: p.id,
        name: p.name,
        code: p.code,
        price: p.price,
        riCoefficient: p.riCoefficient,
        availableQuantity: p.availableQuantity,
        baseUnitId: p.baseUnitId,
        baseUnit: p.baseUnit
      }));
      setProducts(mappedProducts);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchCurrencies();
    fetchMeasurementUnits();
    fetchProducts();
  }, [isReturnOrder, originalProducts]);

  const calculateTotal = () => {
    return formData.products.reduce((sum, product) => sum + product.total, 0);
  };

  const handleAddProduct = () => {
    if (isReturnOrder && formData.products.length >= originalProducts.length) {
      toast.error('Không thể thêm quá số lượng sản phẩm trong đơn gốc');
      return;
    }

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
      products: prev.products.filter((_, i) => i !== index).map((p, i) => ({ ...p, lineNumber: i + 1 }))
    }));
  };

  const handleProductChange = async (selectedOption: any) => {
    if (!selectedOption || !newProduct) return;

    if (selectedOption.value === 'create-product' && !isReturnOrder) {
      setShowProductAddPopup(false);
      setCurrentProductIndex(0);
      setShowProductAddPopup(true);
      return;
    }

    try {
      const productDetail = await getProductDetail(selectedOption.value);
      const defaultUnit = productDetail.uoms[0] || { id: '', presentation: '', coefficient: 1 };
      const productSource = isReturnOrder
        ? originalProducts.find(p => p.id === selectedOption.value)
        : {
            id: productDetail.id,
            name: productDetail.name,
            code: productDetail.code,
            price: productDetail.price,
            riCoefficient: productDetail.riCoefficient,
            baseUnitId: defaultUnit.id,
            baseUnit: defaultUnit.presentation
          };

      setNewProduct(prev => ({
        ...prev!,
        product: { _type: 'XTSObjectId', dataType: 'XTSProduct', id: productSource.id, presentation: productSource.name },
        sku: productSource.code || '',
        price: productSource.price,
        priceOriginal: productSource.price,
        coefficient: productSource.riCoefficient || defaultUnit.coefficient || 1,
        total: productSource.price * prev!.quantity,
        amount: productSource.price * prev!.quantity,
        uom: {
          _type: 'XTSObjectId',
          dataType: 'XTSUOMClassifier',
          id: productSource.baseUnitId || defaultUnit.id,
          presentation: productSource.baseUnit || defaultUnit.presentation
        },
        availableQuantity: isReturnOrder ? productSource.availableQuantity : undefined
      }));
    } catch (error) {
      toast.error('Không thể tải chi tiết sản phẩm');
      console.error('Error fetching product detail:', error);
    }
  };

  const handleFieldChange = (field: keyof SupplierProduct, value: any) => {
    const newValue = value === '' ? 0 : Number(value);

    setNewProduct(prev => {
      if (!prev) return prev;
      const updatedProduct = {
        ...prev,
        [field]: newValue,
        total: (field === 'quantity' ? newValue : prev.quantity) * (field === 'price' ? newValue : prev.price),
        amount: (field === 'quantity' ? newValue : prev.quantity) * (field === 'price' ? newValue : prev.price)
      };

      if (field === 'quantity' && isReturnOrder) {
        const maxQuantity = updatedProduct.availableQuantity || 0;
        updatedProduct.quantity = Math.min(newValue, maxQuantity);
        updatedProduct.total = updatedProduct.quantity * updatedProduct.price;
        updatedProduct.amount = updatedProduct.quantity * updatedProduct.price;
      }

      if (field === 'price') {
        updatedProduct.priceOriginal = newValue;
      }

      return updatedProduct;
    });
  };

  const handleQuantityAdjust = (adjustment: number) => {
    setNewProduct(prev => {
      if (!prev) return prev;
      let newQuantity = Math.max(1, prev.quantity + adjustment);
      if (isReturnOrder && prev.availableQuantity) {
        newQuantity = Math.min(newQuantity, prev.availableQuantity);
      }
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

  // Reset newProduct thay vì đóng popup
  setNewProduct({
    lineNumber: formData.products.length + 2, // Tăng lineNumber cho sản phẩm tiếp theo
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

  toast.success('Đã thêm sản phẩm vào đơn hàng');
  // Không đóng popup: setShowProductAddPopup(false) bị loại bỏ
};

  const handleProductAdded = async (newProductData: { id: string; presentation: string }) => {
    if (isReturnOrder) return;

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

      if (currentProductIndex !== null) {
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
          coefficient: productDetail.riCoefficient || defaultUnit.coefficient || 1,
          priceOriginal: productDetail.price,
          vatRateRate: null,
          picture: null
        });
      }

      setShowProductAddPopup(true);
      setCurrentProductIndex(null);
      toast.success('Sản phẩm đã được thêm');
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
          supplier: result.generalInfo.supplier
        },
        notExist: result.notExist,
        existed: result.existed
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

    const supplierFromOCR = updatedGeneralInfo.supplier?.trim();
    const existingSupplier = suppliers.find(
      s => s.name.toLowerCase() === supplierFromOCR?.toLowerCase()
    );

    const counterpartyId = existingSupplier ? existingSupplier.id : formData.counterpartyId;
    const counterpartyName = existingSupplier ? existingSupplier.name : formData.counterpartyName;

    if (updatedNotExist.length > 0 && !isReturnOrder) {
      try {
        const defaultMeasurementUnit = measurementUnits.find(unit => unit.presentation === 'c') || measurementUnits[0] || { id: '', presentation: '' };
        
        const createPromises = updatedNotExist.map(async item => {
          const adjustedPrice = Number(item.price);
          const adjustedCoefficient = Number(item.coefficient) || 1;
          const createProductData = {
            code: item.productCode || `NEW-${item.lineNumber}`,
            name: item.productDescription || `Sản phẩm ${item.lineNumber}`,
            category: defaultValues.productCategory?.id || '',
            purchasePrice: adjustedPrice,
            sellingPrice: adjustedPrice,
            measurementUnit: defaultMeasurementUnit.id,
            riCoefficient: adjustedCoefficient,
            description: item.productCharacteristic || '',
            images: []
          };

          const { id, presentation } = await createProduct(createProductData);
          const productDetail = await getProductDetail(id);
          const defaultUnit = productDetail.uoms[0] || { id: '', presentation: '', coefficient: 1 };

          const newProduct = {
            id,
            name: presentation,
            code: item.productCode || `NEW-${item.lineNumber}`,
            price: adjustedPrice,
            riCoefficient: adjustedCoefficient,
            baseUnitId: defaultUnit.id,
            baseUnit: defaultUnit.presentation
          };

          setProducts(prev => [...prev, newProduct]);
          return {
            ...item,
            id,
            name: presentation,
            price: adjustedPrice.toString(),
            baseUnitId: defaultUnit.id,
            baseUnit: defaultUnit.presentation
          };
        });

        processedNotExist = await Promise.all(createPromises);
      } catch (error) {
        toast.error('Không thể tạo sản phẩm mới');
        console.error('Error creating products:', error);
        setIsSavingFromPopup(false);
        return;
      }
    }

    const combinedProducts: SupplierProduct[] = [
      ...updatedExisted.map((item, index) => {
        const selectedObj = item.selectedObject;
        const adjustedPrice = Number(selectedObj.price || 0);
        const adjustedQuantity = Number(selectedObj.quantity) || 1;
        const adjustedCoefficient = Number(selectedObj.coefficient || selectedObj._uomCoefficient || 1);
        return {
          lineNumber: index + 1,
          product: { _type: 'XTSObjectId', dataType: 'XTSProduct', id: selectedObj.objectId.id || '', presentation: selectedObj.objectId.presentation || '' },
          characteristic: null,
          uom: { _type: 'XTSObjectId', dataType: 'XTSUOMClassifier', id: selectedObj.uom?.id || '', presentation: selectedObj.uom?.presentation || '' },
          quantity: adjustedQuantity,
          price: adjustedPrice,
          amount: adjustedQuantity * adjustedPrice,
          discountsMarkupsAmount: null,
          vatAmount: null,
          vatRate: null,
          total: adjustedQuantity * adjustedPrice,
          sku: selectedObj.sku || '',
          coefficient: adjustedCoefficient,
          priceOriginal: adjustedPrice,
          vatRateRate: null,
          picture: null
        };
      }),
      ...processedNotExist.map((item, index) => {
        const adjustedPrice = Number(item.price);
        const adjustedQuantity = Number(item.quantity) || 1;
        const adjustedCoefficient = Number(item.coefficient) || 1;
        return {
          lineNumber: updatedExisted.length + index + 1,
          product: { _type: 'XTSObjectId', dataType: 'XTSProduct', id: item.id || '', presentation: item.name || item.productDescription },
          characteristic: null,
          uom: {
            _type: 'XTSObjectId',
            dataType: 'XTSUOMClassifier',
            id: item.baseUnitId || '',
            presentation: item.baseUnit || ''
          },
          quantity: adjustedQuantity,
          price: adjustedPrice,
          amount: adjustedQuantity * adjustedPrice,
          discountsMarkupsAmount: null,
          vatAmount: null,
          vatRate: null,
          total: adjustedQuantity * adjustedPrice,
          sku: item.productCode || `NEW-${item.lineNumber}`,
          coefficient: adjustedCoefficient,
          priceOriginal: adjustedPrice,
          vatRateRate: null,
          picture: null
        };
      })
    ];

    setFormData(prev => ({
      ...prev,
      date: updatedGeneralInfo?.date || prev.date,
      counterpartyId,
      counterpartyName,
      comment: updatedGeneralInfo?.comment || prev.comment,
      amount: Number(updatedGeneralInfo?.documentAmount) || prev.amount,
      products: combinedProducts
    }));

    setShowPopup(false);
    setIsSavingFromPopup(false);
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

      if (product.quantity < 0) {
        toast.error('Số lượng không được âm');
        return false;
      }

      if (isReturnOrder && product.quantity > (product.availableQuantity || 0)) {
        toast.error(`Số lượng trả của ${product.product.presentation} vượt quá số lượng trong đơn gốc`);
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

      const operationKindId = isReturnOrder ? 'ReturnFromCustomer' : 'ReceiptFromSupplier';
      const operationKindPresentation = isReturnOrder ? 'Trả hàng từ khách' : 'Mua hàng từ nhà cung cấp';

      const invoiceData: CreateSupplierInvoiceData = {
        date: formData.date,
        posted: isReturnOrder ? true : false,
        operationKindId,
        operationKindPresentation,
        companyId: defaultValues.company?.id || '',
        companyName: defaultValues.company?.presentation || '',
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
        products: formData.products
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

  const productOptions = isReturnOrder
    ? originalProducts.map(product => ({
        value: product.id,
        label: product.name || 'Không có tên'
      }))
    : [
        { value: 'create-product', label: 'Thêm mới sản phẩm', isCreateOption: true },
        ...products.map(product => ({
          value: product.id,
          label: product.name || 'Không có tên'
        })),
        ...formData.products
          .filter(p => p.product.id && !products.some(mp => mp.id === p.product.id))
          .map(p => ({
            value: p.product.id,
            label: p.product.presentation || 'Không có tên'
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
      counterpartyId: selectedOption ? selectedOption.value : '',
      counterpartyName: selectedSupplier ? selectedSupplier.name : ''
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
        counterpartyId: newSupplier.id,
        counterpartyName: supplierName
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
              onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
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
              value={
                formData.counterpartyId
                  ? { value: formData.counterpartyId, label: formData.counterpartyName }
                  : null
              }
              onChange={handleSupplierChange}
              placeholder="Chọn nhà cung cấp"
              isClearable={!isReturnOrder}
              isSearchable
              className="text-sm"
              classNamePrefix="select"
              isDisabled={isFetchingSuppliers || isProcessingImages || isReturnOrder}
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
              onChange={e => setFormData(prev => ({ ...prev, comment: e.target.value }))}
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
          </div>

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
                        onChange={selectedOption => {
                          // Handle product change if needed in the future
                        }}
                        placeholder="Chọn sản phẩm"
                        isClearable={!isReturnOrder}
                        isSearchable
                        className="text-sm"
                        classNamePrefix="select"
                        isDisabled={true} // Disable editing existing products directly
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
                      disabled={isProcessingImages}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Số lượng{' '}
                        {isReturnOrder && product.product.id && product.availableQuantity !== undefined
                          ? `(Tối đa: ${product.availableQuantity})`
                          : ''}
                      </label>
                      <input
                        type="number"
                        value={product.quantity}
                        className="w-full text-sm text-gray-900 bg-transparent border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={true} // Disable direct editing
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Đơn giá</label>
                      <input
                        type="number"
                        value={product.price}
                        className="w-full text-sm text-gray-900 bg-transparent border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={true} // Disable direct editing
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
              disabled={isProcessingImages}
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
                  onChange={e => setSupplierName(e.target.value)}
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
                  onChange={e => setSupplierPhone(e.target.value)}
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
                  onChange={e => setSupplierAddress(e.target.value)}
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
            onChange={handleProductChange}
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
              disabled={isReturnOrder}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">
              Số lượng{' '}
              {isReturnOrder && newProduct.availableQuantity !== undefined
                ? `(Tối đa: ${newProduct.availableQuantity})`
                : ''}
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
                onFocus={(e) => e.target.value = ''} // Clear value on focus
                min="1"
                max={isReturnOrder ? newProduct.availableQuantity : undefined}
                className="w-full text-sm text-gray-900 border-t border-b border-gray-300 px-2 py-1 focus:ring-blue-500 focus:border-blue-500 text-center"
                inputMode="numeric"
              />
              <button
                onClick={() => handleQuantityAdjust(1)}
                className="p-1 bg-gray-200 rounded-r-md hover:bg-gray-300"
                disabled={isReturnOrder && newProduct.quantity >= (newProduct.availableQuantity || Infinity)}
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