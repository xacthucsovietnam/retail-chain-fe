import api from './axiosClient';
import { ListRequest, PaginatedResponse } from './types';


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

export const getCashReceipts = async (page: number = 1, pageSize: number = 20, conditions: any[] = []) => {
    const positionFrom = (page - 1) * pageSize + 1;
    const positionTo = page * pageSize;

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
        const response = await api.post('', receiptListData);

        if (!response.data || !Array.isArray(response.data.items)) {
            throw new Error('Invalid cash receipt list response format');
        }

        const receipts = response.data.items.map((item: any) => {
            try {
                if (!item.object) {
                    throw new Error('Missing object property in cash receipt item');
                }

                return {
                    id: item.object.objectId.id,
                    number: item.object.number || '',
                    date: item.object.date || '',
                    counterparty: item.object.counterparty?.presentation || '',
                    operationType: item.object.operationKind?.presentation || '',
                    cashAccount: item.object.cashAccount?.presentation || '',
                    amount: item.object.documentAmount || 0,
                    currency: item.object.cashCurrency?.presentation || '',
                    purpose: item.object.cashFlowItem?.presentation || '',
                    sourceDocument: item.object.documentBasis?.presentation || '',
                    notes: item.object.comment || ''
                };
            } catch (err) {
                console.error('Error mapping cash receipt item:', err, item);
                return null;
            }
        }).filter(Boolean);

        return {
            items: receipts,
            hasMore: response.data.items.length === pageSize
        };
    } catch (error) {
        console.error('Cash receipt fetch error:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to fetch cash receipts: ${error.message}`);
        }
        throw new Error('Failed to fetch cash receipts');
    }
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
            throw new Error('Invalid cash receipt detail response format');
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
            currency: receipt.cashCurrency?.presentation || '',
            collector: receipt.author?.presentation || '',
            notes: receipt.comment || ''
        };
    } catch (error) {
        console.error('Cash receipt detail fetch error:', error);
        throw new Error('Failed to fetch cash receipt details');
    }
};

/**
 * Creates a new cash receipt
 * @param data Cash receipt data
 * @returns Created cash receipt ID and number
 */
export const createCashReceipt = async (data: CreateCashReceiptData): Promise<{ id: string; number: string }> => {
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
            structuralUnit: {
                _type: 'XTSObjectId',
                dataType: 'XTSStructuralUnit',
                id: '',
                presentation: '',
                url: ''
            },
            department: {
                _type: 'XTSObjectId',
                dataType: 'XTSStructuralUnit',
                id: '',
                presentation: '',
                url: ''
            },
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
                navigationRef: null
            },
            cashAccount: data.cashAccountId ? {
                _type: 'XTSObjectId',
                dataType: 'XTSPettyCash',
                id: data.cashAccountId,
                presentation: data.cashAccountName || '',
                url: ''
            } : {
                _type: 'XTSObjectId',
                dataType: 'XTSPettyCash',
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
            paymentDetails: []
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
            throw new Error('Invalid create cash receipt response format');
        }

        return {
            id: response.data.object.objectId.id,
            number: response.data.object.number
        };
    } catch (error) {
        console.error('Cash receipt creation error:', error);
        throw new Error('Failed to create cash receipt');
    }
};

/**
 * Updates an existing cash receipt
 * @param data Cash receipt data to update
 * @returns void
 */
export const updateCashReceipt = async (data: UpdateCashReceiptData): Promise<void> => {
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
                structuralUnit: {
                    _type: 'XTSObjectId',
                    dataType: '',
                    id: '',
                    presentation: '',
                    url: ''
                },
                department: {
                    _type: 'XTSObjectId',
                    dataType: '',
                    id: '',
                    presentation: '',
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

    try {
        const response = await api.post('', updateData);
        
        if (!response.data?.objects?.[0]) {
            throw new Error('Invalid update cash receipt response format');
        }
    } catch (error) {
        console.error('Cash receipt update error:', error);
        throw new Error('Failed to update cash receipt');
    }
};