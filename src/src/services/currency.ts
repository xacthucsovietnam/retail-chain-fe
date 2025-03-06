import api from './axiosClient';
import { ListRequest, PaginatedResponse } from './types';

export interface CurrencyDetail {
    id: string;
    code: string;
    name: string;
    fullName: string;
    symbolicPresentation: string;
    mainCurrency: string;
    markup: string;
}

export interface Currency {
    id: string;
    code: string;
    name: string;
    fullName: string;
    symbolicPresentation: string;
    mainCurrency: string;
    markup: string;
}

export interface CreateCurrencyData {
    name: string;
    fullName: string;
    symbolicPresentation: string;
    mainCurrencyId?: string;
    mainCurrencyName?: string;
    markup?: number;
}

export interface UpdateCurrencyData {
    id: string;
    code: string;
    name: string;
    fullName: string;
    symbolicPresentation: string;
    mainCurrencyId?: string;
    mainCurrencyName?: string;
    markup?: number;
}

export const getCurrencies = async (page: number = 1, pageSize: number = 20, conditions: any[] = []) => {
    const positionFrom = (page - 1) * pageSize + 1;
    const positionTo = page * pageSize;

    const currencyListData: ListRequest = {
        _type: 'XTSGetObjectListRequest',
        _dbId: '',
        _msgId: '',
        dataType: 'XTSCurrency',
        columnSet: [],
        sortBy: [],
        positionFrom,
        positionTo,
        limit: pageSize,
        conditions: []
    };

    try {
        const response = await api.post('', currencyListData);

        if (!response.data || !Array.isArray(response.data.items)) {
            throw new Error('Invalid cash receipt list response format');
        }

        const currencies = response.data.items.map((item: any) => {
            try {
                if (!item.object) {
                    throw new Error('Missing object property in cash receipt item');
                }

                return {
                    id: item.object.objectId?.id || '',
                    code: item.object.code || '',
                    name: item.object.description || '',
                    fullName: item.object.descriptionFull || '',
                    symbolicPresentation: item.object.symbolicPresentation || '',
                    mainCurrency: item.object.mainCurrency || '',
                    markup: item.object.markup || ''
                };
            } catch (err) {
                console.error('Error mapping cash currency item:', err, item);
                return null;
            }
        }).filter(Boolean);

        return {
            items: currencies,
            hasMore: response.data.items.length === pageSize
        };
    } catch (error) {
        console.error('Cash currency fetch error:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to fetch cash currencies: ${error.message}`);
        }
        throw new Error('Failed to fetch cash currencies');
    }
};

/**
 * Fetches detailed information for a specific Currency
 * @param id Currency ID
 * @returns Detailed Currency information
 */
export const getCurrencyDetail = async (id: string): Promise<CurrencyDetail> => {
    const currencyData = {
        _type: 'XTSGetObjectsRequest',
        _dbId: '',
        _msgId: '',
        objectIds: [
            {
                _type: 'XTSObjectId',
                dataType: 'XTSCurrency',
                id: id,
                presentation: '',
                url: ''
            }
        ],
        columnSet: []
    };

    try {
        const response = await api.post('', currencyData);

        if (!response.data?.objects?.[0]) {
            throw new Error('Invalid currency detail response format');
        }

        const currency = response.data.objects[0];
        return {
            id: currency.objectId?.id || '',
            code: currency.code || '',
            name: currency.description || '',
            fullName: currency.descriptionFull || '',
            symbolicPresentation: currency.symbolicPresentation || '',
            mainCurrency: currency.mainCurrency || '',
            markup: currency.markup || ''
        };
    } catch (error) {
        console.error('Cash currency detail fetch error:', error);
        throw new Error('Failed to fetch cash currency details');
    }
};

/**
 * Creates a new currency
 * @param data Currency data
 * @returns Created currency ID
 */
export const createCurrency = async (data: CreateCurrencyData): Promise<{ id: string }> => {
    const createData = {
        _type: 'XTSCreateObjectsRequest',
        _dbId: '',
        _msgId: '',
        objects: [
            {
                _type: 'XTSCurrency',
                _isFullData: false,
                objectId: {
                    _type: 'XTSObjectId',
                    dataType: 'XTSCurrency',
                    id: '',
                    presentation: '',
                    url: ''
                },
                code: '',
                description: data.name,
                descriptionFull: data.fullName,
                symbolicPresentation: data.symbolicPresentation,
                mainCurrency: data.mainCurrencyId ? {
                    _type: 'XTSObjectId',
                    dataType: 'XTSCurrency',
                    id: data.mainCurrencyId,
                    presentation: data.mainCurrencyName || '',
                    url: ''
                } : null,
                markup: data.markup || 1
            }
        ]
    };

    try {
        const response = await api.post('', createData);

        if (!response.data?.objects?.[0]?.objectId) {
            throw new Error('Invalid create currency response format');
        }

        return {
            id: response.data.objects[0].objectId.id
        };
    } catch (error) {
        console.error('Currency creation error:', error);
        throw new Error('Failed to create currency');
    }
};

/**
 * Updates an existing currency
 * @param data Currency data to update
 * @returns void
 */
export const updateCurrency = async (data: UpdateCurrencyData): Promise<void> => {
    const updateData = {
        _type: 'XTSUpdateObjectsRequest',
        _dbId: '',
        _msgId: '',
        objects: [
            {
                _type: 'XTSCurrency',
                _isFullData: true,
                objectId: {
                    _type: 'XTSObjectId',
                    dataType: 'XTSCurrency',
                    id: data.id,
                    presentation: data.name,
                    url: ''
                },
                code: data.code,
                description: data.name,
                descriptionFull: data.fullName,
                symbolicPresentation: data.symbolicPresentation,
                mainCurrency: data.mainCurrencyId ? {
                    _type: 'XTSObjectId',
                    dataType: 'XTSCurrency',
                    id: data.mainCurrencyId,
                    presentation: data.mainCurrencyName || '',
                    url: ''
                } : null,
                markup: data.markup || 0
            }
        ]
    };

    try {
        const response = await api.post('', updateData);
        
        if (!response.data?.objects?.[0]) {
            throw new Error('Invalid update currency response format');
        }
    } catch (error) {
        console.error('Currency update error:', error);
        throw new Error('Failed to update currency');
    }
};