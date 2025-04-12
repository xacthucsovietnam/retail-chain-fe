import api from './axiosClient';
import { ListRequest, PaginatedResponse } from './types';
import { getSession } from '../utils/storage';

// Interfaces giữ nguyên
export interface CashReceiptDetail {
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
}

export interface CashReceipt {
  id: string;
  number: string;
  date: string;
  counterparty: string;
  operationType: string;
  cashAccount: string;
  amount: number;
  currency: string;
  purpose: string;
  sourceDocument: string;
  notes: string;
}

export interface CreateCashReceiptData {
  date: string;
  operationKindId: string;
  operationKindName: string;
  customerId: string;
  customerName: string;
  amount: number;
  comment: string;
  employeeId?: string;
  employeeName?: string;
  cashAccountId?: string;
  cashAccountName?: string;
  cashFlowItemId?: string;
  cashFlowItemName?: string;
  documentBasisId?: string;
  documentBasisName?: string;
}

export interface UpdateCashReceiptData {
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
  cashAccountId: string;
  cashAccountName: string;
  cashFlowItemId: string;
  cashFlowItemName: string;
  contractId?: string;
  contractName?: string;
}

export interface CashReceiptPaymentDetail {
  contractId: string;
  contractName: string;
  paymentAmount: number;
  advanceFlag: boolean;
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
const mapToCashReceipt = (item: any): CashReceipt | null => {
  if (!item?.object) return null;
  return {
    id: item.object.objectId?.id ?? '',
    number: item.object.number ?? '',
    date: item.object.date ?? '',
    counterparty: item.object.counterparty?.presentation ?? '',
    operationType: item.object.operationKind?.presentation ?? '',
    cashAccount: item.object.cashAccount?.presentation ?? '',
    amount: item.object.documentAmount ?? 0,
    currency: item.object.cashCurrency?.presentation ?? '',
    purpose: item.object.cashFlowItem?.presentation ?? '',
    sourceDocument: item.object.documentBasis?.presentation ?? '',
    notes: item.object.comment ?? ''
  };
};

const mapToCashReceiptDetail = (receipt: any): CashReceiptDetail => ({
  id: receipt.objectId?.id ?? '',
  number: receipt.number ?? '',
  date: receipt.date ?? '',
  transactionType: receipt.operationKind?.presentation ?? '',
  customer: receipt.counterparty?.presentation ?? '',
  order: receipt.documentBasis?.presentation ?? '',
  amount: receipt.documentAmount ?? 0,
  currency: receipt.cashCurrency?.presentation ?? '',
  collector: receipt.author?.presentation ?? '',
  notes: receipt.comment ?? ''
});

/**
 * Fetches a list of cash receipts with pagination and optional conditions
 * @param page Page number (default: 1)
 * @param pageSize Number of items per page (default: 20)
 * @param conditions Array of XTSCondition objects to filter receipts
 * @returns Paginated response with cash receipts and hasMore flag
 */
export const getCashReceipts = async (
  page: number = 1,
  pageSize: number = 20,
  conditions: any[] = []
): Promise<PaginatedResponse<CashReceipt>> => {
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
    dataType: 'XTSCashReceipt',
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
    throw new Error('Invalid cash receipt list response format');
  }

  const receipts = response.items
    .map(mapToCashReceipt)
    .filter((item): item is CashReceipt => item !== null);

  return {
    items: receipts,
    hasMore: response.items.length === pageSize
  };
};

/**
 * Fetches detailed information for a specific cash receipt
 * @param id Cash receipt ID
 * @returns Detailed cash receipt information
 */
export const getCashReceiptDetail = async (id: string): Promise<CashReceiptDetail> => {
  const receiptData = {
    _type: 'XTSGetObjectsRequest',
    _dbId: '',
    _msgId: '',
    objectIds: [
      {
        _type: 'XTSObjectId',
        dataType: 'XTSCashReceipt',
        id,
        presentation: '',
        url: ''
      }
    ],
    columnSet: []
  };

  const response = await handleApiRequest<any>(receiptData);

  if (!response.objects?.[0]) {
    throw new Error('Invalid cash receipt detail response format');
  }

  return mapToCashReceiptDetail(response.objects[0]);
};

/**
 * Creates a new cash receipt
 * @param data Cash receipt data
 * @returns Created cash receipt ID and number
 */
export const createCashReceipt = async (
  data: CreateCashReceiptData
): Promise<{ id: string; number: string }> => {
  const session = getSessionData();
  const company = session.defaultValues?.company;
  const author = session.user;
  const currency = session.defaultValues?.documentCurrency;

  if (!company || !author || !currency) {
    throw new Error('Required session data (company, author, or currency) not found');
  }

  const createData = {
    _type: 'XTSCreateObjectRequest',
    _dbId: '',
    _msgId: '',
    object: {
      _type: 'XTSCashReceipt',
      _isFullData: false,
      objectId: {
        _type: 'XTSObjectId',
        dataType: 'XTSCashReceipt',
        id: '',
        presentation: '',
        url: ''
      },
      date: data.date || new Date().toISOString(),
      number: '',
      operationKind: {
        _type: 'XTSObjectId',
        dataType: 'XTSOperationKindsCashReceipt',
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
      employeeResponsible: data.employeeId
        ? {
            _type: 'XTSObjectId',
            id: data.employeeId,
            dataType: 'XTSEmployee',
            presentation: data.employeeName || '',
            navigationRef: null
          }
        : {
            _type: 'XTSObjectId',
            id: '',
            dataType: 'XTSEmployee',
            presentation: '',
            navigationRef: null
          },
      cashAccount: data.cashAccountId
        ? {
            _type: 'XTSObjectId',
            dataType: 'XTSPettyCash',
            id: data.cashAccountId,
            presentation: data.cashAccountName || '',
            url: ''
          }
        : {
            _type: 'XTSObjectId',
            dataType: 'XTSPettyCash',
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
      paymentDetails: []
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
    throw new Error('Invalid create cash receipt response format');
  }

  return {
    id: response.object.objectId.id,
    number: response.object.number
  };
};

/**
 * Updates an existing cash receipt
 * @param data Cash receipt data to update
 * @returns void
 */
export const updateCashReceipt = async (data: UpdateCashReceiptData): Promise<void> => {
  const session = getSessionData();
  const company = session.defaultValues?.company;
  const author = session.user;
  const currency = session.defaultValues?.documentCurrency;

  if (!company || !author || !currency) {
    throw new Error('Required session data (company, author, or currency) not found');
  }

  const paymentDetails: CashReceiptPaymentDetail[] = [
    {
      contractId: data.contractId || '',
      contractName: data.contractName || '',
      paymentAmount: data.amount,
      advanceFlag: true
    }
  ];

  const updateData = {
    _type: 'XTSUpdateObjectsRequest',
    _dbId: '',
    _msgId: '',
    objects: [
      {
        _type: 'XTSCashReceipt',
        _isFullData: true,
        objectId: {
          _type: 'XTSObjectId',
          dataType: 'XTSCashReceipt',
          id: data.id,
          presentation: data.title,
          url: ''
        },
        date: data.date,
        number: data.number,
        operationKind: {
          _type: 'XTSObjectId',
          dataType: 'XTSOperationKindsCashReceipt',
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
        employeeResponsible: {
          _type: 'XTSObjectId',
          dataType: 'XTSEmployee',
          id: data.employeeId || '',
          presentation: data.employeeName || '',
          url: ''
        },
        cashAccount: {
          _type: 'XTSObjectId',
          dataType: 'XTSPettyCash',
          id: data.cashAccountId,
          presentation: data.cashAccountName,
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
        paymentDetails: paymentDetails.map((detail, index) => ({
          _type: 'XTSCashReceiptPaymentDetails',
          _lineNumber: index + 1,
          contract: {
            _type: 'XTSObjectId',
            dataType: 'XTSCounterpartyContract',
            id: detail.contractId,
            presentation: detail.contractName,
            url: ''
          },
          document: {
            _type: 'XTSObjectId',
            dataType: '',
            id: '',
            presentation: '',
            url: ''
          },
          paymentAmount: detail.paymentAmount,
          settlementsAmount: 0,
          rate: 1,
          multiplicity: 1,
          advanceFlag: detail.advanceFlag,
          docOrder: {
            _type: 'XTSObjectId',
            dataType: '',
            id: '',
            presentation: '',
            url: ''
          }
        }))
      }
    ]
  };

  const response = await handleApiRequest<any>(updateData);

  if (!response.objects?.[0]) {
    throw new Error('Invalid update cash receipt response format');
  }
};