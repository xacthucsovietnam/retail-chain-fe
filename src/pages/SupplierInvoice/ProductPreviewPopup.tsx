import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import Select from 'react-select';
import { ProcessedImageData } from '../../utils/imageProcessing';
import { createPartner } from '../../services/partner';
import { getSession } from '../../utils/storage';
import toast from 'react-hot-toast';

// Định nghĩa interface cho XTSFoundObject từ imageProcessing.ts
interface XTSFoundObject {
  _type: "XTSFoundObject";
  lineNumber: number;
  attributeValue: string;
  objects: any[];
}

interface ProductPreviewPopupProps {
  generalInfo: {
    date: string;
    documentAmount: string;
    documentQuantity: string;
    number: string;
    contactInfo: string;
    comment: string;
    supplier: string;
  };
  notExist: ProcessedImageData[];
  existed: XTSFoundObject[];
  suppliers: any[];
  onClose: () => void;
  onSave: (updatedNotExist: ProcessedImageData[], updatedExisted: XTSFoundObject[], updatedGeneralInfo: ProductPreviewPopupProps['generalInfo']) => void;
}

const ProductPreviewPopup: React.FC<ProductPreviewPopupProps> = ({
  generalInfo,
  notExist,
  existed,
  suppliers,
  onClose,
  onSave,
}) => {
  const session = getSession();
  const defaultValues = session?.defaultValues || {};

  const [activeTab, setActiveTab] = useState(1);
  const [localNotExist, setLocalNotExist] = useState<ProcessedImageData[]>(
    notExist.map(item => ({
      ...item,
      coefficient: item.coefficient || 1,
      discount: '',
      originalPrice: item.price
    }))
  );
  const [localExisted, setLocalExisted] = useState<XTSFoundObject[]>(
    existed.map(item => ({
      ...item,
      selectedObject: {
        ...item.objects[0],
        quantity: item.objects[0]?.quantity || '1',
        price: item.objects[0]?.price || '0', // Sử dụng price từ OCR Gemini
        total: (Number(item.objects[0]?.quantity || 1) * Number(item.objects[0]?.price || 0)).toString(),
        discount: '',
        originalPrice: item.objects[0]?.price || '0', // Sử dụng price từ OCR Gemini
        coefficient: item.objects[0]?._uomCoefficient || '1',
        productCharacteristic: item.objects[0]?.descriptionFull || ''
      }
    }))
  );
  const [localGeneralInfo, setLocalGeneralInfo] = useState(generalInfo);
  const [calculatedAmount, setCalculatedAmount] = useState<string>('');
  const [calculatedQuantity, setCalculatedQuantity] = useState<string>('');
  const [showQuickFillPopup, setShowQuickFillPopup] = useState(false);
  const [quickFillName, setQuickFillName] = useState('');
  const [quickFillCoefficient, setQuickFillCoefficient] = useState('1');
  const [quickFillDiscount, setQuickFillDiscount] = useState('');

  useEffect(() => {
    const allItems = [
      ...localExisted.map(item => item.selectedObject),
      ...localNotExist
    ];
    const totalAmount = allItems
      .reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0)
      .toFixed(2);
    const totalQuantity = allItems
      .reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0)
      .toString();
    setCalculatedAmount(totalAmount);
    setCalculatedQuantity(totalQuantity);
  }, [localExisted, localNotExist]);

  const updatePriceAndTotal = (item: any, discount: string) => {
    const originalPrice = parseFloat(item.originalPrice) || 0;
    const discountValue = discount === '' ? 0 : parseFloat(discount) || 0;
    const quantity = parseFloat(item.quantity) || 0;
    const newPrice = originalPrice + discountValue;
    return {
      ...item,
      price: newPrice.toString(),
      discount,
      total: (quantity * newPrice).toFixed(2)
    };
  };

  const handleNotExistDiscountChange = (index: number, discount: string) => {
    const updatedNotExist = [...localNotExist];
    updatedNotExist[index] = updatePriceAndTotal(updatedNotExist[index], discount);
    setLocalNotExist(updatedNotExist);
  };

  const handleExistedDiscountChange = (index: number, discount: string) => {
    const updatedExisted = [...localExisted];
    updatedExisted[index].selectedObject = updatePriceAndTotal(updatedExisted[index].selectedObject, discount);
    setLocalExisted(updatedExisted);
  };

  const handleNotExistChange = (index: number, field: keyof ProcessedImageData, value: string) => {
    const updatedNotExist = [...localNotExist];
    updatedNotExist[index] = { ...updatedNotExist[index], [field]: value };
    if (field === 'quantity' || field === 'coefficient') {
      const quantity = parseFloat(updatedNotExist[index].quantity) || 0;
      const price = parseFloat(updatedNotExist[index].price) || 0;
      updatedNotExist[index].total = (quantity * price).toFixed(2);
    }
    setLocalNotExist(updatedNotExist);
  };

  const handleExistedChange = (index: number, field: string, value: string) => {
    const updatedExisted = [...localExisted];
    updatedExisted[index].selectedObject = {
      ...updatedExisted[index].selectedObject,
      [field]: value
    };
    if (field === 'quantity' || field === 'coefficient') {
      const quantity = parseFloat(updatedExisted[index].selectedObject.quantity) || 0;
      const price = parseFloat(updatedExisted[index].selectedObject.price) || 0;
      updatedExisted[index].selectedObject.total = (quantity * price).toFixed(2);
    }
    setLocalExisted(updatedExisted);
  };

  const handleExistedProductChange = (index: number, selectedOption: any) => {
    const updatedExisted = [...localExisted];
    const selectedObj = updatedExisted[index].objects.find((obj: any) => obj.objectId.id === selectedOption.value);
    if (selectedObj) {
      updatedExisted[index].selectedObject = {
        ...selectedObj,
        quantity: updatedExisted[index].selectedObject.quantity || selectedObj.quantity || '1',
        price: updatedExisted[index].selectedObject.price || selectedObj.price || '0', // Giữ nguyên price từ OCR Gemini
        total: updatedExisted[index].selectedObject.total || (Number(selectedObj.quantity || 1) * Number(selectedObj.price || 0)).toString(),
        discount: updatedExisted[index].selectedObject.discount || '',
        originalPrice: selectedObj.price || '0', // Sử dụng price từ OCR Gemini
        coefficient: selectedObj._uomCoefficient || updatedExisted[index].selectedObject.coefficient || '1',
        productCharacteristic: selectedObj.descriptionFull || ''
      };
    }
    setLocalExisted(updatedExisted);
  };

  const handleRemoveNotExist = (index: number) => {
    setLocalNotExist(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExisted = (index: number) => {
    setLocalExisted(prev => prev.filter((_, i) => i !== index));
  };

  const handleGeneralInfoChange = (field: keyof typeof generalInfo, value: string) => {
    setLocalGeneralInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleQuickFill = () => {
    const updatedNotExist = localNotExist.map((item, index) => {
      const quantity = parseFloat(item.quantity) || 0;
      const originalPrice = parseFloat(item.originalPrice) || 0;
      const discount = quickFillDiscount === '' ? 0 : parseFloat(quickFillDiscount) || 0;
      const newPrice = originalPrice + discount;
      const newTotal = (quantity * newPrice).toFixed(2);

      return {
        ...item,
        productDescription: quickFillName ? `${quickFillName} ${index + 1}` : item.productDescription,
        coefficient: parseFloat(quickFillCoefficient) || 1,
        discount: quickFillDiscount,
        price: newPrice.toString(),
        total: newTotal
      };
    });

    const updatedExisted = localExisted.map(item => {
      const quantity = parseFloat(item.selectedObject.quantity) || 0;
      const originalPrice = parseFloat(item.selectedObject.originalPrice) || 0;
      const discount = quickFillDiscount === '' ? 0 : parseFloat(quickFillDiscount) || 0;
      const newPrice = originalPrice + discount;
      const newTotal = (quantity * newPrice).toFixed(2);

      return {
        ...item,
        selectedObject: {
          ...item.selectedObject,
          coefficient: parseFloat(quickFillCoefficient) || 1,
          discount: quickFillDiscount,
          price: newPrice.toString(),
          total: newTotal
        }
      };
    });

    setLocalNotExist(updatedNotExist);
    setLocalExisted(updatedExisted);
    setShowQuickFillPopup(false);
    setQuickFillName('');
    setQuickFillCoefficient('1');
    setQuickFillDiscount('');
  };

  const handleSave = async () => {
    let supplierId = suppliers.find(s => s.name === localGeneralInfo.supplier)?.id;
    if (localGeneralInfo.supplier && !supplierId) {
      try {
        const newSupplier = await createPartner({
          name: localGeneralInfo.supplier,
          fullName: '',
          dateOfBirth: '',
          phone: '',
          email: '',
          address: '',
          notes: '',
          gender: '',
          picture: '',
          counterpartyKindId: defaultValues.counterpartyKind?.id || '',
          counterpartyKindPresentation: defaultValues.counterpartyKind?.presentation || '',
          employeeResponsibleId: defaultValues.employeeResponsible?.id || '',
          employeeResponsiblePresentation: defaultValues.employeeResponsible?.presentation || '',
          taxIdentifactionNumber: '',
          invalid: false,
          isCustomer: false,
          isVendor: true,
          otherRelations: false,
          margin: 0,
          doOperationsByContracts: false,
          doOperationsByOrders: false,
          doOperationsByDocuments: false
        });
        supplierId = newSupplier.id;
      } catch (error) {
        toast.error('Không thể tạo nhà cung cấp mới');
        console.error('Error creating supplier:', error);
        return;
      }
    }

    const formattedDate = localGeneralInfo.date
      ? new Date(localGeneralInfo.date).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16);

    const updatedGeneralInfo = {
      ...localGeneralInfo,
      date: formattedDate,
      supplierId
    };

    onSave(localNotExist, localExisted, updatedGeneralInfo);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-lg p-4 w-full max-w-md h-[85vh] flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Xem trước thông tin</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-600 hover:text-gray-800" />
          </button>
        </div>

        <div className="flex border-b mb-3">
          <button
            className={`flex-1 py-2 text-sm font-medium text-center ${activeTab === 1 ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600'}`}
            onClick={() => setActiveTab(1)}
          >
            Sản phẩm
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium text-center ${activeTab === 2 ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600'}`}
            onClick={() => setActiveTab(2)}
          >
            Thông tin
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 2 && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <label className="font-medium min-w-[100px]">Ngày:</label>
                <input
                  type="datetime-local"
                  value={localGeneralInfo.date ? new Date(localGeneralInfo.date).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handleGeneralInfoChange('date', e.target.value)}
                  className="flex-1 p-1 border rounded text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="font-medium min-w-[100px]">Số hóa đơn:</label>
                <input
                  type="text"
                  value={localGeneralInfo.number || ''}
                  onChange={(e) => handleGeneralInfoChange('number', e.target.value)}
                  className="flex-1 p-1 border rounded text-sm"
                  placeholder="Nhập số hóa đơn..."
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="font-medium min-w-[100px]">Nhà cung cấp:</label>
                <input
                  type="text"
                  value={localGeneralInfo.supplier || ''}
                  onChange={(e) => handleGeneralInfoChange('supplier', e.target.value)}
                  className="flex-1 p-1 border rounded text-sm"
                  placeholder="Nhập nhà cung cấp..."
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="font-medium min-w-[100px]">Thông tin liên hệ:</label>
                <input
                  type="text"
                  value={localGeneralInfo.contactInfo || ''}
                  onChange={(e) => handleGeneralInfoChange('contactInfo', e.target.value)}
                  className="flex-1 p-1 border rounded text-sm"
                  placeholder="Nhập thông tin liên hệ..."
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="font-medium min-w-[100px]">Tổng tiền:</label>
                <input
                  type="text"
                  value={localGeneralInfo.documentAmount || calculatedAmount || ''}
                  onChange={(e) => handleGeneralInfoChange('documentAmount', e.target.value)}
                  className="flex-1 p-1 border rounded text-sm"
                  placeholder="Nhập tổng tiền..."
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="font-medium min-w-[100px]">Tổng số lượng:</label>
                <input
                  type="text"
                  value={localGeneralInfo.documentQuantity || calculatedQuantity || ''}
                  onChange={(e) => handleGeneralInfoChange('documentQuantity', e.target.value)}
                  className="flex-1 p-1 border rounded text-sm"
                  placeholder="Nhập tổng số lượng..."
                />
              </div>
              <div className="flex items-start gap-2">
                <label className="font-medium min-w-[100px] mt-1">Ghi chú:</label>
                <textarea
                  value={localGeneralInfo.comment || ''}
                  onChange={(e) => handleGeneralInfoChange('comment', e.target.value)}
                  className="flex-1 p-1 border rounded text-sm"
                  placeholder="Nhập ghi chú..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {activeTab === 1 && (
            <div className="space-y-3">
              {localExisted.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Sản phẩm đã tồn tại</h3>
                  {localExisted.map((item, index) => {
                    const productOptions = item.objects.map((obj: any) => ({
                      value: obj.objectId.id,
                      label: obj.objectId.presentation || 'N/A' // Sử dụng objectId.presentation làm label
                    }));
                    const selectedProduct = item.selectedObject;

                    return (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg shadow-sm mb-2 relative">
                        <button
                          onClick={() => handleRemoveExisted(index)}
                          className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium min-w-[60px]">Mã:</span>
                            <span className="text-sm">{item.attributeValue || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <label className="text-sm min-w-[60px]">Tên:</label>
                          <Select
                            options={productOptions}
                            value={productOptions.find(option => option.value === selectedProduct.objectId.id) || null}
                            onChange={(selectedOption) => handleExistedProductChange(index, selectedOption)}
                            placeholder="Chọn sản phẩm"
                            className="flex-1 text-sm"
                            classNamePrefix="select"
                          />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <label className="text-sm min-w-[60px]">Đặc điểm:</label>
                          <span className="text-sm">{selectedProduct.productCharacteristic || 'Không có'}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <label className="text-sm min-w-[60px]">Hệ số ri:</label>
                          <input
                            type="number"
                            value={selectedProduct.coefficient || '1'}
                            onChange={(e) => handleExistedChange(index, 'coefficient', e.target.value)}
                            className="w-20 p-1 border rounded text-sm"
                            min="1"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <label className="text-sm min-w-[60px]">Số lượng:</label>
                            <input
                              type="number"
                              value={selectedProduct.quantity || '1'}
                              onChange={(e) => handleExistedChange(index, 'quantity', e.target.value)}
                              className="w-20 p-1 border rounded text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-sm min-w-[60px]">Đơn giá:</label>
                            <input
                              type="number"
                              value={selectedProduct.price || '0'}
                              onChange={(e) => handleExistedChange(index, 'price', e.target.value)}
                              className="w-20 p-1 border rounded text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-sm min-w-[60px]">Chiết khấu:</label>
                            <input
                              type="number"
                              value={selectedProduct.discount || ''}
                              onChange={(e) => handleExistedChange(index, 'discount', e.target.value)}
                              onBlur={(e) => handleExistedDiscountChange(index, e.target.value)}
                              className="w-20 p-1 border rounded text-sm"
                            />
                          </div>
                        </div>
                        <p className="mt-2 text-sm">
                          <span className="font-medium">Tổng tiền:</span> {selectedProduct.total || '0'} ¥
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {localNotExist.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Sản phẩm mới</h3>
                  {localNotExist.map((item, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg shadow-sm mb-2 relative">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Sản phẩm: {item.lineNumber}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-red-600 text-sm">Mới</span>
                          <button
                            onClick={() => handleRemoveNotExist(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-sm min-w-[60px]">Mã:</label>
                        <input
                          type="text"
                          value={item.productCode}
                          onChange={(e) => handleNotExistChange(index, 'productCode', e.target.value)}
                          className="flex-1 p-1 border rounded text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-sm min-w-[60px]">Tên:</label>
                        <input
                          type="text"
                          value={item.productDescription || ''}
                          onChange={(e) => handleNotExistChange(index, 'productDescription', e.target.value)}
                          className="flex-1 p-1 border rounded text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-sm min-w-[60px]">Đặc điểm:</label>
                        <input
                          type="text"
                          value={item.productCharacteristic}
                          onChange={(e) => handleNotExistChange(index, 'productCharacteristic', e.target.value)}
                          className="flex-1 p-1 border rounded text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-sm min-w-[60px]">Hệ số ri:</label>
                        <input
                          type="number"
                          value={item.coefficient}
                          onChange={(e) => handleNotExistChange(index, 'coefficient', e.target.value)}
                          className="w-20 p-1 border rounded text-sm"
                          min="1"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <label className="text-sm min-w-[60px]">Số lượng:</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleNotExistChange(index, 'quantity', e.target.value)}
                            className="w-20 p-1 border rounded text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm min-w-[60px]">Đơn giá:</label>
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => handleNotExistChange(index, 'price', e.target.value)}
                            className="w-20 p-1 border rounded text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm min-w-[60px]">Chiết khấu:</label>
                          <input
                            type="number"
                            value={item.discount}
                            onChange={(e) => handleNotExistChange(index, 'discount', e.target.value)}
                            onBlur={(e) => handleNotExistDiscountChange(index, e.target.value)}
                            className="w-20 p-1 border rounded text-sm"
                          />
                        </div>
                      </div>
                      <p className="mt-2 text-sm">
                        <span className="font-medium">Tổng tiền:</span> {item.total} ¥
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-3 flex justify-end gap-2">
          <button
            onClick={() => setShowQuickFillPopup(true)}
            className="px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
          >
            Điền nhanh
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            Lưu
          </button>
        </div>

        {showQuickFillPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-lg p-4 w-full max-w-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Điền nhanh thông tin sản phẩm
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <label className="block text-sm font-medium text-gray-700 min-w-[100px]">
                    Tên sản phẩm
                  </label>
                  <input
                    type="text"
                    value={quickFillName}
                    onChange={(e) => setQuickFillName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nhập tên sản phẩm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="block text-sm font-medium text-gray-700 min-w-[100px]">
                    Hệ số ri
                  </label>
                  <input
                    type="number"
                    value={quickFillCoefficient}
                    onChange={(e) => setQuickFillCoefficient(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nhập hệ số ri"
                    min="1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="block text-sm font-medium text-gray-700 min-w-[100px]">
                    Chiết khấu
                  </label>
                  <input
                    type="number"
                    value={quickFillDiscount}
                    onChange={(e) => setQuickFillDiscount(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nhập chiết khấu"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowQuickFillPopup(false)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
                >
                  Đóng
                </button>
                <button
                  onClick={handleQuickFill}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPreviewPopup;