// Common types used across services
export interface ListRequest {
    _type: string;
    _dbId: string;
    _msgId: string;
    dataType: string;
    columnSet: string[];
    sortBy: string[];
    positionFrom: number;
    positionTo: number;
    limit: number;
    conditions: any[];
}

export interface PaginatedResponse<T> {
    items: T[];
    hasMore: boolean;
}

export interface User {
    id: string;
    userName: string;
    fullName: string;
    [key: string]: any;
}

export interface BaseResponse {
    _type: string;
    _dbId: string | null;
    _messageId: string | null;
}

export interface ObjectId {
    _type: string;
    id: string;
    dataType: string;
    presentation: string;
    navigationRef: null;
}

export interface BaseObject {
    _type: string;
    _isFullData: boolean;
    objectId: ObjectId;
}