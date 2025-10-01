import React, { useState } from 'react';
import './AddVehicleModal.css';

const AddVehicleModal = ({ isOpen, onClose, onAdd }) => {
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [vehicleType, setVehicleType] = useState('bike');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (vehicleNumber.trim() === '') {
            alert('Please enter a vehicle number.');
            return;
        }
        onAdd({ vehicleNumber, vehicleType });
        onClose(); // Close the modal
    };

    return (
        <div className={`modal ${isOpen ? 'is-active' : ''}`}>
            <div className="modal-background" onClick={onClose}></div>
            <div className="modal-content">
                <h2 className="modal-title">Add New Vehicle</h2>
                <form onSubmit={handleSubmit} className="add-vehicle-form">
                    <div className="form-group">
                        <label htmlFor="vehicleNumber">Vehicle Number</label>
                        <input
                            type="text"
                            id="vehicleNumber"
                            value={vehicleNumber}
                            onChange={(e) => setVehicleNumber(e.target.value)}
                            placeholder="e.g., UP32 AB 1234"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="vehicleType">Vehicle Type</label>
                        <select id="vehicleType" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
                            <option value="bike">Bike</option>
                            <option value="scooter">Scooter</option>
                            <option value="van">Van</option>
                            <option value="truck">Truck</option>
                        </select>
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary">Add Vehicle</button>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
            <button className="modal-close is-large" aria-label="close" onClick={onClose}></button>
        </div>
    );
};

export default AddVehicleModal;