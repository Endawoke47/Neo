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
  Switch,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  Close as CloseIcon,
  Security as SecurityIcon,
  Shield as ShieldIcon,
  Verified as VerifiedIcon,
  Devices as DevicesIcon,
  Visibility as VisibilityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  QrCode as QrCodeIcon,
  Key as KeyIcon,
  Lock as LockIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import QRCode from 'qrcode';
import { SecurityService } from '../services/security.service';

interface SecuritySettingsDialogProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
}

interface SecuritySettings {
  twoFactorAuth: {
    enabled: boolean;
    secret?: string;
    backupCodes?: string[];
    qrCode?: string;
    verified: boolean;
  };
  sessionSettings: {
    timeout: number;
    maxConcurrentSessions: number;
    requireReauth: boolean;
  };
  ipWhitelist: string[];
  deviceTrust: {
    enabled: boolean;
    trustedDevices: {
      id: string;
      name: string;
      fingerprint: string;
      lastUsed: Date;
      trusted: boolean;
    }[];
  };
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    expirationDays: number;
  };
  auditLog: {
    loginAttempts: {
      timestamp: Date;
      ipAddress: string;
      userAgent: string;
      success: boolean;
      failureReason?: string;
    }[];
    securityEvents: {
      id: string;
      type: string;
      description: string;
      timestamp: Date;
      severity: 'low' | 'medium' | 'high' | 'critical';
      metadata: Record<string, any>;
    }[];
  };
}

interface SecurityAudit {
  score: number;
  recommendations: string[];
  vulnerabilities: {
    level: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation: string;
  }[];
  lastAudit: Date;
}

const SETUP_STEPS = [
  'Generate QR Code',
  'Scan with Authenticator',
  'Verify Code',
  'Save Backup Codes',
];

export const SecuritySettingsDialog: React.FC<SecuritySettingsDialogProps> = ({
  open,
  onClose,
  clientId,
}) => {
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [audit, setAudit] = useState<SecurityAudit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | '2fa' | 'devices' | 'audit'>('overview');
  
  // 2FA Setup State
  const [setup2FA, setSetup2FA] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [verificationCode, setVerificationCode] = useState('');
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // Device Trust State
  const [newIpAddress, setNewIpAddress] = useState('');

  const securityService = new SecurityService();

  useEffect(() => {
    if (open) {
      fetchSecuritySettings();
      performSecurityAudit();
    }
  }, [open]);

  const fetchSecuritySettings = async () => {
    try {
      setLoading(true);
      const securitySettings = await securityService.getSecuritySettings(clientId);
      setSettings(securitySettings);
      setError(null);
    } catch (err) {
      setError('Failed to load security settings');
      console.error('Security settings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const performSecurityAudit = async () => {
    try {
      const auditResult = await securityService.performSecurityAudit(clientId);
      setAudit(auditResult);
    } catch (err) {
      console.error('Security audit error:', err);
    }
  };

  const handleSetup2FA = async () => {
    try {
      setLoading(true);
      const twoFactorAuth = await securityService.setupTwoFactorAuth(clientId);
      
      setQrCodeData(twoFactorAuth.qrCode || '');
      setBackupCodes(twoFactorAuth.backupCodes || []);
      setSetup2FA(true);
      setActiveStep(0);
      setError(null);
    } catch (err) {
      setError('Failed to setup two-factor authentication');
      console.error('2FA setup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode.trim()) {
      setError('Please enter verification code');
      return;
    }

    try {
      setLoading(true);
      const result = await securityService.verifyTwoFactorAuth(clientId, verificationCode);
      
      if (result.success) {
        setSetup2FA(false);
        setActiveStep(0);
        setVerificationCode('');
        await fetchSecuritySettings();
        setError(null);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to verify two-factor authentication');
      console.error('2FA verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSecuritySettings = async (updatedSettings: Partial<SecuritySettings>) => {
    try {
      setLoading(true);
      const newSettings = await securityService.updateSecuritySettings(clientId, updatedSettings);
      setSettings(newSettings);
      await performSecurityAudit();
      setError(null);
    } catch (err) {
      setError('Failed to update security settings');
      console.error('Update settings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToIPWhitelist = async () => {
    if (!newIpAddress.trim() || !settings) return;

    const updatedSettings = {
      ipWhitelist: [...settings.ipWhitelist, newIpAddress.trim()],
    };

    await updateSecuritySettings(updatedSettings);
    setNewIpAddress('');
  };

  const removeFromIPWhitelist = async (ip: string) => {
    if (!settings) return;

    const updatedSettings = {
      ipWhitelist: settings.ipWhitelist.filter(existingIp => existingIp !== ip),
    };

    await updateSecuritySettings(updatedSettings);
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const renderOverview = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SecurityIcon color="primary" />
        Security Overview
      </Typography>

      {audit && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Security Score</Typography>
              <Chip
                label={`${audit.score}/100`}
                color={getSecurityScoreColor(audit.score)}
                size="large"
                icon={<ShieldIcon />}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Last audit: {format(new Date(audit.lastAudit), 'MMM dd, yyyy • h:mm a')}
            </Typography>
            
            {audit.vulnerabilities.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Security Issues
                </Typography>
                {audit.vulnerabilities.map((vuln, index) => (
                  <Alert
                    key={index}
                    severity={getSeverityColor(vuln.level) as any}
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="body2" fontWeight="bold">
                      {vuln.description}
                    </Typography>
                    <Typography variant="body2">
                      {vuln.recommendation}
                    </Typography>
                  </Alert>
                ))}
              </Box>
            )}

            {audit.recommendations.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Recommendations
                </Typography>
                <List dense>
                  {audit.recommendations.map((rec, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={rec} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <VerifiedIcon color={settings?.twoFactorAuth.enabled ? 'success' : 'disabled'} />
                <Typography variant="subtitle1">Two-Factor Authentication</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {settings?.twoFactorAuth.enabled ? 'Enabled' : 'Disabled'}
              </Typography>
              <Button
                size="small"
                onClick={() => setActiveTab('2fa')}
                sx={{ mt: 1 }}
              >
                Manage
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <DevicesIcon color={settings?.deviceTrust.enabled ? 'success' : 'disabled'} />
                <Typography variant="subtitle1">Device Trust</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {settings?.deviceTrust.trustedDevices.length || 0} trusted devices
              </Typography>
              <Button
                size="small"
                onClick={() => setActiveTab('devices')}
                sx={{ mt: 1 }}
              >
                Manage
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LockIcon color="primary" />
                <Typography variant="subtitle1">Session Settings</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Timeout: {settings?.sessionSettings.timeout || 60} minutes
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <HistoryIcon color="primary" />
                <Typography variant="subtitle1">Audit Log</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {settings?.auditLog.securityEvents.length || 0} recent events
              </Typography>
              <Button
                size="small"
                onClick={() => setActiveTab('audit')}
                sx={{ mt: 1 }}
              >
                View
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const render2FASetup = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <VerifiedIcon color="primary" />
        Two-Factor Authentication
      </Typography>

      {settings?.twoFactorAuth.enabled ? (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CheckCircleIcon color="success" />
              <Typography variant="subtitle1">Two-Factor Authentication is Enabled</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Your account is protected with two-factor authentication.
            </Typography>
            <Button
              variant="outlined"
              color="error"
              onClick={() => {
                // Disable 2FA logic
              }}
            >
              Disable 2FA
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Box>
          {!setup2FA ? (
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Enhance Your Security
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Two-factor authentication adds an extra layer of security to your account.
                  You'll need your password and your phone to sign in.
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleSetup2FA}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <QrCodeIcon />}
                >
                  Setup Two-Factor Authentication
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <Stepper activeStep={activeStep} orientation="vertical">
                  <Step>
                    <StepLabel>Scan QR Code</StepLabel>
                    <StepContent>
                      <Typography variant="body2" gutterBottom>
                        Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                      </Typography>
                      {qrCodeData && (
                        <Box sx={{ textAlign: 'center', my: 2 }}>
                          <img src={qrCodeData} alt="QR Code" style={{ maxWidth: 200 }} />
                        </Box>
                      )}
                      <Button onClick={() => setActiveStep(1)}>
                        I've Scanned the Code
                      </Button>
                    </StepContent>
                  </Step>

                  <Step>
                    <StepLabel>Verify Setup</StepLabel>
                    <StepContent>
                      <Typography variant="body2" gutterBottom>
                        Enter the 6-digit verification code from your authenticator app
                      </Typography>
                      <TextField
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="Enter 6-digit code"
                        fullWidth
                        sx={{ my: 2 }}
                        inputProps={{ maxLength: 6 }}
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button onClick={() => setActiveStep(0)}>
                          Back
                        </Button>
                        <Button
                          variant="contained"
                          onClick={handleVerify2FA}
                          disabled={loading || verificationCode.length !== 6}
                        >
                          {loading ? <CircularProgress size={20} /> : 'Verify'}
                        </Button>
                      </Box>
                    </StepContent>
                  </Step>

                  <Step>
                    <StepLabel>Save Backup Codes</StepLabel>
                    <StepContent>
                      <Typography variant="body2" gutterBottom>
                        Save these backup codes in a safe place. You can use them to access your account
                        if you lose your authenticator device.
                      </Typography>
                      <Paper sx={{ p: 2, my: 2, bgcolor: 'grey.50' }}>
                        {backupCodes.map((code, index) => (
                          <Typography key={index} variant="body2" fontFamily="monospace">
                            {code}
                          </Typography>
                        ))}
                      </Paper>
                      <Button
                        variant="contained"
                        onClick={() => {
                          // Download backup codes
                          const element = document.createElement('a');
                          const file = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
                          element.href = URL.createObjectURL(file);
                          element.download = 'counselflow-backup-codes.txt';
                          document.body.appendChild(element);
                          element.click();
                          document.body.removeChild(element);
                        }}
                      >
                        Download Backup Codes
                      </Button>
                    </StepContent>
                  </Step>
                </Stepper>
              </CardContent>
            </Card>
          )}
        </Box>
      )}
    </Box>
  );

  const renderDeviceManagement = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <DevicesIcon color="primary" />
        Device & IP Management
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Device Trust
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings?.deviceTrust.enabled || false}
                    onChange={(e) => updateSecuritySettings({
                      deviceTrust: { ...settings?.deviceTrust, enabled: e.target.checked },
                    })}
                  />
                }
                label="Enable device trust"
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                When enabled, you'll be notified when signing in from a new device.
              </Typography>

              {settings?.deviceTrust.trustedDevices && settings.deviceTrust.trustedDevices.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Trusted Devices
                  </Typography>
                  <List>
                    {settings.deviceTrust.trustedDevices.map((device) => (
                      <ListItem key={device.id}>
                        <ListItemText
                          primary={device.name}
                          secondary={`Last used: ${format(new Date(device.lastUsed), 'MMM dd, yyyy')}`}
                        />
                        <ListItemSecondaryAction>
                          <Chip
                            label={device.trusted ? 'Trusted' : 'Untrusted'}
                            color={device.trusted ? 'success' : 'warning'}
                            size="small"
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                IP Whitelist
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Only allow access from specific IP addresses.
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  value={newIpAddress}
                  onChange={(e) => setNewIpAddress(e.target.value)}
                  placeholder="Enter IP address"
                  size="small"
                  fullWidth
                />
                <Button
                  variant="outlined"
                  onClick={addToIPWhitelist}
                  disabled={!newIpAddress.trim()}
                >
                  Add
                </Button>
              </Box>

              {settings?.ipWhitelist && settings.ipWhitelist.length > 0 && (
                <List>
                  {settings.ipWhitelist.map((ip, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={ip} />
                      <ListItemSecondaryAction>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => removeFromIPWhitelist(ip)}
                        >
                          Remove
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderAuditLog = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <HistoryIcon color="primary" />
        Security Audit Log
      </Typography>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Recent Security Events
          </Typography>
          <List>
            {settings?.auditLog.securityEvents.slice(0, 10).map((event) => (
              <React.Fragment key={event.id}>
                <ListItem>
                  <ListItemText
                    primary={event.description}
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(event.timestamp), 'MMM dd, yyyy • h:mm a')}
                        </Typography>
                        <br />
                        <Chip
                          label={event.severity}
                          size="small"
                          color={getSeverityColor(event.severity)}
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    }
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );

  if (loading && !settings) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent sx={{ textAlign: 'center', p: 4 }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading Security Settings...
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '80vh', display: 'flex', flexDirection: 'column' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Security Settings</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {error && (
        <Alert severity="error" sx={{ mx: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1, px: 2 }}>
          {[
            { key: 'overview', label: 'Overview', icon: <SecurityIcon /> },
            { key: '2fa', label: '2FA', icon: <VerifiedIcon /> },
            { key: 'devices', label: 'Devices', icon: <DevicesIcon /> },
            { key: 'audit', label: 'Audit', icon: <HistoryIcon /> },
          ].map(({ key, label, icon }) => (
            <Button
              key={key}
              startIcon={icon}
              onClick={() => setActiveTab(key as any)}
              variant={activeTab === key ? 'contained' : 'text'}
              size="small"
              sx={{ mb: 1 }}
            >
              {label}
            </Button>
          ))}
        </Box>
      </Box>

      <DialogContent sx={{ flex: 1, p: 0, overflow: 'auto' }}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === '2fa' && render2FASetup()}
        {activeTab === 'devices' && renderDeviceManagement()}
        {activeTab === 'audit' && renderAuditLog()}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={performSecurityAudit} disabled={loading}>
          {loading ? <CircularProgress size={20} /> : 'Run Security Audit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SecuritySettingsDialog;
