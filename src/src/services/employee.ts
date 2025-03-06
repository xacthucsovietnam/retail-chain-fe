import api from './axiosClient';
import { ListRequest, PaginatedResponse } from './types';

export interface EmployeeDetail {
    id: string;
    name: string;
    company: string;
}

export interface Employee {
    id: string;
    name: string;
    description: string;
    personalInfo: string;
    company: string;
    manager: string;
    isActive: boolean;
}

export interface UpdateEmployeeData {
    id: string;
    name: string;
    individualId: string;
    isActive: boolean;
    managerId: string | null;
    companyId: string | null;
}

export interface CreateEmployeeData {
    name: string;
    isActive: boolean;
    managerId: string | null;
    companyId: string | null;
}

export const getEmployees = async (page: number = 1, pageSize: number = 50, conditions: any[] = []): Promise<PaginatedResponse<Employee>> => {
    const positionFrom = (page - 1) * pageSize + 1;
    const positionTo = page * pageSize;

    const employeeListData = {
        _type: 'XTSGetObjectListRequest',
        _dbId: '',
        _msgId: '',
        dataType: 'XTSEmployee',
        columnSet: [],
        sortBy: [],
        positionFrom,
        positionTo,
        limit: pageSize,
        conditions: conditions
    };

    try {
        const response = await api.post('', employeeListData);

        if (!response.data || !Array.isArray(response.data.items)) {
            throw new Error('Invalid employee list response format');
        }

        const employees = response.data.items.map((item: any) => {
            try {
                if (!item.object) {
                    throw new Error('Missing object property in employee item');
                }

                return {
                    id: item.object.objectId?.id || '',
                    name: item.object.objectId?.presentation || '',
                    description: item.object.description || '',
                    personalInfo: item.object.individual?.presentation || '',
                    company: item.object.parentCompany?.presentation || '',
                    manager: item.object.headEmployee?.presentation || '',
                    isActive: !item.object.invalid
                };
            } catch (err) {
                console.error('Error mapping employee item:', err, item);
                return null;
            }
        }).filter(Boolean);

        return {
            items: employees,
            hasMore: response.data.items.length === pageSize
        };
    } catch (error) {
        console.error('Employee fetch error:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to fetch employees: ${error.message}`);
        }
        throw new Error('Failed to fetch employees');
    }
};

export const getEmployeeDetail = async (id: string): Promise<EmployeeDetail> => {
    const employeeData = {
        _type: 'XTSGetObjectsRequest',
        _dbId: '',
        _msgId: '',
        objectIds: [
            {
                _type: 'XTSObjectId',
                dataType: 'XTSEmployee',
                id: id,
                presentation: '',
                url: ''
            }
        ],
        columnSet: []
    };

    try {
        const response = await api.post('', employeeData);

        if (!response.data?.objects?.[0]) {
            throw new Error('Invalid cash employee detail response format');
        }

        const employee = response.data.objects[0];
        return {
            id: employee.objectId?.id,
            name: employee.description || '',
            company: employee.parentCompany?.presentation || ''
        };
    } catch (error) {
        console.error('Cash employee detail fetch error:', error);
        throw new Error('Failed to fetch cash employee details');
    }
};

export const createEmployee = async (data: CreateEmployeeData): Promise<{ id: string; name: string }> => {
    const createData = {
        _type: 'XTSCreateObjectsRequest',
        _dbId: '',
        _msgId: '',
        objects: [
            {
                _type: 'XTSEmployee',
                canHaveChildren: null,
                isFolder: null,
                object: {
                    _type: 'XTSEmployee',
                    _isFullData: null,
                    objectId: {
                        _type: 'XTSObjectId',
                        id: '',
                        dataType: 'XTSEmployee',
                        presentation: data.name,
                        navigationRef: null
                    },
                    description: data.name,
                    individual: {
                        _type: 'XTSObjectId',
                        id: '',
                        dataType: 'XTSIndividual',
                        presentation: data.name,
                        navigationRef: null
                    },
                    individ: {
                        _type: 'XTSObjectId',
                        id: '',
                        dataType: 'XTSIndividual',
                        presentation: data.name,
                        navigationRef: null
                    },
                    invalid: !data.isActive,
                    parentCompany: data.companyId ? {
                        _type: 'XTSObjectId',
                        id: data.companyId,
                        dataType: 'XTSCompany',
                        presentation: null,
                        navigationRef: null
                    } : null,
                    headEmployee: data.managerId ? {
                        _type: 'XTSObjectId',
                        id: data.managerId,
                        dataType: 'XTSEmployee',
                        presentation: null,
                        navigationRef: null
                    } : null
                }
            }
        ]
    };

    try {
        const response = await api.post('', createData);

        if (!response.data?.objects?.[0]?.object?.objectId) {
            throw new Error('Invalid create employee response format');
        }

        const createdEmployee = response.data.objects[0].object;
        return {
            id: createdEmployee.objectId.id,
            name: createdEmployee.description || createdEmployee.objectId.presentation
        };
    } catch (error) {
        console.error('Employee creation error:', error);
        throw new Error('Failed to create employee');
    }
};

export const updateEmployee = async (data: UpdateEmployeeData): Promise<void> => {
    const updateData = {
        _type: 'XTSUpdateObjectsRequest',
        _dbId: '',
        _msgId: '',
        objects: [
            {
                _type: 'XTSEmployee',
                canHaveChildren: null,
                isFolder: null,
                object: {
                    _type: 'XTSEmployee',
                    _isFullData: null,
                    objectId: {
                        _type: 'XTSObjectId',
                        id: data.id,
                        dataType: 'XTSEmployee',
                        presentation: data.name,
                        navigationRef: null
                    },
                    description: data.name,
                    individual: {
                        _type: 'XTSObjectId',
                        id: data.individualId,
                        dataType: 'XTSIndividual',
                        presentation: data.name,
                        navigationRef: null
                    },
                    individ: {
                        _type: 'XTSObjectId',
                        id: data.individualId,
                        dataType: 'XTSIndividual',
                        presentation: data.name,
                        navigationRef: null
                    },
                    invalid: !data.isActive,
                    parentCompany: data.companyId ? {
                        _type: 'XTSObjectId',
                        id: data.companyId,
                        dataType: 'XTSCompany',
                        presentation: null,
                        navigationRef: null
                    } : null,
                    headEmployee: data.managerId ? {
                        _type: 'XTSObjectId',
                        id: data.managerId,
                        dataType: 'XTSEmployee',
                        presentation: null,
                        navigationRef: null
                    } : null
                }
            }
        ]
    };

    try {
        const response = await api.post('', updateData);
        
        if (!response.data?.objects?.[0]) {
            throw new Error('Invalid update employee response format');
        }
    } catch (error) {
        console.error('Employee update error:', error);
        throw new Error('Failed to update employee');
    }
};