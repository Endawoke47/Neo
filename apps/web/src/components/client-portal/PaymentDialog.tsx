import React from 'react';

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  payments: any[];
  onSuccess: () => void;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  onClose,
  clientId,
  payments,
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
        <h2 style={{ color: '#666', marginBottom: '1rem' }}>Payment Dialog</h2>
        <p style={{ color: '#888', fontSize: '1.1rem', marginBottom: '1rem' }}>
          This component is temporarily disabled and requires Material-UI installation or rewrite.
        </p>
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            Client ID: {clientId}
          </p>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            Payments: {payments.length} items
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
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Mock Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentDialog;