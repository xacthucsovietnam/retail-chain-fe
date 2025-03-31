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

// Định nghĩa interface cho thông tin chung
interface GeneralInfo {
  date: string;
  number: string;
  supplier: string;
  contactInfo: string;
  documentAmount: string;
  documentQuantity: string;
  comment: string;
}

// Định nghĩa interface cho XTSFoundObject (tương tự foundObjects trong searchResponse)
interface XTSFoundObject {
  _type: "XTSFoundObject";
  lineNumber: number;
  attributeValue: string;
  objects: any[]; // Lưu toàn bộ dữ liệu sản phẩm từ searchResponse
}

// Định nghĩa interface cho kết quả xử lý
interface ProcessResult {
  generalInfo: GeneralInfo;
  notExist: ProcessedImageData[];
  existed: XTSFoundObject[];
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
        const base64Data = base64.split(',')[1]; // Lấy phần dữ liệu base64 sau dấu phẩy
        return {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data,
          },
        };
      })
    );

    // Prompt OCR được điều chỉnh để xử lý nhiều ảnh của cùng một hóa đơn
    const prompt = `
      You are tasked with analyzing multiple images that represent pages of a single receipt. Process all provided images as parts of the same receipt and extract the following information:
      - Date (e.g., from '开单时间' or bottom date like '2025-01-16' in format YYYY-MM-DD, if present in any image).
      - Total amount (e.g., after '合计' or '总金额' like '5020', typically from the last page if present).
      - Total quantity (e.g., after '总数' or '件' like '1040', typically from the last page if present).
      - All line items across all pages, each with:
        - Product name (e.g., text in parentheses like '(333字母单T)' after the product code, or leave as empty string '' if not present).
        - Product code (e.g., initial alphanumeric sequence like '9902ABC' or '天龙童星XD5802' at the start of each line, consisting of digits, letters, and Chinese characters. If under '款号' column, use that value; otherwise, extract the first alphanumeric sequence including Chinese characters).
        - Size (e.g., not visible, leave as empty string '' if not present).
        - Quantity (e.g., number after '数量:' like '60', or a single number in the line).
        - Price (e.g., numeric value after '¥' and before '~' like '33.00', or average if a range).
        - Total (e.g., amount after '金额:' like '¥1980.00').

      Special instructions:
      - Treat all images as consecutive pages of the same receipt.
      - For Product code: Extract the first sequence of alphanumeric characters (e.g., '9902ABC' or '天龙童星XD5802') at the start of each line, which may include digits, letters (A-Z, a-z), and Chinese characters. Ignore checkmarks (✓), parentheses, or non-alphanumeric characters. If a '款号' column exists, prioritize its value. If no alphanumeric sequence is found, return ''.
      - For Product name: Use the text within parentheses (e.g., '(333字母单T)') immediately following the product code, if present.
      - For Quantity: Extract the number after '数量:' (e.g., '60'). If written as 'NxM' (e.g., '5x5'), multiply N and M (e.g., '5x5' becomes '25'). Otherwise, use the single number.
      - For Price: Extract the numeric value after '¥' and before '~' (e.g., '33.00' from '¥33.00 ~ ¥33.00'). If a range, calculate the average.
      - For Total: Extract the numeric value after '金额:' and before '¥' (e.g., '1980.00' from '金额: ¥1980.00').
      - If no product name, size, or other fields are visible, return empty string ''.
      - Assign a unique lineNumber (starting from 1) to each line item across all pages in sequence.
      - Preserve all characters in their original form (Chinese, English, Vietnamese, etc.) without escaping or encoding them.

      Example:
      Input line: '9902ABC (333字母单T) ¥33.00 ~ ¥33.00 数量: 60 金额: ¥1980.00'
      Output: {"productDescription": "333字母单T", "productCode": "9902ABC", "productCharacteristic": "", "quantity": "60", "price": "33.00", "total": "1980.00"}

      Return ONLY valid JSON matching this schema in a single response:
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
            "total": string
          }
        ]
      }
    `;

    // Chuẩn bị nội dung request với role rõ ràng
    const requestBody = {
      contents: [
        {
          role: "user", // Chỉ định role là "user" cho nội dung từ người dùng
          parts: [
            { text: prompt }, // Prompt ở phần đầu
            ...base64Images, // Các ảnh được thêm vào sau prompt
          ],
        },
      ],
    };

    // Gọi API Gemini OCR
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyCYylAHaJxTR6lRFNJX6lPqde9urcldhcE",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
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

    const originalItems: ProcessedImageData[] = ocrResult.items.map((item: any) => ({
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

    // Tạo existed và notExist
    const existed: XTSFoundObject[] = [];
    const notExist: ProcessedImageData[] = [];

    // Tạo Set từ các attributeValue (SKU) trong foundObjects để kiểm tra tồn tại
    const existedSKUs = new Set(foundObjects.map((obj: any) => obj.attributeValue));

    // Phân loại sản phẩm
    originalItems.forEach((item) => {
      if (existedSKUs.has(item.productCode)) {
        // Tìm foundObject tương ứng với item dựa trên productCode và lineNumber
        const foundObj = foundObjects.find(
          (obj: any) => obj.attributeValue === item.productCode && obj.lineNumber.toString() === item.lineNumber
        );
        if (foundObj) {
          // Lưu toàn bộ dữ liệu từ foundObj vào existed
          existed.push({
            _type: "XTSFoundObject",
            lineNumber: foundObj.lineNumber,
            attributeValue: foundObj.attributeValue,
            objects: foundObj.objects.map((product: any) => ({
              ...product, // Giữ nguyên toàn bộ dữ liệu sản phẩm
              // Có thể thêm các trường từ originalItems nếu cần
              quantity: item.quantity,
              price: item.price,
              total: item.total,
              productDescription: item.productDescription,
              productCharacteristic: item.productCharacteristic,
            })),
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