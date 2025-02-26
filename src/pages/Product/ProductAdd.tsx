import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Camera, 
  Upload, 
  Package, 
  Tag, 
  DollarSign, 
  Ruler, 
  FileText,
  Save,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createProduct, getCategories, getMeasurementUnits } from '../../services/product';
import { useLanguage } from '../../contexts/LanguageContext';
import type { MeasurementUnit } from '../../services/product';

interface Category {
  id: string;
  name: string;
}

interface ProductFormData {
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

const MAX_IMAGES = 5;
const MAX_DESCRIPTION_LENGTH = 500;

export default function ProductAdd() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [measurementUnits, setMeasurementUnits] = useState<MeasurementUnit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUnits, setIsLoadingUnits] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ProductFormData>({
    images: [],
    code: '',
    name: '',
    category: '',
    purchasePrice: 0,
    sellingPrice: 0,
    measurementUnit: '',
    riCoefficient: 0,
    description: ''
  });

  const [errors, setErrors] = useState({
    images: '',
    code: '',
    name: '',
    category: '',
    sellingPrice: '',
    measurementUnit: ''
  });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load categories
        const categoryData = await getCategories();
        setCategories(categoryData);

        // Load measurement units
        setIsLoadingUnits(true);
        const unitData = await getMeasurementUnits();
        setMeasurementUnits(unitData);
        
        // Set first unit as default if available
        if (unitData.length > 0) {
          setFormData(prev => ({ ...prev, measurementUnit: unitData[0].id }));
        }
      } catch (error) {
        toast.error('Failed to load form data');
      } finally {
        setIsLoadingUnits(false);
      }
    };

    loadInitialData();
  }, []);

  const validateForm = () => {
    const newErrors = {
      images: '',
      code: '',
      name: '',
      category: '',
      sellingPrice: '',
      measurementUnit: ''
    };

    if (formData.code.trim() === '') {
      newErrors.code = 'Product code is required';
    }

    if (formData.name.trim().length < 3) {
      newErrors.name = 'Product name must be at least 3 characters';
    }

    if (formData.category === '') {
      newErrors.category = 'Please select a category';
    }

    if (formData.sellingPrice <= 0) {
      newErrors.sellingPrice = 'Selling price is required';
    }

    if (formData.measurementUnit === '') {
      newErrors.measurementUnit = 'Please select a measurement unit';
    }

    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + formData.images.length > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/');
      if (!isValid) {
        toast.error(`${file.name} is not a valid image file`);
      }
      return isValid;
    });

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...validFiles]
    }));

    // Create preview URLs
    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));

    // Revoke the URL to prevent memory leaks
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await createProduct({
        ...formData,
        purchasePrice: Number(formData.purchasePrice),
        sellingPrice: Number(formData.sellingPrice),
        riCoefficient: Number(formData.riCoefficient)
      });

      toast.success('Product created successfully');
      navigate('/products');
    } catch (error) {
      toast.error('Failed to create product');
    } finally {
      setIsLoading(false);
      setShowConfirmation(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate('/products')}
          className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Products
        </button>

        <button
          onClick={() => setShowConfirmation(true)}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Product
        </button>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Product</h2>

        {/* Image Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Images ({formData.images.length}/{MAX_IMAGES})
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {formData.images.length < MAX_IMAGES && (
              <div className="aspect-square">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="mt-2 text-sm text-gray-500">Upload Image</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            )}
          </div>
          {errors.images && (
            <p className="mt-1 text-sm text-red-600">{errors.images}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Code *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.trim() }))}
                onBlur={() => validateForm()}
                placeholder="Enter product code..."
                className={`block w-full pl-10 pr-3 py-2 border ${
                  errors.code ? 'border-red-300' : 'border-gray-300'
                } rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm`}
              />
              <Package className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            {errors.code && (
              <p className="mt-1 text-sm text-red-600">{errors.code}</p>
            )}
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                onBlur={() => validateForm()}
                placeholder="Enter product name..."
                className={`block w-full pl-10 pr-3 py-2 border ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                } rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm`}
              />
              <Tag className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <div className="relative">
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                onBlur={() => validateForm()}
                className={`block w-full pl-10 pr-3 py-2 border ${
                  errors.category ? 'border-red-300' : 'border-gray-300'
                } rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none`}
              >
                <option value="">Select category...</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <Tag className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category}</p>
            )}
          </div>

          {/* Purchase Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purchase Price
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.purchasePrice}
                onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: Number(e.target.value) }))}
                min="0"
                step="0.01"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-right"
              />
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Selling Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Selling Price *
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.sellingPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: Number(e.target.value) }))}
                onBlur={() => validateForm()}
                min="0"
                step="0.01"
                className={`block w-full pl-10 pr-3 py-2 border ${
                  errors.sellingPrice ? 'border-red-300' : 'border-gray-300'
                } rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-right`}
              />
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            {errors.sellingPrice && (
              <p className="mt-1 text-sm text-red-600">{errors.sellingPrice}</p>
            )}
          </div>

          {/* Measurement Unit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Measurement Unit *
            </label>
            <div className="relative">
              <select
                value={formData.measurementUnit}
                onChange={(e) => setFormData(prev => ({ ...prev, measurementUnit: e.target.value }))}
                onBlur={() => validateForm()}
                disabled={isLoadingUnits}
                className={`block w-full pl-10 pr-3 py-2 border ${
                  errors.measurementUnit ? 'border-red-300' : 'border-gray-300'
                } rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none disabled:bg-gray-50`}
              >
                <option value="">Select unit...</option>
                {measurementUnits.map(unit => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
              <Ruler className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            {errors.measurementUnit && (
              <p className="mt-1 text-sm text-red-600">{errors.measurementUnit}</p>
            )}
          </div>

          {/* Ri Coefficient */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ri Coefficient
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.riCoefficient}
                onChange={(e) => setFormData(prev => ({ ...prev, riCoefficient: Number(e.target.value) }))}
                min="0"
                step="0.01"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-right"
              />
              <Ruler className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <div className="relative">
            <textarea
              value={formData.description}
              onChange={(e) => {
                if (e.target.value.length <= MAX_DESCRIPTION_LENGTH) {
                  setFormData(prev => ({ ...prev, description: e.target.value }));
                }
              }}
              placeholder="Enter description"
              rows={4}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm resize-y"
            />
            <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {formData.description.length}/{MAX_DESCRIPTION_LENGTH} characters
          </p>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirm Product Creation
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to create this product? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}