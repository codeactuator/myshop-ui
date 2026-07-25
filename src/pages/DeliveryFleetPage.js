import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';
import { Navigate, Link, useOutletContext } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './DeliveryFleetPage.css';
import L from 'leaflet';

// Fix for default marker icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});
const DeliveryFleetPage = () => {
  const { currentUser } = useAuth();
  const { showMessage } = useMessage();
  // Use the data already fetched by the AdminDashboardPage
  const { deliveryPartners, setDeliveryPartners, orders, loading: dashboardLoading } = useOutletContext() || {};
  
  const [partners, setPartners] = useState(deliveryPartners || []);
  const [newPartner, setNewPartner] = useState({ name: '', phone: '' });
  const [editingPartner, setEditingPartner] = useState(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);
  const partnerCardRefs = useRef({});

  // Sync local state with context updates
  useEffect(() => {
    if (deliveryPartners) {
      setPartners(deliveryPartners);
    }
  }, [deliveryPartners]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPartner(prev => ({ ...prev, [name]: value }));
  };

  const handleAddPartner = async (e) => {
    e.preventDefault();
    if (!newPartner.name || !newPartner.phone) {
      showMessage('Validation Error', 'Please fill in all fields.');
      return;
    }

    const partnerPayload = {
      ...newPartner,
      available: true,
      activeDeliveries: 0,
      location: { lat: 12.9716, lng: 77.5946 } // Default location
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/delivery/partners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partnerPayload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to add partner.');
      }
      const addedPartner = await response.json();
      const updatedFleet = [...partners, addedPartner];
      setPartners(updatedFleet);
      setDeliveryPartners(updatedFleet);
      setNewPartner({ name: '', phone: '' }); // Reset form
    } catch (err) {
      showMessage('Error', err.message);
    }
  };

  const handleToggleAvailability = async (partnerId, currentAvailability) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/delivery/partners/${partnerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !currentAvailability }),
      });
      if (!response.ok) throw new Error('Failed to update partner status.');
      const updatedPartner = await response.json();
      // Correctly merge the updated fields into the existing partner object
      // to preserve the enriched data (like name, phone).
      setPartners(partners.map(p => 
        p.id === partnerId ? { ...p, ...updatedPartner } : p
      ));
      setDeliveryPartners(partners.map(p => p.id === partnerId ? { ...p, ...updatedPartner } : p));
    } catch (err) {
      showMessage('Error', err.message);
    }
  };

  const handleUpdatePartner = async (e) => {
    e.preventDefault();
    if (!editingPartner || !editingPartner.name || !editingPartner.phone) {
      showMessage('Validation Error', 'Please fill in all fields.');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/delivery/partners/${editingPartner.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingPartner.name, phone: editingPartner.phone }),
      });
      if (!response.ok) throw new Error('Failed to update partner.');
      const updatedPartner = await response.json();
      setPartners(partners.map(p => p.id === editingPartner.id ? updatedPartner : p));
      setDeliveryPartners(partners.map(p => p.id === editingPartner.id ? updatedPartner : p));
      setEditingPartner(null); // Close modal
    } catch (err) {
      showMessage('Error', err.message);
    }
  };

  const handlePartnerSelect = (partnerId) => {
    setSelectedPartnerId(partnerId);
    const card = partnerCardRefs.current[partnerId];
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (!currentUser || currentUser.userType?.toLowerCase() !== 'admin') {
    return <Navigate to="/products" />;
  }

  // If the dashboard is still loading its initial batch of data
  if (dashboardLoading) return <div className="page-status">Loading fleet data...</div>;

  return (
    <div className="delivery-fleet-container">
      <h1>Delivery Fleet Management</h1>

      <div className="map-view-container">
        <h2>Partner Locations</h2>
        <MapContainer center={[12.9716, 77.5946]} zoom={13} scrollWheelZoom={true} className="fleet-map">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {partners.filter(p => p.location).map(partner => (
            <Marker 
              key={partner.id} 
              position={[partner.location.lat, partner.location.lng]}
              icon={new L.Icon.Default()}
              eventHandlers={{ click: () => handlePartnerSelect(partner.id) }}
            >
              <Popup>
                <strong>{partner.name}</strong><br />
                Status: {partner.available ? 'Available' : 'Unavailable'}<br />
                Active Deliveries: {orders.filter(o => o.deliveryPartnerId === partner.id && (o.status === 'PREPARING' || o.status === 'OUT_FOR_DELIVERY')).length}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="add-partner-form">
        <h2>Add New Partner</h2>
        <form onSubmit={handleAddPartner}>
          <input type="text" name="name" value={newPartner.name} onChange={handleInputChange} placeholder="Partner Name" required />
          <input type="tel" name="phone" value={newPartner.phone} onChange={handleInputChange} placeholder="Phone Number" required />
          <button type="submit" className="btn btn-primary">Add Partner</button>
        </form>
      </div>

      <div className="partner-list">
        <h2>Current Partners</h2>
        {partners.length === 0 ? (
          <p>No delivery partners in the fleet yet.</p>
        ) : (
          partners.map(partner => (
            <div 
              key={partner.id} 
              className={`partner-card ${selectedPartnerId === partner.id ? 'highlighted' : ''}`}
              ref={el => (partnerCardRefs.current[partner.id] = el)}
              onClick={() => handlePartnerSelect(partner.id)}
            >
              <div className="partner-info">
                <h3>{partner.name}</h3>
                <p>Phone: {partner.phone}</p>
                <p>Active Deliveries: {orders.filter(o => o.deliveryPartnerId === partner.id && (o.status === 'PREPARING' || o.status === 'OUT_FOR_DELIVERY')).length}</p>
                <p>Status: <span className={partner.available ? 'status-available' : 'status-unavailable'}>{partner.available ? 'Available' : 'Unavailable'}</span></p>
                <div className="partner-actions">
                  <button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); handleToggleAvailability(partner.id, partner.available); }}>Toggle Availability</button>
                  <button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); setEditingPartner(partner); }}>Edit</button>
                </div>
              </div>
              <div className="assigned-orders">
                <h4>Assigned Orders</h4>
                {orders.filter(o => o.deliveryPartnerId === partner.id && (o.status === 'PREPARING' || o.status === 'OUT_FOR_DELIVERY')).length > 0 ? (
                  <ul className="assigned-orders-list">
                    {orders.filter(o => o.deliveryPartnerId === partner.id && (o.status === 'PREPARING' || o.status === 'OUT_FOR_DELIVERY')).map(order => (
                      <li key={order.id} className="assigned-order-item">
                        <Link to={`/admin/dashboard/orders/${order.id}`}>Order #{order.id}</Link> - <span className={`status-badge status-${order.status}`}>{order.status.replace('_', ' ')}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-orders-text">No active orders assigned.</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {editingPartner && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">Edit Partner</h2>
            <form onSubmit={handleUpdatePartner}>
              <div className="form-group">
                <label htmlFor="edit-name">Name</label>
                <input id="edit-name" type="text" value={editingPartner.name} onChange={(e) => setEditingPartner({...editingPartner, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label htmlFor="edit-phone">Phone</label>
                <input id="edit-phone" type="tel" value={editingPartner.phone} onChange={(e) => setEditingPartner({...editingPartner, phone: e.target.value})} required />
              </div>
              <div className="modal-actions"><button type="submit" className="btn btn-primary">Save Changes</button><button type="button" className="btn btn-secondary" onClick={() => setEditingPartner(null)}>Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryFleetPage;