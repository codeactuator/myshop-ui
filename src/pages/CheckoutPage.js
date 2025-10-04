import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './CheckoutPage.css';

const CheckoutPage = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' or 'upi'
  const [fulfillmentMethod, setFulfillmentMethod] = useState('delivery'); // 'delivery' or 'pickup'
  const [deliveryOption, setDeliveryOption] = useState('saved'); // 'saved' or 'new'
  const [formData, setFormData] = useState({
    name: '',
    apartmentNumber: '',
    phone: '',
  });

  useEffect(() => {
    // Pre-populate form if a user is logged in
    if (deliveryOption === 'saved' && currentUser) {
      setFormData({
        name: currentUser.name,
        apartmentNumber: currentUser.apartmentNumber,
        phone: currentUser.phone,
      });
    } else {
      // Clear form when switching to 'new address'
      setFormData({ name: '', apartmentNumber: '', phone: '' });
    }
  }, [currentUser, deliveryOption]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    // Determine which address to use for the order
    const deliveryAddress = deliveryOption === 'saved' && currentUser 
      ? { name: currentUser.name, apartmentNumber: currentUser.apartmentNumber, phone: currentUser.phone } 
      : formData;

    const order = {
      userId: currentUser?.id,
      buyerInfo: fulfillmentMethod === 'delivery' ? deliveryAddress : { name: currentUser.name, phone: currentUser.phone },
      fulfillmentMethod: fulfillmentMethod,
      paymentMethod: paymentMethod,
      items: cartItems,
      totalAmount: cartTotal, 
      orderDate: new Date().toISOString(),
      status: 'pending',
      deliveryPartnerId: null,
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });

      if (response.ok) {
        const newOrder = await response.json();
        if (paymentMethod === 'upi') {
          // Do not clear cart yet, redirect to payment page
          navigate(`/payment/upi/${newOrder.id}`);
        } else { // For COD
          clearCart();
          // Pass orderId to the success page
          navigate('/order-success', { state: { orderId: newOrder.id } });
        }
      } else {
        throw new Error('Failed to place order.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('An error occurred while placing your order. Please try again.');
    }
  };

  return (
    <div className="checkout-container">
      <h1>Checkout</h1>
      <div className="checkout-layout">
        <div className="checkout-form-container">
          <form id="checkout-form" onSubmit={handleSubmit}>
            <h2>Fulfillment Method</h2>
            <div className="fulfillment-options">
              <div className="radio-group">
                <input type="radio" id="delivery" name="fulfillmentMethod" value="delivery" checked={fulfillmentMethod === 'delivery'} onChange={() => setFulfillmentMethod('delivery')} />
                <label htmlFor="delivery">Delivery</label>
              </div>
              <div className="radio-group">
                <input type="radio" id="pickup" name="fulfillmentMethod" value="pickup" checked={fulfillmentMethod === 'pickup'} onChange={() => setFulfillmentMethod('pickup')} />
                <label htmlFor="pickup">Pickup</label>
              </div>
            </div>

            {fulfillmentMethod === 'delivery' && (
              <div className="delivery-details-container">
                <h2>Delivery Details</h2>
                <div className="address-options">
                  <div className="radio-group">
                    <input type="radio" id="savedAddress" name="deliveryOption" value="saved" checked={deliveryOption === 'saved'} onChange={() => setDeliveryOption('saved')} disabled={!currentUser} />
                    <label htmlFor="savedAddress">Use Saved Address</label>
                  </div>
                  {deliveryOption === 'saved' && currentUser && (
                    <div className="saved-address-details">
                      <p><strong>{currentUser.name}</strong></p>
                      <p>{currentUser.apartmentNumber}</p>
                      <p>{currentUser.phone}</p>
                    </div>
                  )}
                  <div className="radio-group">
                    <input type="radio" id="newAddress" name="deliveryOption" value="new" checked={deliveryOption === 'new'} onChange={() => setDeliveryOption('new')} />
                    <label htmlFor="newAddress">Add a New Address</label>
                  </div>
                </div>

                {deliveryOption === 'new' && (
                  <div className="new-address-form">
                    <div className="form-group">
                      <label htmlFor="name">Full Name</label>
                      <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="apartmentNumber">Apartment / Flat No.</label>
                      <input type="text" id="apartmentNumber" name="apartmentNumber" value={formData.apartmentNumber} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="phone">Mobile Number</label>
                      <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} required />
                    </div>
                  </div>
                )}
              </div>
            )}

            {fulfillmentMethod === 'pickup' && (
              <div className="pickup-info">
                <h2>Pickup Information</h2>
                <p>You will be notified about the pickup location and time once the seller confirms the order.</p>
              </div>
            )}

            <div className="payment-method-container">
              <h2>Payment Method</h2>
              <div className="payment-options">
                <div className="radio-group">
                  <input type="radio" id="cod" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                  <label htmlFor="cod">Cash on Delivery (COD)</label>
                </div>
                <div className="radio-group">
                  <input type="radio" id="upi" name="paymentMethod" value="upi" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} />
                  <label htmlFor="upi">UPI</label>
                </div>
              </div>
              {paymentMethod === 'upi' && (
                <div className="upi-info">
                  <p>After placing the order, you will be shown a QR code to complete the payment.</p>
                </div>
              )}
            </div>
          </form>
        </div>
        <div className="checkout-summary-container">
          <h2>Order Summary</h2>
          {cartItems.map(item => (
            <div key={item.id} className="summary-item">
              <span>{item.name} (x{item.quantity})</span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="summary-total">
            <strong>Total</strong>
            <strong>${cartTotal.toFixed(2)}</strong>
          </div>
          <button type="submit" form="checkout-form" className="btn btn-primary place-order-btn">Place Order</button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;