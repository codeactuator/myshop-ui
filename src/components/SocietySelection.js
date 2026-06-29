import React, { useState, useMemo } from 'react';
import './SocietySelection.css';

const SocietyCard = ({ society, onSelect, isSelected }) => (
    <div 
        className={`society-card ${isSelected ? 'selected' : ''}`} 
        onClick={() => onSelect(society.id)}
    >
        <div className="society-card-icon">
            {/* Placeholder for an icon or image */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 21V9l8-6 8 6v12h-6v-7h-4v7H4z"/>
            </svg>
        </div>
        <div className="society-card-name">{society.name}</div>
        {isSelected && (
            <div className="society-card-checkmark">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
            </div>
        )}
    </div>
);

const SocietySelection = ({ societies, onSocietySelect, selectedSocietyId }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSocieties = useMemo(() => {
        if (!searchTerm) {
            return societies;
        }
        return societies.filter(society =>
            society.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [societies, searchTerm]);

    return (
        <div className="society-selection-container">
            <input
                type="text"
                placeholder="Search for your society..."
                className="society-search-input"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
            <div className="society-grid">
                {filteredSocieties.map(society => (
                    <SocietyCard 
                        key={society.id} 
                        society={society} 
                        onSelect={onSocietySelect}
                        isSelected={society.id === selectedSocietyId}
                    />
                ))}
            </div>
        </div>
    );
};

export default SocietySelection;
