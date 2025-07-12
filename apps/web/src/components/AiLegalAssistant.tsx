import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  CircularProgress,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  Alert,
  Tooltip,
  IconButton,
  Badge,
  Slide,
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  Send as SendIcon,
  History as HistoryIcon,
  Description as DescriptionIcon,
  Search as SearchIcon,
  Gavel as GavelIcon,
  School as SchoolIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Analytics as AnalyticsIcon,
  Star as StarIcon,
  Bookmark as BookmarkIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  Lightbulb as LightbulbIcon,
  SecurityIcon,
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';
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
      id={`ai-assistant-tabpanel-${index}`}
      aria-labelledby={`ai-assistant-tab-${index}`}
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

const AiLegalAssistant: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [researchTasks, setResearchTasks] = useState<any[]>([]);
  const [documentAnalyses, setDocumentAnalyses] = useState<any[]>([]);
  const [selectedPracticeArea, setSelectedPracticeArea] = useState('');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState('medium');
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
    loadResearchTasks();
    loadDocumentAnalyses();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversations]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    // Mock data - replace with actual API calls
    setConversations([
      {
        id: '1',
        type: 'query',
        content: 'What are the requirements for filing a motion to dismiss in federal court?',
        timestamp: new Date('2024-01-15T10:30:00'),
        status: 'completed',
        response: {
          answer: 'A motion to dismiss in federal court must comply with Federal Rule of Civil Procedure 12(b). The motion must be filed within 21 days of service of the summons and complaint, unless an extension is granted...',
          confidence: 0.92,
          sources: [
            { title: 'Fed. R. Civ. P. 12(b)', citation: 'Federal Rules of Civil Procedure' },
            { title: 'Conley v. Gibson', citation: '355 U.S. 41 (1957)' },
          ],
          keyPoints: [
            '21-day deadline for filing',
            'Must state specific grounds',
            'Court has discretion to grant extensions',
          ],
          recommendations: [
            'Review all applicable grounds for dismissal',
            'Ensure proper service of motion on opposing counsel',
            'Consider whether amendment would cure deficiencies',
          ],
        },
      },
      {
        id: '2',
        type: 'query',
        content: 'How do I structure a partnership agreement for a law firm?',
        timestamp: new Date('2024-01-15T11:45:00'),
        status: 'completed',
        response: {
          answer: 'A law firm partnership agreement should include several key provisions: profit/loss distribution, management structure, capital contributions, withdrawal procedures, and ethical obligations...',
          confidence: 0.88,
          sources: [
            { title: 'Model Rules of Professional Conduct', citation: 'ABA Model Rules' },
            { title: 'Partnership Law Guide', citation: 'Legal Practice Management' },
          ],
          keyPoints: [
            'Define partner roles and responsibilities',
            'Establish profit-sharing formula',
            'Include dissolution procedures',
          ],
          warnings: [
            'Ensure compliance with professional conduct rules',
            'Consider malpractice insurance requirements',
          ],
        },
      },
    ]);
  };

  const loadResearchTasks = async () => {
    setResearchTasks([
      {
        id: '1',
        title: 'Employment Law Research - Wrongful Termination',
        description: 'Research current state of wrongful termination law in California',
        practiceArea: 'Employment Law',
        jurisdiction: 'California',
        priority: 'high',
        status: 'completed',
        progress: 100,
        dueDate: new Date('2024-01-20'),
        findings: [
          {
            title: 'At-Will Employment Exceptions',
            summary: 'California recognizes several exceptions to at-will employment',
            significance: 'critical',
          },
          {
            title: 'Recent Case Law Updates',
            summary: 'New developments in wrongful termination litigation',
            significance: 'important',
          },
        ],
      },
      {
        id: '2',
        title: 'Contract Law Analysis - Force Majeure Clauses',
        description: 'Analyze effectiveness of force majeure clauses post-COVID',
        practiceArea: 'Contract Law',
        jurisdiction: 'Federal',
        priority: 'medium',
        status: 'in-progress',
        progress: 65,
        dueDate: new Date('2024-01-25'),
        findings: [],
      },
    ]);
  };

  const loadDocumentAnalyses = async () => {
    setDocumentAnalyses([
      {
        id: '1',
        documentName: 'Service Agreement - TechCorp',
        documentType: 'Contract',
        timestamp: new Date('2024-01-15T09:15:00'),
        confidence: 0.91,
        analysis: {
          summary: 'Standard service agreement with some unusual liability provisions',
          keyProvisions: [
            'Unlimited liability clause (concerning)',
            'Automatic renewal provision',
            'Broad indemnification requirements',
          ],
          riskFactors: [
            'Unlimited liability exposure',
            'Vague termination procedures',
            'Missing force majeure clause',
          ],
          recommendations: [
            'Negotiate liability cap',
            'Clarify termination process',
            'Add force majeure provision',
          ],
        },
      },
      {
        id: '2',
        documentName: 'Employment Contract - Executive',
        documentType: 'Employment Agreement',
        timestamp: new Date('2024-01-14T16:30:00'),
        confidence: 0.85,
        analysis: {
          summary: 'Comprehensive executive employment agreement with competitive terms',
          keyProvisions: [
            'Base salary: $250,000',
            '2-year severance package',
            'Non-compete: 18 months',
          ],
          riskFactors: [
            'Broad non-compete scope',
            'Vague performance metrics',
          ],
          recommendations: [
            'Narrow non-compete geography',
            'Define performance standards',
            'Add change of control provisions',
          ],
        },
      },
    ]);
  };

  const handleSubmitQuery = async () => {
    if (!query.trim()) return;

    setIsProcessing(true);
    
    const newQuery = {
      id: Date.now().toString(),
      type: 'query',
      content: query,
      timestamp: new Date(),
      status: 'processing',
      context: {
        practiceArea: selectedPracticeArea,
        jurisdiction: selectedJurisdiction,
        urgency: urgencyLevel,
      },
    };

    setConversations(prev => [...prev, newQuery]);
    setQuery('');

    // Simulate AI processing
    setTimeout(() => {
      const response = {
        answer: 'This is a simulated AI response to your legal query. In a production system, this would be generated by the AI legal assistant service using advanced language models and legal databases.',
        confidence: 0.85,
        sources: [
          { title: 'Relevant Statute', citation: 'Example Citation' },
          { title: 'Case Law', citation: 'Example v. Case (2024)' },
        ],
        keyPoints: [
          'Key legal principle 1',
          'Important consideration 2',
          'Relevant precedent 3',
        ],
        recommendations: [
          'Consult with specialized attorney',
          'Review applicable local laws',
          'Document all relevant facts',
        ],
      };

      setConversations(prev => 
        prev.map(conv => 
          conv.id === newQuery.id 
            ? { ...conv, status: 'completed', response }
            : conv
        )
      );
      setIsProcessing(false);
    }, 3000);
  };

  const handleStartResearch = () => {
    setOpenDialog('newResearch');
  };

  const handleUploadDocument = () => {
    setOpenDialog('uploadDocument');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
      case 'in-progress':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getSignificanceIcon = (significance: string) => {
    switch (significance) {
      case 'critical':
        return <WarningIcon color="error" />;
      case 'important':
        return <StarIcon color="warning" />;
      case 'moderate':
        return <CheckCircleIcon color="info" />;
      case 'minor':
        return <CheckCircleIcon color="success" />;
      default:
        return <CheckCircleIcon />;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <AutoAwesomeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          AI Legal Assistant
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<SearchIcon />}
            onClick={handleStartResearch}
            sx={{ mr: 1 }}
          >
            Start Research
          </Button>
          <Button
            variant="contained"
            startIcon={<DescriptionIcon />}
            onClick={handleUploadDocument}
          >
            Analyze Document
          </Button>
        </Box>
      </Box>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          aria-label="AI assistant tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<PsychologyIcon />} label="Chat Assistant" />
          <Tab icon={<SearchIcon />} label="Research Tasks" />
          <Tab icon={<DescriptionIcon />} label="Document Analysis" />
          <Tab icon={<AnalyticsIcon />} label="Insights" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            {/* Chat Interface */}
            <Grid item xs={12} lg={8}>
              <Card sx={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                  <List>
                    {conversations.map((conversation) => (
                      <React.Fragment key={conversation.id}>
                        <ListItem alignItems="flex-start">
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              <GavelIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary="You"
                            secondary={
                              <Box>
                                <Typography variant="body2" color="textPrimary">
                                  {conversation.content}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {format(conversation.timestamp, 'MMM dd, HH:mm')}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>

                        {conversation.status === 'processing' && (
                          <ListItem>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                <PsychologyIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary="AI Assistant"
                              secondary={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <CircularProgress size={16} sx={{ mr: 1 }} />
                                  <Typography variant="body2">
                                    Analyzing your query...
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        )}

                        {conversation.response && (
                          <ListItem alignItems="flex-start">
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                <PsychologyIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Typography variant="subtitle2">AI Assistant</Typography>
                                  <Chip
                                    label={`${(conversation.response.confidence * 100).toFixed(0)}% confidence`}
                                    size="small"
                                    color="info"
                                    sx={{ ml: 1 }}
                                  />
                                </Box>
                              }
                              secondary={
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="body2" paragraph>
                                    {conversation.response.answer}
                                  </Typography>

                                  {conversation.response.keyPoints && (
                                    <Accordion sx={{ mt: 2 }}>
                                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography variant="subtitle2">
                                          Key Points ({conversation.response.keyPoints.length})
                                        </Typography>
                                      </AccordionSummary>
                                      <AccordionDetails>
                                        <List dense>
                                          {conversation.response.keyPoints.map((point: string, index: number) => (
                                            <ListItem key={index}>
                                              <ListItemText primary={point} />
                                            </ListItem>
                                          ))}
                                        </List>
                                      </AccordionDetails>
                                    </Accordion>
                                  )}

                                  {conversation.response.sources && (
                                    <Accordion sx={{ mt: 1 }}>
                                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography variant="subtitle2">
                                          Legal Sources ({conversation.response.sources.length})
                                        </Typography>
                                      </AccordionSummary>
                                      <AccordionDetails>
                                        <List dense>
                                          {conversation.response.sources.map((source: any, index: number) => (
                                            <ListItem key={index}>
                                              <ListItemText
                                                primary={source.title}
                                                secondary={source.citation}
                                              />
                                            </ListItem>
                                          ))}
                                        </List>
                                      </AccordionDetails>
                                    </Accordion>
                                  )}

                                  {conversation.response.recommendations && (
                                    <Accordion sx={{ mt: 1 }}>
                                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography variant="subtitle2">
                                          Recommendations ({conversation.response.recommendations.length})
                                        </Typography>
                                      </AccordionSummary>
                                      <AccordionDetails>
                                        <List dense>
                                          {conversation.response.recommendations.map((rec: string, index: number) => (
                                            <ListItem key={index}>
                                              <ListItemText primary={rec} />
                                            </ListItem>
                                          ))}
                                        </List>
                                      </AccordionDetails>
                                    </Accordion>
                                  )}

                                  {conversation.response.warnings && (
                                    <Alert severity="warning" sx={{ mt: 2 }}>
                                      <Typography variant="body2">
                                        {conversation.response.warnings.join('; ')}
                                      </Typography>
                                    </Alert>
                                  )}

                                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                    <Tooltip title="Bookmark this response">
                                      <IconButton size="small">
                                        <BookmarkIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Share response">
                                      <IconButton size="small">
                                        <ShareIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Download as PDF">
                                      <IconButton size="small">
                                        <DownloadIcon />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </Box>
                              }
                            />
                          </ListItem>
                        )}
                        <Divider variant="inset" component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                  <div ref={chatEndRef} />
                </CardContent>

                <Divider />
                
                <Box sx={{ p: 2 }}>
                  <Grid container spacing={2} alignItems="flex-end">
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Practice Area</InputLabel>
                        <Select
                          value={selectedPracticeArea}
                          onChange={(e) => setSelectedPracticeArea(e.target.value)}
                        >
                          <MenuItem value="">All Areas</MenuItem>
                          <MenuItem value="contract-law">Contract Law</MenuItem>
                          <MenuItem value="employment-law">Employment Law</MenuItem>
                          <MenuItem value="corporate-law">Corporate Law</MenuItem>
                          <MenuItem value="litigation">Litigation</MenuItem>
                          <MenuItem value="real-estate">Real Estate</MenuItem>
                          <MenuItem value="intellectual-property">IP Law</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Jurisdiction</InputLabel>
                        <Select
                          value={selectedJurisdiction}
                          onChange={(e) => setSelectedJurisdiction(e.target.value)}
                        >
                          <MenuItem value="">Select Jurisdiction</MenuItem>
                          <MenuItem value="federal">Federal</MenuItem>
                          <MenuItem value="california">California</MenuItem>
                          <MenuItem value="new-york">New York</MenuItem>
                          <MenuItem value="texas">Texas</MenuItem>
                          <MenuItem value="florida">Florida</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Urgency</InputLabel>
                        <Select
                          value={urgencyLevel}
                          onChange={(e) => setUrgencyLevel(e.target.value)}
                        >
                          <MenuItem value="low">Low</MenuItem>
                          <MenuItem value="medium">Medium</MenuItem>
                          <MenuItem value="high">High</MenuItem>
                          <MenuItem value="urgent">Urgent</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          fullWidth
                          variant="outlined"
                          placeholder="Ask a legal question..."
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSubmitQuery();
                            }
                          }}
                          multiline
                          maxRows={3}
                          disabled={isProcessing}
                        />
                        <Button
                          variant="contained"
                          onClick={handleSubmitQuery}
                          disabled={isProcessing || !query.trim()}
                          sx={{ minWidth: 48 }}
                        >
                          <SendIcon />
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Card>
            </Grid>

            {/* Quick Actions & Help */}
            <Grid item xs={12} lg={4}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <LightbulbIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Quick Actions
                      </Typography>
                      <List dense>
                        <ListItem button onClick={() => setQuery('What are the elements of a valid contract?')}>
                          <ListItemText primary="Contract Formation" />
                        </ListItem>
                        <ListItem button onClick={() => setQuery('How do I file a motion for summary judgment?')}>
                          <ListItemText primary="Summary Judgment" />
                        </ListItem>
                        <ListItem button onClick={() => setQuery('What are the requirements for employment termination?')}>
                          <ListItemText primary="Employment Law" />
                        </ListItem>
                        <ListItem button onClick={() => setQuery('How do I structure a corporate merger?')}>
                          <ListItemText primary="Corporate Transactions" />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Usage Statistics
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="h4" color="primary">
                            {conversations.length}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Queries Today
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="h4" color="success.main">
                            95%
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Avg Confidence
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>Important:</strong> AI responses are for informational purposes only and do not constitute legal advice. Always consult with a qualified attorney for specific legal matters.
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            {/* Research Tasks Overview */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Active Research Tasks
                  </Typography>
                  <Typography variant="h4">
                    {researchTasks.filter(t => t.status !== 'completed').length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Completed This Week
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {researchTasks.filter(t => t.status === 'completed').length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Average Completion Time
                  </Typography>
                  <Typography variant="h4">
                    2.5 days
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Research Tasks List */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Research Tasks
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleStartResearch}
                    >
                      New Research Task
                    </Button>
                  </Box>
                  
                  {researchTasks.map((task) => (
                    <Card key={task.id} variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box>
                            <Typography variant="h6" gutterBottom>
                              {task.title}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" paragraph>
                              {task.description}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                              <Chip label={task.practiceArea} size="small" variant="outlined" />
                              <Chip label={task.jurisdiction} size="small" variant="outlined" />
                              <Chip
                                label={task.priority}
                                size="small"
                                color={getUrgencyColor(task.priority)}
                              />
                            </Box>
                          </Box>
                          <Chip
                            label={task.status}
                            color={getStatusColor(task.status)}
                            size="small"
                          />
                        </Box>

                        {task.status === 'in-progress' && (
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">Progress</Typography>
                              <Typography variant="body2">{task.progress}%</Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={task.progress} />
                          </Box>
                        )}

                        {task.dueDate && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <ScheduleIcon sx={{ mr: 1, fontSize: 16 }} />
                            <Typography variant="body2">
                              Due: {format(task.dueDate, 'MMM dd, yyyy')}
                            </Typography>
                          </Box>
                        )}

                        {task.findings && task.findings.length > 0 && (
                          <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Typography variant="subtitle2">
                                Research Findings ({task.findings.length})
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <List dense>
                                {task.findings.map((finding: any, index: number) => (
                                  <ListItem key={index}>
                                    <ListItemAvatar>
                                      {getSignificanceIcon(finding.significance)}
                                    </ListItemAvatar>
                                    <ListItemText
                                      primary={finding.title}
                                      secondary={finding.summary}
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            </AccordionDetails>
                          </Accordion>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            {/* Document Analysis Overview */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Documents Analyzed
                  </Typography>
                  <Typography variant="h4">
                    {documentAnalyses.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    High Risk Documents
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    1
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Average Confidence
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    88%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Document Analyses List */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Document Analyses
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<DescriptionIcon />}
                      onClick={handleUploadDocument}
                    >
                      Analyze New Document
                    </Button>
                  </Box>

                  {documentAnalyses.map((analysis) => (
                    <Card key={analysis.id} variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box>
                            <Typography variant="h6" gutterBottom>
                              {analysis.documentName}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                              <Chip label={analysis.documentType} size="small" variant="outlined" />
                              <Chip
                                label={`${(analysis.confidence * 100).toFixed(0)}% confidence`}
                                size="small"
                                color="info"
                              />
                              <Typography variant="caption" color="textSecondary">
                                {format(analysis.timestamp, 'MMM dd, HH:mm')}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        <Typography variant="body2" paragraph>
                          {analysis.analysis.summary}
                        </Typography>

                        {analysis.analysis.riskFactors.length > 0 && (
                          <Alert severity="warning" sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Risk Factors Identified:
                            </Typography>
                            <List dense>
                              {analysis.analysis.riskFactors.map((risk: string, index: number) => (
                                <ListItem key={index} sx={{ py: 0 }}>
                                  <ListItemText primary={risk} />
                                </ListItem>
                              ))}
                            </List>
                          </Alert>
                        )}

                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="subtitle2">
                              Key Provisions ({analysis.analysis.keyProvisions.length})
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <List dense>
                              {analysis.analysis.keyProvisions.map((provision: string, index: number) => (
                                <ListItem key={index}>
                                  <ListItemText primary={provision} />
                                </ListItem>
                              ))}
                            </List>
                          </AccordionDetails>
                        </Accordion>

                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="subtitle2">
                              Recommendations ({analysis.analysis.recommendations.length})
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <List dense>
                              {analysis.analysis.recommendations.map((rec: string, index: number) => (
                                <ListItem key={index}>
                                  <ListItemText primary={rec} />
                                </ListItem>
                              ))}
                            </List>
                          </AccordionDetails>
                        </Accordion>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                AI Assistant Insights & Analytics
              </Typography>
              <Alert severity="info">
                Comprehensive analytics and insights coming soon. This will include query patterns, research trends, document risk analysis, and productivity metrics.
              </Alert>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Dialogs would go here - New Research Task, Upload Document, etc. */}
    </Box>
  );
};

export default AiLegalAssistant;
