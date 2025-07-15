import React from 'react';

interface SecureCommunicationDialogProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  onSuccess: () => void;
}

const SecureCommunicationDialog: React.FC<SecureCommunicationDialogProps> = ({
  open,
  onClose,
  clientId,
  onSuccess
}) => {
  if (!open) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        maxWidth: '500px',
        width: '90%',
        textAlign: 'center',
        border: '2px dashed #ccc'
      }}>
        <h2 style={{ color: '#666', marginBottom: '1rem' }}>Secure Communication Dialog</h2>
        <p style={{ color: '#888', fontSize: '1.1rem', marginBottom: '1rem' }}>
          This component is temporarily disabled and requires Material-UI installation or rewrite.
        </p>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Client ID: {clientId}
        </p>
        <div style={{ 
          backgroundColor: '#e3f2fd', 
          padding: '1rem', 
          borderRadius: '4px', 
          marginBottom: '1.5rem',
          border: '1px solid #bbdefb'
        }}>
          <p style={{ color: '#1976d2', fontSize: '0.9rem', margin: 0 }}>
            🔒 Secure messaging functionality will be available after Material-UI integration
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button 
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
          <button 
            onClick={() => {
              onSuccess();
              onClose();
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Mock Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecureCommunicationDialog;