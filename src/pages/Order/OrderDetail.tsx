import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Printer,
  Loader2,
  AlertCircle,
  Package,
  CreditCard,
  DollarSign,
  Truck,
  X,
  Check,
  FileText,
  Files,
  Plus,
  ArrowUpToLine,
  ArrowDownToLine,
  ChevronDown,
  ChevronUp,
  Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getOrderDetail, updateOrder, getRelatedDocuments, type RelatedDocument } from '../../services/order';
import { deleteObjects } from '../../services/deleteObjects';
import type { OrderDetail, UpdateOrderData } from '../../services/order';
import { formatCurrency } from '../../utils/currency';
import { useLanguage } from '../../contexts/LanguageContext';
import { DEFAULT_IMAGE_URL } from '../../services/file';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { zoomPlugin } from '@react-pdf-viewer/zoom';
import { printPlugin } from '@react-pdf-viewer/print';
import { getFilePlugin } from '@react-pdf-viewer/get-file';
import { getSession } from '../../utils/storage';

interface PaymentFormData {
  cash: number | '';
  bankTransfer: number | '';
  credit: number;
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRelatedDocs, setShowRelatedDocs] = useState(false);
  const [relatedDocs, setRelatedDocs] = useState<RelatedDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [showDebtCollectionModal, setShowDebtCollectionModal] = useState(false);
  const { t } = useLanguage();
  const [isOrderInfoExpanded, setIsOrderInfoExpanded] = useState(true);
  const [isPaymentExpanded, setIsPaymentExpanded] = useState(true);
  const [isProductListExpanded, setIsProductListExpanded] = useState(true);

  const [paymentData, setPaymentData] = useState<PaymentFormData>({
    cash: '',
    bankTransfer: '',
    credit: 0,
  });

  const session = getSession();
  const defaultValues = session?.defaultValues || {};

  const zoomPluginInstance = zoomPlugin();
  const printPluginInstance = printPlugin();
  const getFilePluginInstance = getFilePlugin();

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: () => [],
    renderToolbar: (Toolbar) => (
      <Toolbar>
        {(slots) => {
          const { ZoomOut, ZoomIn, Download, Print } = slots;
          return (
            <div className="flex items-center gap-2 p-2">
              <ZoomOut />
              <ZoomIn />
              <Download />
              <Print />
            </div>
          );
        }}
      </Toolbar>
    ),
  });

  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!id) {
        setError('Order ID is missing');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getOrderDetail(id);
        setOrder(data);
        setPaymentData({
          cash: data.cash || '',
          bankTransfer: data.bankTransfer || '',
          credit: data.documentAmount - (data.cash || 0) - (data.bankTransfer || 0),
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load order details';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetail();
  }, [id]);

  const handlePaymentChange = (field: keyof PaymentFormData, value: string) => {
    // Allow empty string or valid number
    const newValue = value === '' ? '' : Math.max(0, Number(value));

    setPaymentData((prev) => {
      const total = order?.documentAmount || 0;
      let newPaymentData = { ...prev, [field]: newValue };

      if (field === 'cash' || field === 'bankTransfer') {
        // Convert empty strings to 0 for calculations
        const cash = newPaymentData.cash === '' ? 0 : Number(newPaymentData.cash);
        const bankTransfer = newPaymentData.bankTransfer === '' ? 0 : Number(newPaymentData.bankTransfer);
        const credit = total - cash - bankTransfer;
        newPaymentData.credit = Math.max(0, credit);

        // If credit is negative, adjust the input field
        if (credit < 0) {
          newPaymentData[field] = total - (field === 'cash' ? bankTransfer : cash);
          newPaymentData.credit = 0;
        }
      }

      return newPaymentData;
    });
  };

  const handleQuickFill = (field: 'cash' | 'bankTransfer') => {
    if (!order) return;

    setPaymentData({
      cash: field === 'cash' ? order.documentAmount : '',
      bankTransfer: field === 'bankTransfer' ? order.documentAmount : '',
      credit: 0,
    });
  };

  const handleShowRelatedDocs = async () => {
    if (!order) return;

    try {
      setIsLoadingDocs(true);
      const docs = await getRelatedDocuments(order.id, order.number);
      setRelatedDocs(docs);
      setShowRelatedDocs(true);
    } catch (error) {
      toast.error('Không thể tải danh sách chứng từ liên quan');
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const getNextOrderState = (currentState: string, action: 'payment' | 'delivery'): string => {
    const lowerState = currentState.toLowerCase();

    if (action === 'payment') {
      if (lowerState.includes('đang soạn') || lowerState.includes('chờ trả trước')) {
        return 'Preparing';
      }
    } else if (action === 'delivery') {
      if (lowerState.includes('đang chuẩn bị')) {
        return 'Delivered';
      }
    }

    return currentState;
  };

  const handleConfirmPayment = async () => {
    if (!order || !id) return;

    try {
      setIsProcessing(true);

      const nextStateId = getNextOrderState(order.orderState, 'payment');

      const updateData: UpdateOrderData = {
        id: order.id,
        number: order.number,
        title: order.title,
        deletionMark: order.deletionMark,
        author: order.author,
        comment: order.comment,
        companyId: defaultValues.company?.id || '',
        company: order.company,
        contractId: order.contract ? order.contract.split(': ')[1] : null,
        contractName: order.contract,
        customerId: order.customerId,
        customerName: order.customerName,
        deliveryAddress: order.deliveryAddress,
        deliveryAddressValue: order.deliveryAddressValue,
        discountCardId: order.discountCard ? order.discountCard.split(': ')[1] : null,
        discountCard: order.discountCard,
        emailAddress: order.emailAddress,
        orderKindId: defaultValues.salesOrderOrderKind?.id || '5736c2cc-5b28-11ef-a699-00155d058802',
        orderKind: order.orderKind,
        operationTypeId: defaultValues.salesOrderOperationKind?.id || 'OrderForSale',
        operationType: order.operationType,
        priceKindId: defaultValues.priceKind?.id || '1a1fb49c-5b28-11ef-a699-00155d058802',
        priceKind: order.priceKind,
        shipmentDate: order.shipmentDate,
        documentAmount: order.documentAmount,
        documentCurrencyId: defaultValues.documentCurrency?.id || 'c26a4d87-c6e2-4aca-ab05-1b02be6ecaec',
        documentCurrency: order.documentCurrency,
        employeeResponsibleId: order.employeeResponsibleId,
        employeeResponsibleName: order.employeeResponsibleName,
        orderStateId: nextStateId,
        orderState: nextStateId === 'Preparing' ? 'Đang chuẩn bị' : order.orderState,
        shippingCost: order.shippingCost,
        phone: order.phone,
        completionOptionId: order.completionOption ? order.completionOption.split(': ')[1] : null,
        completionOption: order.completionOption,
        cash: paymentData.cash === '' ? 0 : Number(paymentData.cash),
        bankTransfer: paymentData.bankTransfer === '' ? 0 : Number(paymentData.bankTransfer),
        postPayment: paymentData.credit,
        paymentNote: order.paymentNote,
        rate: order.rate,
        multiplicity: order.multiplicity,
        vatTaxationId: defaultValues.vatTaxation?.id || 'NotTaxableByVAT',
        vatTaxation: order.vatTaxation,
        status: order.status,
        externalAccountId: order.externalAccount ? order.externalAccount.split(': ')[1] : null,
        externalAccount: order.externalAccount,
        receiptableIncrease: order.receiptableIncrease,
        receiptableDecrease: order.receiptableDecrease,
        receiptableBalance: order.receiptableBalance,
        products: order.products.map((p) => ({
          lineNumber: p.lineNumber,
          productId: p.productId,
          productName: p.productName,
          characteristic: p.characteristic,
          unitId: p.unitId,
          unitName: p.unitName,
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
          coefficient: p.coefficient,
        })),
        date: order.date,
      };

      await updateOrder(updateData);

      toast.success('Payment updated successfully');
      setShowPaymentModal(false);
      setShowConfirmation(false);

      const updatedOrder = await getOrderDetail(id);
      setOrder(updatedOrder);
    } catch (error) {
      toast.error('Failed to update payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelivery = async () => {
    if (!order || !id) return;

    try {
      setIsProcessing(true);

      const nextStateId = getNextOrderState(order.orderState, 'delivery');

      const updateData: UpdateOrderData = {
        id: order.id,
        number: order.number,
        title: order.title,
        deletionMark: order.deletionMark,
        author: order.author,
        comment: order.comment,
        companyId: defaultValues.company?.id || '',
        company: order.company,
        contractId: order.contract ? order.contract.split(': ')[1] : null,
        contractName: order.contract,
        customerId: order.customerId,
        customerName: order.customerName,
        deliveryAddress: order.deliveryAddress,
        deliveryAddressValue: order.deliveryAddressValue,
        discountCardId: order.discountCard ? order.discountCard.split(': ')[1] : null,
        discountCard: order.discountCard,
        emailAddress: order.emailAddress,
        orderKindId: defaultValues.salesOrderOrderKind?.id || '5736c2cc-5b28-11ef-a699-00155d058802',
        orderKind: order.orderKind,
        operationTypeId: defaultValues.salesOrderOperationKind?.id || 'OrderForSale',
        operationType: order.operationType,
        priceKindId: defaultValues.priceKind?.id || '1a1fb49c-5b28-11ef-a699-00155d058802',
        priceKind: order.priceKind,
        shipmentDate: order.shipmentDate,
        documentAmount: order.documentAmount,
        documentCurrencyId: defaultValues.documentCurrency?.id || 'c26a4d87-c6e2-4aca-ab05-1b02be6ecaec',
        documentCurrency: order.documentCurrency,
        employeeResponsibleId: order.employeeResponsibleId,
        employeeResponsibleName: order.employeeResponsibleName,
        orderStateId: nextStateId,
        orderState: nextStateId === 'Delivered' ? 'Đã giao hàng' : order.orderState,
        shippingCost: order.shippingCost,
        phone: order.phone,
        completionOptionId: order.completionOption ? order.completionOption.split(': ')[1] : null,
        completionOption: order.completionOption,
        cash: order.cash,
        bankTransfer: order.bankTransfer,
        postPayment: order.postPayment,
        paymentNote: order.paymentNote,
        rate: order.rate,
        multiplicity: order.multiplicity,
        vatTaxationId: defaultValues.vatTaxation?.id || 'NotTaxableByVAT',
        vatTaxation: order.vatTaxation,
        status: order.status,
        externalAccountId: order.externalAccount ? order.externalAccount.split(': ')[1] : null,
        externalAccount: order.externalAccount,
        receiptableIncrease: order.receiptableIncrease,
        receiptableDecrease: order.receiptableDecrease,
        receiptableBalance: order.receiptableBalance,
        products: order.products.map((p) => ({
          lineNumber: p.lineNumber,
          productId: p.productId,
          productName: p.productName,
          characteristic: p.characteristic,
          unitId: p.unitId,
          unitName: p.unitName,
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
          coefficient: p.coefficient,
        })),
        date: order.date,
      };

      await updateOrder(updateData);

      toast.success('Order marked as delivered');

      const updatedOrder = await getOrderDetail(id);
      setOrder(updatedOrder);
    } catch (error) {
      toast.error('Failed to update delivery status');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    if (!id) return;
    setShowPdfViewer(true);
  };

  const handleAddMore = () => {
    navigate('/orders/add');
  };

  const handleReturn = () => {
    if (!order) return;

    const preloadData = {
      isReturnOrder: true,
      customerId: order.customerId || '',
      customerName: order.customerName || '',
      employeeId: order.employeeResponsibleId || '',
      employeeName: order.employeeResponsibleName || '',
      originalOrderId: order.id,
      originalOrderNumber: order.number,
      originalProducts: order.products.map((p) => ({
        id: p.productId,
        name: p.productName,
        code: p.code,
        price: p.price,
        riCoefficient: p.coefficient,
        availableQuantity: p.quantity,
      })),
    };

    sessionStorage.setItem('newSupplierInvoiceData', JSON.stringify(preloadData));
    navigate('/supplier-invoices/add');
  };

  const handleDelete = async () => {
    if (!order || !id) return;

    setIsProcessing(true);

    try {
      const objectToDelete = {
        _type: 'XTSObjectId',
        id: order.id,
        dataType: 'XTSOrder',
        presentation: `${order.title} (đã xóa)`,
        navigationRef: null,
      };

      await deleteObjects([objectToDelete]);
      toast.success('Đơn hàng đã được xóa thành công');
      navigate('/orders');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể xóa đơn hàng';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = () => {
    if (!order || !id) return;

    const updateData: UpdateOrderData = {
      id: order.id,
      number: order.number,
      title: order.title,
      deletionMark: order.deletionMark,
      author: order.author,
      comment: order.comment,
      companyId: defaultValues.company?.id || '',
      company: order.company,
      contractId: order.contract ? order.contract.split(': ')[1] : null,
      contractName: order.contract,
      customerId: order.customerId,
      customerName: order.customerName,
      deliveryAddress: order.deliveryAddress,
      deliveryAddressValue: order.deliveryAddressValue,
      discountCardId: order.discountCard ? order.discountCard.split(': ')[1] : null,
      discountCard: order.discountCard,
      emailAddress: order.emailAddress,
      orderKindId: defaultValues.salesOrderOrderKind?.id || '5736c2cc-5b28-11ef-a699-00155d058802',
      orderKind: order.orderKind,
      operationTypeId: defaultValues.salesOrderOperationKind?.id || 'OrderForSale',
      operationType: order.operationType,
      priceKindId: defaultValues.priceKind?.id || '1a1fb49c-5b28-11ef-a699-00155d058802',
      priceKind: order.priceKind,
      shipmentDate: order.shipmentDate,
      documentAmount: order.documentAmount,
      documentCurrencyId: defaultValues.documentCurrency?.id || 'c26a4d87-c6e2-4aca-ab05-1b02be6ecaec',
      documentCurrency: order.documentCurrency,
      employeeResponsibleId: order.employeeResponsibleId,
      employeeResponsibleName: order.employeeResponsibleName,
      orderStateId:
        order.orderState === 'Đang soạn'
          ? 'Editing'
          : order.orderState === 'Đã giao hàng'
          ? 'Delivered'
          : order.orderState === 'Chờ trả trước'
          ? 'ToPrepay'
          : order.orderState === 'Đang chuẩn bị'
          ? 'Preparing'
          : order.orderState === 'Đã hủy'
          ? 'ecfc6706-bdd8-11ef-a6a7-00155d058802'
          : order.orderState === 'Đã hoàn thành'
          ? 'Completed'
          : 'Editing',
      orderState: order.orderState,
      shippingCost: order.shippingCost,
      phone: order.phone,
      completionOptionId: order.completionOption ? order.completionOption.split(': ')[1] : null,
      completionOption: order.completionOption,
      cash: order.cash,
      bankTransfer: order.bankTransfer,
      postPayment: order.postPayment,
      paymentNote: order.paymentNote,
      rate: order.rate,
      multiplicity: order.multiplicity,
      vatTaxationId: defaultValues.vatTaxation?.id || 'NotTaxableByVAT',
      vatTaxation: order.vatTaxation,
      status: order.status,
      externalAccountId: order.externalAccount ? order.externalAccount.split(': ')[1] : null,
      externalAccount: order.externalAccount,
      receiptableIncrease: order.receiptableIncrease,
      receiptableDecrease: order.receiptableDecrease,
      receiptableBalance: order.receiptableBalance,
      products: order.products.map((p) => ({
        lineNumber: p.lineNumber,
        productId: p.productId,
        productName: p.productName,
        characteristic: p.characteristic,
        unitId: p.unitId,
        unitName: p.unitName,
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
        coefficient: p.coefficient,
      })),
      date: order.date,
    };

    navigate(`/orders/edit/${id}`, { state: { orderData: updateData } });
  };

  const handleViewProductDetail = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  const handleViewRelatedDocDetail = (doc: RelatedDocument) => {
    const dataType = doc.dataType;
    const docId = doc.id;

    switch (dataType) {
      case 'XTSOrder':
        navigate(`/orders/${docId}`);
        break;
      case 'XTSSupplierInvoice':
        navigate(`/supplier-invoices/${docId}`);
        break;
      case 'XTSCashReceipt':
        navigate(`/cash-receipts/${docId}`);
        break;
      case 'XTSTransferReceipt':
        navigate(`/transfer-receipts/${docId}`);
        break;
      default:
        toast.error('Không hỗ trợ xem chi tiết loại chứng từ này');
        break;
    }
  };

  const handleCollectDebt = (type: 'cash' | 'transfer') => {
    if (!order) return;

    const orderData = {
      orderId: order.id,
      orderNumber: order.number,
      customerId: order.customerId,
      customerName: order.customerName,
      documentAmount: order.documentAmount,
      cash: order.cash || 0,
      bankTransfer: order.bankTransfer || 0,
      postPayment: order.postPayment || 0,
      documentCurrency: order.documentCurrency,
    };

    if (type === 'cash') {
      navigate('/cash-receipts/add', { state: { orderData } });
    } else if (type === 'transfer') {
      navigate('/transfer-receipts/add', { state: { orderData } });
    }

    setShowDebtCollectionModal(false);
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('đang soạn')) {
      return 'bg-[#FFC107]/10 text-[#FFC107]';
    }
    if (statusLower.includes('đã giao hàng')) {
      return 'bg-[#FF9800]/10 text-[#FF9800]';
    }
    if (statusLower.includes('chờ trả trước')) {
      return 'bg-[#2196F3]/10 text-[#2196F3]';
    }
    if (statusLower.includes('đang chuẩn bị')) {
      return 'bg-[#4CAF50]/10 text-[#4CAF50]';
    }
    if (statusLower.includes('đã hủy')) {
      return 'bg-[#F44336]/10 text-[#F44336]';
    }
    if (statusLower.includes('đã hoàn thành')) {
      return 'bg-[#9C27B0]/10 text-[#9C27B0]';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionButtons = () => {
    if (!order) return null;

    const status = order.orderState.toLowerCase();
    const leftButtons = [];
    const rightButtons = [];

    leftButtons.push(
      <button
        key="back"
        onClick={() => navigate('/orders')}
        className="p-3 bg-gray-600 text-white rounded-full shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        title="Quay lại"
      >
        <ArrowLeft className="h-6 w-6" />
      </button>,
    );

    rightButtons.push(
      <button
        key="related"
        onClick={handleShowRelatedDocs}
        disabled={isLoadingDocs}
        className="p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        title="Chứng từ liên quan"
      >
        <Files className="h-6 w-6" />
      </button>,
    );

    if (status.includes('đang soạn') || status.includes('chờ trả trước')) {
      leftButtons.push(
        <button
          key="delete"
          onClick={handleDelete}
          disabled={isProcessing}
          className="p-3 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          title="Xóa"
        >
          <Trash2 className="h-6 w-6" />
        </button>,
      );
      rightButtons.push(
        <button
          key="edit"
          onClick={handleEdit}
          className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          title="Chỉnh sửa"
        >
          <Pencil className="h-6 w-6" />
        </button>,
        <button
          key="pay"
          onClick={() => setShowPaymentModal(true)}
          className="p-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          title="Thanh toán"
        >
          <CreditCard className="h-6 w-6" />
        </button>,
      );
    } else if (status.includes('đang chuẩn bị')) {
      leftButtons.push(
        <button
          key="delete"
          onClick={handleDelete}
          disabled={isProcessing}
          className="p-3 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          title="Xóa"
        >
          <Trash2 className="h-6 w-6" />
        </button>,
      );
      rightButtons.push(
        <button
          key="deliver"
          onClick={handleDelivery}
          disabled={isProcessing}
          className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          title="Giao hàng"
        >
          <Truck className="h-6 w-6" />
        </button>,
        <button
          key="print"
          onClick={handlePrint}
          className="p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          title="In"
        >
          <Printer className="h-6 w-6" />
        </button>,
      );
    } else if (status.includes('đã giao hàng') || status.includes('đã hoàn thành')) {
      rightButtons.push(
        <button
          key="print"
          onClick={handlePrint}
          className="p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          title="In"
        >
          <Printer className="h-6 w-6" />
        </button>,
      );
    }

    if (order.postPayment && order.postPayment > 0) {
      rightButtons.push(
        <button
          key="collect-debt"
          onClick={() => setShowDebtCollectionModal(true)}
          className="p-3 bg-teal-600 text-white rounded-full shadow-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          title="Thu công nợ"
        >
          <Wallet className="h-6 w-6" />
        </button>,
      );
    }

    return (
      <div className="flex justify-between items-center w-full px-4">
        <div className="flex gap-2">{leftButtons}</div>
        <div className="flex gap-2">{rightButtons}</div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{error || 'Order Not Found'}</h2>
          <button
            onClick={() => navigate('/orders')}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const pdfUrl = `${import.meta.env.VITE_FILE_BASE_URL}/${id}.pdf?print-form-id=${id}&data-type=XTSOrder&template-name=ExternalPrintForm.PF_SalesOrder`;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">Chi tiết đơn hàng #{order.number}</h1>
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
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                  order.orderState,
                )}`}
              >
                {order.orderState}
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
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">Ngày đặt hàng</div>
                <div className="text-sm font-medium">{formatDate(order.date)}</div>
              </div>

              <div className="flex justify-between items-start">
                <div className="text-sm text-gray-500">Khách hàng</div>
                <div className="text-sm font-medium text-right">{order.customerName}</div>
              </div>

              {order.employeeResponsibleName && (
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">Nhân viên bán hàng</div>
                  <div className="text-sm font-medium">{order.employeeResponsibleName}</div>
                </div>
              )}

              {order.deliveryAddress && (
                <div className="flex justify-between items-start">
                  <div className="text-sm text-gray-500">Địa chỉ giao hàng</div>
                  <div className="text-sm font-medium text-right max-w-[60%]">{order.deliveryAddress}</div>
                </div>
              )}

              {order.comment && (
                <div className="flex justify-between items-start">
                  <div className="text-sm text-gray-500">Ghi chú</div>
                  <div className="text-sm font-medium text-right max-w-[60%]">{order.comment}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Nhóm 2: Tổng tiền và thanh toán */}
        <div className="mb-6 bg-white rounded-lg shadow-sm">
          <div
            className="flex justify-between items-center px-4 py-3 cursor-pointer"
            onClick={() => setIsPaymentExpanded(!isPaymentExpanded)}
          >
            <h2 className="text-base font-medium text-gray-900">Tổng tiền và thanh toán</h2>
            {isPaymentExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-600" />
            )}
          </div>
          {isPaymentExpanded && (
            <div className="px-4 pb-4 space-y-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <div>Tổng tiền</div>
                <div className="text-blue-600">{formatCurrency(order.documentAmount, order.documentCurrency)}</div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Tiền mặt</div>
                    <div className="text-sm font-medium text-green-600">
                      {formatCurrency(order.cash || 0, order.documentCurrency)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Chuyển khoản</div>
                    <div className="text-sm font-medium text-blue-600">
                      {formatCurrency(order.bankTransfer || 0, order.documentCurrency)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Công nợ</div>
                    <div className="text-sm font-medium text-red-600">
                      {formatCurrency(order.postPayment || 0, order.documentCurrency)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Nhóm 3: Danh sách sản phẩm */}
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
            <div className="px-4 pb-4 space-y-2">
              {order.products.map((product, index) => (
                <div
                  key={product.lineNumber}
                  className="flex items-center justify-between bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleViewProductDetail(product.productId)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {product.picture ? (
                        <img
                          src={product.picture}
                          alt={product.productName}
                          className="h-full w-full object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_IMAGE_URL;
                          }}
                        />
                      ) : (
                        <Package className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        #{index + 1} {product.productName}
                      </p>
                      <p className="text-xs text-gray-500">SKU: {product.code}</p>
                      <p className="text-xs text-gray-500">
                        {product.quantity} {product.unitName} x {product.price.toLocaleString()} đồng/chiếc
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-blue-600">
                      {formatCurrency(product.total, order.documentCurrency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-4 left-0 right-0 z-50">{getActionButtons()}</div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Thanh toán</h3>
              <button onClick={() => setShowPaymentModal(false)}>
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tổng tiền</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formatCurrency(order.documentAmount, order.documentCurrency)}
                    readOnly
                    className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                  />
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-gray-700">Tiền mặt</label>
                  <button onClick={() => handleQuickFill('cash')} className="text-xs text-blue-600">
                    Điền toàn bộ
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={paymentData.cash}
                    onChange={(e) => handlePaymentChange('cash', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-gray-700">Chuyển khoản</label>
                  <button onClick={() => handleQuickFill('bankTransfer')} className="text-xs text-blue-600">
                    Điền toàn bộ
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={paymentData.bankTransfer}
                    onChange={(e) => handlePaymentChange('bankTransfer', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                  <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Công nợ</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formatCurrency(paymentData.credit, order.documentCurrency)}
                    readOnly
                    className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                  />
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={() => setShowConfirmation(true)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRelatedDocs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl p-4 max-h-[80vh] overflow-y-auto flex flex-col">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2 border-b">
              <h3 className="text-lg font-medium">Danh sách chứng từ liên quan</h3>
              <button onClick={() => setShowRelatedDocs(false)}>
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            {isLoadingDocs ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : relatedDocs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Không có chứng từ liên quan</div>
            ) : (
              <div className="space-y-4 mb-4">
                {relatedDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleViewRelatedDocDetail(doc)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">#{doc.number}</h4>
                        <p className="text-xs text-gray-500">{formatDate(doc.date)}</p>
                      </div>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        {doc.dataType.replace('XTS', '')}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">{doc.presentation}</p>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Số tiền:</span>
                        <span className="ml-1 font-medium text-blue-600">
                          {formatCurrency(doc.documentAmount, doc.documentCurrency)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Công ty:</span>
                        <span className="ml-1">{doc.company}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  onClick={handleAddMore}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Bán thêm
                </button>
                <button
                  onClick={handleReturn}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 flex items-center justify-center gap-2"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  Trả hàng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Xác nhận thanh toán</h3>
            <p className="text-sm text-gray-600 mb-6">
              Bạn có chắc chắn muốn cập nhật thông tin thanh toán cho đơn hàng #{order.number}?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                disabled={isProcessing}
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmPayment}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center justify-center gap-2"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang xử lý
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Xác nhận
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDebtCollectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Thu công nợ</h3>
              <button onClick={() => setShowDebtCollectionModal(false)}>
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Chọn phương thức thu công nợ cho đơn hàng #{order.number}:
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleCollectDebt('cash')}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                Thu tiền mặt
              </button>
              <button
                onClick={() => handleCollectDebt('transfer')}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Thu chuyển khoản
              </button>
            </div>
          </div>
        </div>
      )}

      {showPdfViewer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center sm:items-center">
          <div className="bg-white rounded-lg w-full max-w-4xl sm:h-[90vh] h-[calc(100vh-56px)] mt-[56px] sm:mt-0 flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium">Xem trước đơn hàng #{order.number}</h3>
              <button onClick={() => setShowPdfViewer(false)}>
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                <Viewer
                  fileUrl={pdfUrl}
                  plugins={[defaultLayoutPluginInstance, zoomPluginInstance, printPluginInstance, getFilePluginInstance]}
                />
              </Worker>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}