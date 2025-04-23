import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LanguageProvider } from './contexts/LanguageContext';
import { UserProvider } from './contexts/UserContext';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Overview/Dashboard';
import Products from './pages/Product/Products';
import ProductDetail from './pages/Product/ProductDetail';
import ProductAdd from './pages/Product/ProductAdd';
import ProductUpdate from './pages/Product/ProductUpdate';
import Orders from './pages/Order/Orders';
import OrderDetail from './pages/Order/OrderDetail';
import OrderAdd from './pages/Order/OrderAdd';
import OrderUpdate from './pages/Order/OrderUpdate';
import Partners from './pages/Partner/Partners';
import PartnerDetail from './pages/Partner/PartnerDetail';
import PartnerAdd from './pages/Partner/PartnerAdd';
import PartnerUpdate from './pages/Partner/PartnerUpdate';
import CashReceipts from './pages/CashReceipt/CashReceipts';
import CashReceiptDetailPage from './pages/CashReceipt/CashReceiptDetail';
import CashReceiptAdd from './pages/CashReceipt/CashReceiptAdd';
import CashReceiptUpdate from './pages/CashReceipt/CashReceiptUpdate';
import TransferReceipts from './pages/TransferReceipt/TransferCollection';
import TransferReceiptDetailPage from './pages/TransferReceipt/TransferReceiptDetail';
import TransferReceiptAdd from './pages/TransferReceipt/TransferReceiptAdd';
import TransferReceiptUpdate from './pages/TransferReceipt/TransferReceiptUpdate';
import SupplierInvoices from './pages/SupplierInvoice/SupplierInvoices';
import SupplierInvoiceDetail from './pages/SupplierInvoice/SupplierInvoiceDetail';
import SupplierInvoiceAdd from './pages/SupplierInvoice/SupplierInvoiceAdd';
import SupplierInvoiceUpdate from './pages/SupplierInvoice/SupplierInvoiceUpdate';
import Employees from './pages/Employee/Employees';
import EmployeeDetail from './pages/Employee/EmployeeDetail';
import EmployeeAdd from './pages/Employee/EmployeeAdd';
import EmployeeUpdate from './pages/Employee/EmployeeUpdate';
import Currency from './pages/Currency/Currency';
import CurrencyDetail from './pages/Currency/CurrencyDetail';
import CurrencyAdd from './pages/Currency/CurrencyAdd';
import CurrencyUpdate from './pages/Currency/CurrencyUpdate';
import Profile from './pages/Profile/Profile';
import ProfileUpdate from './pages/Profile/ProfileUpdate';
import Layout from './components/Layout';

export default function App() {
  return (
    <LanguageProvider>
      <UserProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/products" element={<Layout><Products /></Layout>} />
            <Route path="/products/add" element={<Layout><ProductAdd /></Layout>} />
            <Route path="/products/:id" element={<Layout><ProductDetail /></Layout>} />
            <Route path="/products/edit/:id" element={<Layout><ProductUpdate /></Layout>} />
            <Route path="/orders" element={<Layout><Orders /></Layout>} />
            <Route path="/orders/add" element={<Layout><OrderAdd /></Layout>} />
            <Route path="/orders/:id" element={<Layout><OrderDetail /></Layout>} />
            <Route path="/orders/edit/:id" element={<Layout><OrderUpdate /></Layout>} />
            <Route path="/partners" element={<Layout><Partners /></Layout>} />
            <Route path="/partners/add" element={<Layout><PartnerAdd /></Layout>} />
            <Route path="/partners/:id" element={<Layout><PartnerDetail /></Layout>} />
            <Route path="/partners/edit/:id" element={<Layout><PartnerUpdate /></Layout>} />
            <Route path="/employees" element={<Layout><Employees /></Layout>} />
            <Route path="/employees/add" element={<Layout><EmployeeAdd /></Layout>} />
            <Route path="/employees/:id" element={<Layout><EmployeeDetail /></Layout>} />
            <Route path="/employees/edit/:id" element={<Layout><EmployeeUpdate /></Layout>} />
            <Route path="/supplier-invoices" element={<Layout><SupplierInvoices /></Layout>} />
            <Route path="/supplier-invoices/add" element={<Layout><SupplierInvoiceAdd /></Layout>} />
            <Route path="/supplier-invoices/:id" element={<Layout><SupplierInvoiceDetail /></Layout>} />
            <Route path="/supplier-invoices/edit/:id" element={<Layout><SupplierInvoiceUpdate /></Layout>} />
            <Route path="/cash-receipts" element={<Layout><CashReceipts /></Layout>} />
            <Route path="/cash-receipts/add" element={<Layout><CashReceiptAdd /></Layout>} />
            <Route path="/cash-receipts/:id" element={<Layout><CashReceiptDetailPage /></Layout>} />
            <Route path="/cash-receipts/edit/:id" element={<Layout><CashReceiptUpdate /></Layout>} />
            <Route path="/transfer-receipts" element={<Layout><TransferReceipts /></Layout>} />
            <Route path="/transfer-receipts/add" element={<Layout><TransferReceiptAdd /></Layout>} />
            <Route path="/transfer-receipts/:id" element={<Layout><TransferReceiptDetailPage /></Layout>} />
            <Route path="/transfer-receipts/edit/:id" element={<Layout><TransferReceiptUpdate /></Layout>} />
            <Route path="/currency" element={<Layout><Currency /></Layout>} />
            <Route path="/currency/add" element={<Layout><CurrencyAdd /></Layout>} />
            <Route path="/currency/:id" element={<Layout><CurrencyDetail /></Layout>} />
            <Route path="/currency/edit/:id" element={<Layout><CurrencyUpdate /></Layout>} />
            <Route path="/profile" element={<Layout><Profile /></Layout>} />
            <Route path="/profile/edit" element={<Layout><ProfileUpdate /></Layout>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </UserProvider>
    </LanguageProvider>
  );
}