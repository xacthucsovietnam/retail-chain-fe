import api from './axiosClient';
// First add the new interface for related documents
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
// Keep all existing interfaces and functions
export interface CustomerDropdownItem {
  id: string;
  name: string;
  code: string;
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
  sku: string;
  unit: string;
  quantity: number;
  price: number;
  amount: number;
  total: number;
  coefficient: number;
  picture: string | null;
}

export interface OrderDetail {
  id: string;
  number: string;
  date: string;
  title: string;
  author: string;
  comment: string | null;
  company: string;
  contract: string | null;
  customer: string;
  deliveryAddress: string | null;
  orderKind: string;
  operationType: string;
  priceKind: string;
  shipmentDate: string;
  documentAmount: number;
  documentCurrency: string;
  employeeResponsible: string | null;
  orderState: string;
  shippingCost: number | null;
  phone: string | null;
  cash: number | null;
  bankTransfer: number | null;
  postPayment: number | null;
  paymentNote: string | null;
  vatTaxation: string;
  products: OrderProduct[];
}

export interface CreateOrderProduct {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  unitId: string;
  unitName: string;
  coefficient: number;
  sku: string;
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
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  unitId: string;
  unitName: string;
  coefficient: number;
  sku: string;
  lineNumber: number;
}

export interface UpdateOrderData {
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
  documentAmount: number;
  products: UpdateOrderProduct[];
  date: string;
  contractId: string;
  contractName: string;
  externalAccountId: string;
  externalAccountName: string;
  cashAmount: number;
  transferAmount: number;
  postPayAmount: number;
  paymentNotes: string;
}

// Add the new function to get related documents
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
    positionFrom: 1,
    positionTo: 100,
    limit: 100,
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
    positionFrom: 1,
    positionTo: 100,
    limit: 100,
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
  // Return the mapped order states
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
    columnSet: ['objectId'], // Chỉ yêu cầu các trường cần thiết
    sortBy: [],
    positionFrom: 1,
    positionTo: 10000000,
    limit: 10000000,
    conditions: []
  };

  try {
    const response = await api.post('', request);
    
    if (!response.data?.items) {
      throw new Error('Invalid product list response format');
    }

    return response.data.items.map((item: any) => ({
      id: item.object.objectId.id,
      name: item.object.objectId.presentation,
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

  const orderListData: ListRequest = {
    _type: 'XTSGetObjectListRequest',
    _dbId: '',
    _msgId: '',
    dataType: 'XTSOrder',
    columnSet: [],
    sortBy: [],
    positionFrom,
    positionTo,
    limit: pageSize,
    conditions: [
      {
        _type: 'XTSCondition',
        property: 'company',
        value: {
          _type: 'XTSObjectId',
          id: 'a4e5cb74-5b27-11ef-a699-00155d058802',
          dataType: 'XTSCompany',
          presentation: 'Cửa hàng Dung-Baby',
          navigationRef: null
        },
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
      author: order.author?.presentation || '',
      comment: order.comment,
      company: order.company?.presentation || '',
      contract: order.contract?.presentation || null,
      customer: order.customer?.presentation || '',
      deliveryAddress: order.deliveryAddress,
      orderKind: order.orderKind?.presentation || '',
      operationType: order.operationKind?.presentation || '',
      priceKind: order.priceKind?.presentation || '',
      shipmentDate: order.shipmentDate,
      documentAmount: order.documentAmount || 0,
      documentCurrency: order.documentCurrency?.presentation || '',
      employeeResponsible: order.employeeResponsible?.presentation || null,
      orderState: order.orderState?.presentation || '',
      shippingCost: order.shippingCost,
      phone: order.phone,
      cash: order.cash,
      bankTransfer: order.bankTransfer,
      postPayment: order.postPayment,
      paymentNote: order.paymentNote,
      vatTaxation: order.vatTaxation?.presentation || '',
      products: (order.inventory || []).map((item: any) => ({
        lineNumber: item._lineNumber || 0,
        productId: item.product?.id || '',
        productName: item.product?.presentation || '',
        sku: item._sku || '',
        unit: item.uom?.presentation || '',
        quantity: item.quantity || 0,
        price: item.price || 0,
        amount: item.amount || 0,
        total: item.total || 0,
        coefficient: item._coefficient || 1,
        picture: item._picture
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
          _type: 'XTSObjectId',
          id: 'OrderForSale',
          dataType: 'XTSOperationKindsSalesOrder',
          presentation: 'Đơn hàng bán',
          navigationRef: null
        },
        orderKind: {
          _type: 'XTSObjectId',
          id: '5736c2cc-5b28-11ef-a699-00155d058802',
          dataType: 'XTSSalesOrderKind',
          presentation: 'Thông tin chính',
          navigationRef: null
        },
        priceKind: {
          _type: 'XTSObjectId',
          id: '1a1fb49c-5b28-11ef-a699-00155d058802',
          dataType: 'XTSPriceKind',
          presentation: 'Giá bán lẻ',
          navigationRef: null
        },
        orderState: {
          _type: 'XTSObjectId',
          dataType: 'XTSSalesOrderState',
          id: data.orderState,
          presentation: orderStatePresentation,
          url: ''
        },
        company: {
          _type: 'XTSObjectId',
          id: 'a4e5cb74-5b27-11ef-a699-00155d058802',
          dataType: 'XTSCompany',
          presentation: 'Cửa hàng Dung-Baby',
          navigationRef: null
        },
        customer: {
          _type: 'XTSObjectId',
          id: data.customerId,
          dataType: 'XTSCounterparty',
          presentation: data.customerName,
          navigationRef: null
        },
        documentCurrency: {
          _type: 'XTSObjectId',
          id: 'c26a4d87-c6e2-4aca-ab05-1b02be6ecaec',
          dataType: 'XTSCurrency',
          presentation: 'đồng',
          navigationRef: null
        },
        documentAmount: data.documentAmount,
        vatTaxation: {
          _type: 'XTSObjectId',
          id: 'NotTaxableByVAT',
          dataType: 'XTSVATTaxationType',
          presentation: 'Không chịu thuế (không thuế GTGT)',
          navigationRef: null
        },
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
          characteristic: {
            _type: 'XTSObjectId',
            dataType: 'XTSProductCharacteristic',
            id: '',
            presentation: '',
            url: ''
          },
          vatRate: {
            _type: 'XTSObjectId',
            dataType: '',
            id: '',
            presentation: '',
            url: ''
          },
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
          amount: product.price * product.quantity,
          automaticDiscountAmount: 0,
          discountsMarkupsAmount: 0,
          vatAmount: 0,
          total: product.price * product.quantity,
          _sku: product.sku,
          _coefficient: product.coefficient,
          _price: product.price,
          _vatRateRate: 0,
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
  if (!data.orderState) throw new Error('Order state is required');

  const orderStatePresentation = getOrderStatePresentation(data.orderState);

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
          _type: 'XTSObjectId',
          dataType: 'XTSOperationKindsSalesOrder',
          id: 'OrderForSale',
          presentation: 'Đơn hàng bán',
          url: ''
        },
        orderKind: {
          _type: 'XTSObjectId',
          dataType: 'XTSSalesOrderKind',
          id: '5736c2cc-5b28-11ef-a699-00155d058802',
          presentation: 'Thông tin chính',
          url: ''
        },
        priceKind: {
          _type: 'XTSObjectId',
          dataType: 'XTSPriceKind',
          id: '1a1fb49c-5b28-11ef-a699-00155d058802',
          presentation: 'Giá bán lẻ',
          url: ''
        },
        orderState: {
          _type: 'XTSObjectId',
          dataType: 'XTSSalesOrderState',
          id: data.orderState,
          presentation: orderStatePresentation,
          url: ''
        },
        company: {
          _type: 'XTSObjectId',
          dataType: 'XTSCompany',
          id: 'a4e5cb74-5b27-11ef-a699-00155d058802',
          presentation: 'Cửa hàng Dung-Baby',
          url: ''
        },
        customer: {
          _type: 'XTSObjectId',
          dataType: 'XTSCounterparty',
          id: data.customerId,
          presentation: data.customerName,
          url: ''
        },
        contract: {
          _type: 'XTSObjectId',
          dataType: 'XTSCounterpartyContract',
          id: data.contractId,
          presentation: data.contractName,
          url: ''
        },
        documentCurrency: {
          _type: 'XTSObjectId',
          dataType: 'XTSCurrency',
          id: 'c26a4d87-c6e2-4aca-ab05-1b02be6ecaec',
          presentation: 'đồng',
          url: ''
        },
        documentAmount: data.documentAmount,
        vatTaxation: {
          _type: 'XTSObjectId',
          dataType: 'XTSVATTaxationType',
          id: 'NotTaxableByVAT',
          presentation: 'Không chịu thuế (không thuế GTGT)',
          url: ''
        },
        rate: 1,
        multiplicity: 1,
        comment: data.comment,
        shipmentDate: new Date().toISOString().split('T')[0],
        deliveryAddress: data.deliveryAddress,
        deliveryAddressValue: data.deliveryAddress,
        cash: data.cashAmount,
        bankTransfer: data.transferAmount,
        postPayment: data.postPayAmount,
        paymentNote: data.paymentNotes,
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
          characteristic: {
            _type: 'XTSObjectId',
            dataType: '',
            id: '',
            presentation: '',
            url: ''
          },
          vatRate: {
            _type: 'XTSObjectId',
            dataType: '',
            id: '',
            presentation: '',
            url: ''
          },
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
          amount: product.price * product.quantity,
          automaticDiscountAmount: 0,
          discountsMarkupsAmount: 0,
          vatAmount: 0,
          total: product.price * product.quantity,
          _sku: product.sku,
          _coefficient: product.coefficient,
          _price: product.price,
          _vatRateRate: 0,
          _picture: {
            _type: 'XTSObjectId',
            dataType: '',
            id: '',
            presentation: '',
            url: ''
          }
        })),
        externalAccount: {
          _type: 'XTSObjectId',
          dataType: 'XTSExternalAccount',
          id: data.externalAccountId,
          presentation: data.externalAccountName,
          url: ''
        },
        employeeResponsible: data.employeeId ? {
          _type: 'XTSObjectId',
          dataType: 'XTSEmployee',
          id: data.employeeId,
          presentation: data.employeeName,
          url: ''
        } : null,
        _receiptableIncrease: 0,
        _receiptableDecrease: 0,
        _receiptableBalance: 0
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