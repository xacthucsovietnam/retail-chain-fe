// src/services/partner.ts
import api from './axiosClient';
import { ListRequest, PaginatedResponse } from './types';

export interface Partner {
    id: string;
    code: string;
    name: string;
    type: string;
    gender: string;
    phone: string;
    email: string;
    address: string;
    notes: string;
    isActive: boolean;
    isCustomer: boolean;
    isVendor: boolean;
}

export interface PartnerDetail {
    id: string;
    code: string;
    name: string;
    description: string;
    type: string;
    dateOfBirth: string | null;
    notes: string | null;
    taxId: string | null;
    isActive: boolean;
    mainInfo: string | null;
    isCustomer: boolean;
    isVendor: boolean;
    gender: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    employeeResponsible: string | null;
    doOperationsByContracts: boolean;
    doOperationsByOrders: boolean;
    doOperationsByDocuments: boolean;
}

export interface CreatePartnerData {
    name: string;
    fullName: string;
    dateOfBirth: string;
    phone: string;
    email: string;
    address: string;
    notes: string;
    gender: string;
    picture: string;
    // Thêm các trường mới
    counterpartyKindId: string;
    counterpartyKindPresentation: string;
    employeeResponsibleId: string;
    employeeResponsiblePresentation: string;
    taxIdentifactionNumber: string;
    invalid: boolean;
    isCustomer: boolean;
    isVendor: boolean;
    otherRelations: boolean;
    margin: number;
    doOperationsByContracts: boolean;
    doOperationsByOrders: boolean;
    doOperationsByDocuments: boolean;
}

export interface UpdatePartnerData {
    id: string;
    code: string;
    name: string;
    fullName: string;
    dateOfBirth: string;
    phone: string;
    email: string;
    address: string;
    notes: string;
    gender: string;
    picture: string;
    isCustomer: boolean;
    isVendor: boolean;
    doOperationsByContracts: boolean;
    doOperationsByOrders: boolean;
    doOperationsByDocuments: boolean;
}

export const getPartners = async (page: number = 1, pageSize: number = 50, conditions: any[] = []): Promise<PaginatedResponse<Partner>> => {
    const positionFrom = (page - 1) * pageSize + 1;
    const positionTo = page * pageSize;

    const customerListData: ListRequest = {
        _type: 'XTSGetObjectListRequest',
        _dbId: '',
        _msgId: '',
        dataType: 'XTSCounterparty',
        columnSet: [],
        sortBy: [],
        positionFrom,
        positionTo,
        limit: pageSize,
        conditions: conditions
    };

    try {
        const response = await api.post('', customerListData);

        if (!response.data) {
            throw new Error('Empty response received from server');
        }

        if (!Array.isArray(response.data.items)) {
            console.error('Invalid response format:', response.data);
            throw new Error('Invalid customer list response format');
        }

        const customers = response.data.items.map((item: any) => {
            try {
                if (!item.object) {
                    throw new Error('Missing object property in customer item');
                }

                return {
                    id: item.object.objectId.id,
                    code: item.object.code || '',
                    name: item.object.objectId?.presentation || '',
                    type: item.object.counterpartyKind?.presentation || '',
                    gender: item.object.gender?.presentation || '',
                    phone: item.object.phone || '',
                    email: item.object.email || '',
                    address: item.object.address || '',
                    notes: item.object.comment || '',
                    isActive: !item.object.invalid,
                    isCustomer: Boolean(item.object.customer),
                    isVendor: Boolean(item.object.vendor)
                };
            } catch (err) {
                console.error('Error mapping customer item:', err, item);
                return null;
            }
        }).filter(Boolean);

        return {
            items: customers,
            hasMore: response.data.items.length === pageSize
        };
    } catch (error) {
        console.error('Customer fetch error:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to fetch customers: ${error.message}`);
        }
        throw new Error('Failed to fetch customers');
    }
};

export const getPartnerDetail = async (id: string): Promise<PartnerDetail> => {
    const partnerData = {
        _type: 'XTSGetObjectsRequest',
        _dbId: '',
        _msgId: '',
        objectIds: [
            {
                _type: 'XTSObjectId',
                dataType: 'XTSCounterparty',
                id: id,
                presentation: '',
                url: ''
            }
        ],
        columnSet: []
    };

    try {
        const response = await api.post('', partnerData);

        if (!response.data?.objects?.[0]) {
            throw new Error('Invalid partner detail response format');
        }

        const partner = response.data.objects[0];
        return {
            id: partner.objectId.id,
            code: partner.code || '',
            name: partner.objectId.presentation || '',
            description: partner.description || '',
            type: partner.counterpartyKind?.presentation || '',
            dateOfBirth: partner.dateOfBirth,
            notes: partner.comment,
            taxId: partner.taxIdentifactionNumber,
            isActive: !partner.invalid,
            mainInfo: partner.mainInfo,
            isCustomer: Boolean(partner.customer),
            isVendor: Boolean(partner.vendor),
            gender: partner.gender?.presentation || null,
            phone: partner.phone,
            email: partner.email,
            address: partner.address,
            employeeResponsible: partner.employeeResponsible?.presentation || null,
            doOperationsByContracts: Boolean(partner.doOperationsByContracts),
            doOperationsByOrders: Boolean(partner.doOperationsByOrders),
            doOperationsByDocuments: Boolean(partner.doOperationsByDocuments)
        };
    } catch (error) {
        console.error('Partner detail fetch error:', error);
        throw new Error('Failed to fetch partner details');
    }
};

export const createPartner = async (data: CreatePartnerData): Promise<{ id: string; code: string }> => {
    const partnerData = {
        _type: 'XTSCreateObjectsRequest',
        _dbId: '',
        _msgId: '',
        objects: [
            {
                _type: 'XTSCounterparty',
                dateOfBirth: data.dateOfBirth,
                _isFullData: false,
                objectId: {
                    _type: 'XTSObjectId',
                    dataType: 'XTSCounterparty',
                    id: '',
                    presentation: data.name,
                    url: ''
                },
                code: '',
                description: data.name,
                descriptionFull: data.fullName,
                counterpartyKind: {
                    _type: 'XTSObjectId',
                    dataType: 'XTSCounterpartyKind',
                    id: data.counterpartyKindId,
                    presentation: data.counterpartyKindPresentation,
                    navigationRef: null
                },
                gender: {
                    _type: 'XTSObjectId',
                    dataType: 'XTSGender',
                    id: data.gender,
                    presentation: '',
                    url: ''
                },
                employeeResponsible: {
                    _type: 'XTSObjectId',
                    dataType: 'XTSEmployee',
                    id: data.employeeResponsibleId,
                    presentation: data.employeeResponsiblePresentation,
                    url: ''
                },
                comment: data.notes,
                taxIdentifactionNumber: data.taxIdentifactionNumber,
                invalid: data.invalid,
                mainInfo: `${data.fullName}\n${data.phone}\n${data.email}\n${data.notes}`,
                customer: data.isCustomer,
                vendor: data.isVendor,
                otherRelations: data.otherRelations,
                phone: data.phone,
                email: data.email,
                address: data.address,
                addressValue: data.address,
                picture: {
                    _type: 'XTSObjectId',
                    dataType: 'XTSCounterpartyAttachedFile',
                    id: '',
                    presentation: '',
                    url: data.picture
                },
                margin: data.margin,
                doOperationsByContracts: data.doOperationsByContracts,
                doOperationsByOrders: data.doOperationsByOrders,
                doOperationsByDocuments: data.doOperationsByDocuments
            }
        ]
    };

    try {
        const response = await api.post('', partnerData);

        if (!response.data?.objects?.[0]?.objectId) {
            throw new Error('Invalid create partner response format');
        }

        return {
            id: response.data.objects[0].objectId.id,
            code: response.data.objects[0].code
        };
    } catch (error) {
        console.error('Partner creation error:', error);
        throw new Error('Failed to create partner');
    }
};

export const updatePartner = async (data: UpdatePartnerData): Promise<void> => {
    const partnerData = {
        _type: 'XTSUpdateObjectsRequest',
        _dbId: '',
        _msgId: '',
        objects: [
            {
                _type: 'XTSCounterparty',
                dateOfBirth: data.dateOfBirth,
                _isFullData: true,
                objectId: {
                    _type: 'XTSObjectId',
                    dataType: 'XTSCounterparty',
                    id: data.id,
                    presentation: data.name,
                    url: ''
                },
                code: data.code,
                description: data.name,
                descriptionFull: data.fullName,
                counterpartyKind: {
                    _type: 'XTSObjectId',
                    dataType: 'XTSCounterpartyKind',
                    id: 'Individual',
                    presentation: 'Cá nhân',
                    url: ''
                },
                gender: {
                    _type: 'XTSObjectId',
                    dataType: 'XTSGender',
                    id: data.gender,
                    presentation: '',
                    url: ''
                },
                employeeResponsible: {
                    _type: 'XTSObjectId',
                    dataType: '',
                    id: '',
                    presentation: '',
                    url: ''
                },
                comment: data.notes,
                taxIdentifactionNumber: '',
                invalid: false,
                mainInfo: `${data.fullName}\n${data.phone}\n${data.email}\n${data.notes}`,
                customer: data.isCustomer,
                vendor: data.isVendor,
                otherRelations: false,
                phone: data.phone,
                email: data.email,
                address: data.address,
                addressValue: data.address,
                picture: {
                    _type: 'XTSObjectId',
                    dataType: 'XTSCounterpartyAttachedFile',
                    id: '',
                    presentation: '',
                    url: data.picture
                },
                margin: 0,
                doOperationsByContracts: data.doOperationsByContracts,
                doOperationsByOrders: data.doOperationsByOrders,
                doOperationsByDocuments: data.doOperationsByDocuments
            }
        ]
    };

    try {
        const response = await api.post('', partnerData);
        
        if (!response.data?.objects?.[0]) {
            throw new Error('Invalid update partner response format');
        }
    } catch (error) {
        console.error('Partner update error:', error);
        throw new Error('Failed to update partner');
    }
};