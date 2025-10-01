import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import DeliveryVehicleCard from '../components/DeliveryVehicleCard';
import AddVehicleModal from '../components/AddVehicleModal';
import './DeliveryFleetPage.css';

const DeliveryFleetPage = () => {
  const { currentUser } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch('http://localhost:3001/deliveryVehicles');
        if (!response.ok) {
          throw new Error('Failed to fetch delivery vehicles.');
        }
        const data = await response.json();
        setVehicles(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  const handleAddVehicle = async (newVehicle) => {
    try {
      const response = await fetch('http://localhost:3001/deliveryVehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVehicle),
      });
      if (!response.ok) throw new Error('Failed to add vehicle.');
      const addedVehicle = await response.json();
      setVehicles([...vehicles, addedVehicle]);
    } catch (err) {
      alert('Failed to add vehicle.');
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    try {
      const response = await fetch(`http://localhost:3001/deliveryVehicles/${vehicleId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete vehicle.');

      setVehicles(vehicles.filter(vehicle => vehicle.id !== vehicleId));
    } catch (err) {
      alert('Failed to delete vehicle.');
    }
  };

  if (!currentUser || currentUser.userType !== 'admin') {
    return <Navigate to="/products" />;
  }

  if (loading) return <div className="page-status">Loading delivery fleet...</div>;
  if (error) return <div className="page-status">Error: {error}</div>;

  return (
    <div className="delivery-fleet-container">
      <h1>Delivery Fleet Management</h1>
      <button className="btn btn-primary add-vehicle-btn" onClick={() => setIsAddModalOpen(true)}>
        Add New Vehicle
      </button>
      <AddVehicleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddVehicle}
      />
      <div className="vehicle-list">
        {vehicles.length === 0 ? (
          <p>No vehicles in the fleet yet.</p>
        ) : (
          vehicles.map(vehicle => (
            <DeliveryVehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onDelete={handleDeleteVehicle}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default DeliveryFleetPage;