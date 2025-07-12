import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  IconButton,
  Divider,
  InputAdornment,
  Paper,
  Badge,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Send as SendIcon,
  Attachment as AttachmentIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  MoreVert as MoreVertIcon,
  Lock as LockIcon,
  Verified as VerifiedIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { ClientPortalService } from '../services/client-portal.service';

interface SecureCommunicationDialogProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  onSuccess: () => void;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  encrypted: boolean;
  attachments: string[];
  readBy: { userId: string; timestamp: Date }[];
}

interface Communication {
  id: string;
  threadId: string;
  participants: string[];
  subject: string;
  messages: Message[];
  encryption: {
    algorithm: string;
    keyId: string;
    iv: string;
  };
  metadata: {
    caseId?: string;
    priority: string;
    tags: string[];
  };
}

export const SecureCommunicationDialog: React.FC<SecureCommunicationDialogProps> = ({
  open,
  onClose,
  clientId,
  onSuccess,
}) => {
  const [step, setStep] = useState<'compose' | 'thread'>('compose');
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [selectedThread, setSelectedThread] = useState<Communication | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compose form state
  const [participants, setParticipants] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [caseId, setCaseId] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [attachments, setAttachments] = useState<File[]>([]);

  // Thread state
  const [newMessage, setNewMessage] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const clientPortalService = new ClientPortalService();

  useEffect(() => {
    if (open) {
      fetchCommunications();
    }
  }, [open]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedThread?.messages]);

  const fetchCommunications = async () => {
    try {
      setLoading(true);
      // Implementation would fetch existing communications
      setCommunications([]);
      setError(null);
    } catch (err) {
      setError('Failed to load communications');
      console.error('Communications error:', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCreateCommunication = async () => {
    if (!subject.trim() || !message.trim() || participants.length === 0) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const communication = await clientPortalService.createSecureCommunication(
        clientId,
        participants,
        subject,
        message,
        caseId || undefined,
      );

      setCommunications([communication, ...communications]);
      setSelectedThread(communication);
      setStep('thread');

      // Reset form
      setSubject('');
      setMessage('');
      setParticipants([]);
      setCaseId('');
      setAttachments([]);

      onSuccess();
      setError(null);
    } catch (err) {
      setError('Failed to create secure communication');
      console.error('Create communication error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThread) return;

    try {
      setLoading(true);
      // Implementation would send message in existing thread
      setNewMessage('');
      setError(null);
    } catch (err) {
      setError('Failed to send message');
      console.error('Send message error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments([...attachments, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const renderComposeView = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SecurityIcon color="primary" />
        Start Secure Communication
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockIcon />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          label="Recipients (Attorney IDs)"
          value={participants.join(', ')}
          onChange={(e) => setParticipants(e.target.value.split(',').map(p => p.trim()).filter(Boolean))}
          placeholder="attorney1, attorney2"
          required
          fullWidth
          helperText="Enter attorney IDs separated by commas"
        />

        <TextField
          label="Case ID (Optional)"
          value={caseId}
          onChange={(e) => setCaseId(e.target.value)}
          fullWidth
          helperText="Link this communication to a specific case"
        />

        <TextField
          select
          label="Priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
          fullWidth
        >
          <MenuItem value="low">Low</MenuItem>
          <MenuItem value="medium">Medium</MenuItem>
          <MenuItem value="high">High</MenuItem>
        </TextField>

        <TextField
          label="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          multiline
          rows={6}
          fullWidth
          placeholder="Type your secure message here..."
        />

        {/* Attachments */}
        <Box>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            multiple
            onChange={handleFileSelect}
          />
          <Button
            startIcon={<AttachmentIcon />}
            onClick={() => fileInputRef.current?.click()}
            variant="outlined"
            size="small"
          >
            Add Attachments
          </Button>
          {attachments.length > 0 && (
            <Box sx={{ mt: 1 }}>
              {attachments.map((file, index) => (
                <Chip
                  key={index}
                  label={file.name}
                  onDelete={() => removeAttachment(index)}
                  size="small"
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </Box>
          )}
        </Box>

        {/* Encryption Notice */}
        <Paper sx={{ p: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <VerifiedIcon color="primary" />
            <Typography variant="subtitle2" color="primary">
              End-to-End Encryption
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            This communication will be encrypted using AES-256-GCM encryption.
            Only you and the specified recipients will be able to read this message.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );

  const renderThreadView = () => {
    if (!selectedThread) return null;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Thread Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LockIcon color="primary" />
              {selectedThread.subject}
            </Typography>
            <IconButton onClick={handleMenuClick}>
              <MoreVertIcon />
            </IconButton>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={`${selectedThread.participants.length} participants`}
              size="small"
              icon={<PersonIcon />}
            />
            <Chip
              label={selectedThread.metadata.priority}
              size="small"
              color={
                selectedThread.metadata.priority === 'high' ? 'error' :
                selectedThread.metadata.priority === 'medium' ? 'warning' : 'success'
              }
            />
            <Chip
              label="End-to-End Encrypted"
              size="small"
              icon={<VerifiedIcon />}
              color="primary"
            />
          </Box>
        </Box>

        {/* Messages */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
          {selectedThread.messages.map((msg, index) => (
            <Box
              key={msg.id}
              sx={{
                display: 'flex',
                justifyContent: msg.senderId === clientId ? 'flex-end' : 'flex-start',
                mb: 2,
              }}
            >
              <Paper
                sx={{
                  p: 2,
                  maxWidth: '70%',
                  bgcolor: msg.senderId === clientId ? 'primary.main' : 'grey.100',
                  color: msg.senderId === clientId ? 'white' : 'text.primary',
                }}
              >
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {msg.content}
                </Typography>
                {msg.attachments.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {msg.attachments.map((attachment, i) => (
                      <Chip
                        key={i}
                        label={attachment}
                        size="small"
                        icon={<DownloadIcon />}
                        clickable
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>
                )}
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {format(new Date(msg.timestamp), 'MMM dd, yyyy • h:mm a')}
                  {msg.encrypted && <VerifiedIcon sx={{ ml: 1, fontSize: 12 }} />}
                </Typography>
              </Paper>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>

        {/* Message Input */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your secure message..."
              fullWidth
              multiline
              maxRows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => fileInputRef.current?.click()}
                      size="small"
                    >
                      <AttachmentIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || loading}
              sx={{ minWidth: 'auto', px: 2 }}
            >
              {loading ? <CircularProgress size={20} /> : <SendIcon />}
            </Button>
          </Box>
        </Box>

        {/* Menu */}
        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
          <MenuItem onClick={() => { /* Export thread */ handleMenuClose(); }}>
            Export Thread
          </MenuItem>
          <MenuItem onClick={() => { /* Add participants */ handleMenuClose(); }}>
            Add Participants
          </MenuItem>
          <MenuItem onClick={() => { /* Security details */ handleMenuClose(); }}>
            Encryption Details
          </MenuItem>
        </Menu>
      </Box>
    );
  };

  const renderCommunicationsList = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Recent Communications
      </Typography>
      <List>
        {communications.map((comm) => (
          <ListItem
            key={comm.id}
            button
            onClick={() => {
              setSelectedThread(comm);
              setStep('thread');
            }}
          >
            <ListItemAvatar>
              <Badge
                badgeContent={comm.messages.filter(m => 
                  !m.readBy.some(r => r.userId === clientId)
                ).length}
                color="error"
              >
                <Avatar>
                  <LockIcon />
                </Avatar>
              </Badge>
            </ListItemAvatar>
            <ListItemText
              primary={comm.subject}
              secondary={
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {comm.participants.length} participants
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDistanceToNow(new Date(comm.messages[comm.messages.length - 1].timestamp))} ago
                  </Typography>
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
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
          {step === 'compose' ? 'Secure Communication' : selectedThread?.subject}
        </Typography>
        <Box>
          {step === 'thread' && (
            <Button onClick={() => setStep('compose')} sx={{ mr: 1 }}>
              New Message
            </Button>
          )}
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ flex: 1, p: 0, overflow: 'hidden' }}>
        {step === 'compose' ? renderComposeView() : renderThreadView()}
      </DialogContent>

      {step === 'compose' && (
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateCommunication}
            disabled={loading || !subject.trim() || !message.trim() || participants.length === 0}
          >
            {loading ? <CircularProgress size={20} /> : 'Send Secure Message'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default SecureCommunicationDialog;
