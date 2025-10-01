import React from 'react';
import './DeliveryVehicleCard.css';

const DeliveryVehicleCard = ({ vehicle, onDelete }) => {
  const { id, vehicleNumber, vehicleType } = vehicle;

  const handleDeleteClick = () => {
    if (window.confirm(`Are you sure you want to delete vehicle ${vehicleNumber}?`)) {
      onDelete(id);
    }
  };

  return (
    <div className="vehicle-card">
      <div className="vehicle-info">
        <h3>{vehicleNumber}</h3>
        <p><strong>Type:</strong> {vehicleType}</p>
      </div>
      <div className="vehicle-actions">
        <button
          className="btn btn-danger delete-vehicle-btn"
          onClick={handleDeleteClick}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default DeliveryVehicleCard;