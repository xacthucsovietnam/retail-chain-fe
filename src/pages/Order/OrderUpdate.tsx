import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Package,
  Trash2,
  PlusCircle,
  Plus,
  ChevronDown,
  ChevronUp,
  Minus
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
  type CustomerDropdownItem,
  type EmployeeDropdownItem,
  type ProductDropdownItem,
  type OrderStateDropdownItem,
  type UpdateOrderData,
  type UpdateOrderProduct
} from '../../services/order';
import { createPartner } from '../../services/partner';
import { getSession } from '../../utils/storage';
import { getProductDetail, type ProductDetail } from '../../services/product';
import ProductAddPopup from '../../components/ProductAddPopup';

interface FormData {
  id: string;
  number: string;
  title: string;
  deletionMark: boolean | null;
  author: string;
  comment: string | null;
  companyId: string;
  company: string;
  contractId: string | null;
  contractName: string | null;
  customerId: string;
  customerName: string;
  deliveryAddress: string | null;
  deliveryAddressValue: string | null;
  discountCardId: string | null;
  discountCard: string | null;
  emailAddress: string | null;
  orderKindId: string;
  orderKind: string;
  operationTypeId: string;
  operationType: string;
  priceKindId: string;
  priceKind: string;
  shipmentDate: string;
  documentAmount: number;
  documentCurrencyId: string;
  documentCurrency: string;
  employeeResponsibleId: string | null;
  employeeResponsibleName: string | null;
  orderStateId: string;
  orderState: string;
  shippingCost: number | null;
  phone: string | null;
  completionOptionId: string | null;
  completionOption: string | null;
  cash: number | null;
  bankTransfer: number | null;
  postPayment: number | null;
  paymentNote: string | null;
  rate: number;
  multiplicity: number;
  vatTaxationId: string;
  vatTaxation: string;
  status: string | null;
  externalAccountId: string | null;
  externalAccount: string | null;
  receiptableIncrease: number;
  receiptableDecrease: number;
  receiptableBalance: number;
  products: Array<{
    lineNumber: number;
    productId: string;
    productName: string;
    characteristic: string | null;
    unitId: string;
    unitName: string;
    quantity: number | string;
    price: number;
    amount: number;
    automaticDiscountAmount: number;
    discountsMarkupsAmount: number;
    vatAmount: number;
    vatRateId: string;
    vatRateName: string;
    total: number;
    code: string;
    coefficient: number;
    availableUnits: Array<{ id: string; presentation: string; coefficient: number }>;
    imageUrl?: string;
  }>;
  date: string;
}

export default function OrderUpdate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const session = getSession();
  const defaultValues = session?.defaultValues || {};

  const initialOrderData = location.state?.orderData as UpdateOrderData | undefined;

  const [formData, setFormData] = useState<FormData>({
    id: initialOrderData?.id || '',
    number: initialOrderData?.number || '',
    title: initialOrderData?.title || '',
    deletionMark: initialOrderData?.deletionMark || null,
    author: initialOrderData?.author || '',
    comment: initialOrderData?.comment || '',
    companyId: initialOrderData?.companyId || '',
    company: initialOrderData?.company || '',
    contractId: initialOrderData?.contractId || null,
    contractName: initialOrderData?.contractName || '',
    customerId: initialOrderData?.customerId || '',
    customerName: initialOrderData?.customerName || '',
    deliveryAddress: initialOrderData?.deliveryAddress || '',
    deliveryAddressValue: initialOrderData?.deliveryAddressValue || '',
    discountCardId: initialOrderData?.discountCardId || null,
    discountCard: initialOrderData?.discountCard || '',
    emailAddress: initialOrderData?.emailAddress || '',
    orderKindId: initialOrderData?.orderKindId || '5736c2cc-5b28-11ef-a699-00155d058802',
    orderKind: initialOrderData?.orderKind || '',
    operationTypeId: initialOrderData?.operationTypeId || 'OrderForSale',
    operationType: initialOrderData?.operationType || '',
    priceKindId: initialOrderData?.priceKindId || '1a1fb49c-5b28-11ef-a699-00155d058802',
    priceKind: initialOrderData?.priceKind || '',
    shipmentDate: initialOrderData?.shipmentDate || '',
    documentAmount: initialOrderData?.documentAmount || 0,
    documentCurrencyId: initialOrderData?.documentCurrencyId || 'c26a4d87-c6e2-4aca-ab05-1b02be6ecaec',
    documentCurrency: initialOrderData?.documentCurrency || '',
    employeeResponsibleId: initialOrderData?.employeeResponsibleId || defaultValues.employeeResponsible?.id || '',
    employeeResponsibleName: initialOrderData?.employeeResponsibleName || defaultValues.employeeResponsible?.presentation || '',
    orderStateId: initialOrderData?.orderStateId || '',
    orderState: initialOrderData?.orderState || '',
    shippingCost: initialOrderData?.shippingCost || null,
    phone: initialOrderData?.phone || '',
    completionOptionId: initialOrderData?.completionOptionId || null,
    completionOption: initialOrderData?.completionOption || '',
    cash: initialOrderData?.cash || null,
    bankTransfer: initialOrderData?.bankTransfer || null,
    postPayment: initialOrderData?.postPayment || null,
    paymentNote: initialOrderData?.paymentNote || '',
    rate: initialOrderData?.rate || 1,
    multiplicity: initialOrderData?.multiplicity || 1,
    vatTaxationId: initialOrderData?.vatTaxationId || 'NotTaxableByVAT',
    vatTaxation: initialOrderData?.vatTaxation || '',
    status: initialOrderData?.status || '',
    externalAccountId: initialOrderData?.externalAccountId || null,
    externalAccount: initialOrderData?.externalAccount || '',
    receiptableIncrease: initialOrderData?.receiptableIncrease || 0,
    receiptableDecrease: initialOrderData?.receiptableDecrease || 0,
    receiptableBalance: initialOrderData?.receiptableBalance || 0,
    products: initialOrderData?.products.map(p => ({
      lineNumber: p.lineNumber || 0,
      productId: p.productId || '',
      productName: p.productName || '',
      characteristic: p.characteristic || null,
      unitId: p.unitId || '',
      unitName: p.unitName || '',
      quantity: p.quantity || 1,
      price: p.price || 0,
      amount: p.amount || 0,
      automaticDiscountAmount: p.automaticDiscountAmount || 0,
      discountsMarkupsAmount: p.discountsMarkupsAmount || 0,
      vatAmount: p.vatAmount || 0,
      vatRateId: p.vatRateId || '',
      vatRateName: p.vatRateName || '',
      total: p.total || 0,
      code: p.code || '',
      coefficient: p.coefficient || 1,
      availableUnits: [],
      imageUrl: undefined
    })) || [],
    date: initialOrderData?.date || ''
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
  const [showProductAddPopup, setShowProductAddPopup] = useState(false);
  const [newProduct, setNewProduct] = useState<FormData['products'][0] | null>(null);
  const [isOrderInfoExpanded, setIsOrderInfoExpanded] = useState(true);
  const [isProductListExpanded, setIsProductListExpanded] = useState(true);
  const [showCreateProductPopup, setShowCreateProductPopup] = useState(false);
  const [currentProductIndex, setCurrentProductIndex] = useState<number | null>(null);

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
          initialOrderData ? Promise.resolve(null) : getOrderDetail(id),
          getCustomerDropdownData(),
          getEmployeeDropdownData(),
          getProductDropdownData(),
          getOrderStateDropdownData()
        ]);

        setCustomers(customerData);
        setEmployees(employeeData);
        setProducts(productData);
        setOrderStates(orderStateData);

        if (!initialOrderData && orderData) {
          const productsWithDetails = await Promise.all(
            orderData.products.map(async (p) => {
              const productDetail = await getProductDetail(p.productId);
              const fileStorageURL = session?.fileStorageURL || '';
              const imageUrl = productDetail.imageUrl && productDetail.images.length > 0 
                ? `${fileStorageURL}${productDetail.images[0].id}`
                : undefined;

              const selectedUnit = productDetail.uoms.find(u => u.id === p.unitId) || 
                                 productDetail.uoms[0] || { id: '', presentation: '', coefficient: 1 };

              return {
                lineNumber: p.lineNumber,
                productId: p.productId,
                productName: p.productName,
                characteristic: p.characteristic,
                unitId: selectedUnit.id,
                unitName: selectedUnit.presentation,
                quantity: p.quantity,
                price: p.price,
                amount: p.amount,
                automaticDiscountAmount: p.automaticDiscountAmount,
                discountsMarkupsAmount: p.discountsMarkupsAmount,
                vatAmount: p.vatAmount,
                vatRateId: p.vatRateId,
                vatRateName: p.vatRateName,
                total: p.total,
                code: p.code,
                coefficient: selectedUnit.coefficient,
                availableUnits: productDetail.uoms,
                imageUrl
              };
            })
          );

          const selectedCustomer = customerData.find(c => c.id === orderData.customerId);
          const selectedOrderState = orderStateData.find(s => s.name === orderData.orderState) || 
                                   orderStateData.find(s => s.id === 'Editing');
          const selectedEmployee = employeeData.find(e => e.id === orderData.employeeResponsibleId);

          setFormData({
            id: orderData.id || '',
            number: orderData.number || '',
            title: orderData.title || '',
            deletionMark: orderData.deletionMark || null,
            author: orderData.author || '',
            comment: orderData.comment || '',
            companyId: defaultValues.company?.id || '',
            company: orderData.company || '',
            contractId: orderData.contractId || null,
            contractName: orderData.contract || '',
            customerId: selectedCustomer?.id || orderData.customerId || '',
            customerName: selectedCustomer?.name || orderData.customerName || '',
            deliveryAddress: orderData.deliveryAddress || '',
            deliveryAddressValue: orderData.deliveryAddressValue || '',
            discountCardId: orderData.discountCardId || null,
            discountCard: orderData.discountCard || '',
            emailAddress: orderData.emailAddress || '',
            orderKindId: '5736c2cc-5b28-11ef-a699-00155d058802',
            orderKind: orderData.orderKind || '',
            operationTypeId: 'OrderForSale',
            operationType: orderData.operationType || '',
            priceKindId: '1a1fb49c-5b28-11ef-a699-00155d058802',
            priceKind: orderData.priceKind || '',
            shipmentDate: orderData.shipmentDate || '',
            documentAmount: orderData.documentAmount || 0,
            documentCurrencyId: 'c26a4d87-c6e2-4aca-ab05-1b02be6ecaec',
            documentCurrency: orderData.documentCurrency || '',
            employeeResponsibleId: selectedEmployee?.id || orderData.employeeResponsibleId || defaultValues.employeeResponsible?.id || '',
            employeeResponsibleName: selectedEmployee?.name || orderData.employeeResponsibleName || defaultValues.employeeResponsible?.presentation || '',
            orderStateId: selectedOrderState?.id || 'Editing',
            orderState: selectedOrderState?.name || 'Đang soạn',
            shippingCost: orderData.shippingCost || null,
            phone: orderData.phone || '',
            completionOptionId: orderData.completionOptionId || null,
            completionOption: orderData.completionOption || '',
            cash: orderData.cash || null,
            bankTransfer: orderData.bankTransfer || null,
            postPayment: orderData.postPayment || null,
            paymentNote: orderData.paymentNote || '',
            rate: orderData.rate || 1,
            multiplicity: orderData.multiplicity || 1,
            vatTaxationId: 'NotTaxableByVAT',
            vatTaxation: orderData.vatTaxation || '',
            status: orderData.status || '',
            externalAccountId: orderData.externalAccountId || null,
            externalAccount: orderData.externalAccount || '',
            receiptableIncrease: orderData.receiptableIncrease || 0,
            receiptableDecrease: orderData.receiptableDecrease || 0,
            receiptableBalance: orderData.receiptableBalance || 0,
            products: productsWithDetails,
            date: orderData.date || ''
          });
        } else if (initialOrderData) {
          const productsWithDetails = await Promise.all(
            initialOrderData.products.map(async (p) => {
              const productDetail = await getProductDetail(p.productId);
              const fileStorageURL = session?.fileStorageURL || '';
              const imageUrl = productDetail.imageUrl && productDetail.images.length > 0 
                ? `${fileStorageURL}${productDetail.images[0].id}`
                : undefined;
              const selectedUnit = productDetail.uoms.find(u => u.id === p.unitId) || 
                                 productDetail.uoms[0] || { id: '', presentation: '', coefficient: 1 };
              return {
                ...formData.products.find(prod => prod.productId === p.productId && prod.lineNumber === p.lineNumber)!,
                availableUnits: productDetail.uoms,
                unitId: selectedUnit.id,
                unitName: selectedUnit.presentation,
                coefficient: selectedUnit.coefficient,
                imageUrl
              };
            })
          );
          setFormData(prev => ({ ...prev, products: productsWithDetails }));
        }
      } catch (error) {
        toast.error('Không thể tải dữ liệu đơn hàng');
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, initialOrderData]);

  const calculateProductTotal = (product: FormData['products'][0]) => {
    const quantity = typeof product.quantity === 'string' && product.quantity === '' ? 0 : Number(product.quantity);
    return quantity * product.price * product.coefficient;
  };

  const calculateTotal = () => {
    return formData.products.reduce((sum, product) => sum + calculateProductTotal(product), 0);
  };

  const handleAddProduct = () => {
    setNewProduct({
      lineNumber: formData.products.length + 1,
      productId: '',
      productName: '',
      characteristic: null,
      unitId: '',
      unitName: '',
      quantity: 1,
      price: 0,
      amount: 0,
      automaticDiscountAmount: 0,
      discountsMarkupsAmount: 0,
      vatAmount: 0,
      vatRateId: '',
      vatRateName: '',
      total: 0,
      code: '',
      coefficient: 1,
      availableUnits: []
    });
    setShowProductAddPopup(true);
    setIsOrderInfoExpanded(false);
  };

  const handleRemoveProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index),
      documentAmount: calculateTotal()
    }));
  };

  const handleProductChange = async (selectedOption: any) => {
    if (!selectedOption) {
      setNewProduct({
        lineNumber: formData.products.length + 1,
        productId: '',
        productName: '',
        characteristic: null,
        unitId: '',
        unitName: '',
        quantity: 1,
        price: 0,
        amount: 0,
        automaticDiscountAmount: 0,
        discountsMarkupsAmount: 0,
        vatAmount: 0,
        vatRateId: '',
        vatRateName: '',
        total: 0,
        code: '',
        coefficient: 1,
        availableUnits: []
      });
      return;
    }

    if (selectedOption.value === 'create-product') {
      setShowProductAddPopup(false);
      setShowCreateProductPopup(true);
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
        lineNumber: formData.products.length + 1,
        productId: productDetail.id,
        productName: productDetail.name,
        characteristic: null,
        unitId: defaultUnit.id,
        unitName: defaultUnit.presentation,
        quantity: 1,
        price: productDetail.price,
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
        code: productDetail.code,
        coefficient: defaultUnit.coefficient,
        availableUnits,
        imageUrl
      });
    } catch (error) {
      console.error('Error fetching product detail:', error);
      toast.error('Không thể tải chi tiết sản phẩm');
    }
  };

  const handleProductChangeInList = async (index: number, selectedOption: any) => {
    if (!selectedOption) return;

    if (selectedOption.value === 'create-product') {
      setCurrentProductIndex(index);
      setShowCreateProductPopup(true);
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

      setFormData(prev => {
        const updatedProducts = [...prev.products];
        const currentProduct = updatedProducts[index];
        updatedProducts[index] = {
          ...currentProduct,
          productId: productDetail.id,
          productName: productDetail.name,
          code: productDetail.code,
          unitId: defaultUnit.id,
          unitName: defaultUnit.presentation,
          coefficient: defaultUnit.coefficient,
          price: productDetail.price,
          amount: productDetail.price * (currentProduct.quantity === '' ? 0 : Number(currentProduct.quantity)),
          total: calculateProductTotal({
            quantity: currentProduct.quantity,
            price: productDetail.price,
            coefficient: defaultUnit.coefficient
          }),
          availableUnits,
          imageUrl
        };
        return {
          ...prev,
          products: updatedProducts,
          documentAmount: calculateTotal()
        };
      });
    } catch (error) {
      console.error('Error fetching product detail:', error);
      toast.error('Không thể tải chi tiết sản phẩm');
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
        amount: (prev!.quantity === '' ? 0 : Number(prev!.quantity)) * prev!.price,
        total: calculateProductTotal({
          ...prev!,
          coefficient: selectedUnit.coefficient,
          quantity: prev!.quantity
        })
      }));
    }
  };

  const handleUnitChangeInList = (index: number, selectedOption: any) => {
    if (!selectedOption) return;

    const selectedUnit = formData.products[index].availableUnits?.find(u => u.id === selectedOption.value);
    if (selectedUnit) {
      setFormData(prev => {
        const updatedProducts = [...prev.products];
        const currentProduct = updatedProducts[index];
        updatedProducts[index] = {
          ...currentProduct,
          unitId: selectedUnit.id,
          unitName: selectedUnit.presentation,
          coefficient: selectedUnit.coefficient,
          amount: (currentProduct.quantity === '' ? 0 : Number(currentProduct.quantity)) * currentProduct.price,
          total: calculateProductTotal({
            ...currentProduct,
            coefficient: selectedUnit.coefficient
          })
        };
        return {
          ...prev,
          products: updatedProducts,
          documentAmount: calculateTotal()
        };
      });
    }
  };

  const handleFieldChange = (field: keyof FormData['products'][0], value: any) => {
    const newValue = field === 'quantity' ? (value === '' ? '' : Number(value)) : (value === '' ? 0 : Number(value));

    setNewProduct(prev => {
      const quantityForCalc = field === 'quantity' && value === '' ? 0 : newValue;
      return {
        ...prev!,
        [field]: newValue,
        amount: field === 'quantity' || field === 'price' 
          ? quantityForCalc * (field === 'quantity' ? prev!.price : (prev!.quantity === '' ? 0 : Number(prev!.quantity)))
          : prev!.amount,
        total: calculateProductTotal({
          ...prev!,
          [field]: quantityForCalc
        })
      };
    });
  };

  const handleQuantityBlur = () => {
    if (newProduct && (newProduct.quantity === '' || Number(newProduct.quantity) < 1)) {
      toast.error('Số lượng phải lớn hơn 0');
      setNewProduct(prev => ({
        ...prev!,
        quantity: 1,
        amount: 1 * prev!.price,
        total: calculateProductTotal({
          ...prev!,
          quantity: 1
        })
      }));
    }
  };

  const handleProductFieldChange = (index: number, field: keyof FormData['products'][0], value: string) => {
    const newValue = field === 'quantity' ? (value === '' ? '' : Number(value)) : (value === '' ? 0 : Number(value));

    if (field === 'price' && newValue < 0) {
      toast.error('Đơn giá không được âm');
      return;
    }

    setFormData(prev => {
      const updatedProducts = [...prev.products];
      const product = updatedProducts[index];
      const quantityForCalc = field === 'quantity' && value === '' ? 0 : newValue;
      updatedProducts[index] = {
        ...product,
        [field]: newValue,
        amount: field === 'quantity' || field === 'price' 
          ? quantityForCalc * (field === 'quantity' ? product.price : (product.quantity === '' ? 0 : Number(product.quantity)))
          : product.amount,
        total: calculateProductTotal({
          ...product,
          [field]: quantityForCalc
        })
      };
      return {
        ...prev,
        products: updatedProducts,
        documentAmount: calculateTotal()
      };
    });
  };

  const handleProductQuantityBlur = (index: number) => {
    const product = formData.products[index];
    if (product.quantity === '' || Number(product.quantity) < 1) {
      toast.error('Số lượng phải lớn hơn 0');
      setFormData(prev => {
        const updatedProducts = [...prev.products];
        updatedProducts[index] = {
          ...product,
          quantity: 1,
          amount: 1 * product.price,
          total: calculateProductTotal({
            ...product,
            quantity: 1
          })
        };
        return {
          ...prev,
          products: updatedProducts,
          documentAmount: calculateTotal()
        };
      });
    }
  };

  const handleSaveProduct = () => {
    if (!newProduct || !newProduct.productId) {
      toast.error('Vui lòng chọn sản phẩm');
      return;
    }

    if (newProduct.quantity === '' || Number(newProduct.quantity) <= 0) {
      toast.error('Số lượng phải lớn hơn 0');
      return;
    }

    if (newProduct.price < 0) {
      toast.error('Đơn giá không được âm');
      return;
    }

    setFormData(prev => ({
      ...prev,
      products: [...prev.products, {
        ...newProduct,
        quantity: Number(newProduct.quantity),
        amount: Number(newProduct.quantity) * newProduct.price
      }],
      documentAmount: calculateTotal() + calculateProductTotal(newProduct)
    }));
    toast.success('Thêm sản phẩm vào đơn thành công');
    setNewProduct({
      lineNumber: formData.products.length + 2,
      productId: '',
      productName: '',
      characteristic: null,
      unitId: '',
      unitName: '',
      quantity: 1,
      price: 0,
      amount: 0,
      automaticDiscountAmount: 0,
      discountsMarkupsAmount: 0,
      vatAmount: 0,
      vatRateId: '',
      vatRateName: '',
      total: 0,
      code: '',
      coefficient: 1,
      availableUnits: []
    });
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

      const newProductDataFormatted = {
        lineNumber: formData.products.length + 1,
        productId: productDetail.id,
        productName: productDetail.name,
        characteristic: null,
        unitId: defaultUnit.id,
        unitName: defaultUnit.presentation,
        quantity: 1,
        price: productDetail.price,
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
        code: productDetail.code,
        coefficient: defaultUnit.coefficient,
        availableUnits,
        imageUrl
      };

      if (currentProductIndex !== null) {
        setFormData(prev => {
          const updatedProducts = [...prev.products];
          updatedProducts[currentProductIndex] = {
            ...newProductDataFormatted,
            lineNumber: updatedProducts[currentProductIndex].lineNumber
          };
          return {
            ...prev,
            products: updatedProducts,
            documentAmount: calculateTotal()
          };
        });
        setCurrentProductIndex(null);
        setShowProductAddPopup(false);
      } else {
        setNewProduct(newProductDataFormatted);
        setShowProductAddPopup(true);
      }

      setShowCreateProductPopup(false);
      toast.success('Sản phẩm đã được thêm');
    } catch (error) {
      console.error('Error fetching new product detail:', error);
      toast.error('Không thể tải chi tiết sản phẩm vừa thêm');
    }
  };

  const validateForm = (): boolean => {
    if (!formData.customerId) {
      toast.error('Vui lòng chọn khách hàng');
      return false;
    }

    if (!formData.orderStateId) {
      toast.error('Vui lòng chọn trạng thái đơn hàng');
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
      setIsSaving(true);

      const orderProducts: UpdateOrderProduct[] = formData.products.map(product => ({
        lineNumber: product.lineNumber,
        productId: product.productId,
        productName: product.productName,
        characteristic: product.characteristic,
        unitId: product.unitId,
        unitName: product.unitName,
        quantity: Number(product.quantity),
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

      const updateData: UpdateOrderData = {
        id: formData.id,
        number: formData.number,
        title: formData.title,
        deletionMark: formData.deletionMark,
        author: formData.author,
        comment: formData.comment,
        companyId: formData.companyId,
        company: formData.company,
        contractId: formData.contractId,
        contractName: formData.contractName,
        customerId: formData.customerId,
        customerName: formData.customerName,
        deliveryAddress: formData.deliveryAddress,
        deliveryAddressValue: formData.deliveryAddressValue,
        discountCardId: formData.discountCardId,
        discountCard: formData.discountCard,
        emailAddress: formData.emailAddress,
        orderKindId: formData.orderKindId,
        orderKind: formData.orderKind,
        operationTypeId: formData.operationTypeId,
        operationType: formData.operationType,
        priceKindId: formData.priceKindId,
        priceKind: formData.priceKind,
        shipmentDate: formData.shipmentDate,
        documentAmount: calculateTotal(),
        documentCurrencyId: formData.documentCurrencyId,
        documentCurrency: formData.documentCurrency,
        employeeResponsibleId: formData.employeeResponsibleId,
        employeeResponsibleName: formData.employeeResponsibleName,
        orderStateId: formData.orderStateId,
        orderState: formData.orderState,
        shippingCost: formData.shippingCost,
        phone: formData.phone,
        completionOptionId: formData.completionOptionId,
        completionOption: formData.completionOption,
        cash: formData.cash,
        bankTransfer: formData.bankTransfer,
        postPayment: formData.postPayment,
        paymentNote: formData.paymentNote,
        rate: formData.rate,
        multiplicity: formData.multiplicity,
        vatTaxationId: formData.vatTaxationId,
        vatTaxation: formData.vatTaxation,
        status: formData.status,
        externalAccountId: formData.externalAccountId,
        externalAccount: formData.externalAccount,
        receiptableIncrease: formData.receiptableIncrease,
        receiptableDecrease: formData.receiptableDecrease,
        receiptableBalance: formData.receiptableBalance,
        products: orderProducts,
        date: formData.date || new Date().toISOString()
      };

      await updateOrder(updateData);

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

  const productOptions = [
    { value: 'create-product', label: 'Thêm mới sản phẩm', isCreateOption: true },
    ...products.map(product => ({
      value: product.id,
      label: product.name
    })),
    ...formData.products
      .filter(p => p.productId && !products.some(mp => mp.id === p.productId))
      .map(p => ({
        value: p.productId,
        label: p.productName
      }))
  ];

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
    const selectedOrderState = orderStates.find(s => s.id === selectedOption?.value);
    setFormData(prev => ({
      ...prev,
      orderStateId: selectedOption ? selectedOption.value : '',
      orderState: selectedOrderState ? selectedOrderState.name : ''
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
        {/* Nhóm 1: Thông tin đơn hàng */}
        <div className="mb-6 bg-white rounded-lg shadow-sm">
          <div 
            className="flex justify-between items-center px-4 py-3 cursor-pointer"
            onClick={() => setIsOrderInfoExpanded(!isOrderInfoExpanded)}
          >
            <div className="flex items-center gap-2">
              <h2 className="text-base font-medium text-gray-900">Thông tin đơn hàng</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {formData.orderState || 'Đang soạn'}
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
                    <p className="text-sm text-gray-900">
                      Địa chỉ: {selectedCustomer.address || 'Không có'}
                    </p>
                  </div>
                </>
              )}

              <div>
                <p className="text-sm text-gray-900">
                  Người bán: {formData.employeeResponsibleName || 'Không xác định'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái *
                </label>
                <Select
                  options={orderStateOptions}
                  value={orderStateOptions.find(option => option.value === formData.orderStateId) || null}
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
                {formData.products.map((product, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex gap-3 mb-3">
                      <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
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
                        <Package className={`h-8 w-8 text-gray-400 ${product.imageUrl ? 'hidden' : ''}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Select
                          options={productOptions}
                          value={productOptions.find(option => option.value === product.productId) || null}
                          onChange={(selectedOption) => handleProductChangeInList(index, selectedOption)}
                          placeholder="Chọn sản phẩm..."
                          isSearchable
                          className="text-sm"
                          classNamePrefix="select"
                          components={{ Option: CustomOption }}
                        />
                        {product.productId && (
                          <>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-sm text-gray-500">Mã sản phẩm:</span>
                              <span className="text-sm text-gray-900">{product.code}</span>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-sm text-gray-500">Hệ số:</span>
                              <span className="text-sm text-gray-900">{product.coefficient}</span>
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

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Đơn vị tính</label>
                          <Select
                            options={product.availableUnits?.map(unit => ({
                              value: unit.id,
                              label: unit.presentation
                            }))}
                            value={product.availableUnits
                              ?.map(unit => ({ value: unit.id, label: unit.presentation }))
                              .find(option => option.value === product.unitId) || null}
                            onChange={(selectedOption) => handleUnitChangeInList(index, selectedOption)}
                            placeholder="Chọn đơn vị"
                            className="text-sm"
                            classNamePrefix="select"
                            styles={{
                              control: (provided) => ({
                                ...provided,
                                minHeight: 'auto',
                                height: '38px',
                                fontSize: '14px',
                              }),
                              valueContainer: (provided) => ({
                                ...provided,
                                padding: '2px 8px',
                              }),
                              indicatorsContainer: (provided) => ({
                                ...provided,
                                height: '38px',
                              }),
                              menu: (provided) => ({
                                ...provided,
                                zIndex: 9999,
                              }),
                            }}
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
                            className="w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            inputMode="numeric"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Số lượng</label>
                          <div className="relative flex items-center">
                            <button
                              onClick={() => handleProductFieldChange(index, 'quantity', Math.max(1, Number(product.quantity) - 1).toString())}
                              className="absolute left-0 h-9 w-9 flex items-center justify-center bg-gray-100 text-gray-600 rounded-l-md hover:bg-gray-200 focus:outline-none"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <input
                              type="number"
                              value={product.quantity === '' ? '' : product.quantity}
                              onChange={(e) => handleProductFieldChange(index, 'quantity', e.target.value)}
                              onBlur={() => handleProductQuantityBlur(index)}
                              className="w-full text-sm text-gray-900 border border-gray-300 rounded-md px-12 py-2 text-center focus:ring-blue-500 focus:border-blue-500"
                              inputMode="numeric"
                            />
                            <button
                              onClick={() => handleProductFieldChange(index, 'quantity', (Number(product.quantity) + 1).toString())}
                              className="absolute right-0 h-9 w-9 flex items-center justify-center bg-gray-100 text-gray-600 rounded-r-md hover:bg-gray-200 focus:outline-none"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col justify-end">
                          <label className="block text-xs text-gray-500 mb-1">Thành tiền</label>
                          <div className="flex items-center justify-between h-9 px-3">
                            <span className="text-sm font-medium text-blue-600">
                              {product.total.toLocaleString()} đ
                            </span>
                          </div>
                        </div>
                      </div>
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

      {showProductAddPopup && newProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-5">
              Thêm sản phẩm
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Sản phẩm <span className="text-red-500">*</span>
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mã sản phẩm
                  </label>
                  <input
                    type="text"
                    value={newProduct.code || ''}
                    readOnly
                    className="w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                    placeholder="Mã sản phẩm"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                    placeholder="Chọn đơn vị"
                    className="text-sm"
                    classNamePrefix="select"
                    styles={{
                      control: (provided) => ({
                        ...provided,
                        minHeight: 'auto',
                        height: '38px',
                        fontSize: '14px',
                      }),
                      valueContainer: (provided) => ({
                        ...provided,
                        padding: '2px 8px',
                      }),
                      indicatorsContainer: (provided) => ({
                        ...provided,
                        height: '38px',
                      }),
                      menu: (provided) => ({
                        ...provided,
                        zIndex: 9999,
                      }),
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Đơn giá
                  </label>
                  <input
                    type="number"
                    value={newProduct.price === 0 ? '' : newProduct.price}
                    onChange={(e) => handleFieldChange('price', e.target.value)}
                    min="0"
                    step="1000"
                    className="w-full text-sm text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    inputMode="numeric"
                    placeholder="Nhập đơn giá"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Số lượng
                  </label>
                  <div className="relative flex items-center">
                    <button
                      onClick={() =>
                        handleFieldChange('quantity', Math.max(1, Number(newProduct.quantity) - 1))
                      }
                      className="absolute left-0 h-9 w-9 flex items-center justify-center bg-gray-100 text-gray-600 rounded-l-md hover:bg-gray-200 focus:outline-none"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      value={newProduct.quantity === '' ? '' : newProduct.quantity}
                      onChange={(e) => handleFieldChange('quantity', e.target.value)}
                      onBlur={handleQuantityBlur}
                      className="w-full text-sm text-gray-900 border border-gray-300 rounded-md px-12 py-2 text-center focus:ring-blue-500 focus:border-blue-500"
                      inputMode="numeric"
                    />
                    <button
                      onClick={() => handleFieldChange('quantity', Number(newProduct.quantity) + 1)}
                      className="absolute right-0 h-9 w-9 flex items-center justify-center bg-gray-100 text-gray-600 rounded-r-md hover:bg-gray-200 focus:outline-none"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-700">Thành tiền</span>
                <span className="text-base font-semibold text-blue-600">
                  {newProduct.total.toLocaleString()} đ
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowProductAddPopup(false);
                  setNewProduct(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded-md"
              >
                Đóng
              </button>
              <button
                onClick={handleSaveProduct}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
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
              setShowProductAddPopup(currentProductIndex === null);
              setCurrentProductIndex(null);
            }}
            onProductAdded={(newProductData) => {
              handleProductAdded(newProductData);
            }}
          />
        </div>
      )}
    </div>
  );
}