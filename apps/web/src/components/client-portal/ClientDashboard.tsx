import React from 'react';

interface ClientDashboardProps {
  clientId: string;
  onNavigate: (path: string) => void;
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({ clientId, onNavigate }) => {
  return (
    <div style={{ 
      padding: '2rem', 
      textAlign: 'center',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
      border: '2px dashed #ccc',
      margin: '1rem'
    }}>
      <h2 style={{ color: '#666', marginBottom: '1rem' }}>Client Dashboard</h2>
      <p style={{ color: '#888', fontSize: '1.1rem', marginBottom: '1rem' }}>
        This component is temporarily disabled and requires Material-UI installation or rewrite.
      </p>
      <p style={{ color: '#666', fontSize: '0.9rem' }}>
        Client ID: {clientId}
      </p>
      <button 
        onClick={() => onNavigate('/')} 
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '1rem'
        }}
      >
        Go Back
      </button>
    </div>
  );
};

export default ClientDashboard;