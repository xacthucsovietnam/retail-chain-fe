import api from './axiosClient';
import { ListRequest, PaginatedResponse } from './types';

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

export const getTransferReceipts = async (page: number = 1, pageSize: number = 20, conditions: any[] = []) => {
    const positionFrom = (page - 1) * pageSize + 1;
    const positionTo = page * pageSize;

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
        conditions: conditions
    };

    try {
        const response = await api.post('', receiptListData);

        if (!response.data || !Array.isArray(response.data.items)) {
            throw new Error('Invalid transfer receipt list response format');
        }

        const receipts = response.data.items.map((item: any) => {
            try {
                if (!item.object) {
                    throw new Error('Missing object property in transfer receipt item');
                }

                return {
                    id: item.object.objectId?.id || '',
                    number: item.object.number || '',
                    date: item.object.date || '',
                    author: item.object.author?.presentation || '',
                    comment: item.object.comment || '',
                    company: item.object.company?.presentation || '',
                    counterparty: item.object.counterparty?.presentation || '',
                    operationType: item.object.operationKind?.presentation || '',
                    bankAccount: item.object.bankAccount?.presentation || '',
                    amount: item.object.documentAmount || 0,
                    currency: item.object.currency?.presentation || '',
                    purpose: item.object.cashFlowItem?.presentation || '',
                    sourceDocument: item.object.documentBasis?.presentation || ''
                };
            } catch (err) {
                console.error('Error mapping transfer receipt item:', err, item);
                return null;
            }
        }).filter(Boolean);

        return {
            items: receipts,
            hasMore: response.data.items.length === pageSize
        };
    } catch (error) {
        console.error('Transfer receipt fetch error:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to fetch transfer receipts: ${error.message}`);
        }
        throw new Error('Failed to fetch transfer receipts');
    }
};

export const getTransferReceiptDetail = async (id: string): Promise<TransferReceiptDetail> => {
    const receiptData = {
        _type: 'XTSGetObjectsRequest',
        _dbId: '',
        _msgId: '',
        objectIds: [
            {
                _type: 'XTSObjectId',
                dataType: 'XTSPaymentReceipt',
                id: id,
                presentation: '',
                url: ''
            }
        ],
        columnSet: []
    };

    try {
        const response = await api.post('', receiptData);

        if (!response.data?.objects?.[0]) {
            throw new Error('Invalid transfer receipt detail response format');
        }

        const receipt = response.data.objects[0];
        return {
            id: receipt.objectId?.id,
            number: receipt.number || '',
            date: receipt.date || '',
            transactionType: receipt.operationKind?.presentation || '',
            customer: receipt.counterparty?.presentation || '',
            order: receipt.documentBasis?.presentation || '',
            amount: receipt.documentAmount || 0,
            currency: receipt.currency?.presentation || '',
            collector: receipt.author?.presentation || '',
            notes: receipt.comment || '',
            bankAccount: receipt.bankAccount?.presentation || ''
        };
    } catch (error) {
        console.error('Transfer receipt detail fetch error:', error);
        throw new Error('Failed to fetch transfer receipt details');
    }
};

/**
 * Creates a new transfer receipt
 * @param data Transfer receipt data
 * @returns Created transfer receipt ID and number
 */
export const createTransferReceipt = async (data: CreateTransferReceiptData): Promise<{ id: string; number: string }> => {
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
            cashCurrency: {
                _type: 'XTSObjectId',
                dataType: 'XTSCurrency',
                id: '',
                presentation: '',
                url: ''
            },
            documentAmount: data.amount,
            accountingAmount: 0,
            rate: 1,
            multiplicity: 1,
            comment: data.comment || '',
            author: {
                _type: 'XTSObjectId',
                id: '0a1ae9b6-5b28-11ef-a699-00155d058802',
                dataType: 'XTSUser',
                presentation: 'Test',
                navigationRef: null
            },
            bankAccount: data.bankAccountId ? {
                _type: 'XTSObjectId',
                dataType: 'XTSBankAccounts',
                id: data.bankAccountId,
                presentation: data.bankAccountName || '',
                url: ''
            } : {
                _type: 'XTSObjectId',
                dataType: 'XTSBankAccounts',
                id: '',
                presentation: '',
                url: ''
            },
            cashFlowItem: data.cashFlowItemId ? {
                _type: 'XTSObjectId',
                dataType: 'XTSCashFlowItem',
                id: data.cashFlowItemId,
                presentation: data.cashFlowItemName || '',
                url: ''
            } : {
                _type: 'XTSObjectId',
                dataType: 'XTSCashFlowItem',
                id: '',
                presentation: '',
                url: ''
            },
            documentBasis: data.documentBasisId ? {
                _type: 'XTSObjectId',
                dataType: 'XTSSupplierInvoice',
                id: data.documentBasisId,
                presentation: data.documentBasisName || '',
                url: ''
            } : {
                _type: 'XTSObjectId',
                dataType: '',
                id: '',
                presentation: '',
                url: ''
            },
            paymentDetails: [],
            employeeResponsible: data.employeeId ? {
                _type: 'XTSObjectId',
                id: data.employeeId,
                dataType: 'XTSEmployee',
                presentation: data.employeeName || '',
                navigationRef: null
            } : {
                _type: 'XTSObjectId',
                id: '',
                dataType: 'XTSEmployee',
                presentation: '',
                url: ''
            }
        },
        fillingValues: data.documentBasisId ? {
            documentBasis: {
                _type: 'XTSObjectId',
                dataType: 'XTSSupplierInvoice',
                id: data.documentBasisId,
                presentation: data.documentBasisName || '',
                url: ''
            },
            amount: data.amount
        } : {}
    };

    try {
        const response = await api.post('', createData);

        if (!response.data?.object?.objectId) {
            throw new Error('Invalid create transfer receipt response format');
        }

        return {
            id: response.data.object.objectId.id,
            number: response.data.object.number
        };
    } catch (error) {
        console.error('Transfer receipt creation error:', error);
        throw new Error('Failed to create transfer receipt');
    }
};

/**
 * Updates an existing transfer receipt
 * @param data Transfer receipt data to update
 * @returns void
 */
export const updateTransferReceipt = async (data: UpdateTransferReceiptData): Promise<void> => {
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
                cashCurrency: {
                    _type: 'XTSObjectId',
                    dataType: '',
                    id: '',
                    presentation: '',
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
                    id: '0a1ae9b6-5b28-11ef-a699-00155d058802',
                    presentation: 'Test',
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
                paymentDetails: []
            }
        ]
    };

    try {
        const response = await api.post('', updateData);
        
        if (!response.data?.objects?.[0]) {
            throw new Error('Invalid update transfer receipt response format');
        }
    } catch (error) {
        console.error('Transfer receipt update error:', error);
        throw new Error('Failed to update transfer receipt');
    }
};