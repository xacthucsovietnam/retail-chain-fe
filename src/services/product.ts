import api from './axiosClient';
import { ListRequest, PaginatedResponse } from './types';

export interface Product {
    id: string;
    name: string;
    code: string;
    category: string;
    price: number;
    imageUrl: string;
}

export interface ProductDetail {
    id: string;
    name: string;
    code: string;
    category: string;
    price: number;
    imageUrl: string | null;
    baseUnit: string;
    riCoefficient: number;
    description: string;
    comment: string;
}

export interface Category {
    id: string;
    name: string;
}

export interface MeasurementUnit {
  id: string;
  name: string;
}

export interface CreateProductData {
    images: File[];
    code: string;
    name: string;
    category: string;
    purchasePrice: number;
    sellingPrice: number;
    measurementUnit: string;
    riCoefficient: number;
    description: string;
}

export interface UpdateProductData {
    id: string;
    name: string;
    code: string;
    description: string;
    category: string;
    measurementUnit: string;
    riCoefficient: number;
    price: number;
    comment?: string;
    picture?: string;
}

export const getProducts = async (searchTerm: string = '', category: string = '', page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Product>> => {
    const positionFrom = (page - 1) * pageSize + 1;
    const positionTo = page * pageSize;

    const productListData: ListRequest = {
        _type: 'XTSGetObjectListRequest',
        _dbId: '',
        _msgId: '',
        dataType: 'XTSProduct',
        columnSet: [],
        sortBy: [],
        positionFrom,
        positionTo,
        limit: pageSize,
        conditions: []
    };

    if (searchTerm) {
        productListData.conditions.push({
            _type: 'XTSCondition',
            property: 'description',
            value: searchTerm,
            comparisonOperator: 'contains'
        });
    }

    if (category) {
        productListData.conditions.push({
            _type: 'XTSCondition',
            property: 'productCategory.presentation',
            value: category,
            comparisonOperator: '='
        });
    }

    try {
        const response = await api.post('', productListData);

        if (!response.data || !Array.isArray(response.data.items)) {
            throw new Error('Invalid product list response format');
        }

        return {
            items: response.data.items.map((item: any) => ({
                id: item.object.objectId.id,
                imageUrl: item.object.picture,
                category: item.object.productCategory.presentation,
                name: item.object.description,
                code: item.object.sku,
                price: item.object._price
            })),
            hasMore: response.data.items.length === pageSize
        };
    } catch (error) {
        console.error('Product fetch error:', error);
        throw new Error('Failed to fetch products');
    }
};

export const getProductDetail = async (id: string): Promise<ProductDetail> => {
    const productData = {
        _type: 'XTSGetObjectsRequest',
        _dbId: '',
        _msgId: '',
        objectIds: [
            {
                _type: 'XTSObjectId',
                dataType: 'XTSProduct',
                id: id,
                presentation: '',
                url: ''
            }
        ],
        columnSet: []
    };

    try {
        const response = await api.post('', productData);

        if (!response.data?.objects?.[0]) {
            throw new Error('Invalid product detail response format');
        }

        const product = response.data.objects[0];
        return {
            id: product.objectId.id,
            name: product.description || '',
            code: product.code || '',
            category: product.productCategory?.presentation || '',
            price: product._price || 0,
            imageUrl: product.picture || null,
            baseUnit: product.measurementUnit?.presentation || '',
            riCoefficient: product._uomCoefficient || 1,
            description: product.descriptionFull || '',
            comment: product.comment || ''
        };
    } catch (error) {
        console.error('Product detail fetch error:', error);
        throw new Error('Failed to fetch product details');
    }
};

export const getCategories = async (): Promise<Category[]> => {
    const categoryListData = {
        _type: 'XTSGetObjectListRequest',
        _dbId: '',
        _msgId: '',
        dataType: 'XTSProductCategory',
        columnSet: [],
        sortBy: [],
        positionFrom: 1,
        positionTo: 100,
        limit: 0,
        conditions: []
    };

    try {
        const response = await api.post('', categoryListData);

        if (!response.data || !Array.isArray(response.data.items)) {
            throw new Error('Invalid category list response format');
        }

        return response.data.items.map((item: any) => ({
            id: item.object.objectId.id,
            name: item.object.objectId.presentation
        }));
    } catch (error) {
        console.error('Category fetch error:', error);
        throw new Error('Failed to fetch categories');
    }
};

export const getMeasurementUnits = async (): Promise<MeasurementUnit[]> => {
  const unitListData = {
    _type: 'XTSGetObjectListRequest',
    _dbId: '',
    _msgId: '',
    dataType: 'XTSUOMClassifier',
    columnSet: [],
    sortBy: [],
    positionFrom: 1,
    positionTo: 100,
    limit: 0,
    conditions: []
  };

  try {
    const response = await api.post('', unitListData);

    if (!response.data || !Array.isArray(response.data.items)) {
      throw new Error('Invalid measurement unit list response format');
    }

    return response.data.items.map((item: any) => ({
      id: item.object.objectId.id,
      name: item.object.objectId.presentation
    }));
  } catch (error) {
    console.error('Measurement unit fetch error:', error);
    throw new Error('Failed to fetch measurement units');
  }
};

export const createProduct = async (data: CreateProductData): Promise<void> => {
    const createProductData = {
        _type: 'XTSCreateObjectsRequest',
        _dbId: '',
        _msgId: '',
        objects: [
            {
                _type: 'XTSProduct',
                _isFullData: false,
                objectId: {
                    _type: 'XTSObjectId',
                    dataType: 'XTSProduct',
                    id: '',
                    presentation: data.name,
                    url: ''
                },
                description: data.name || '',
                descriptionFull: data.description || '',
                sku: data.code  || '',
                comment: data.description  || '',
                productType: {
                    _type: 'XTSObjectId',
                    id: 'InventoryItem',
                    dataType: 'XTSProductType',
                    presentation: 'Vật tư',
                    navigationRef: null
                },
                productCategory: {
                    _type: 'XTSObjectId',
                    id: data.category,
                    dataType: 'XTSProductCategory',
                    presentation: '',
                    navigationRef: null
                },
                measurementUnit: {
                    _type: 'XTSObjectId',
                    id: data.measurementUnit,
                    dataType: 'XTSUOMClassifier',
                    presentation: '',
                    navigationRef: null
                },
                _uomCoefficient: data.riCoefficient || '',
                _price: data.sellingPrice || '',
                _priceKind: {
                    _type: 'XTSObjectId',
                    id: '1a1fb49c-5b28-11ef-a699-00155d058802',
                    dataType: 'XTSPriceKind',
                    presentation: 'Giá bán lẻ',
                    navigationRef: null
                },
                _vatRate: {
                    _type: 'XTSObjectId',
                    dataType: 'XTSVATRate',
                    id: '',
                    presentation: '',
                    url: ''
                },
                _vatRateRate: 0,
                _uoms: [],
                _characteristics: [],
                _prices: [],
                _pictures: [],
                businessActivity: {
                    _type: 'XTSObjectId',
                    id: '5736c39d-5b28-11ef-a699-00155d058802',
                    dataType: 'XTSBusinessActivity',
                    presentation: 'Mảng hoạt động chính',
                    navigationRef: null
                }
            }
        ]
    };

    try {
        await api.post('', createProductData);
    } catch (error) {
        console.error('Product creation error:', error);
        throw new Error('Failed to create product');
    }
};

export const updateProduct = async (data: UpdateProductData): Promise<void> => {
    const updateProductData = {
        _type: 'XTSUpdateObjectsRequest',
        _dbId: '',
        _msgId: '',
        objects: [
            {
                _type: 'XTSProduct',
                _isFullData: true,
                objectId: {
                    _type: 'XTSObjectId',
                    dataType: 'XTSProduct',
                    id: data.id,
                    presentation: data.name,
                    url: ''
                },
                description: data.name,
                descriptionFull: data.description,
                sku: data.code,
                comment: data.comment || '',
                productType: {
                    _type: 'XTSObjectId',
                    dataType: 'XTSProductType',
                    id: 'InventoryItem',
                    presentation: 'Vật tư',
                    url: ''
                },
                productCategory: {
                    _type: 'XTSObjectId',
                    dataType: 'XTSProductCategory',
                    id: data.category,
                    presentation: '',
                    url: ''
                },
                measurementUnit: {
                    _type: 'XTSObjectId',
                    dataType: 'XTSUOMClassifier',
                    id: data.measurementUnit,
                    presentation: '',
                    url: ''
                },
                picture: {
                    _type: 'XTSObjectId',
                    dataType: '',
                    id: '',
                    presentation: '',
                    url: data.picture || ''
                },
                _uomCoefficient: data.riCoefficient,
                _price: data.price,
                _priceKind: {
                    _type: 'XTSObjectId',
                    dataType: 'XTSPriceKind',
                    id: '1a1fb49c-5b28-11ef-a699-00155d058802',
                    presentation: 'Giá bán lẻ',
                    url: ''
                },
                _vatRate: {
                    _type: 'XTSObjectId',
                    dataType: '',
                    id: '',
                    presentation: '',
                    url: ''
                },
                _vatRateRate: 0,
                _uoms: [
                    {
                        _type: 'XTSProductUOMRow',
                        _lineNumber: 0,
                        uom: {
                            _type: 'XTSObjectId',
                            id: data.measurementUnit,
                            dataType: 'XTSUOMClassifier',
                            presentation: '',
                            navigationRef: ''
                        },
                        coefficient: 1
                    },
                    {
                        _type: 'XTSProductUOMRow',
                        _lineNumber: 0,
                        uom: {
                            _type: 'XTSObjectId',
                            id: data.measurementUnit,
                            dataType: 'XTSMeasurementUnit',
                            presentation: `Ri (${data.riCoefficient} c)`,
                            navigationRef: ''
                        },
                        coefficient: data.riCoefficient
                    }
                ],
                _characteristics: [],
                _prices: [null],
                _pictures: []
            }
        ]
    };

    try {
        const response = await api.post('', updateProductData);
        if (!response.data?.success) {
            throw new Error('Product update failed');
        }
    } catch (error) {
        console.error('Product update error:', error);
        throw new Error('Failed to update product');
    }
};