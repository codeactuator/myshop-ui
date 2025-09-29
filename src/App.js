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
import AddProductPage from './pages/AddProductPage';
import UpiPaymentPage from './pages/UpiPaymentPage';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './components/MainLayout';
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

  const hasSeenIntro = localStorage.getItem('hasSeenIntro');
  const initialRoute = hasSeenIntro ? "/products" : "/welcome";

  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            {/* Routes without the main navbar */}
            <Route path="/" element={<Navigate to={initialRoute} replace />} />
            <Route path="/welcome" element={<WelcomeScreenWrapper />} />
            <Route path="/intro" element={<AppIntroScreenWrapper />} />

            {/* Routes with the main navbar */}
            <Route element={<MainLayout />}>
              <Route path="/products" element={<ProductListingPage />} />
              <Route path="/products/:productId" element={<ProductDetailsPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order-success" element={<OrderSuccessPage />} />
            <Route path="/my-orders" element={<MyOrdersPage />} />
            <Route path="/orders/:orderId" element={<OrderTrackingPage />} />
            <Route path="/seller/dashboard" element={<SellerDashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/seller/add-product" element={<AddProductPage />} />
            <Route path="/payment/upi/:orderId" element={<UpiPaymentPage />} />
            </Route>
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

// Helper components to handle navigation from older prop-based components
const WelcomeScreenWrapper = () => {
  const navigate = useNavigate();
  return <WelcomeScreen onNavigate={(path) => navigate(path === 'intro' ? '/intro' : '/products')} />;
};

const AppIntroScreenWrapper = () => {
  const navigate = useNavigate();
  const handleDone = () => {
    localStorage.setItem('hasSeenIntro', 'true');
    navigate('/products');
  };
  return <AppIntroScreen onNavigate={handleDone} />;
};

export default App;
