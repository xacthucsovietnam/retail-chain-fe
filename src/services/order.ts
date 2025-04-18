import api from './axiosClient';
import { getSession } from '../utils/storage';
import { ListRequest, PaginatedResponse } from './types';

// Interface for related documents
export interface RelatedDocument {
  id: string;
  number: string;
  date: string;
  dataType: string;
  presentation: string;
  documentAmount: number;
  documentCurrency: string;
  company: string;
  counterparty: string;
}

export interface CustomerDropdownItem {
  id: string;
  name: string;
  code: string;
  phoneNumber: string | null;
  address: string | null;
}

export interface EmployeeDropdownItem {
  id: string;
  name: string;
}

export interface OrderStateDropdownItem {
  id: string;
  name: string;
}

export interface ProductDropdownItem {
  id: string;
  name: string;
}

export interface Order {
  id: string;
  number: string;
  date: string;
  customerName: string;
  status: string;
  totalAmount: number;
  totalProducts: number;
  notes: string;
}

export interface OrderProduct {
  lineNumber: number;
  productId: string;
  productName: string;
  characteristic: string | null;
  unitId: string;                // Changed from uomId
  unitName: string;              // Changed from uomName
  quantity: number;
  price: number;
  amount: number;
  automaticDiscountAmount: number;
  discountsMarkupsAmount: number;
  vatAmount: number;
  vatRateId: string;
  vatRateName: string;
  total: number;
  code: string;                  // Changed from sku
  coefficient: number;
  picture: string | null;
}

export interface OrderDetail {
  id: string;
  number: string;
  date: string;
  title: string;
  deletionMark: boolean | null;
  author: string;
  comment: string | null;
  company: string;
  contract: string | null;
  customerId: string;
  customerName: string;
  deliveryAddress: string | null;
  deliveryAddressValue: string | null;
  discountCard: string | null;
  emailAddress: string | null;
  orderKind: string;
  operationType: string;
  priceKind: string;
  shipmentDate: string;
  documentAmount: number;
  documentCurrency: string;
  employeeResponsibleId: string | null;
  employeeResponsibleName: string | null;
  orderState: string;
  shippingCost: number | null;
  phone: string | null;
  completionOption: string | null;
  cash: number | null;
  bankTransfer: number | null;
  postPayment: number | null;
  paymentNote: string | null;
  rate: number;
  multiplicity: number;
  vatTaxation: string;
  status: string | null;
  externalAccount: string | null;
  receiptableIncrease: number;
  receiptableDecrease: number;
  receiptableBalance: number;
  products: OrderProduct[];
}

export interface CreateOrderProduct {
  productId: string;
  productName: string;
  characteristic: string | null;
  unitId: string;                // Changed from uomId
  unitName: string;              // Changed from uomName
  quantity: number;
  price: number;
  amount: number;
  automaticDiscountAmount: number;
  discountsMarkupsAmount: number;
  vatAmount: number;
  vatRateId: string;
  vatRateName: string;
  total: number;
  code: string;                  // Changed from sku
  coefficient: number;
}

export interface CreateOrderData {
  customerId: string;
  customerName: string;
  employeeId: string;
  employeeName: string;
  orderState: string;
  deliveryAddress: string;
  comment: string;
  documentAmount: number;
  products: CreateOrderProduct[];
}

export interface UpdateOrderProduct {
  lineNumber: number;
  productId: string;
  productName: string;
  characteristic: string | null;
  unitId: string;                // Changed from uomId
  unitName: string;              // Changed from uomName
  quantity: number;
  price: number;
  amount: number;
  automaticDiscountAmount: number;
  discountsMarkupsAmount: number;
  vatAmount: number;
  vatRateId: string;
  vatRateName: string;
  total: number;
  code: string;                  // Changed from sku
  coefficient: number;
}

export interface UpdateOrderData {
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
  products: UpdateOrderProduct[];
  date: string;
}

// Function to get related documents
export const getRelatedDocuments = async (orderId: string, orderNumber: string): Promise<RelatedDocument[]> => {
  const request = {
    _type: "XTSGetRelatedDocumentsRequest",
    _dbId: "",
    _msgId: "",
    objectId: {
      _type: "XTSObjectId",
      dataType: "XTSOrder",
      id: orderId,
      presentation: orderNumber,
      url: ""
    }
  };

  try {
    const response = await api.post('', request);

    if (!response.data?.documents) {
      throw new Error('Invalid response format');
    }

    return response.data.documents.map((doc: any) => ({
      id: doc.document?.id || '',
      number: doc.number || '',
      date: doc.date || '',
      dataType: doc.document?.dataType || '',
      presentation: doc.document?.presentation || '',
      documentAmount: doc.documentAmount || 0,
      documentCurrency: doc.documentCurrency?.presentation || '',
      company: doc.company?.presentation || '',
      counterparty: doc.counterparty?.presentation || ''
    }));
  } catch (error) {
    console.error('Failed to fetch related documents:', error);
    throw new Error('Failed to fetch related documents');
  }
};

// Static list of order states
const orderStates = [
  {
    _type: "XTSObjectId",
    dataType: "XTSSalesOrderState",
    id: "Editing",
    presentation: "Đang soạn"
  },
  {
    _type: "XTSObjectId",
    dataType: "XTSSalesOrderState",
    id: "Delivered",
    presentation: "Đã giao hàng"
  },
  {
    _type: "XTSObjectId",
    dataType: "XTSSalesOrderState",
    id: "ToPrepay",
    presentation: "Chờ trả trước"
  },
  {
    _type: "XTSObjectId",
    dataType: "XTSSalesOrderState",
    id: "Preparing",
    presentation: "Đang chuẩn bị"
  },
  {
    _type: "XTSObjectId",
    id: "ecfc6706-bdd8-11ef-a6a7-00155d058802",
    dataType: "XTSSalesOrderState",
    presentation: "Đã hủy",
    navigationRef: null
  },
  {
    _type: "XTSObjectId",
    dataType: "XTSSalesOrderState",
    id: "Completed",
    presentation: "Đã hoàn thành"
  }
];

// Helper function to get order state presentation by ID
const getOrderStatePresentation = (stateId: string): string => {
  const state = orderStates.find(s => s.id === stateId);
  return state?.presentation || 'Đang soạn';
};

// Data loading functions
export const getCustomerDropdownData = async (): Promise<CustomerDropdownItem[]> => {
  const request = {
    _type: 'XTSGetObjectListRequest',
    _dbId: '',
    _msgId: '',
    dataType: 'XTSCounterparty',
    columnSet: [],
    sortBy: [],
    positionFrom: 0,
    positionTo: 0,
    limit: 0,
    conditions: [
      {
        _type: 'XTSCondition',
        property: 'customer',
        value: true,
        comparisonOperator: '='
      }
    ]
  };

  try {
    const response = await api.post('', request);
    
    if (!response.data?.items) {
      throw new Error('Invalid customer list response format');
    }

    return response.data.items.map((item: any) => ({
      id: item.object.objectId.id,
      name: item.object.objectId.presentation,
      code: item.object.code || '',
      phoneNumber: item.object.phone,
      address: item.object.address
    }));
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    throw new Error('Không thể tải danh sách khách hàng');
  }
};

export const getEmployeeDropdownData = async (): Promise<EmployeeDropdownItem[]> => {
  const request = {
    _type: 'XTSGetObjectListRequest',
    _dbId: '',
    _msgId: '',
    dataType: 'XTSEmployee',
    columnSet: [],
    sortBy: [],
    positionFrom: 0,
    positionTo: 0,
    limit: 0,
    conditions: [
      {
        _type: 'XTSCondition',
        property: 'invalid',
        value: false,
        comparisonOperator: '='
      }
    ]
  };

  try {
    const response = await api.post('', request);
    
    if (!response.data?.items) {
      throw new Error('Invalid employee list response format');
    }

    return response.data.items.map((item: any) => ({
      id: item.object.objectId.id,
      name: item.object.objectId.presentation
    }));
  } catch (error) {
    console.error('Failed to fetch employees:', error);
    throw new Error('Không thể tải danh sách nhân viên');
  }
};

export const getOrderStateDropdownData = async (): Promise<OrderStateDropdownItem[]> => {
  return orderStates.map(state => ({
    id: state.id,
    name: state.presentation
  }));
};

export const getProductDropdownData = async (): Promise<ProductDropdownItem[]> => {
  const request = {
    _type: 'XTSGetObjectListRequest',
    _dbId: '',
    _msgId: '',
    dataType: 'XTSProduct',
    columnSet: ['objectId', 'sku'],
    sortBy: [],
    positionFrom: 0,
    positionTo: 0,
    limit: 0,
    conditions: []
  };

  try {
    const response = await api.post('', request);
    
    if (!response.data?.items) {
      throw new Error('Invalid product list response format');
    }

    return response.data.items.map((item: any) => ({
      id: item.object.objectId.id,
      name: `${item.object.sku}: ${item.object.objectId.presentation}`,
    }));
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw new Error('Không thể tải danh sách sản phẩm');
  }
};

// Existing functions
export const getOrders = async (page: number = 1, pageSize: number = 20, conditions: any[] = []): Promise<PaginatedResponse<Order>> => {
  const positionFrom = (page - 1) * pageSize + 1;
  const positionTo = page * pageSize;

  const sessionData = getSession();
  const defaultCompany = sessionData?.defaultValues?.company;

  const orderListData: ListRequest = {
    _type: 'XTSGetObjectListRequest',
    _dbId: '',
    _msgId: '',
    dataType: 'XTSOrder',
    columnSet: [],
    sortBy: ['date DESC'],
    positionFrom,
    positionTo,
    limit: pageSize,
    conditions: [
      {
        _type: 'XTSCondition',
        property: 'company',
        value: defaultCompany,
        comparisonOperator: '='
      },
      ...conditions
    ]
  };

  try {
    const response = await api.post('', orderListData);

    if (!response.data || !Array.isArray(response.data.items)) {
      throw new Error('Invalid order list response format');
    }

    return {
      items: response.data.items.map((item: any) => ({
        id: item.object.objectId.id,
        number: item.object.number,
        date: item.object.date,
        customerName: item.object.customer?.presentation || '',
        status: item.object.orderState?.presentation || '',
        totalAmount: item.object.documentAmount || 0,
        totalProducts: item.object.inventory?.length || 0,
        notes: item.object.comment
      })),
      hasMore: response.data.items.length === pageSize
    };
  } catch (error) {
    console.error('Order fetch error:', error);
    throw new Error('Failed to fetch orders. Please try again.');
  }
};

export const getOrderDetail = async (id: string): Promise<OrderDetail> => {
  const orderData = {
    _type: 'XTSGetObjectsRequest',
    _dbId: '',
    _msgId: '',
    objectIds: [
      {
        _type: 'XTSObjectId',
        dataType: 'XTSOrder',
        id: id,
        presentation: '',
        url: ''
      }
    ],
    columnSet: []
  };

  try {
    const response = await api.post('', orderData);

    if (!response.data?.objects?.[0]) {
      throw new Error('Invalid order detail response format');
    }

    const order = response.data.objects[0];
    return {
      id: order.objectId.id,
      number: order.number,
      date: order.date,
      title: order.objectId.presentation,
      deletionMark: order.deletionMark,
      author: order.author?.presentation || '',
      comment: order.comment,
      company: order.company?.presentation || '',
      contract: order.contract?.presentation || null,
      customerId: order.customer?.id || '',
      customerName: order.customer?.presentation || '',
      deliveryAddress: order.deliveryAddress,
      deliveryAddressValue: order.deliveryAddressValue,
      discountCard: order.discountCard?.presentation || null,
      emailAddress: order.emailAddress,
      orderKind: order.orderKind?.presentation || '',
      operationType: order.operationKind?.presentation || '',
      priceKind: order.priceKind?.presentation || '',
      shipmentDate: order.shipmentDate,
      documentAmount: order.documentAmount || 0,
      documentCurrency: order.documentCurrency?.presentation || '',
      employeeResponsibleId: order.employeeResponsible?.id || null,
      employeeResponsibleName: order.employeeResponsible?.presentation || null,
      orderState: order.orderState?.presentation || '',
      shippingCost: order.shippingCost,
      phone: order.phone,
      completionOption: order.completionOption?.presentation || null,
      cash: order.cash,
      bankTransfer: order.bankTransfer,
      postPayment: order.postPayment,
      paymentNote: order.paymentNote,
      rate: order.rate || 1,
      multiplicity: order.multiplicity || 1,
      vatTaxation: order.vatTaxation?.presentation || '',
      status: order.status,
      externalAccount: order.externalAccount?.presentation || null,
      receiptableIncrease: order._receiptableIncrease || 0,
      receiptableDecrease: order._receiptableDecrease || 0,
      receiptableBalance: order._receiptableBalance || 0,
      products: (order.inventory || []).map((item: any) => ({
        lineNumber: item._lineNumber || 0,
        productId: item.product?.id || '',
        productName: item.product?.presentation || '',
        characteristic: item.characteristic?.presentation || null,
        unitId: item.uom?.id || '',
        unitName: item.uom?.presentation || '', 
        quantity: item.quantity || 0,
        price: item.price || 0,
        amount: item.amount || 0,
        automaticDiscountAmount: item.automaticDiscountAmount || 0,
        discountsMarkupsAmount: item.discountsMarkupsAmount || 0,
        vatAmount: item.vatAmount || 0,
        vatRateId: item.vatRate?.id || '',
        vatRateName: item.vatRate?.presentation || '',
        total: item.total || 0,
        code: item._sku || '',
        coefficient: item._coefficient || 1,
        picture: item._picture?.presentation || null
      }))
    };
  } catch (error) {
    console.error('Order detail fetch error:', error);
    throw new Error('Failed to fetch order details');
  }
};

export const createOrder = async (data: CreateOrderData): Promise<{ id: string; number: string }> => {
  // Validate required fields
  if (!data.customerId) throw new Error('Customer is required');
  if (!data.products.length) throw new Error('At least one product is required');
  if (!data.orderState) throw new Error('Order state is required');

  const sessionData = getSession();
  const defaultCompany = sessionData?.defaultValues?.company;
  const defaultVatTaxation = sessionData?.defaultValues?.vatTaxation;
  const defaultOperationKind = sessionData?.defaultValues?.salesOrderOperationKind;
  const defaultOrderKind = sessionData?.defaultValues?.salesOrderOrderKind;
  const defaultPriceKind = sessionData?.defaultValues?.priceKind;
  const defaultCurrency = sessionData?.defaultValues?.documentCurrency;
  const orderStatePresentation = getOrderStatePresentation(data.orderState);

  const orderData = {
    _type: 'XTSCreateObjectsRequest',
    _dbId: '',
    _msgId: '',
    objects: [
      {
        _type: 'XTSOrder',
        _isFullData: false,
        objectId: {
          _type: 'XTSObjectId',
          dataType: 'XTSOrder',
          id: '',
          presentation: '',
          url: ''
        },
        date: new Date().toISOString(),
        number: '',
        operationKind: {
          _type: "XTSObjectId",
          dataType: defaultOperationKind.dataType,
          id: defaultOperationKind.id,
          presentation: defaultOperationKind.presentation,
          url: ""
        } || null,
        orderKind: {
          _type: "XTSObjectId",
          dataType: defaultOrderKind.dataType,
          id: defaultOrderKind.id,
          presentation: defaultOrderKind.presentation,
          url: ""
        } || null,
        priceKind: {
          _type: "XTSObjectId",
          dataType: defaultPriceKind.dataType,
          id: defaultPriceKind.id,
          presentation: defaultPriceKind.presentation,
          url: ""
        } || null,
        orderState: {
          _type: 'XTSObjectId',
          dataType: 'XTSSalesOrderState',
          id: data.orderState,
          presentation: orderStatePresentation,
          url: ''
        },
        company: defaultCompany,
        customer: {
          _type: 'XTSObjectId',
          id: data.customerId,
          dataType: 'XTSCounterparty',
          presentation: data.customerName,
          navigationRef: null
        },
        documentCurrency: defaultCurrency || null,
        documentAmount: data.documentAmount,
        vatTaxation: defaultVatTaxation || null,
        rate: 1,
        multiplicity: 1,
        comment: data.comment,
        shipmentDate: new Date().toISOString().split('T')[0],
        deliveryAddress: data.deliveryAddress,
        deliveryAddressValue: data.deliveryAddress,
        cash: 0,
        bankTransfer: 0,
        postPayment: 0,
        paymentNote: '',
        inventory: data.products.map((product, index) => ({
          _type: 'XTSOrderProductRow',
          _lineNumber: index + 1,
          product: {
            _type: 'XTSObjectId',
            dataType: 'XTSProduct',
            id: product.productId,
            presentation: product.productName,
            url: ''
          },
          characteristic: product.characteristic ? {
            _type: 'XTSObjectId',
            dataType: 'XTSProductCharacteristic',
            id: product.characteristic,
            presentation: product.characteristic,
            url: ''
          } : null,
          vatRate: product.vatRateId ? {
            _type: 'XTSObjectId',
            dataType: 'XTSVATRate',
            id: product.vatRateId,
            presentation: product.vatRateName,
            url: ''
          } : null,
          uom: {
            _type: 'XTSObjectId',
            dataType: 'XTSMeasurementUnit',
            id: product.unitId,
            presentation: product.unitName,
            url: ''
          },
          quantity: product.quantity,
          comment: '',
          price: product.price,
          amount: product.amount,
          automaticDiscountAmount: product.automaticDiscountAmount,
          discountsMarkupsAmount: product.discountsMarkupsAmount,
          vatAmount: product.vatAmount,
          total: product.total,
          _sku: product.code,
          _coefficient: product.coefficient,
          _price: product.price,
          _vatRateRate: product.vatAmount && product.amount ? product.vatAmount / product.amount : 0,
          _picture: {
            _type: 'XTSObjectId',
            dataType: '',
            id: '',
            presentation: '',
            url: ''
          }
        })),
        employeeResponsible: data.employeeId ? {
          _type: 'XTSObjectId',
          id: data.employeeId,
          dataType: 'XTSEmployee',
          presentation: data.employeeName,
          navigationRef: null
        } : null
      }
    ]
  };

  console.log('Final orderData payload before sending:', JSON.stringify(orderData, null, 2));

  try {
    const response = await api.post('', orderData);

    if (!response.data?.objects?.[0]?.objectId) {
      throw new Error('Invalid create order response format');
    }

    return {
      id: response.data.objects[0].objectId.id,
      number: response.data.objects[0].number
    };
  } catch (error) {
    console.error('Order creation error:', error);
    throw new Error('Failed to create order');
  }
};

export const updateOrder = async (data: UpdateOrderData): Promise<void> => {
  // Validate required fields
  if (!data.id) throw new Error('Order ID is required');
  if (!data.customerId) throw new Error('Customer is required');
  if (!data.products.length) throw new Error('At least one product is required');
  if (!data.orderStateId) throw new Error('Order state is required');

  const sessionData = getSession();
  const defaultOperationKind = sessionData?.defaultValues?.salesOrderOperationKind;
  const defaultOrderKind = sessionData?.defaultValues?.salesOrderOrderKind;
  const defaultPriceKind = sessionData?.defaultValues?.priceKind;
  const defaultCompany = sessionData?.defaultValues?.company;
  const defaultCurrency = sessionData?.defaultValues?.documentCurrency;

  const orderData = {
    _type: 'XTSUpdateObjectsRequest',
    _dbId: '',
    _msgId: '',
    objects: [
      {
        _type: 'XTSOrder',
        _isFullData: true,
        objectId: {
          _type: 'XTSObjectId',
          dataType: 'XTSOrder',
          id: data.id,
          presentation: data.title,
          url: ''
        },
        date: data.date,
        number: data.number,
        operationKind: {
          _type: "XTSObjectId",
          dataType: defaultOperationKind.dataType,
          id: defaultOperationKind.id,
          presentation: defaultOperationKind.presentation,
          url: ""
        } || null,
        orderKind: {
          _type: "XTSObjectId",
          dataType: defaultOrderKind.dataType,
          id: defaultOrderKind.id,
          presentation: defaultOrderKind.presentation,
          url: ""
        } || null,
        priceKind: {
          _type: "XTSObjectId",
          dataType: defaultPriceKind.dataType,
          id: defaultPriceKind.id,
          presentation: defaultPriceKind.presentation,
          url: ""
        } || null,
        orderState: {
          _type: 'XTSObjectId',
          dataType: 'XTSSalesOrderState',
          id: data.orderStateId,
          presentation: data.orderState,
          url: ''
        },
        company: {
          _type: 'XTSObjectId',
          dataType: 'XTSCompany',
          id: defaultCompany.id,
          presentation: defaultCompany.presentation,
          url: ''
        },
        customer: {
          _type: 'XTSObjectId',
          dataType: 'XTSCounterparty',
          id: data.customerId,
          presentation: data.customerName,
          url: ''
        },
        contract: data.contractId ? {
          _type: 'XTSObjectId',
          dataType: 'XTSCounterpartyContract',
          id: data.contractId,
          presentation: data.contractName,
          url: ''
        } : null,
        documentCurrency: {
          _type: 'XTSObjectId',
          dataType: 'XTSCurrency',
          id: defaultCurrency.id,
          presentation: defaultCurrency.presentation,
          url: ''
        },
        documentAmount: data.documentAmount,
        vatTaxation: {
          _type: 'XTSObjectId',
          dataType: 'XTSVATTaxationType',
          id: data.vatTaxationId,
          presentation: data.vatTaxation,
          url: ''
        },
        rate: data.rate,
        multiplicity: data.multiplicity,
        comment: data.comment,
        shipmentDate: data.shipmentDate,
        deliveryAddress: data.deliveryAddress,
        deliveryAddressValue: data.deliveryAddressValue,
        discountCard: data.discountCardId ? {
          _type: 'XTSObjectId',
          dataType: 'XTSDiscountCard',
          id: data.discountCardId,
          presentation: data.discountCard,
          url: ''
        } : null,
        emailAddress: data.emailAddress,
        shippingCost: data.shippingCost,
        phone: data.phone,
        completionOption: data.completionOptionId ? {
          _type: 'XTSObjectId',
          dataType: 'XTSCompletionOption',
          id: data.completionOptionId,
          presentation: data.completionOption,
          url: ''
        } : null,
        cash: data.cash,
        bankTransfer: data.bankTransfer,
        postPayment: data.postPayment,
        paymentNote: data.paymentNote,
        status: data.status,
        inventory: data.products.map(product => ({
          _type: 'XTSOrderProductRow',
          _lineNumber: product.lineNumber,
          product: {
            _type: 'XTSObjectId',
            dataType: 'XTSProduct',
            id: product.productId,
            presentation: product.productName,
            url: ''
          },
          characteristic: product.characteristic ? {
            _type: 'XTSObjectId',
            dataType: 'XTSProductCharacteristic',
            id: product.characteristic,
            presentation: product.characteristic,
            url: ''
          } : null,
          uom: {
            _type: 'XTSObjectId',
            dataType: 'XTSMeasurementUnit',
            id: product.unitId,
            presentation: product.unitName,
            url: ''
          },
          quantity: product.quantity,
          price: product.price,
          amount: product.amount,
          automaticDiscountAmount: product.automaticDiscountAmount,
          discountsMarkupsAmount: product.discountsMarkupsAmount,
          vatRate: product.vatRateId ? {
            _type: 'XTSObjectId',
            dataType: 'XTSVATRate',
            id: product.vatRateId,
            presentation: product.vatRateName,
            url: ''
          } : null,
          vatAmount: product.vatAmount,
          total: product.total,
          _sku: product.code,
          _coefficient: product.coefficient,
          _price: product.price,
          _vatRateRate: product.vatAmount && product.amount ? product.vatAmount / product.amount : 0,
          _picture: product.picture ? {
            _type: 'XTSObjectId',
            dataType: 'XTSProductAttachedFile',
            id: '',
            presentation: product.picture,
            url: ''
          } : null
        })),
        externalAccount: data.externalAccountId ? {
          _type: 'XTSObjectId',
          dataType: 'XTSExternalAccount',
          id: data.externalAccountId,
          presentation: data.externalAccount,
          url: ''
        } : null,
        employeeResponsible: data.employeeResponsibleId ? {
          _type: 'XTSObjectId',
          dataType: 'XTSEmployee',
          id: data.employeeResponsibleId,
          presentation: data.employeeResponsibleName,
          url: ''
        } : null,
        _receiptableIncrease: data.receiptableIncrease,
        _receiptableDecrease: data.receiptableDecrease,
        _receiptableBalance: data.receiptableBalance
      }
    ]
  };

  try {
    const response = await api.post('', orderData);
    
    if (!response.data?.objects?.[0]) {
      throw new Error('Invalid update order response format');
    }
  } catch (error) {
    console.error('Order update error:', error);
    throw new Error('Failed to update order');
  }
};