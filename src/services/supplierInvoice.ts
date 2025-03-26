// src/services/supplierInvoice.ts
import api from './axiosClient';
import { ListRequest, PaginatedResponse } from './types';

// Add new interfaces for dropdown data
export interface SupplierDropdownItem {
  id: string;
  name: string;
  code: string;
}

export interface ProductDropdownItem {
  id: string;
  name: string;
  code: string;
  baseUnit: string;
  baseUnitId: string;
  price: number;
}

// Keep existing interfaces
export interface XTSObjectId {
  _type: string;
  dataType: string;
  id: string;
  presentation: string;
  url?: string;
  navigationRef?: any;
}

export interface SupplierProduct {
  lineNumber: number;
  productId: string;
  productName: string;
  code: string;
  unit: string;
  quantity: number;
  price: number;
  amount: number;
  total: number;
  coefficient: number;
  picture: string | null;
}

export interface SupplierInvoiceDetail {
  id: string;
  number: string;
  date: string;
  author: XTSObjectId;
  contract: XTSObjectId;
  counterparty: XTSObjectId;
  operationType: XTSObjectId;
  amount: number;
  currency: XTSObjectId;
  employeeResponsible: XTSObjectId;
  vatTaxation: XTSObjectId;
  structuralUnit: XTSObjectId;
  orderBasis: XTSObjectId;
  comment: string;
  posted: boolean;
  products: SupplierProduct[];
}

export interface SupplierInvoice {
  id: string;
  number: string;
  date: string;
  author: string;
  contract: string;
  counterparty: string;
  operationType: string;
  amount: number;
  currency: string;
  employeeResponsible: string;
  vatTaxation: string;
  structuralUnit: string;
  orderBasis: string;
  comment: string;
  posted: boolean;
}

export interface CreateSupplierInvoiceProduct {
  productId: string;
  productName: string;
  unitId: string;
  unitName: string;
  quantity: number;
  price: number;
  coefficient: number;
}

export interface CreateSupplierInvoiceData {
  date: string;
  customerId: string;
  customerName: string;
  currencyId: string;
  currencyName: string;
  rate: number;
  comment: string;
  employeeId: string;
  employeeName: string;
  externalAccountId: string;
  externalAccountName: string;
  amount: number;
  products: CreateSupplierInvoiceProduct[];
}

export interface UpdateSupplierInvoiceData {
  id: string;
  number: string;
  title: string;
  date: string;
  customerId: string;
  customerName: string;
  contractId: string;
  contractName: string;
  currencyId: string;
  currencyName: string;
  rate: number;
  comment: string;
  employeeId: string;
  employeeName: string;
  externalAccountId: string;
  externalAccountName: string;
  amount: number;
  products: CreateSupplierInvoiceProduct[];
  posted: boolean;
}

// Add new functions for dropdown data
export const getSupplierDropdownData = async (): Promise<SupplierDropdownItem[]> => {
  const request = {
    _type: 'XTSGetObjectListRequest',
    _dbId: '',
    _msgId: '',
    dataType: 'XTSCounterparty',
    columnSet: [],
    sortBy: [],
    positionFrom: 1,
    positionTo: 100,
    limit: 50,
    conditions: [
      {
        _type: 'XTSCondition',
        property: 'vendor',
        value: true,
        comparisonOperator: '='
      }
    ]
  };

  try {
    const response = await api.post('', request);
    
    if (!response.data?.items) {
      throw new Error('Invalid supplier list response format');
    }

    return response.data.items.map((item: any) => ({
      id: item.object.objectId.id,
      name: item.object.objectId.presentation,
      code: item.object.code || ''
    }));
  } catch (error) {
    console.error('Failed to fetch suppliers:', error);
    throw new Error('Không thể tải danh sách nhà cung cấp');
  }
};

export const getProductDropdownData = async (): Promise<ProductDropdownItem[]> => {
  const request = {
    _type: 'XTSGetObjectListRequest',
    _dbId: '',
    _msgId: '',
    dataType: 'XTSProduct',
    columnSet: [],
    sortBy: [],
    positionFrom: 1,
    positionTo: 10000,
    limit: 10000,
    conditions: []
  };

  try {
    const response = await api.post('', request);
    
    if (!response.data?.items) {
      throw new Error('Invalid product list response format');
    }

    return response.data.items.map((item: any) => ({
      id: item.object.objectId.id,
      name: item.object.description,
      code: item.object.code || '',
      baseUnit: item.object.measurementUnit?.presentation || '',
      baseUnitId: item.object.measurementUnit?.id || '',
      price: item.object._price || 0
    }));
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw new Error('Không thể tải danh sách sản phẩm');
  }
};

// Keep existing functions
export const getSupplierInvoices = async (page: number = 1, pageSize: number = 50, conditions: any[] = []) => {
  const positionFrom = (page - 1) * pageSize + 1;
  const positionTo = page * pageSize;

  const invoiceListData: ListRequest = {
    _type: 'XTSGetObjectListRequest',
    _dbId: '',
    _msgId: '',
    dataType: 'XTSSupplierInvoice',
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
    const response = await api.post('', invoiceListData);

    if (!response.data || !Array.isArray(response.data.items)) {
      throw new Error('Invalid supplier invoice list response format');
    }

    const invoices = response.data.items.map((item: any) => {
      try {
        if (!item.object) {
          throw new Error('Missing object property in supplier invoice item');
        }

        return {
          id: item.object.objectId?.id || '',
          number: item.object.number || '',
          date: item.object.date || '',
          author: item.object.author?.presentation || '',
          contract: item.object.contract?.presentation || '',
          counterparty: item.object.counterparty?.presentation || '',
          operationType: item.object.operationType?.presentation || '',
          amount: item.object.documentAmount || 0,
          currency: item.object.currency?.presentation || '',
          employeeResponsible: item.object.employeeResponsible?.presentation || '',
          vatTaxation: item.object.vatTaxation?.presentation || '',
          structuralUnit: item.object.structuralUnit?.presentation || '',
          orderBasis: item.object.orderBasis?.presentation || '',
          comment: item.object.comment || '',
          posted: Boolean(item.object.posted),
        };
      } catch (err) {
        console.error('Error mapping supplier invoice item:', err, item);
        return null;
      }
    }).filter(Boolean);

    return {
      items: invoices,
      hasMore: response.data.items.length === pageSize
    };
  } catch (error) {
    console.error('Supplier invoice fetch error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to fetch supplier invoices: ${error.message}`);
    }
    throw new Error('Failed to fetch supplier invoices');
  }
};

export const getSupplierInvoiceDetail = async (id: string): Promise<SupplierInvoiceDetail> => {
  const supplierInvoiceData = {
    _type: 'XTSGetObjectsRequest',
    _dbId: '',
    _msgId: '',
    objectIds: [
      {
        _type: 'XTSObjectId',
        dataType: 'XTSSupplierInvoice',
        id: id,
        presentation: '',
        url: ''
      }
    ],
    columnSet: []
  };

  try {
    const response = await api.post('', supplierInvoiceData);

    if (!response.data?.objects?.[0]) {
      throw new Error('Invalid supplier invoice detail response format');
    }

    const supplierInvoice = response.data.objects[0];
    return {
      id: supplierInvoice.objectId?.id || '',
      number: supplierInvoice.number || '',
      date: supplierInvoice.date || '',
      author: supplierInvoice.author || { _type: 'XTSObjectId', dataType: 'XTSEmployee', id: '', presentation: '' },
      contract: supplierInvoice.contract || { _type: 'XTSObjectId', dataType: 'XTSCounterpartyContract', id: '', presentation: '' },
      counterparty: supplierInvoice.counterparty || { _type: 'XTSObjectId', dataType: 'XTSCounterparty', id: '', presentation: '' },
      operationType: supplierInvoice.operationKind || { _type: 'XTSObjectId', dataType: 'XTSOperationKindsSupplierInvoice', id: '', presentation: '' },
      amount: supplierInvoice.documentAmount || 0,
      currency: supplierInvoice.documentCurrency || { _type: 'XTSObjectId', dataType: 'XTSCurrency', id: '', presentation: '' },
      employeeResponsible: supplierInvoice.employeeResponsible || { _type: 'XTSObjectId', dataType: 'XTSEmployee', id: '', presentation: '' },
      vatTaxation: supplierInvoice.vatTaxation || { _type: 'XTSObjectId', dataType: 'XTSVATTaxationType', id: '', presentation: '' },
      structuralUnit: supplierInvoice.structuralUnit || { _type: 'XTSObjectId', dataType: 'XTSStructuralUnit', id: '', presentation: '' },
      orderBasis: supplierInvoice.orderBasis || { _type: 'XTSObjectId', dataType: 'XTSOrder', id: '', presentation: '' },
      comment: supplierInvoice.comment || '',
      posted: supplierInvoice.posted || false,
      products: (supplierInvoice.inventory || []).map((item: any) => ({
        lineNumber: item._lineNumber || 0,
        productId: item.product?.id || '',
        productName: item.product?.presentation || '',
        code: item._sku || '',
        unit: item.uom?.presentation || '',
        quantity: item.quantity || 0,
        price: item.price || 0,
        amount: item.amount || 0,
        total: item.total || 0,
        coefficient: item._coefficient || 1,
        picture: item._picture || null
      }))
    };
  } catch (error) {
    console.error('Supplier invoice detail fetch error:', error);
    throw new Error('Failed to fetch supplier invoice details');
  }
};

export const createSupplierInvoice = async (data: CreateSupplierInvoiceData): Promise<{ id: string; number: string }> => {
  const createData = {
    _type: 'XTSCreateObjectsRequest',
    _dbId: '',
    _msgId: '',
    objects: [
      {
        _type: 'XTSSupplierInvoice',
        _isFullData: false,
        objectId: {
          _type: 'XTSObjectId',
          dataType: 'XTSSupplierInvoice',
          id: '',
          presentation: '',
          url: ''
        },
        date: data.date,
        number: '',
        posted: false,
        operationKind: {
          _type: 'XTSObjectId',
          id: 'ReceiptFromSupplier',
          dataType: 'XTSOperationKindsSupplierInvoice',
          presentation: 'Mua hàng từ nhà cung cấp',
          navigationRef: null
        },
        company: {
          _type: 'XTSObjectId',
          id: 'a4e5cb74-5b27-11ef-a699-00155d058802',
          dataType: 'XTSCompany',
          presentation: 'Cửa hàng Dung-Baby',
          navigationRef: null
        },
        counterparty: {
          _type: 'XTSObjectId',
          dataType: 'XTSCounterparty',
          id: data.customerId,
          presentation: data.customerName,
          url: ''
        },
        documentCurrency: {
          _type: 'XTSObjectId',
          id: data.currencyId,
          dataType: 'XTSCurrency',
          presentation: data.currencyName,
          navigationRef: null
        },
        documentAmount: data.amount,
        vatTaxation: {
          _type: 'XTSObjectId',
          id: 'NotTaxableByVAT',
          dataType: 'XTSVATTaxationType',
          presentation: 'Không chịu thuế (không thuế GTGT)',
          navigationRef: null
        },
        rate: data.rate,
        multiplicity: 1,
        comment: data.comment,
        employeeResponsible: {
          _type: 'XTSObjectId',
          id: data.employeeId,
          dataType: 'XTSEmployee',
          presentation: data.employeeName,
          navigationRef: null
        },
        externalAccount: {
          _type: 'XTSObjectId',
          id: data.externalAccountId,
          dataType: 'XTSExternalAccount',
          presentation: data.externalAccountName,
          navigationRef: null
        },
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
          uom: {
            _type: 'XTSObjectId',
            dataType: 'XTSUOMClassifier',
            id: product.unitId,
            presentation: product.unitName,
            url: ''
          },
          quantity: product.quantity,
          price: product.price,
          amount: product.quantity * product.price,
          total: product.quantity * product.price,
          _coefficient: product.coefficient,
          _price: product.price
        }))
      }
    ]
  };

  try {
    const response = await api.post('', createData);

    if (!response.data?.objects?.[0]?.objectId) {
      throw new Error('Invalid create supplier invoice response format');
    }

    const createdInvoice = response.data.objects[0];
    return {
      id: createdInvoice.objectId.id,
      number: createdInvoice.number
    };
  } catch (error) {
    console.error('Supplier invoice creation error:', error);
    throw new Error('Failed to create supplier invoice');
  }
};

export const updateSupplierInvoice = async (data: UpdateSupplierInvoiceData): Promise<void> => {
  const updateData = {
    _type: 'XTSUpdateObjectsRequest',
    _dbId: '',
    _msgId: '',
    objects: [
      {
        _type: 'XTSSupplierInvoice',
        _isFullData: true,
        objectId: {
          _type: 'XTSObjectId',
          dataType: 'XTSSupplierInvoice',
          id: data.id,
          presentation: data.title,
          url: ''
        },
        date: data.date,
        number: data.number,
        posted: data.posted,
        operationKind: {
          _type: 'XTSObjectId',
          dataType: 'XTSOperationKindsSupplierInvoice',
          id: 'ReceiptFromSupplier',
          presentation: 'Mua hàng từ nhà cung cấp',
          url: ''
        },
        company: {
          _type: 'XTSObjectId',
          dataType: 'XTSCompany',
          id: 'a4e5cb74-5b27-11ef-a699-00155d058802',
          presentation: 'Cửa hàng Dung-Baby',
          url: ''
        },
        counterparty: {
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
          id: data.currencyId,
          presentation: data.currencyName,
          url: ''
        },
        documentAmount: data.amount,
        vatTaxation: {
          _type: 'XTSObjectId',
          dataType: 'XTSVATTaxationType',
          id: 'NotTaxableByVAT',
          presentation: 'Không chịu thuế (không thuế GTGT)',
          url: ''
        },
        rate: data.rate,
        multiplicity: 1,
        comment: data.comment,
        employeeResponsible: {
          _type: 'XTSObjectId',
          dataType: 'XTSEmployee',
          id: data.employeeId,
          presentation: data.employeeName,
          url: ''
        },
        externalAccount: {
          _type: 'XTSObjectId',
          dataType: 'XTSExternalAccount',
          id: data.externalAccountId,
          presentation: data.externalAccountName,
          url: ''
        },
        inventory: data.products.map((product, index) => ({
          _type: 'XTSSupplierInvoiceInventory',
          _lineNumber: index + 1,
          product: {
            _type: 'XTSObjectId',
            dataType: 'XTSProduct',
            id: product.productId,
            presentation: product.productName,
            url: ''
          },
          uom: {
            _type: 'XTSObjectId',
            dataType: 'XTSUOMClassifier',
            id: product.unitId,
            presentation: product.unitName,
            url: ''
          },
          quantity: product.quantity,
          price: product.price,
          amount: product.quantity * product.price,
          total: product.quantity * product.price,
          _coefficient: product.coefficient,
          _price: product.price
        }))
      }
    ]
  };

  try {
    const response = await api.post('', updateData);
    
    if (!response.data?.objects?.[0]) {
      throw new Error('Invalid update supplier invoice response format');
    }
  } catch (error) {
    console.error('Supplier invoice update error:', error);
    throw new Error('Failed to update supplier invoice');
  }
};