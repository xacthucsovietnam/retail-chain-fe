import api from './axiosClient';
import { ObjectId } from './types';

// Định nghĩa interface cho request xóa đối tượng
interface DeleteObjectsRequest {
  _type: string;
  _dbId: string;
  _messageId: null;
  objectIds: ObjectId[];
}

// Định nghĩa interface cho response của xóa đối tượng
interface DeleteObjectsResponse {
  _type: string;
  _dbId: string;
  _messageId: null;
  objectIds: ObjectId[];
}

// Hàm xóa các đối tượng
export const deleteObjects = async (objectIds: ObjectId[]): Promise<ObjectId[]> => {
  // Tạo payload theo mẫu API yêu cầu
  const payload: DeleteObjectsRequest = {
    _type: 'XTSDeleteObjectsRequest',
    _dbId: '',
    _messageId: null,
    objectIds: objectIds.map(obj => ({
      _type: 'XTSObjectId',
      id: obj.id,
      dataType: obj.dataType,
      presentation: obj.presentation,
      navigationRef: null,
    })),
  };

  try {
    // Gửi yêu cầu POST tới endpoint rỗng
    const response = await api.post('', JSON.stringify(payload));
    // Ép kiểu dữ liệu response về DeleteObjectsResponse
    const deleteResponse = response.data as DeleteObjectsResponse;
    // Trả về danh sách objectIds từ response
    return deleteResponse.objectIds;
  } catch (error) {
    // Xử lý lỗi từ axios hoặc server
    const errorMessage = error instanceof Error ? error.message : 'Không thể xóa đối tượng';
    throw new Error(errorMessage);
  }
};

// Hàm tiện ích để xóa một đối tượng duy nhất
export const deleteSingleObject = async (object: ObjectId): Promise<ObjectId> => {
  const result = await deleteObjects([object]);
  return result[0]; // Trả về objectId đầu tiên (vì chỉ xóa một đối tượng)
};