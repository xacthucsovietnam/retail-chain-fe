// src/services/product.ts
import api from './axiosClient';
import { 
  uploadFile, 
  deleteFile, 
  getImageUrl,
  type FileUploadResponse 
} from './file';
import { ListRequest, PaginatedResponse } from './types';

export interface ProductImage {
  id: string;
  url: string;
  presentation: string;
}

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
  baseUnitId: string;
  baseUnit: string;
  riCoefficient: number;
  description: string;
  comment: string;
  images: ProductImage[];
  uoms: Array<{
    id: string;
    presentation: string;
    coefficient: number;
  }>;
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
  newImages?: File[];
  deletedImageIds?: string[];
}

const processProductImages = (product: any): ProductImage[] => {
  const images: ProductImage[] = [];

  if (product.picture) {
    images.push({
      id: product.picture.id,
      url: getImageUrl(product.picture.presentation),
      presentation: product.picture.presentation
    });
  }

  if (Array.isArray(product._pictures)) {
    product._pictures.forEach((pic: any) => {
      if (pic?.fileName && !images.find(img => img.id === pic.file.id)) {
        images.push({
          id: pic.file.id,
          url: getImageUrl(pic.fileName),
          presentation: pic.fileName
        });
      }
    });
  }

  return images;
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
    limit: 100,
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
    limit: 100,
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

export const getProducts = async (
  searchTerm: string = '',
  category: string = '',
  page: number = 1,
  pageSize: number = 20,
  searchType: 'description' | 'sku' = 'description'
): Promise<PaginatedResponse<Product>> => {
  const positionFrom = (page - 1) * pageSize + 1;
  const positionTo = page * pageSize;

  const productListData: ListRequest = {
    _type: 'XTSGetObjectListRequest',
    _dbId: '',
    _msgId: '',
    dataType: 'XTSProduct',
    columnSet: ['objectId', 'productCategory', 'description', 'sku', '_price', '_uomCoefficient', 'picture'],
    sortBy: [],
    positionFrom,
    positionTo,
    limit: pageSize,
    conditions: [],
  };

  if (searchTerm) {
    productListData.conditions.push({
      _type: 'XTSCondition',
      property: searchType,
      value: searchTerm,
      comparisonOperator: 'LIKE',
    });
  }

  if (category) {
    productListData.conditions.push({
      _type: 'XTSCondition',
      property: 'productCategory.presentation',
      value: category,
      comparisonOperator: '=',
    });
  }

  try {
    const response = await api.post('', productListData);

    if (!response.data || !Array.isArray(response.data.items)) {
      throw new Error('Invalid product list response format');
    }

    return {
      items: response.data.items.map((item: any) => {
        let imageUrl = '';
        if (item.object.picture?.presentation) {
          imageUrl = getImageUrl(item.object.picture.presentation);
        }

        return {
          id: item.object.objectId.id,
          imageUrl: imageUrl,
          category: item.object.productCategory?.presentation || '',
          name: item.object.description || '',
          code: item.object.sku || '',
          price: item.object._price || 0,
        };
      }),
      hasMore: response.data.items.length === pageSize,
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
    columnSet: [
      'objectId', 'description', 'sku', 'productCategory', '_price', 'picture',
      'measurementUnit', '_uomCoefficient', 'descriptionFull', 'comment', '_uoms', '_pictures'
    ]
  };

  try {
    const response = await api.post('', productData);

    if (!response.data?.objects?.[0]) {
      throw new Error('Invalid product detail response format');
    }

    const product = response.data.objects[0];
    const images = processProductImages(product);

    return {
      id: product.objectId.id,
      name: product.description || '',
      code: product.sku || '',
      category: product.productCategory?.presentation || '',
      price: product._price || 0,
      imageUrl: images[0]?.url || null,
      baseUnitId: product.measurementUnit?.id || '',
      baseUnit: product.measurementUnit?.presentation || '',
      riCoefficient: product._uomCoefficient || 1,
      description: product.descriptionFull || '',
      comment: product.comment || '',
      images: images,
      uoms: product._uoms?.map((uom: any) => ({
        id: uom.uom.id,
        presentation: uom.uom.presentation,
        coefficient: uom.coefficient || 1
      })) || []
    };
  } catch (error) {
    console.error('Product detail fetch error:', error);
    throw new Error('Failed to fetch product details');
  }
};

export const createProduct = async (data: CreateProductData): Promise<{ id: string; presentation: string }> => {
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
        description: data.name,
        descriptionFull: data.description,
        sku: data.code,
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
        _uomCoefficient: data.riCoefficient,
        _price: data.sellingPrice,
        _priceKind: {
          _type: 'XTSObjectId',
          id: '1a1fb49c-5b28-11ef-a699-00155d058802',
          dataType: 'XTSPriceKind',
          presentation: 'Giá bán lẻ',
          navigationRef: null
        }
      }
    ]
  };

  try {
    const productResponse = await api.post('', createProductData);

    if (!productResponse.data?.objects?.[0]?.objectId) {
      throw new Error('Invalid create product response format');
    }

    const createdProduct = productResponse.data.objects[0];
    const productId = createdProduct.objectId.id;
    const productPresentation = createdProduct.objectId.presentation;

    if (data.images.length > 0) {
      try {
        const uploadPromises = data.images.map(image => 
          uploadFile(image, {
            fileOwnerType: 'XTSProduct',
            fileOwnerTypeId: productId,
            fileOwnerName: productPresentation,
            fileType: 'Product'
          })
        );

        await Promise.all(uploadPromises);
      } catch (error) {
        console.error('Image upload error:', error);
      }
    }

    return {
      id: productId,
      presentation: productPresentation
    };
  } catch (error) {
    console.error('Product creation error:', error);
    throw new Error('Failed to create product');
  }
};

export const updateProduct = async (data: UpdateProductData): Promise<void> => {
  try {
    if (data.deletedImageIds?.length) {
      const deletePromises = data.deletedImageIds.map(fileId =>
        deleteFile({
          fileId,
          fileType: 'XTSProduct'
        })
      );
      await Promise.all(deletePromises);
    }

    if (data.newImages?.length) {
      const uploadPromises = data.newImages.map(image =>
        uploadFile(image, {
          fileOwnerType: 'XTSProduct',
          fileOwnerTypeId: data.id,
          fileOwnerName: data.name,
          fileType: 'Product'
        })
      );
      await Promise.all(uploadPromises);
    }

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
          picture: data.picture ? {
            _type: 'XTSObjectId',
            dataType: '',
            id: '',
            presentation: data.picture,
            url: ''
          } : null,
          _uomCoefficient: data.riCoefficient,
          _price: data.price,
          _priceKind: {
            _type: 'XTSObjectId',
            dataType: 'XTSPriceKind',
            id: '1a1fb49c-5b28-11ef-a699-00155d058802',
            presentation: 'Giá bán lẻ',
            url: ''
          }
        }
      ]
    };

    const response = await api.post('', updateProductData);
    
    if (!response.data?.objects?.[0]) {
      throw new Error('Invalid update product response format');
    }
  } catch (error) {
    console.error('Product update error:', error);
    throw new Error('Failed to update product');
  }
};