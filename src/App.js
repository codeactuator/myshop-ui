import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import './App.css';
import SplashScreen from './pages/SplashScreen';
import WelcomeScreen from './pages/WelcomeScreen';
import AppIntroScreen from './pages/AppIntroScreen';
import ProductListingPage from './pages/ProductListingPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import MyOrdersPage from './pages/MyOrdersPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import SellerDashboardPage from './pages/SellerDashboardPage';
import ProfilePage from './pages/ProfilePage';
import InventoryPage from './pages/InventoryPage';
import UserManagementPage from './pages/UserManagementPage';
import DeliveryFleetPage from './pages/DeliveryFleetPage';
import DeliveryPartnerDashboardPage from './pages/DeliveryPartnerDashboardPage';
import DeliveryOrderTrackingPage from './pages/DeliveryOrderTrackingPage';
import SellerProductDetailsPage from './pages/SellerProductDetailsPage';
import SellerOrderDetailsPage from './pages/SellerOrderDetailsPage';
import AdminOrderDetailsPage from './pages/AdminOrderDetailsPage';
import AdminProductDetailsPage from './pages/AdminProductDetailsPage';
import ProductManagementPage from './pages/ProductManagementPage';
import TransactionManagementPage from './pages/TransactionManagementPage';
import ReportsPage from './pages/ReportsPage';
import DashboardHomePage from './pages/DashboardHomePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import EditProductPage from './pages/EditProductPage';
import AddProductPage from './pages/AddProductPage';
import UpiPaymentPage from './pages/UpiPaymentPage';
import ShopConfigPage from './pages/ShopConfigPage';
import ShopPage from './pages/ShopPage';
import SocietyManagementPage from './pages/SocietyManagementPage';
import { AuthProvider } from './context/AuthContext';
import { MessageProvider } from './context/MessageContext';
import { CartProvider } from './context/CartContext';
import MainLayout from './components/MainLayout';
import ProfileGate from './components/ProfileGate';
import { useNavigate } from 'react-router-dom';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000); // Splash screen timeout

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <SplashScreen />;
  }

  const initialRoute = "/products";

  return (
    <AuthProvider>
      <MessageProvider>
        <CartProvider>
          <Router>
            <Routes>
              {/* Routes without the main navbar */}
              <Route path="/" element={<Navigate to={initialRoute} replace />} />
              <Route path="/welcome" element={<WelcomeScreen />} />
              <Route path="/intro" element={<AppIntroScreenWrapper />} />

              {/* Routes with the main navbar */}
              <Route element={<MainLayout />}>
                {/* Keep ProfilePage accessible without ProfileGate to avoid redirect loops */}
                <Route path="/profile" element={<ProfilePage />} />

                {/* Profile Gated Routes */}
                <Route element={<ProfileGate />}>
                  <Route path="/products" element={<ProductListingPage />} />
                  <Route path="/products/:productId" element={<ProductDetailsPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/order-success" element={<OrderSuccessPage />} />
                  <Route path="/my-orders" element={<MyOrdersPage />} />
                  <Route path="/seller/products/:productId" element={<SellerProductDetailsPage />} />
                  <Route path="/seller/orders/:orderId" element={<SellerOrderDetailsPage />} />
                  <Route path="/orders/:orderId" element={<OrderTrackingPage />} />
                  <Route path="/delivery/dashboard" element={<DeliveryPartnerDashboardPage />} />
                  <Route path="/delivery/orders/:orderId" element={<DeliveryOrderTrackingPage />} />
                  <Route path="/seller/dashboard" element={<SellerDashboardPage />} />
                  <Route path="/seller/inventory" element={<InventoryPage />} />
                  <Route path="/seller/edit-product/:productId" element={<EditProductPage />} />
                  <Route path="/seller/add-product" element={<AddProductPage />} />
                  <Route path="/seller/shop-config" element={<ShopConfigPage />} />
                  <Route path="/shops/:sellerId" element={<ShopPage />} />
                  <Route path="/payment/upi/:orderId" element={<UpiPaymentPage />} />
                </Route>
              </Route>

              {/* Admin Routes (outside of MainLayout) */}
              <Route path="/admin/dashboard" element={<AdminDashboardPage />}>
                <Route index element={<DashboardHomePage />} />
                <Route path="users" element={<UserManagementPage />} />
                <Route path="products/:productId" element={<AdminProductDetailsPage />} />
                <Route path="orders/:orderId" element={<AdminOrderDetailsPage />} />
                <Route path="products" element={<ProductManagementPage />} />
                <Route path="orders" element={<TransactionManagementPage />} />
                <Route path="delivery-fleet" element={<DeliveryFleetPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="societies" element={<SocietyManagementPage />} />
              </Route>
            </Routes>
          </Router>
        </CartProvider>
      </MessageProvider>
    </AuthProvider>
  );
}

// Helper components to handle navigation from older prop-based components
const AppIntroScreenWrapper = () => {
  const navigate = useNavigate();
  const handleDone = () => {
    localStorage.setItem('hasSeenIntro', 'true');
    navigate('/products');
  };
  return <AppIntroScreen onNavigate={handleDone} />;
};

export default App;
