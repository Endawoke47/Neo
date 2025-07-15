import React from 'react';

interface SecuritySettingsDialogProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
}

const SecuritySettingsDialog: React.FC<SecuritySettingsDialogProps> = ({
  open,
  onClose,
  clientId
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
        <h2 style={{ color: '#666', marginBottom: '1rem' }}>Security Settings Dialog</h2>
        <p style={{ color: '#888', fontSize: '1.1rem', marginBottom: '1rem' }}>
          This component is temporarily disabled and requires Material-UI installation or rewrite.
        </p>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Client ID: {clientId}
        </p>
        <div style={{ 
          backgroundColor: '#fff3cd', 
          padding: '1rem', 
          borderRadius: '4px', 
          marginBottom: '1.5rem',
          border: '1px solid #ffeaa7'
        }}>
          <p style={{ color: '#856404', fontSize: '0.9rem', margin: 0 }}>
            🔐 Security settings including 2FA, device trust, and audit logs will be available after Material-UI integration
          </p>
        </div>
        <button 
          onClick={onClose}
          style={{
            padding: '0.5rem 1.5rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default SecuritySettingsDialog;