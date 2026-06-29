import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './SocietyManagementPage.css';

const SocietyManagementPage = () => {
    const [societies, setSocieties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newSocietyName, setNewSocietyName] = useState('');
    const [newSocietyArea, setNewSocietyArea] = useState('');
    const { currentUser } = useAuth();

    useEffect(() => {
        fetchSocieties();
    }, []);

    const fetchSocieties = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/societies`);
            if (!response.ok) {
                throw new Error('Failed to fetch societies');
            }
            const data = await response.json();
            setSocieties(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSociety = async (e) => {
        e.preventDefault();
        if (!newSocietyName) {
            alert('Society name is required.');
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/societies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: newSocietyName, area: newSocietyArea }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to create society' }));
                throw new Error(errorData.message);
            }

            setNewSocietyName('');
            setNewSocietyArea('');
            fetchSocieties(); // Refresh the list
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div className="page-status">Loading societies...</div>;
    if (error) return <div className="page-status">Error: {error}</div>;

    return (
        <div className="society-management-page">
            <header className="page-header">
                <h1>Society Management</h1>
            </header>
            
            <div className="card society-create-form">
                <h2 className="card-header">Create New Society</h2>
                <form onSubmit={handleCreateSociety} className="card-body">
                    {error && <div className="alert alert-danger">{error}</div>}
                    <div className="form-group">
                        <label htmlFor="societyName">Society Name</label>
                        <input
                            id="societyName"
                            type="text"
                            className="form-control"
                            value={newSocietyName}
                            onChange={(e) => setNewSocietyName(e.target.value)}
                            placeholder="e.g., Green Valley Apartments"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="societyArea">Area / Location Description</label>
                        <textarea
                            id="societyArea"
                            className="form-control"
                            value={newSocietyArea}
                            onChange={(e) => setNewSocietyArea(e.target.value)}
                            placeholder="e.g., 'Near Central Park' or specific boundaries"
                            rows="3"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary">Create Society</button>
                </form>
            </div>

            <div className="card society-list-container">
                <h2 className="card-header">Existing Societies</h2>
                <div className="card-body">
                    {societies.length > 0 ? (
                        <ul className="list-group">
                            {societies.map(society => (
                                <li key={society.id} className="list-group-item">
                                    <strong>{society.name}</strong>
                                    <p className="mb-0 text-muted">{society.area || 'No area description'}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No societies found. Use the form above to add one.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SocietyManagementPage;
