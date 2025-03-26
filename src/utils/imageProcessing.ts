// ../../utils/imageProcessing.ts
import api from '../services/axiosClient';

// Định nghĩa interface ProcessedImageData
export interface ProcessedImageData {
  productCode: string;
  productDescription: string;
  productCharacteristic: string;
  quantity: string;
  price: string;
  total: string;
  lineNumber: string;
  id?: string;
  name?: string;
}

// Định nghĩa interface cho thông tin chung và danh sách sản phẩm
interface GeneralInfo {
  date: string;
  number: string;
  supplier: string;
  contactInfo: string;
  documentAmount: string;
  documentQuantity: string;
  comment: string;
}

interface ProcessResult {
  generalInfo: GeneralInfo;
  notExist: ProcessedImageData[];
  existed: ProcessedImageData[];
}

// Định nghĩa interface cho XTSSearchObjectsRequest
interface XTSSearchObjectsRequest {
  _type: "XTSSearchObjectsRequest";
  _dbId: "12345";
  _messageId: null;
  dataType: "XTSProduct";
  attributeType: "String";
  attributeName: "sku";
  searchObjects: { lineNumber: number; attributeValue: string }[];
}

// Hàm chuyển đổi File thành base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Hàm decode chuỗi Unicode thành ký tự gốc
const decodeUnicode = (str: string): string => {
  try {
    return decodeURIComponent(
      str.replace(/\\u([\dA-Fa-f]{4})/g, (match, grp) =>
        String.fromCharCode(parseInt(grp, 16))
      )
    );
  } catch (error) {
    console.error("Error decoding Unicode:", error);
    return str; // Trả về chuỗi gốc nếu không decode được
  }
};

// Hàm xử lý ảnh
export const processImages = async (images: File[]): Promise<ProcessResult> => {
  try {
    // Chuyển đổi tất cả ảnh thành base64
    const base64Images = await Promise.all(
      images.map(async (img) => {
        const base64 = await fileToBase64(img);
        const base64Data = base64.split(',')[1];
        return {
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Data,
              },
            },
          ],
        };
      })
    );

    // Prompt OCR
    const prompt = `
      Analyze this receipt image page and extract:
    - Date (e.g., from '开单时间' or bottom date like '2025-01-16' in format YYYY-MM-DD, if present).
    - Total amount (e.g., after '合计' or '总金额' like '5020', if present).
    - Total quantity (e.g., after '总数' or '件' like '1040', if present).
    - All line items on this page, each with:
      - Product name (e.g., the text in parentheses like '(333字母单T)' after the product code, or leave as empty string '' if not present).
      - Product code (e.g., the initial alphanumeric sequence like '9902ABC' or '天龙童星XD5802' at the start of each line, consisting of digits, letters, and Chinese characters. If under '款号' column, use that value; otherwise, extract the first alphanumeric sequence including Chinese characters).
      - Size (e.g., not visible, leave as empty string '' if not present).
      - Quantity (e.g., the number after '数量:' like '60', or a single number in the line).
      - Price (e.g., the numeric value after '¥' and before '~' like '33.00', or average if a range).
      - Total (e.g., the amount after '金额:' like '¥1980.00').
    
    Special instructions:
    - For Product code: Extract the first sequence of alphanumeric characters (e.g., '9902ABC' or '天龙童星XD5802') at the start of each line, which may include digits, letters (A-Z, a-z), and Chinese characters. Ignore any checkmarks (✓), parentheses, or non-alphanumeric characters. If a '款号' column exists, prioritize its value. If no alphanumeric sequence is found, return ''.
    - For Product name: Use the text within parentheses (e.g., '(333字母单T)') immediately following the product code, if present.
    - For Quantity: Extract the number after '数量:' (e.g., '60'). If written as 'NxM' (e.g., '5x5'), multiply N and M (e.g., '5x5' becomes '25'). Otherwise, use the single number.
    - For Price: Extract the numeric value after '¥' and before '~' (e.g., '33.00' from '¥33.00 ~ ¥33.00'). If a range, calculate the average.
    - For Total: Extract the numeric value after '金额:' and before '¥' (e.g., '1980.00' from '金额: ¥1980.00').
    - If no product name, size, or other fields are visible, return empty string ''.
    - Preserve all characters in their original form (Chinese, English, Vietnamese, etc.) without escaping or encoding them.
    
    Example:
    Input line: '9902ABC (333字母单T) ¥33.00 ~ ¥33.00 数量: 60 金额: ¥1980.00'
    Output: {"productDescription": "333字母单T", "productCode": "9902ABC", "UOM": "", "quantity": "60", "price": "33.00", "total": "1980.00"}
    
    Input line: '天龙童星XD5802 ✓ ¥90.00 ~ ¥130.00 数量: 18 金额: ¥450.00'
    Output: {"productDescription": "", "productCode": "天龙童星XD5802", "UOM": "", "quantity": "18", "price": "110.00", "total": "450.00"}
    
    Input line: '款号: 9902XYZ (天龙童星XD5802) ¥50.00 ~ ¥60.00 数量: 20 金额: ¥1200.00'
    Output: {"productDescription": "天龙童星XD5802", "productCode": "9902XYZ", "UOM": "", "quantity": "20", "price": "55.00", "total": "1200.00"}
    
    Return ONLY valid JSON matching this schema:
      {
        "date": string,
        "number": string,
        "supplier": string,
        "contactInfo": string,
        "documentAmount": string,
        "documentQuantity": string,
        "comment": string,
        "items": [
          {
            "lineNumber": string,
            "productCode": string,
            "productDescription": string,
            "productCharacteristic": string,
            "quantity": string,
            "price": string,
            "total": string,
            "uom": string
          }
        ]
      }
    `;

    // Gọi API Gemini OCR
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyCYylAHaJxTR6lRFNJX6lPqde9urcldhcE",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: base64Images.map((img, index) => ({
            parts: [
              ...img.parts,
              { text: index === 0 ? prompt : "" },
            ],
          })),
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const ocrResultText = data.candidates[0].content.parts[0].text;

    // Trích xuất JSON từ chuỗi text
    const jsonMatch = ocrResultText.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch || !jsonMatch[1]) {
      throw new Error("Invalid JSON format in OCR response");
    }
    const jsonString = jsonMatch[1];

    // Parse JSON và decode các chuỗi Unicode
    const ocrResult = JSON.parse(jsonString, (key, value) => {
      if (typeof value === "string") {
        return decodeUnicode(value);
      }
      return value;
    });

    // Gán lineNumber cho từng sản phẩm
    const itemsWithLineNumber = ocrResult.items.map((item: any, index: number) => ({
      ...item,
      lineNumber: `${index + 1}`,
    }));

    // Ánh xạ dữ liệu từ OCR
    const generalInfo: GeneralInfo = {
      date: ocrResult.date || "",
      number: ocrResult.number || "",
      supplier: ocrResult.supplier || "",
      contactInfo: ocrResult.contactInfo || "",
      documentAmount: ocrResult.documentAmount || "",
      documentQuantity: ocrResult.documentQuantity || "",
      comment: ocrResult.comment || "",
    };

    const originalItems: ProcessedImageData[] = itemsWithLineNumber.map((item: any) => ({
      lineNumber: item.lineNumber,
      productCode: item.productCode || "",
      productDescription: item.productDescription || "",
      productCharacteristic: item.productCharacteristic || "",
      quantity: item.quantity || "",
      price: item.price || "",
      total: item.total || "",
      id: undefined,
      name: item.productDescription || "",
    }));

    // Tạo request XTSSearchObjectsRequest
    const searchRequest: XTSSearchObjectsRequest = {
      _type: "XTSSearchObjectsRequest",
      _dbId: "12345",
      _messageId: null,
      dataType: "XTSProduct",
      attributeType: "String",
      attributeName: "sku",
      searchObjects: originalItems.map((item, idx) => ({
        lineNumber: idx + 1,
        attributeValue: item.productCode,
      })),
    };

    // Gọi API với axiosClient
    const searchResponse = await api.post('', searchRequest);

    // Lấy danh sách foundObjects từ searchResponse
    const foundObjects = searchResponse.data?.foundObjects || [];

    // Tạo Set từ các attributeValue (SKU) trong foundObjects
    const existedSKUs = new Set(foundObjects.map((obj: any) => obj.attributeValue));

    // Tạo existed và notExist từ originalItems
    const existed: ProcessedImageData[] = [];
    const notExist: ProcessedImageData[] = [];

    // Map để lưu thông tin gốc từ originalItems theo productCode và lineNumber
    const originalItemsMap = new Map(
      originalItems.map(item => [`${item.productCode}-${item.lineNumber}`, item])
    );

    // Phân loại sản phẩm và tạo existed
    originalItems.forEach((item) => {
      if (existedSKUs.has(item.productCode)) {
        const foundObj = foundObjects.find(
          (obj: any) => obj.attributeValue === item.productCode && obj.lineNumber.toString() === item.lineNumber
        );
        if (foundObj) {
          foundObj.objects.forEach((product: any) => {
            existed.push({
              lineNumber: item.lineNumber,
              productCode: product.sku || item.productCode,
              productDescription: item.productDescription,
              productCharacteristic: item.productCharacteristic,
              quantity: item.quantity,
              price: item.price,
              total: item.total,
              id: product.objectId?.id || undefined,
              name: product.description || item.name,
            });
          });
        }
      } else {
        notExist.push(item);
      }
    });

    // Trả về kết quả
    return { generalInfo, notExist, existed };
  } catch (error) {
    console.error("Error processing images:", error);
    throw new Error("Failed to process images");
  }
};

// Export hàm handleProcessImages
export const handleProcessImages = async (images: File[]) => {
  const result = await processImages(images);
  console.log("Processed result:", result);
  return result;
};