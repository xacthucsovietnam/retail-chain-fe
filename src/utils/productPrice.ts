// services/productPrice.ts
import api from '../services/axiosClient';

// Interface cho XTSObjectId
interface XTSObjectId {
  _type: string;
  dataType: string;
  id: string;
  presentation: string;
  url?: string;
  navigationRef?: any;
}

// Interface cho Inventory trong XTSProductsPriceRegistration
interface Inventory {
  product: XTSObjectId;
  characteristic: XTSObjectId;
  measurementUnit: XTSObjectId;
  kindOfPrice: XTSObjectId;
  price: number;
  oldPrice: number;
  currency: XTSObjectId;
  currencyOld: XTSObjectId;
}

// Interface cho XTSProductsPriceRegistration (dùng cho cả request và response)
interface XTSProductsPriceRegistration {
  _type: string;
  _isFullData: boolean;
  objectId: XTSObjectId;
  comment: string;
  documentBasis: XTSObjectId;
  inventory: Inventory[];
}

// Interface cho request
interface XTSCreateObjectsRequest {
  _type: string;
  _dbId: string;
  _msgId: string;
  objects: XTSProductsPriceRegistration[];
}

// Interface cho response
interface XTSCreateObjectsResponse {
  _type: string;
  _dbId: string;
  _msgId: string;
  objects: XTSProductsPriceRegistration[];
}

// Interface cho response của XTSGetProductPricesRequest
interface XTSGetProductPricesResponse {
  _type: string;
  _dbId: string;
  _msgId: string;
  productPrices: Array<{
    product: XTSObjectId;
    price: number;
  }>;
}

// Hàm tạo payload cho request getProductPrices
const createPayload = (productIds: string[]) => {
  return {
    _type: "XTSGetProductsPricesRequest",
    _dbId: "12345",
    _messageId: null,
    date: new Date().toLocaleString('en-US', { 
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
    .replace(/(\d+)\/(\d+)\/(\d+),\s(\d+):(\d+):(\d+)/, '$3-$1-$2T$4:$5:$6'),
    priceKinds: [{
      _type: "XTSObjectId",
      id: "1a1fb49c-5b28-11ef-a699-00155d058802",
      dataType: "XTSPriceKind",
      presentation: "Giá bán lẻ",
      navigationRef: null
    }],
    products: productIds.map(productId => ({
      _type: "XTSObjectId",
      id: productId,
      dataType: "XTSProduct",
      presentation: "",
      navigationRef: null
    }))
  };
};

// Hàm lấy giá sản phẩm
export const getProductPrices = async (productIds: string[]): Promise<Map<string, { price?: number; oldPrice?: number }>> => {
  try {
    const payload = createPayload(productIds);
    const response = await api.post<XTSGetProductPricesResponse>('', JSON.stringify(payload));
    const priceMap = new Map<string, { price?: number; oldPrice?: number }>();
    const productPrices = response.data?.productPrices || [];

    productIds.forEach(productId => {
      const productPrice = productPrices.find((item: any) => item.product.id === productId);
      const price = productPrice?.price;
      priceMap.set(productId, {
        price: price !== undefined && price !== null ? Number(price) : undefined,
        oldPrice: price !== undefined && price !== null ? Number(price) : undefined
      });
    });

    return priceMap;
  } catch (error) {
    console.error('Error fetching product prices:', error);
    throw error;
  }
};

// Interface cho dữ liệu đầu vào của hàm createProductPrice
interface CreateProductPriceInput {
  documentBasisId: string;
  products: Array<{
    productId: string;
    characteristicId: string;
    measurementUnitId: string;
    kindOfPriceId: string;
    price: number;
    oldPrice: number;
    currencyId: string;
    currencyOldId: string;
  }>;
  comment?: string;
}

// Hàm tạo payload cho request createProductPrice
const createProductPricePayload = (input: CreateProductPriceInput): XTSCreateObjectsRequest => {
  return {
    _type: "XTSCreateObjectsRequest",
    _dbId: "",
    _msgId: "",
    objects: [
      {
        _type: "XTSProductsPriceRegistration",
        _isFullData: false,
        objectId: {
          _type: "XTSObjectId",
          dataType: "XTSProductsPriceRegistration",
          id: "",
          presentation: "",
          url: ""
        },
        comment: input.comment || "",
        documentBasis: {
          _type: "XTSObjectId",
          dataType: "XTSSupplierInvoice",
          id: input.documentBasisId,
          presentation: "",
          url: ""
        },
        inventory: input.products.map(product => ({
          product: {
            _type: "XTSObjectId",
            dataType: "XTSProduct",
            id: product.productId,
            presentation: "",
            url: ""
          },
          characteristic: {
            _type: "XTSObjectId",
            dataType: "XTSProductCharacteristic",
            id: product.characteristicId,
            presentation: "",
            url: ""
          },
          uom: {
            _type: "XTSObjectId",
            dataType: "XTSUOMClassifier",
            id: product.measurementUnitId,
            presentation: "",
            url: ""
          },
          priceKind: {
            _type: "XTSObjectId",
            dataType: "XTSPriceKind",
            id: product.kindOfPriceId,
            presentation: "",
            url: ""
          },
          price: product.price,
          oldPrice: product.oldPrice,
          currency: {
            _type: "XTSObjectId",
            dataType: "XTSCurrency",
            id: product.currencyId,
            presentation: "",
            url: ""
          },
          currencyOld: {
            _type: "XTSObjectId",
            dataType: "XTSCurrency",
            id: product.currencyOldId,
            presentation: "",
            url: ""
          }
        }))
      }
    ]
  };
};

// Hàm tạo giá sản phẩm mới
export const createProductPrice = async (input: CreateProductPriceInput): Promise<XTSProductsPriceRegistration> => {
  try {
    const payload = createProductPricePayload(input);
    const response = await api.post<XTSCreateObjectsResponse>('', JSON.stringify(payload));

    if (response.data?._type !== "XTSCreateObjectsResponse") {
      throw new Error("Invalid response type from API");
    }

    const createdObject = response.data.objects?.[0];
    if (!createdObject || createdObject._type !== "XTSProductsPriceRegistration") {
      throw new Error("Invalid object in response");
    }

    return createdObject as XTSProductsPriceRegistration;
  } catch (error) {
    console.error('Error creating product price:', error);
    throw error;
  }
};