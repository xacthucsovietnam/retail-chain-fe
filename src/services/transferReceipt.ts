import api from './axiosClient';
import { ListRequest, PaginatedResponse } from './types';
import { getSession } from '../utils/storage';

// Interfaces giữ nguyên
export interface TransferReceiptDetail {
  id: string;
  number: string;
  date: string;
  transactionType: string;
  customer: string;
  order: string;
  amount: number;
  currency: string;
  collector: string;
  notes: string;
  bankAccount: string;
}

export interface PaymentReceipt {
  id: string;
  number: string;
  date: string;
  author: string;
  comment: string;
  company: string;
  counterparty: string;
  operationType: string;
  bankAccount: string;
  amount: number;
  currency: string;
  purpose: string;
  sourceDocument: string;
}

export interface CreateTransferReceiptData {
  date: string;
  operationKindId: string;
  operationKindName: string;
  customerId: string;
  customerName: string;
  amount: number;
  comment: string;
  employeeId?: string;
  employeeName?: string;
  bankAccountId?: string;
  bankAccountName?: string;
  cashFlowItemId?: string;
  cashFlowItemName?: string;
  documentBasisId?: string;
  documentBasisName?: string;
}

export interface UpdateTransferReceiptData {
  id: string;
  number: string;
  title: string;
  date: string;
  operationKindId: string;
  operationKindName: string;
  customerId: string;
  customerName: string;
  amount: number;
  comment: string;
  employeeId?: string;
  employeeName?: string;
  bankAccountId: string;
  bankAccountName: string;
  cashFlowItemId: string;
  cashFlowItemName: string;
}

// Hàm tiện ích để xử lý API
const handleApiRequest = async <T>(data: any): Promise<T> => {
  try {
    const response = await api.post('', data);
    if (!response.data) {
      throw new Error('Invalid response format');
    }
    return response.data;
  } catch (error) {
    console.error('API request error:', error);
    throw new Error(`API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Hàm lấy thông tin từ session
interface SessionData {
  user?: {
    _type: string;
    id: string;
    dataType: string;
    presentation: string;
    navigationRef: null;
  };
  defaultValues?: {
    company?: {
      _type: string;
      id: string;
      dataType: string;
      presentation: string;
      navigationRef: null;
    };
    documentCurrency?: {
      _type: string;
      id: string;
      dataType: string;
      presentation: string;
      navigationRef: null;
    };
    employeeResponsible?: {
      _type: string;
      id: string;
      dataType: string;
      presentation: string;
      navigationRef: null;
    };
  };
}

const getSessionData = (): SessionData => {
  const session = getSession();
  if (!session) {
    throw new Error('No session found in localStorage');
  }
  return session;
};

// Hàm ánh xạ dữ liệu
const mapToPaymentReceipt = (item: any): PaymentReceipt | null => {
  if (!item?.object) return null;
  return {
    id: item.object.objectId?.id ?? '',
    number: item.object.number ?? '',
    date: item.object.date ?? '',
    author: item.object.author?.presentation ?? '',
    comment: item.object.comment ?? '',
    company: item.object.company?.presentation ?? '',
    counterparty: item.object.counterparty?.presentation ?? '',
    operationType: item.object.operationKind?.presentation ?? '',
    bankAccount: item.object.bankAccount?.presentation ?? '',
    amount: item.object.documentAmount ?? 0,
    currency: item.object.currency?.presentation ?? '',
    purpose: item.object.cashFlowItem?.presentation ?? '',
    sourceDocument: item.object.documentBasis?.presentation ?? ''
  };
};

const mapToTransferReceiptDetail = (receipt: any): TransferReceiptDetail => ({
  id: receipt.objectId?.id ?? '',
  number: receipt.number ?? '',
  date: receipt.date ?? '',
  transactionType: receipt.operationKind?.presentation ?? '',
  customer: receipt.counterparty?.presentation ?? '',
  order: receipt.documentBasis?.presentation ?? '',
  amount: receipt.documentAmount ?? 0,
  currency: receipt.currency?.presentation ?? '',
  collector: receipt.author?.presentation ?? '',
  notes: receipt.comment ?? '',
  bankAccount: receipt.bankAccount?.presentation ?? ''
});

/**
 * Fetches a list of transfer receipts with pagination and optional conditions
 * @param page Page number (default: 1)
 * @param pageSize Number of items per page (default: 20)
 * @param conditions Array of XTSCondition objects to filter receipts
 * @returns Paginated response with transfer receipts and hasMore flag
 */
export const getTransferReceipts = async (
  page: number = 1,
  pageSize: number = 20,
  conditions: any[] = []
): Promise<PaginatedResponse<PaymentReceipt>> => {
  const positionFrom = (page - 1) * pageSize + 1;
  const positionTo = page * pageSize;

  const session = getSessionData();
  const company = session.defaultValues?.company;
  if (!company) {
    throw new Error('Company information not found in session');
  }

  const receiptListData: ListRequest = {
    _type: 'XTSGetObjectListRequest',
    _dbId: '',
    _msgId: '',
    dataType: 'XTSPaymentReceipt',
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
          id: company.id,
          dataType: 'XTSCompany',
          presentation: company.presentation,
          navigationRef: null
        },
        comparisonOperator: '='
      },
      ...conditions
    ]
  };

  const response = await handleApiRequest<any>(receiptListData);

  if (!Array.isArray(response.items)) {
    throw new Error('Invalid transfer receipt list response format');
  }

  const receipts = response.items
    .map(mapToPaymentReceipt)
    .filter((item): item is PaymentReceipt => item !== null);

  return {
    items: receipts,
    hasMore: response.items.length === pageSize
  };
};

/**
 * Fetches detailed information for a specific transfer receipt
 * @param id Transfer receipt ID
 * @returns Detailed transfer receipt information
 */
export const getTransferReceiptDetail = async (id: string): Promise<TransferReceiptDetail> => {
  const receiptData = {
    _type: 'XTSGetObjectsRequest',
    _dbId: '',
    _msgId: '',
    objectIds: [
      {
        _type: 'XTSObjectId',
        dataType: 'XTSPaymentReceipt',
        id,
        presentation: '',
        url: ''
      }
    ],
    columnSet: []
  };

  const response = await handleApiRequest<any>(receiptData);

  if (!response.objects?.[0]) {
    throw new Error('Invalid transfer receipt detail response format');
  }

  return mapToTransferReceiptDetail(response.objects[0]);
};

/**
 * Creates a new transfer receipt
 * @param data Transfer receipt data
 * @returns Created transfer receipt ID and number
 */
export const createTransferReceipt = async (
  data: CreateTransferReceiptData
): Promise<{ id: string; number: string }> => {
  const session = getSessionData();
  const company = session.defaultValues?.company;
  const author = session.user;
  const currency = session.defaultValues?.documentCurrency;
  const employeeResponsible = session.defaultValues?.employeeResponsible;

  if (!company || !author || !currency) {
    throw new Error('Required session data (company, author, or currency) not found');
  }

  const createData = {
    _type: 'XTSCreateObjectRequest',
    _dbId: '',
    _msgId: '',
    object: {
      _type: 'XTSPaymentReceipt',
      _isFullData: false,
      objectId: {
        _type: 'XTSObjectId',
        dataType: 'XTSPaymentReceipt',
        id: '',
        presentation: '',
        url: ''
      },
      date: data.date || new Date().toISOString(),
      number: '',
      operationKind: {
        _type: 'XTSObjectId',
        dataType: 'XTSOperationKindsPaymentReceipt',
        id: data.operationKindId,
        presentation: data.operationKindName,
        url: ''
      },
      company: {
        _type: 'XTSObjectId',
        id: company.id,
        dataType: 'XTSCompany',
        presentation: company.presentation,
        navigationRef: null
      },
      counterparty: {
        _type: 'XTSObjectId',
        dataType: 'XTSCounterparty',
        id: data.customerId,
        presentation: data.customerName,
        url: ''
      },
      cashCurrency: {
        _type: 'XTSObjectId',
        dataType: 'XTSCurrency',
        id: currency.id,
        presentation: currency.presentation,
        url: ''
      },
      documentAmount: data.amount,
      accountingAmount: 0,
      rate: 1,
      multiplicity: 1,
      comment: data.comment || '',
      author: {
        _type: 'XTSObjectId',
        id: author.id,
        dataType: 'XTSUser',
        presentation: author.presentation,
        navigationRef: null
      },
      bankAccount: data.bankAccountId
        ? {
            _type: 'XTSObjectId',
            dataType: 'XTSBankAccounts',
            id: data.bankAccountId,
            presentation: data.bankAccountName || '',
            url: ''
          }
        : {
            _type: 'XTSObjectId',
            dataType: 'XTSBankAccounts',
            id: '',
            presentation: '',
            url: ''
          },
      cashFlowItem: data.cashFlowItemId
        ? {
            _type: 'XTSObjectId',
            dataType: 'XTSCashFlowItem',
            id: data.cashFlowItemId,
            presentation: data.cashFlowItemName || '',
            url: ''
          }
        : {
            _type: 'XTSObjectId',
            dataType: 'XTSCashFlowItem',
            id: '',
            presentation: '',
            url: ''
          },
      documentBasis: data.documentBasisId
        ? {
            _type: 'XTSObjectId',
            dataType: 'XTSSupplierInvoice',
            id: data.documentBasisId,
            presentation: data.documentBasisName || '',
            url: ''
          }
        : {
            _type: 'XTSObjectId',
            dataType: '',
            id: '',
            presentation: '',
            url: ''
          },
      paymentDetails: [],
      employeeResponsible: data.employeeId
        ? {
            _type: 'XTSObjectId',
            id: data.employeeId,
            dataType: 'XTSEmployee',
            presentation: data.employeeName || '',
            navigationRef: null
          }
        : employeeResponsible
        ? {
            _type: 'XTSObjectId',
            id: employeeResponsible.id,
            dataType: 'XTSEmployee',
            presentation: employeeResponsible.presentation || '',
            navigationRef: null
          }
        : {
            _type: 'XTSObjectId',
            id: '',
            dataType: 'XTSEmployee',
            presentation: '',
            navigationRef: null
          }
    },
    fillingValues: data.documentBasisId
      ? {
          documentBasis: {
            _type: 'XTSObjectId',
            dataType: 'XTSSupplierInvoice',
            id: data.documentBasisId,
            presentation: data.documentBasisName || '',
            url: ''
          },
          amount: data.amount
        }
      : {}
  };

  const response = await handleApiRequest<any>(createData);

  if (!response.object?.objectId) {
    throw new Error('Invalid create transfer receipt response format');
  }

  return {
    id: response.object.objectId.id,
    number: response.object.number
  };
};

/**
 * Updates an existing transfer receipt
 * @param data Transfer receipt data to update
 * @returns void
 */
export const updateTransferReceipt = async (data: UpdateTransferReceiptData): Promise<void> => {
  const session = getSessionData();
  const company = session.defaultValues?.company;
  const author = session.user;
  const currency = session.defaultValues?.documentCurrency;
  const employeeResponsible = session.defaultValues?.employeeResponsible;

  if (!company || !author || !currency) {
    throw new Error('Required session data (company, author, or currency) not found');
  }

  const updateData = {
    _type: 'XTSUpdateObjectsRequest',
    _dbId: '',
    _msgId: '',
    objects: [
      {
        _type: 'XTSPaymentReceipt',
        _isFullData: true,
        objectId: {
          _type: 'XTSObjectId',
          dataType: 'XTSPaymentReceipt',
          id: data.id,
          presentation: data.title,
          url: ''
        },
        date: data.date,
        number: data.number,
        operationKind: {
          _type: 'XTSObjectId',
          dataType: 'XTSOperationKindsPaymentReceipt',
          id: data.operationKindId,
          presentation: data.operationKindName,
          url: ''
        },
        company: {
          _type: 'XTSObjectId',
          dataType: 'XTSCompany',
          id: company.id,
          presentation: company.presentation,
          url: ''
        },
        counterparty: {
          _type: 'XTSObjectId',
          dataType: 'XTSCounterparty',
          id: data.customerId,
          presentation: data.customerName,
          url: ''
        },
        cashCurrency: {
          _type: 'XTSObjectId',
          dataType: 'XTSCurrency',
          id: currency.id,
          presentation: currency.presentation,
          url: ''
        },
        documentAmount: data.amount,
        accountingAmount: 0,
        rate: 1,
        multiplicity: 1,
        comment: data.comment,
        author: {
          _type: 'XTSObjectId',
          dataType: 'XTSUser',
          id: author.id,
          presentation: author.presentation,
          url: ''
        },
        bankAccount: {
          _type: 'XTSObjectId',
          dataType: 'XTSBankAccounts',
          id: data.bankAccountId,
          presentation: data.bankAccountName,
          url: ''
        },
        cashFlowItem: {
          _type: 'XTSObjectId',
          dataType: 'XTSCashFlowItem',
          id: data.cashFlowItemId,
          presentation: data.cashFlowItemName,
          url: ''
        },
        documentBasis: {
          _type: 'XTSObjectId',
          dataType: '',
          id: '',
          presentation: '',
          url: ''
        },
        paymentDetails: [],
        employeeResponsible: data.employeeId
          ? {
              _type: 'XTSObjectId',
              id: data.employeeId,
              dataType: 'XTSEmployee',
              presentation: data.employeeName || '',
              url: ''
            }
          : employeeResponsible
          ? {
              _type: 'XTSObjectId',
              id: employeeResponsible.id,
              dataType: 'XTSEmployee',
              presentation: employeeResponsible.presentation || '',
              url: ''
            }
          : {
              _type: 'XTSObjectId',
              id: '',
              dataType: 'XTSEmployee',
              presentation: '',
              url: ''
            }
      }
    ]
  };

  const response = await handleApiRequest<any>(updateData);

  if (!response.objects?.[0]) {
    throw new Error('Invalid update transfer receipt response format');
  }
};