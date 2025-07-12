import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Divider,
  TextField,
  Alert,
  CircularProgress,
  Paper,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  Close as CloseIcon,
  Payment as PaymentIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  Security as SecurityIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ClientPortalService } from '../services/client-portal.service';

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  payments: any[];
  onSuccess: () => void;
}

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'bank_account' | 'paypal';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  bankName?: string;
  isDefault: boolean;
}

interface CreditCardForm {
  number: string;
  expiryMonth: string;
  expiryYear: string;
  cvc: string;
  name: string;
  zipCode: string;
}

interface BankAccountForm {
  routingNumber: string;
  accountNumber: string;
  accountType: 'checking' | 'savings';
  accountHolderName: string;
}

const PAYMENT_STEPS = [
  'Select Payment',
  'Choose Method',
  'Review & Confirm',
  'Processing',
  'Complete',
];

export const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  onClose,
  clientId,
  payments,
  onSuccess,
}) => {
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any | null>(null);
  
  // Forms
  const [addingMethod, setAddingMethod] = useState<'credit_card' | 'bank_account' | null>(null);
  const [creditCardForm, setCreditCardForm] = useState<CreditCardForm>({
    number: '',
    expiryMonth: '',
    expiryYear: '',
    cvc: '',
    name: '',
    zipCode: '',
  });
  const [bankAccountForm, setBankAccountForm] = useState<BankAccountForm>({
    routingNumber: '',
    accountNumber: '',
    accountType: 'checking',
    accountHolderName: '',
  });

  const clientPortalService = new ClientPortalService();

  useEffect(() => {
    if (open) {
      fetchPaymentMethods();
    }
  }, [open]);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      // Mock payment methods - replace with actual API call
      setPaymentMethods([
        {
          id: 'pm_1',
          type: 'credit_card',
          last4: '4242',
          brand: 'visa',
          expiryMonth: 12,
          expiryYear: 2025,
          isDefault: true,
        },
        {
          id: 'pm_2',
          type: 'bank_account',
          last4: '6789',
          bankName: 'Chase Bank',
          isDefault: false,
        },
      ]);
      setError(null);
    } catch (err) {
      setError('Failed to load payment methods');
      console.error('Payment methods error:', err);
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async () => {
    if (!selectedPayment || !selectedMethod) return;

    try {
      setProcessing(true);
      setActiveStep(3); // Processing step

      const result = await clientPortalService.processPayment(
        clientId,
        selectedPayment.id,
        selectedMethod,
      );

      setPaymentResult(result);
      setActiveStep(4); // Complete step
      
      if (result.success) {
        onSuccess();
      }
    } catch (err) {
      setError('Payment processing failed');
      console.error('Payment error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const addPaymentMethod = async () => {
    if (!addingMethod) return;

    try {
      setLoading(true);

      let methodData;
      if (addingMethod === 'credit_card') {
        methodData = creditCardForm;
      } else {
        methodData = bankAccountForm;
      }

      // Mock adding payment method - replace with actual API call
      const newMethod: PaymentMethod = {
        id: `pm_${Date.now()}`,
        type: addingMethod,
        last4: methodData.accountNumber?.slice(-4) || methodData.number?.slice(-4) || '0000',
        isDefault: paymentMethods.length === 0,
        ...(addingMethod === 'credit_card' && {
          brand: 'visa',
          expiryMonth: parseInt(creditCardForm.expiryMonth),
          expiryYear: parseInt(creditCardForm.expiryYear),
        }),
        ...(addingMethod === 'bank_account' && {
          bankName: 'Bank',
        }),
      };

      setPaymentMethods([...paymentMethods, newMethod]);
      setAddingMethod(null);
      setCreditCardForm({
        number: '',
        expiryMonth: '',
        expiryYear: '',
        cvc: '',
        name: '',
        zipCode: '',
      });
      setBankAccountForm({
        routingNumber: '',
        accountNumber: '',
        accountType: 'checking',
        accountHolderName: '',
      });
      setError(null);
    } catch (err) {
      setError('Failed to add payment method');
      console.error('Add payment method error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'pending':
        return <ScheduleIcon color="warning" />;
      case 'overdue':
        return <WarningIcon color="error" />;
      default:
        return <PaymentIcon color="action" />;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  const renderSelectPayment = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Select Payment to Process
      </Typography>
      
      <List>
        {payments.filter(p => p.status === 'pending' || p.status === 'overdue').map((payment) => (
          <React.Fragment key={payment.id}>
            <ListItem
              button
              onClick={() => {
                setSelectedPayment(payment);
                setActiveStep(1);
              }}
              selected={selectedPayment?.id === payment.id}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getPaymentStatusIcon(payment.status)}
                    <Typography variant="subtitle1">
                      ${payment.amount.toLocaleString()}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {payment.description}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Due: {format(new Date(payment.dueDate), 'MMM dd, yyyy')}
                    </Typography>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <Chip
                  label={payment.status}
                  color={getPaymentStatusColor(payment.status) as any}
                  size="small"
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>

      {payments.filter(p => p.status === 'pending' || p.status === 'overdue').length === 0 && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No pending payments
          </Typography>
        </Paper>
      )}
    </Box>
  );

  const renderPaymentMethods = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Choose Payment Method
      </Typography>

      {selectedPayment && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Payment Details
            </Typography>
            <Typography variant="h5" color="primary">
              ${selectedPayment.amount.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedPayment.description}
            </Typography>
          </CardContent>
        </Card>
      )}

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Saved Payment Methods
        </Typography>
        
        {paymentMethods.map((method) => (
          <Card
            key={method.id}
            sx={{
              mb: 1,
              cursor: 'pointer',
              border: selectedMethod?.id === method.id ? 2 : 1,
              borderColor: selectedMethod?.id === method.id ? 'primary.main' : 'divider',
            }}
            onClick={() => setSelectedMethod(method)}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {method.type === 'credit_card' ? (
                <CreditCardIcon color="primary" />
              ) : (
                <BankIcon color="primary" />
              )}
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2">
                  {method.type === 'credit_card' 
                    ? `${method.brand?.toUpperCase()} •••• ${method.last4}`
                    : `${method.bankName} •••• ${method.last4}`
                  }
                </Typography>
                {method.type === 'credit_card' && (
                  <Typography variant="caption" color="text.secondary">
                    Expires {method.expiryMonth}/{method.expiryYear}
                  </Typography>
                )}
              </Box>
              {method.isDefault && (
                <Chip label="Default" size="small" color="primary" />
              )}
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<CreditCardIcon />}
          onClick={() => setAddingMethod('credit_card')}
          disabled={addingMethod !== null}
        >
          Add Card
        </Button>
        <Button
          variant="outlined"
          startIcon={<BankIcon />}
          onClick={() => setAddingMethod('bank_account')}
          disabled={addingMethod !== null}
        >
          Add Bank Account
        </Button>
      </Box>

      {addingMethod === 'credit_card' && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Add Credit Card
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Card Number"
                  value={creditCardForm.number}
                  onChange={(e) => setCreditCardForm({ ...creditCardForm, number: e.target.value })}
                  placeholder="1234 5678 9012 3456"
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Expiry Month</InputLabel>
                  <Select
                    value={creditCardForm.expiryMonth}
                    onChange={(e) => setCreditCardForm({ ...creditCardForm, expiryMonth: e.target.value })}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <MenuItem key={i + 1} value={String(i + 1).padStart(2, '0')}>
                        {String(i + 1).padStart(2, '0')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Expiry Year</InputLabel>
                  <Select
                    value={creditCardForm.expiryYear}
                    onChange={(e) => setCreditCardForm({ ...creditCardForm, expiryYear: e.target.value })}
                  >
                    {Array.from({ length: 10 }, (_, i) => (
                      <MenuItem key={i} value={String(new Date().getFullYear() + i)}>
                        {new Date().getFullYear() + i}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="CVC"
                  value={creditCardForm.cvc}
                  onChange={(e) => setCreditCardForm({ ...creditCardForm, cvc: e.target.value })}
                  placeholder="123"
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="ZIP Code"
                  value={creditCardForm.zipCode}
                  onChange={(e) => setCreditCardForm({ ...creditCardForm, zipCode: e.target.value })}
                  placeholder="12345"
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Cardholder Name"
                  value={creditCardForm.name}
                  onChange={(e) => setCreditCardForm({ ...creditCardForm, name: e.target.value })}
                  placeholder="John Doe"
                  fullWidth
                />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button onClick={() => setAddingMethod(null)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={addPaymentMethod}
                disabled={loading || !creditCardForm.number || !creditCardForm.name}
              >
                {loading ? <CircularProgress size={20} /> : 'Add Card'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {addingMethod === 'bank_account' && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Add Bank Account
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Routing Number"
                  value={bankAccountForm.routingNumber}
                  onChange={(e) => setBankAccountForm({ ...bankAccountForm, routingNumber: e.target.value })}
                  placeholder="123456789"
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Account Number"
                  value={bankAccountForm.accountNumber}
                  onChange={(e) => setBankAccountForm({ ...bankAccountForm, accountNumber: e.target.value })}
                  placeholder="123456789012"
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Account Type</InputLabel>
                  <Select
                    value={bankAccountForm.accountType}
                    onChange={(e) => setBankAccountForm({ ...bankAccountForm, accountType: e.target.value as 'checking' | 'savings' })}
                  >
                    <MenuItem value="checking">Checking</MenuItem>
                    <MenuItem value="savings">Savings</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Account Holder Name"
                  value={bankAccountForm.accountHolderName}
                  onChange={(e) => setBankAccountForm({ ...bankAccountForm, accountHolderName: e.target.value })}
                  placeholder="John Doe"
                  fullWidth
                />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button onClick={() => setAddingMethod(null)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={addPaymentMethod}
                disabled={loading || !bankAccountForm.routingNumber || !bankAccountForm.accountNumber}
              >
                {loading ? <CircularProgress size={20} /> : 'Add Account'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button onClick={() => setActiveStep(0)}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={() => setActiveStep(2)}
          disabled={!selectedMethod}
        >
          Continue
        </Button>
      </Box>
    </Box>
  );

  const renderReviewConfirm = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Review & Confirm Payment
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Payment Amount
              </Typography>
              <Typography variant="h4" color="primary" gutterBottom>
                ${selectedPayment?.amount.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedPayment?.description}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Payment Method
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {selectedMethod?.type === 'credit_card' ? (
                  <CreditCardIcon color="primary" />
                ) : (
                  <BankIcon color="primary" />
                )}
                <Typography variant="body1">
                  {selectedMethod?.type === 'credit_card' 
                    ? `${selectedMethod.brand?.toUpperCase()} •••• ${selectedMethod.last4}`
                    : `${selectedMethod?.bankName} •••• ${selectedMethod?.last4}`
                  }
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mt: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <SecurityIcon color="primary" />
          <Typography variant="subtitle2" color="primary">
            Secure Payment Processing
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Your payment information is encrypted and processed securely. You will receive a receipt via email once the payment is completed.
        </Typography>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button onClick={() => setActiveStep(1)}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={processPayment}
          disabled={processing}
          size="large"
        >
          {processing ? <CircularProgress size={20} /> : `Pay $${selectedPayment?.amount.toLocaleString()}`}
        </Button>
      </Box>
    </Box>
  );

  const renderProcessing = () => (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <CircularProgress size={60} sx={{ mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        Processing Payment...
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Please wait while we process your payment. Do not close this window.
      </Typography>
    </Box>
  );

  const renderComplete = () => (
    <Box sx={{ p: 2, textAlign: 'center' }}>
      {paymentResult?.success ? (
        <>
          <CheckCircleIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Payment Successful!
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Your payment of ${selectedPayment?.amount.toLocaleString()} has been processed successfully.
          </Typography>
          <Paper sx={{ p: 2, mt: 2, bgcolor: 'success.50' }}>
            <Typography variant="subtitle2" gutterBottom>
              Transaction Details
            </Typography>
            <Typography variant="body2">
              Transaction ID: {paymentResult.transactionId}
            </Typography>
            <Typography variant="body2">
              Date: {format(new Date(), 'MMM dd, yyyy • h:mm a')}
            </Typography>
          </Paper>
          <Button
            variant="contained"
            startIcon={<ReceiptIcon />}
            sx={{ mt: 2 }}
            onClick={() => {
              // Download receipt logic
            }}
          >
            Download Receipt
          </Button>
        </>
      ) : (
        <>
          <WarningIcon color="error" sx={{ fontSize: 80, mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Payment Failed
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {paymentResult?.error || 'An error occurred while processing your payment.'}
          </Typography>
          <Button
            variant="contained"
            onClick={() => setActiveStep(1)}
            sx={{ mt: 2 }}
          >
            Try Again
          </Button>
        </>
      )}
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh', display: 'flex', flexDirection: 'column' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Process Payment
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {error && (
        <Alert severity="error" sx={{ mx: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ px: 2, pb: 1 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {PAYMENT_STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <DialogContent sx={{ flex: 1, p: 0, overflow: 'auto' }}>
        {activeStep === 0 && renderSelectPayment()}
        {activeStep === 1 && renderPaymentMethods()}
        {activeStep === 2 && renderReviewConfirm()}
        {activeStep === 3 && renderProcessing()}
        {activeStep === 4 && renderComplete()}
      </DialogContent>

      {activeStep === 4 && (
        <DialogActions>
          <Button onClick={onClose} variant="contained">
            Close
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default PaymentDialog;
