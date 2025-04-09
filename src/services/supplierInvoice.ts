// src/services/supplierInvoice.ts
import api from './axiosClient';
import { ListRequest, PaginatedResponse, ObjectId } from './types';
import { getSession } from '../utils/storage';

// Interfaces
export interface SupplierDropdownItem {
  id: string;
  name: string;
  code: string;
}

export interface ProductDropdownItem {
  id: string;
  name: string;
  code: string;
}

export interface SupplierProduct {
  lineNumber: number;
  product: ObjectId;
  characteristic: ObjectId | null;
  uom: ObjectId | null;
  quantity: number;
  price: number;
  amount: number;
  discountsMarkupsAmount: number | null;
  vatAmount: number | null;
  vatRate: ObjectId | null;
  total: number;
  sku: string;
  coefficient: number;
  priceOriginal: number;
  vatRateRate: number | null;
  picture: ObjectId | null;
  comment?: string;
}

export interface SupplierInvoiceDetail {
  id: string;
  number: string;
  date: string;
  deletionMark: boolean | null;
  posted: boolean;
  author: ObjectId | null;
  comment: string | null;
  company: ObjectId;
  contract: ObjectId;
  counterparty: ObjectId;
  emailAddress: string | null;
  operationKind: ObjectId;
  counterpartyPriceKind: ObjectId | null;
  documentAmount: number;
  documentCurrency: ObjectId;
  employeeResponsible: ObjectId;
  phone: string | null;
  rate: number | null;
  multiplicity: number;
  vatTaxation: ObjectId;
  structuralUnit: ObjectId;
  returnPriceKind: ObjectId | null;
  documentBasis: ObjectId | null;
  docOrder: ObjectId | null;
  department: ObjectId | null;
  inventory: SupplierProduct[];
}

export interface SupplierInvoice {
  id: string;
  number: string;
  date: string;
  deletionMark: boolean;
  posted: boolean;
  author: ObjectId | null;
  comment: string | null;
  company: ObjectId;
  contract: ObjectId;
  counterparty: ObjectId;
  emailAddress: string | null;
  operationKind: ObjectId;
  counterpartyPriceKind: ObjectId | null;
  documentAmount: number;
  documentCurrency: ObjectId;
  employeeResponsible: ObjectId;
  phone: string | null;
  rate: number;
  multiplicity: number;
  vatTaxation: ObjectId;
  structuralUnit: ObjectId;
  returnPriceKind: ObjectId | null;
  documentBasis: ObjectId | null;
  docOrder: ObjectId | null;
  department: ObjectId | null;
  inventory: any[];
}

export interface CreateSupplierInvoiceData {
  date: string;
  posted: boolean;
  operationKindId: string;
  operationKindPresentation: string;
  companyId: string;
  companyName: string;
  counterpartyId: string;
  counterpartyName: string;
  contractId: string;
  contractName: string;
  currencyId: string;
  currencyName: string;
  amount: number;
  vatTaxationId: string;
  vatTaxationName: string;
  rate: number;
  multiplicity: number;
  comment: string;
  employeeId: string;
  employeeName: string;
  structuralUnitId: string;
  structuralUnitName: string;
  products: SupplierProduct[];
  counterpartyPriceKindId?: string;
  counterpartyPriceKindName?: string;
  returnPriceKindId?: string;
  returnPriceKindName?: string;
  authorId?: string;
  authorName?: string;
  deliveryAddress?: string;
  deliveryAddressValue?: string;
  departmentId?: string;
  departmentName?: string;
  documentBasisId?: string;
  documentBasisName?: string;
  docOrderId?: string;
  docOrderName?: string;
}

export interface UpdateSupplierInvoiceData {
  id: string;
  number: string;
  title: string;
  date: string;
  posted: boolean;
  operationKindId: string;
  operationKindPresentation: string;
  companyId: string;
  companyName: string;
  counterpartyId: string;
  counterpartyName: string;
  contractId: string;
  contractName: string;
  currencyId: string;
  currencyName: string;
  amount: number;
  vatTaxationId: string;
  vatTaxationName: string;
  rate: number;
  multiplicity: number;
  comment: string;
  employeeId: string;
  employeeName: string;
  structuralUnitId: string;
  structuralUnitName: string;
  products: SupplierProduct[];
  counterpartyPriceKindId?: string;
  counterpartyPriceKindName?: string;
  returnPriceKindId?: string;
  returnPriceKindName?: string;
  authorId?: string;
  authorName?: string;
  deliveryAddress?: string;
  deliveryAddressValue?: string;
  departmentId?: string;
  departmentName?: string;
  documentBasisId?: string;
  documentBasisName?: string;
  docOrderId?: string;
  docOrderName?: string;
}

// Utility Functions
interface DefaultValues {
  company: { id: string; presentation: string };
  vatTaxation?: { id: string; presentation: string };
  employeeResponsible?: { id: string; presentation: string };
  externalAccount?: { id: string; presentation: string };
}

const getDefaultValues = (): DefaultValues => {
  const session = getSession();
  const defaults = session?.defaultValues || {};
  if (!defaults.company?.id) {
    throw new Error('Company ID is missing in default values');
  }
  return defaults as DefaultValues;
};

const createObjectId = (
  dataType: string,
  id: string,
  presentation: string,
  url: string = '',
  navigationRef: any = null
): ObjectId => ({
  _type: 'XTSObjectId',
  dataType,
  id,
  presentation,
  url,
  navigationRef,
});

const handleApiError = (error: unknown, context: string): never => {
  console.error(`${context} error:`, error);
  const message = error instanceof Error ? `${context} failed: ${error.message}` : `${context} failed`;
  throw new Error(message);
};

const mapSupplierProducts = (
  products: SupplierProduct[],
  type: string = 'XTSSupplierInvoiceInventory'
): any[] => products.map((item, index) => ({
  _type: type,
  _lineNumber: index + 1,
  product: item.product,
  characteristic: item.characteristic || createObjectId('', '', ''),
  uom: item.uom || createObjectId('', '', ''),
  quantity: item.quantity || 0,
  price: item.price || 0,
  amount: item.amount || (item.quantity || 0) * (item.price || 0),
  discountsMarkupsAmount: item.discountsMarkupsAmount ?? 0,
  vatAmount: item.vatAmount ?? 0,
  vatRate: item.vatRate || createObjectId('', '', ''),
  total: item.total || (item.quantity || 0) * (item.price || 0),
  _sku: item.sku || '',
  _coefficient: item.coefficient || 1,
  _price: item.priceOriginal || item.price || 0,
  _vatRateRate: item.vatRateRate ?? 0,
  _picture: item.picture || createObjectId('', '', ''),
  comment: item.comment || '',
}));

// API Functions
export const getSupplierDropdownData = async (): Promise<SupplierDropdownItem[]> => {
  const request: ListRequest = {
    _type: 'XTSGetObjectListRequest',
    _dbId: '',
    _msgId: '',
    dataType: 'XTSCounterparty',
    columnSet: ['objectId', 'code'],
    sortBy: [],
    positionFrom: 1,
    positionTo: 1000,
    limit: 1000,
    conditions: [{ _type: 'XTSCondition', property: 'vendor', value: true, comparisonOperator: '=' }],
  };

  try {
    const response = await api.post('', request);
    const items = response.data?.items;
    if (!Array.isArray(items)) throw new Error('Invalid supplier list response format');
    
    return items.map(item => ({
      id: item.object.objectId.id,
      name: item.object.objectId.presentation,
      code: item.object.code || '',
    }));
  } catch (error) {
    return handleApiError(error, 'Failed to fetch suppliers');
  }
};

export const getProductDropdownData = async (): Promise<ProductDropdownItem[]> => {
  const request: ListRequest = {
    _type: 'XTSGetObjectListRequest',
    _dbId: '',
    _msgId: '',
    dataType: 'XTSProduct',
    columnSet: ['objectId', 'sku'],
    sortBy: [],
    positionFrom: 1,
    positionTo: 10000,
    limit: 10000,
    conditions: [],
  };

  try {
    const response = await api.post('', request);
    const items = response.data?.items;
    if (!Array.isArray(items)) throw new Error('Invalid product list response format');
    
    return items.map(item => ({
      id: item.object.objectId.id,
      name: item.object.description,
      code: item.object.sku || '',
    }));
  } catch (error) {
    return handleApiError(error, 'Failed to fetch products');
  }
};

export const getSupplierInvoices = async (
  page: number = 1,
  pageSize: number = 50,
  conditions: any[] = []
): Promise<PaginatedResponse<SupplierInvoice>> => {
  const defaultValues = getDefaultValues();
  const positionFrom = (page - 1) * pageSize + 1;
  const positionTo = page * pageSize;

  const request: ListRequest = {
    _type: 'XTSGetObjectListRequest',
    _dbId: '',
    _msgId: '',
    dataType: 'XTSSupplierInvoice',
    columnSet: [],
    sortBy: ['date DESC'],
    positionFrom,
    positionTo,
    limit: pageSize,
    conditions: [
      {
        _type: 'XTSCondition',
        property: 'company',
        value: createObjectId('XTSCompany', defaultValues.company.id, defaultValues.company.presentation),
        comparisonOperator: '=',
      },
      ...conditions,
    ],
  };

  try {
    const response = await api.post('', request);
    const items = response.data?.items;
    if (!Array.isArray(items)) throw new Error('Invalid supplier invoice list response format');

    const invoices: SupplierInvoice[] = items.map(item => {
      const obj = item.object;
      return {
        id: obj.objectId?.id || '',
        number: obj.number || '',
        date: obj.date || '',
        deletionMark: Boolean(obj.deletionMark),
        posted: Boolean(obj.posted),
        author: obj.author || null,
        comment: obj.comment || null,
        company: obj.company || createObjectId('XTSCompany', '', ''),
        contract: obj.contract || createObjectId('XTSCounterpartyContract', '', ''),
        counterparty: obj.counterparty || createObjectId('XTSCounterparty', '', ''),
        emailAddress: obj.emailAddress || null,
        operationKind: obj.operationKind || createObjectId('XTSOperationKindsSupplierInvoice', '', ''),
        counterpartyPriceKind: obj.counterpartyPriceKind || null,
        documentAmount: obj.documentAmount || 0,
        documentCurrency: obj.documentCurrency || createObjectId('XTSCurrency', '', ''),
        employeeResponsible: obj.employeeResponsible || createObjectId('XTSEmployee', '', ''),
        phone: obj.phone || null,
        rate: obj.rate || 1,
        multiplicity: obj.multiplicity || 1,
        vatTaxation: obj.vatTaxation || createObjectId('XTSVATTaxationType', '', ''),
        structuralUnit: obj.structuralUnit || createObjectId('XTSStructuralUnit', '', ''),
        returnPriceKind: obj.returnPriceKind || null,
        documentBasis: obj.documentBasis || null,
        docOrder: obj.docOrder || null,
        department: obj.department || null,
        inventory: obj.inventory || [],
      };
    });

    return { items: invoices, hasMore: items.length === pageSize };
  } catch (error) {
    return handleApiError(error, 'Failed to fetch supplier invoices');
  }
};

export const getSupplierInvoiceDetail = async (id: string): Promise<SupplierInvoiceDetail> => {
  const request = {
    _type: 'XTSGetObjectsRequest',
    _dbId: '',
    _msgId: '',
    objectIds: [createObjectId('XTSSupplierInvoice', id, '')],
    columnSet: [],
  };

  try {
    const response = await api.post('', request);
    const invoice = response.data?.objects?.[0];
    if (!invoice) throw new Error('Invalid supplier invoice detail response format');

    return {
      id: invoice.objectId?.id || '',
      number: invoice.number || '',
      date: invoice.date || '',
      deletionMark: invoice.deletionMark ?? null,
      posted: Boolean(invoice.posted),
      author: invoice.author || null,
      comment: invoice.comment || null,
      company: invoice.company || createObjectId('XTSCompany', '', ''),
      contract: invoice.contract || createObjectId('XTSCounterpartyContract', '', ''),
      counterparty: invoice.counterparty || createObjectId('XTSCounterparty', '', ''),
      emailAddress: invoice.emailAddress || null,
      operationKind: invoice.operationKind || createObjectId('XTSOperationKindsSupplierInvoice', 'ReceiptFromSupplier', 'Mua hàng từ nhà cung cấp'),
      counterpartyPriceKind: invoice.counterpartyPriceKind || null,
      documentAmount: invoice.documentAmount || 0,
      documentCurrency: invoice.documentCurrency || createObjectId('XTSCurrency', '', ''),
      employeeResponsible: invoice.employeeResponsible || createObjectId('XTSEmployee', '', ''),
      phone: invoice.phone || null,
      rate: invoice.rate ?? null,
      multiplicity: invoice.multiplicity || 1,
      vatTaxation: invoice.vatTaxation || createObjectId('XTSVATTaxationType', '', ''),
      structuralUnit: invoice.structuralUnit || createObjectId('XTSStructuralUnit', '', ''),
      returnPriceKind: invoice.returnPriceKind || null,
      documentBasis: invoice.documentBasis || null,
      docOrder: invoice.docOrder || null,
      department: invoice.department || null,
      inventory: (invoice.inventory || []).map((item: any) => ({
        lineNumber: item._lineNumber || 0,
        product: item.product || createObjectId('XTSProduct', '', ''),
        characteristic: item.characteristic || null,
        uom: item.uom || null,
        quantity: item.quantity || 0,
        price: item.price || 0,
        amount: item.amount || 0,
        discountsMarkupsAmount: item.discountsMarkupsAmount ?? null,
        vatAmount: item.vatAmount ?? null,
        vatRate: item.vatRate || null,
        total: item.total || 0,
        sku: item._sku || '',
        coefficient: item._coefficient || 1,
        priceOriginal: item._price || 0,
        vatRateRate: item._vatRateRate ?? null,
        picture: item._picture || null,
        comment: item.comment || '',
      })),
    };
  } catch (error) {
    return handleApiError(error, 'Failed to fetch supplier invoice details');
  }
};

export const createSupplierInvoice = async (
  data: CreateSupplierInvoiceData
): Promise<{ id: string; number: string }> => {
  const defaultValues = getDefaultValues();

  const request = {
    _type: 'XTSCreateObjectsRequest',
    _dbId: '',
    _msgId: '',
    objects: [{
      _type: 'XTSSupplierInvoice',
      _isFullData: true,
      objectId: createObjectId('XTSSupplierInvoice', '', ''),
      date: data.date,
      number: '',
      posted: data.posted,
      operationKind: createObjectId('XTSOperationKindsSupplierInvoice', data.operationKindId, data.operationKindPresentation),
      counterpartyPriceKind: createObjectId('', data.counterpartyPriceKindId || '', data.counterpartyPriceKindName || ''),
      returnPriceKind: createObjectId('', data.returnPriceKindId || '', data.returnPriceKindName || ''),
      company: createObjectId('XTSCompany', data.companyId || defaultValues.company.id, data.companyName || defaultValues.company.presentation),
      counterparty: createObjectId('XTSCounterparty', data.counterpartyId, data.counterpartyName),
      contract: createObjectId('XTSCounterpartyContract', data.contractId, data.contractName),
      documentCurrency: createObjectId('XTSCurrency', data.currencyId, data.currencyName),
      documentAmount: data.amount,
      vatTaxation: createObjectId('XTSVATTaxationType', data.vatTaxationId, data.vatTaxationName),
      rate: data.rate,
      multiplicity: data.multiplicity,
      comment: data.comment,
      author: createObjectId('', data.authorId || '', data.authorName || ''),
      deliveryAddress: data.deliveryAddress || '',
      deliveryAddressValue: data.deliveryAddressValue || '',
      structuralUnit: createObjectId('XTSStructuralUnit', data.structuralUnitId, data.structuralUnitName),
      department: createObjectId('', data.departmentId || '', data.departmentName || ''),
      employeeResponsible: createObjectId('XTSEmployee', data.employeeId, data.employeeName),
      documentBasis: createObjectId('', data.documentBasisId || '', data.documentBasisName || ''),
      docOrder: createObjectId('', data.docOrderId || '', data.docOrderName || ''),
      inventory: mapSupplierProducts(data.products),
    }],
  };

  try {
    const response = await api.post('', request);
    const createdInvoice = response.data?.objects?.[0];
    if (!createdInvoice?.objectId) throw new Error('Invalid create supplier invoice response format');
    
    return { id: createdInvoice.objectId.id, number: createdInvoice.number };
  } catch (error) {
    return handleApiError(error, 'Failed to create supplier invoice');
  }
};

export const updateSupplierInvoice = async (data: UpdateSupplierInvoiceData): Promise<void> => {
  const defaultValues = getDefaultValues();

  const request = {
    _type: 'XTSUpdateObjectsRequest',
    _dbId: '',
    _msgId: '',
    objects: [{
      _type: 'XTSSupplierInvoice',
      _isFullData: true,
      objectId: createObjectId('XTSSupplierInvoice', data.id, data.title),
      date: data.date,
      number: data.number,
      posted: data.posted,
      operationKind: createObjectId('XTSOperationKindsSupplierInvoice', data.operationKindId, data.operationKindPresentation),
      counterpartyPriceKind: createObjectId('', data.counterpartyPriceKindId || '', data.counterpartyPriceKindName || ''),
      returnPriceKind: createObjectId('', data.returnPriceKindId || '', data.returnPriceKindName || ''),
      company: createObjectId('XTSCompany', data.companyId, data.companyName),
      counterparty: createObjectId('XTSCounterparty', data.counterpartyId, data.counterpartyName),
      contract: createObjectId('XTSCounterpartyContract', data.contractId, data.contractName),
      documentCurrency: createObjectId('XTSCurrency', data.currencyId, data.currencyName),
      documentAmount: data.amount,
      vatTaxation: createObjectId('XTSVATTaxationType', data.vatTaxationId, data.vatTaxationName),
      rate: data.rate,
      multiplicity: data.multiplicity,
      comment: data.comment,
      author: createObjectId('', data.authorId || '', data.authorName || ''),
      deliveryAddress: data.deliveryAddress || '',
      deliveryAddressValue: data.deliveryAddressValue || '',
      structuralUnit: createObjectId('XTSStructuralUnit', data.structuralUnitId, data.structuralUnitName),
      department: createObjectId('', data.departmentId || '', data.departmentName || ''),
      employeeResponsible: createObjectId('XTSEmployee', data.employeeId, data.employeeName),
      documentBasis: createObjectId('', data.documentBasisId || '', data.documentBasisName || ''),
      docOrder: createObjectId('', data.docOrderId || '', data.docOrderName || ''),
      inventory: mapSupplierProducts(data.products),
    }],
  };

  try {
    const response = await api.post('', request);
    if (!response.data?.objects?.[0]) throw new Error('Invalid update supplier invoice response format');
  } catch (error) {
    return handleApiError(error, 'Failed to update supplier invoice');
  }
};