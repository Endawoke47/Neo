import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  Fab,
  Badge,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Gavel as GavelIcon,
  Description as DocumentIcon,
  Message as MessageIcon,
  Payment as PaymentIcon,
  Event as EventIcon,
  Notifications as NotificationIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { ClientPortalService } from '../services/client-portal.service';
import { SecureCommunicationDialog } from './SecureCommunicationDialog';
import { DocumentCollaborationDialog } from './DocumentCollaborationDialog';
import { PaymentDialog } from './PaymentDialog';
import { SecuritySettingsDialog } from './SecuritySettingsDialog';

interface ClientDashboardProps {
  clientId: string;
  onNavigate: (path: string) => void;
}

interface DashboardData {
  client: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar: string;
    joinDate: Date;
    lastLogin: Date;
  };
  cases: any[];
  recentDocuments: any[];
  messages: any[];
  payments: any[];
  appointments: any[];
  notifications: any[];
}

const statusColors = {
  active: 'success',
  pending: 'warning',
  completed: 'info',
  overdue: 'error',
  draft: 'default',
} as const;

const priorityColors = {
  high: 'error',
  medium: 'warning',
  low: 'success',
} as const;

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  clientId,
  onNavigate,
}) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secureCommDialog, setSecureCommDialog] = useState(false);
  const [docCollabDialog, setDocCollabDialog] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [securityDialog, setSecurityDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const clientPortalService = new ClientPortalService();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await clientPortalService.getClientDashboard(clientId);
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time updates
    const interval = setInterval(fetchDashboardData, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'overdue':
        return <WarningIcon color="error" />;
      case 'active':
        return <TrendingUpIcon color="primary" />;
      default:
        return <ScheduleIcon color="action" />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Loading Dashboard...
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (error || !dashboardData) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          {error || 'No data available'}
        </Typography>
        <Button onClick={fetchDashboardData} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  const { client, cases, recentDocuments, messages, payments, appointments, notifications } = dashboardData;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar src={client.avatar} sx={{ width: 64, height: 64 }}>
            {client.name.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h4">Welcome back, {client.name.split(' ')[0]}!</Typography>
            <Typography variant="body2" color="text.secondary">
              Last login: {formatDistanceToNow(new Date(client.lastLogin))} ago
            </Typography>
          </Box>
        </Box>
        <Box>
          <IconButton onClick={handleMenuClick}>
            <MoreVertIcon />
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={() => { setSecurityDialog(true); handleMenuClose(); }}>
              <ListItemIcon><SecurityIcon /></ListItemIcon>
              <ListItemText>Security Settings</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { onNavigate('/settings'); handleMenuClose(); }}>
              <ListItemIcon><SettingsIcon /></ListItemIcon>
              <ListItemText>Account Settings</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <GavelIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{cases.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Cases
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <DocumentIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{recentDocuments.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Documents
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Badge badgeContent={messages.filter(m => !m.read).length} color="error">
                  <MessageIcon color="primary" sx={{ fontSize: 40 }} />
                </Badge>
                <Box>
                  <Typography variant="h4">{messages.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Messages
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PaymentIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">
                    ${payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Payments
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Cases Column */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ pb: 1 }}>
              <Typography variant="h6" gutterBottom>
                Active Cases
              </Typography>
            </CardContent>
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              <List>
                {cases.slice(0, 5).map((caseItem, index) => (
                  <React.Fragment key={caseItem.id}>
                    <ListItem>
                      <ListItemIcon>
                        {getStatusIcon(caseItem.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={caseItem.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {caseItem.assignedAttorney} • {caseItem.status}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={caseItem.progress}
                                sx={{ flex: 1, height: 6, borderRadius: 3 }}
                              />
                              <Typography variant="caption">
                                {caseItem.progress}%
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Chip
                          label={caseItem.priority}
                          size="small"
                          color={priorityColors[caseItem.priority as keyof typeof priorityColors]}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < cases.slice(0, 5).length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
            <CardContent sx={{ pt: 1 }}>
              <Button fullWidth onClick={() => onNavigate('/cases')}>
                View All Cases
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Documents */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ pb: 1 }}>
              <Typography variant="h6" gutterBottom>
                Recent Documents
              </Typography>
            </CardContent>
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              <List>
                {recentDocuments.slice(0, 5).map((doc, index) => (
                  <React.Fragment key={doc.id}>
                    <ListItem>
                      <ListItemIcon>
                        <DocumentIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={doc.name}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {doc.type} • {format(new Date(doc.uploadDate), 'MMM dd, yyyy')}
                            </Typography>
                            <Chip
                              label={doc.status}
                              size="small"
                              color={statusColors[doc.status as keyof typeof statusColors]}
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          onClick={() => doc.downloadUrl && window.open(doc.downloadUrl)}
                          disabled={!doc.downloadUrl}
                        >
                          {doc.status === 'approved' ? <DownloadIcon /> : <ViewIcon />}
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < recentDocuments.slice(0, 5).length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
            <CardContent sx={{ pt: 1 }}>
              <Button fullWidth onClick={() => onNavigate('/documents')}>
                View All Documents
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Messages */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ pb: 1 }}>
              <Typography variant="h6" gutterBottom>
                Recent Messages
              </Typography>
            </CardContent>
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              <List>
                {messages.slice(0, 5).map((message, index) => (
                  <React.Fragment key={message.id}>
                    <ListItem>
                      <ListItemIcon>
                        <Badge
                          variant="dot"
                          color="error"
                          invisible={message.read}
                        >
                          <MessageIcon />
                        </Badge>
                      </ListItemIcon>
                      <ListItemText
                        primary={message.subject}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              From: {message.from}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {message.preview}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDistanceToNow(new Date(message.timestamp))} ago
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Chip
                          label={message.priority}
                          size="small"
                          color={priorityColors[message.priority as keyof typeof priorityColors]}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < messages.slice(0, 5).length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
            <CardContent sx={{ pt: 1 }}>
              <Button fullWidth onClick={() => onNavigate('/messages')}>
                View All Messages
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Appointments */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ pb: 1 }}>
              <Typography variant="h6" gutterBottom>
                Upcoming Appointments
              </Typography>
            </CardContent>
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              <List>
                {appointments.slice(0, 5).map((appointment, index) => (
                  <React.Fragment key={appointment.id}>
                    <ListItem>
                      <ListItemIcon>
                        <EventIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={appointment.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {appointment.attorney} • {appointment.type}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {format(new Date(appointment.date), 'MMM dd, yyyy • h:mm a')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {appointment.location}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Chip
                          label={appointment.status}
                          size="small"
                          color={statusColors[appointment.status as keyof typeof statusColors]}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < appointments.slice(0, 5).length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
            <CardContent sx={{ pt: 1 }}>
              <Button fullWidth onClick={() => onNavigate('/appointments')}>
                View All Appointments
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Floating Action Buttons */}
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Fab
          color="primary"
          onClick={() => setSecureCommDialog(true)}
          sx={{ mb: 1 }}
        >
          <MessageIcon />
        </Fab>
        <Fab
          color="secondary"
          onClick={() => setDocCollabDialog(true)}
        >
          <AddIcon />
        </Fab>
      </Box>

      {/* Dialogs */}
      <SecureCommunicationDialog
        open={secureCommDialog}
        onClose={() => setSecureCommDialog(false)}
        clientId={clientId}
        onSuccess={fetchDashboardData}
      />

      <DocumentCollaborationDialog
        open={docCollabDialog}
        onClose={() => setDocCollabDialog(false)}
        clientId={clientId}
        onSuccess={fetchDashboardData}
      />

      <PaymentDialog
        open={paymentDialog}
        onClose={() => setPaymentDialog(false)}
        clientId={clientId}
        payments={payments}
        onSuccess={fetchDashboardData}
      />

      <SecuritySettingsDialog
        open={securityDialog}
        onClose={() => setSecurityDialog(false)}
        clientId={clientId}
      />
    </Box>
  );
};

export default ClientDashboard;
