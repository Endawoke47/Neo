import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Tab,
  Tabs,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Alert,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Integration as IntegrationIcon,
  Api as ApiIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Sync as SyncIcon,
  Key as KeyIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { format } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`integration-tabpanel-${index}`}
      aria-labelledby={`integration-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const IntegrationManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);

  useEffect(() => {
    loadIntegrations();
    loadApiKeys();
    loadMetrics();
  }, []);

  const loadIntegrations = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API calls
      setIntegrations([
        {
          id: 'clio',
          name: 'Clio Practice Management',
          type: 'legal-software',
          status: 'active',
          lastSync: new Date('2024-01-15T10:30:00'),
          health: 'healthy',
          requestsToday: 1250,
          errorRate: 0.5,
        },
        {
          id: 'lexisnexis',
          name: 'LexisNexis',
          type: 'legal-research',
          status: 'active',
          lastSync: new Date('2024-01-15T11:15:00'),
          health: 'healthy',
          requestsToday: 850,
          errorRate: 1.2,
        },
        {
          id: 'docusign',
          name: 'DocuSign',
          type: 'document-management',
          status: 'inactive',
          lastSync: new Date('2024-01-14T16:20:00'),
          health: 'degraded',
          requestsToday: 320,
          errorRate: 3.8,
        },
        {
          id: 'quickbooks',
          name: 'QuickBooks Online',
          type: 'accounting',
          status: 'active',
          lastSync: new Date('2024-01-15T09:45:00'),
          health: 'healthy',
          requestsToday: 480,
          errorRate: 0.8,
        },
      ]);
    } catch (error) {
      console.error('Failed to load integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadApiKeys = async () => {
    try {
      // Mock data - replace with actual API calls
      setApiKeys([
        {
          id: '1',
          name: 'Mobile App',
          key: 'cf_1234...abcd',
          permissions: ['clients:read', 'cases:read'],
          lastUsed: new Date('2024-01-15T11:30:00'),
          requestsToday: 2500,
          status: 'active',
        },
        {
          id: '2',
          name: 'Web Dashboard',
          key: 'cf_5678...efgh',
          permissions: ['clients:*', 'cases:*', 'documents:*'],
          lastUsed: new Date('2024-01-15T11:45:00'),
          requestsToday: 5200,
          status: 'active',
        },
        {
          id: '3',
          name: 'Third Party Integration',
          key: 'cf_9012...ijkl',
          permissions: ['webhooks:receive'],
          lastUsed: new Date('2024-01-14T18:20:00'),
          requestsToday: 150,
          status: 'inactive',
        },
      ]);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  };

  const loadMetrics = async () => {
    try {
      // Mock data - replace with actual API calls
      setMetrics({
        totalRequests: 125000,
        successfulRequests: 122500,
        failedRequests: 2500,
        averageResponseTime: 145,
        requestsPerSecond: 12.5,
        topEndpoints: [
          { endpoint: 'GET /api/clients', count: 15000 },
          { endpoint: 'GET /api/cases', count: 12000 },
          { endpoint: 'POST /api/documents', count: 8500 },
          { endpoint: 'GET /api/calendar', count: 6200 },
          { endpoint: 'PUT /api/cases', count: 4800 },
        ],
        errorRates: [
          { statusCode: 200, count: 110000 },
          { statusCode: 400, count: 1500 },
          { statusCode: 401, count: 800 },
          { statusCode: 500, count: 200 },
        ],
      });
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSyncIntegration = async (integrationId: string) => {
    setLoading(true);
    try {
      // Simulate sync operation
      await new Promise(resolve => setTimeout(resolve, 2000));
      await loadIntegrations();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'healthy':
        return 'success';
      case 'inactive':
      case 'degraded':
        return 'warning';
      case 'error':
      case 'unhealthy':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'healthy':
        return <CheckCircleIcon color="success" />;
      case 'inactive':
      case 'degraded':
        return <WarningIcon color="warning" />;
      case 'error':
      case 'unhealthy':
        return <ErrorIcon color="error" />;
      default:
        return <CircularProgress size={20} />;
    }
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'API Usage Over Time',
      },
    },
  };

  const requestsChartData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
    datasets: [
      {
        label: 'Successful Requests',
        data: [150, 200, 450, 800, 650, 300],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      },
      {
        label: 'Failed Requests',
        data: [10, 15, 25, 40, 30, 20],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
      },
    ],
  };

  const endpointsChartData = {
    labels: metrics.topEndpoints?.map((e: any) => e.endpoint) || [],
    datasets: [
      {
        label: 'Requests',
        data: metrics.topEndpoints?.map((e: any) => e.count) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
        ],
      },
    ],
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Integration & API Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              loadIntegrations();
              loadApiKeys();
              loadMetrics();
            }}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog('newIntegration')}
          >
            Add Integration
          </Button>
        </Box>
      </Box>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="integration management tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<IntegrationIcon />} label="Integrations" />
          <Tab icon={<ApiIcon />} label="API Keys" />
          <Tab icon={<AnalyticsIcon />} label="Analytics" />
          <Tab icon={<SecurityIcon />} label="Security" />
          <Tab icon={<SettingsIcon />} label="Settings" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            {/* Integration Overview Cards */}
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Integrations
                  </Typography>
                  <Typography variant="h4">
                    {integrations.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Active Integrations
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {integrations.filter(i => i.status === 'active').length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Requests Today
                  </Typography>
                  <Typography variant="h4">
                    {integrations.reduce((sum, i) => sum + i.requestsToday, 0).toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Average Error Rate
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {(integrations.reduce((sum, i) => sum + i.errorRate, 0) / integrations.length).toFixed(1)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Integrations List */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Integration Status
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Integration</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Health</TableCell>
                          <TableCell>Last Sync</TableCell>
                          <TableCell>Requests Today</TableCell>
                          <TableCell>Error Rate</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {integrations.map((integration) => (
                          <TableRow key={integration.id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <IntegrationIcon sx={{ mr: 1 }} />
                                {integration.name}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={integration.type}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={integration.status}
                                color={getStatusColor(integration.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {getStatusIcon(integration.health)}
                                <Typography variant="body2" sx={{ ml: 1 }}>
                                  {integration.health}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              {format(integration.lastSync, 'MMM dd, HH:mm')}
                            </TableCell>
                            <TableCell>
                              {integration.requestsToday.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Typography
                                color={integration.errorRate > 2 ? 'error' : 'textPrimary'}
                              >
                                {integration.errorRate.toFixed(1)}%
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Tooltip title="Sync Now">
                                <IconButton
                                  onClick={() => handleSyncIntegration(integration.id)}
                                  disabled={loading}
                                >
                                  <SyncIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit">
                                <IconButton
                                  onClick={() => {
                                    setSelectedIntegration(integration);
                                    setOpenDialog('editIntegration');
                                  }}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton color="error">
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            {/* API Keys Overview */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total API Keys
                  </Typography>
                  <Typography variant="h4">
                    {apiKeys.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Active Keys
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {apiKeys.filter(k => k.status === 'active').length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Requests Today
                  </Typography>
                  <Typography variant="h4">
                    {apiKeys.reduce((sum, k) => sum + k.requestsToday, 0).toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* API Keys List */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      API Keys
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<KeyIcon />}
                      onClick={() => setOpenDialog('newApiKey')}
                    >
                      Generate New Key
                    </Button>
                  </Box>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Key</TableCell>
                          <TableCell>Permissions</TableCell>
                          <TableCell>Last Used</TableCell>
                          <TableCell>Requests Today</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {apiKeys.map((apiKey) => (
                          <TableRow key={apiKey.id}>
                            <TableCell>{apiKey.name}</TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                {apiKey.key}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {apiKey.permissions.slice(0, 2).map((permission: string) => (
                                  <Chip
                                    key={permission}
                                    label={permission}
                                    size="small"
                                    variant="outlined"
                                  />
                                ))}
                                {apiKey.permissions.length > 2 && (
                                  <Chip
                                    label={`+${apiKey.permissions.length - 2} more`}
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              {format(apiKey.lastUsed, 'MMM dd, HH:mm')}
                            </TableCell>
                            <TableCell>
                              {apiKey.requestsToday.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={apiKey.status}
                                color={getStatusColor(apiKey.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Tooltip title="Edit">
                                <IconButton>
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Revoke">
                                <IconButton color="error">
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            {/* Metrics Overview */}
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Requests
                  </Typography>
                  <Typography variant="h4">
                    {metrics.totalRequests?.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Success Rate
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {metrics.totalRequests ? 
                      ((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(1) : 0}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Avg Response Time
                  </Typography>
                  <Typography variant="h4">
                    {metrics.averageResponseTime}ms
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Requests/Second
                  </Typography>
                  <Typography variant="h4">
                    {metrics.requestsPerSecond}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Charts */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    API Usage Over Time
                  </Typography>
                  <Line data={requestsChartData} options={chartOptions} />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Endpoints
                  </Typography>
                  <Doughnut data={endpointsChartData} />
                </CardContent>
              </Card>
            </Grid>

            {/* Detailed Metrics */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Endpoint Performance
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Endpoint</TableCell>
                          <TableCell>Requests</TableCell>
                          <TableCell>Success Rate</TableCell>
                          <TableCell>Avg Response Time</TableCell>
                          <TableCell>Performance</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {metrics.topEndpoints?.map((endpoint: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell sx={{ fontFamily: 'monospace' }}>
                              {endpoint.endpoint}
                            </TableCell>
                            <TableCell>{endpoint.count.toLocaleString()}</TableCell>
                            <TableCell>
                              <Typography color="success.main">
                                {(95 + Math.random() * 4).toFixed(1)}%
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {(100 + Math.random() * 200).toFixed(0)}ms
                            </TableCell>
                            <TableCell>
                              <LinearProgress
                                variant="determinate"
                                value={85 + Math.random() * 15}
                                color="success"
                                sx={{ width: 100 }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Security monitoring and threat detection for API endpoints and integrations.
              </Alert>
            </Grid>

            {/* Security Metrics */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Security Score
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    95/100
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Failed Auth Attempts
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    127
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Rate Limit Violations
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    43
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Security Settings */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Security Configuration
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label="Enable API Rate Limiting"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label="Require API Key Authentication"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label="Log All API Requests"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={<Switch />}
                        label="Block Suspicious IPs"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Global Integration Settings
              </Typography>
            </Grid>

            {/* Global Settings */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Default Rate Limits
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Requests per Hour"
                        type="number"
                        defaultValue={1000}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Burst Limit"
                        type="number"
                        defaultValue={100}
                        variant="outlined"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Sync Settings
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Default Sync Interval</InputLabel>
                        <Select defaultValue="hourly">
                          <MenuItem value="realtime">Real-time</MenuItem>
                          <MenuItem value="hourly">Hourly</MenuItem>
                          <MenuItem value="daily">Daily</MenuItem>
                          <MenuItem value="weekly">Weekly</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Batch Size"
                        type="number"
                        defaultValue={100}
                        variant="outlined"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Export/Import */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Configuration Management
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                    >
                      Export Configuration
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<UploadIcon />}
                    >
                      Import Configuration
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Dialogs would go here - New Integration, Edit Integration, New API Key, etc. */}
    </Box>
  );
};

export default IntegrationManagement;
