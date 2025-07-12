import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Toolbar,
  Paper,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  TextField,
  Alert,
  CircularProgress,
  Menu,
  MenuItem,
  Badge,
} from '@mui/material';
import {
  Close as CloseIcon,
  Share as ShareIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Comment as CommentIcon,
  Save as SaveIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ClientPortalService } from '../services/client-portal.service';

interface DocumentCollaborationDialogProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  onSuccess: () => void;
}

interface Participant {
  userId: string;
  role: string;
  permissions: string[];
  cursor: { line: number; column: number };
  selection: { start: number; end: number };
  online: boolean;
  lastSeen: Date;
}

interface Change {
  id: string;
  userId: string;
  timestamp: Date;
  operation: 'insert' | 'delete' | 'replace';
  position: number;
  content: string;
  metadata: Record<string, any>;
}

interface Comment {
  id: string;
  userId: string;
  position: number;
  content: string;
  timestamp: Date;
  resolved: boolean;
  replies: {
    id: string;
    userId: string;
    content: string;
    timestamp: Date;
  }[];
}

interface DocumentCollaboration {
  id: string;
  documentId: string;
  sessionId: string;
  participants: Participant[];
  changes: Change[];
  comments: Comment[];
  version: {
    major: number;
    minor: number;
    patch: number;
    timestamp: Date;
    author: string;
    description: string;
  };
}

const EDITOR_MODES = {
  EDIT: 'edit',
  REVIEW: 'review',
  COMMENT: 'comment',
} as const;

export const DocumentCollaborationDialog: React.FC<DocumentCollaborationDialogProps> = ({
  open,
  onClose,
  clientId,
  onSuccess,
}) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null);
  const [collaboration, setCollaboration] = useState<DocumentCollaboration | null>(null);
  const [mode, setMode] = useState<string>(EDITOR_MODES.EDIT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentContent, setDocumentContent] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentPosition, setCommentPosition] = useState<number | null>(null);
  const [showParticipants, setShowParticipants] = useState(true);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const clientPortalService = new ClientPortalService();

  useEffect(() => {
    if (open) {
      fetchDocuments();
    }
  }, [open]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      // Implementation would fetch client documents
      setDocuments([
        {
          id: 'doc1',
          name: 'Contract Agreement.pdf',
          type: 'contract',
          status: 'draft',
          lastModified: new Date(),
        },
        {
          id: 'doc2',
          name: 'Legal Brief.docx',
          type: 'brief',
          status: 'review',
          lastModified: new Date(),
        },
      ]);
      setError(null);
    } catch (err) {
      setError('Failed to load documents');
      console.error('Documents error:', err);
    } finally {
      setLoading(false);
    }
  };

  const startCollaboration = async (documentId: string, participantIds: string[]) => {
    try {
      setLoading(true);
      const collaboration = await clientPortalService.startDocumentCollaboration(
        clientId,
        documentId,
        participantIds,
      );
      
      setCollaboration(collaboration);
      setDocumentContent('Sample document content for collaboration...');
      setError(null);
    } catch (err) {
      setError('Failed to start collaboration');
      console.error('Collaboration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentChange = useCallback((content: string) => {
    setDocumentContent(content);
    
    if (collaboration) {
      // Track changes for real-time collaboration
      const change: Change = {
        id: `change_${Date.now()}`,
        userId: clientId,
        timestamp: new Date(),
        operation: 'replace',
        position: 0,
        content,
        metadata: {},
      };
      
      setCollaboration({
        ...collaboration,
        changes: [...collaboration.changes, change],
      });
    }
  }, [collaboration, clientId]);

  const addComment = async (position: number, content: string) => {
    if (!collaboration || !content.trim()) return;

    const comment: Comment = {
      id: `comment_${Date.now()}`,
      userId: clientId,
      position,
      content,
      timestamp: new Date(),
      resolved: false,
      replies: [],
    };

    setCollaboration({
      ...collaboration,
      comments: [...collaboration.comments, comment],
    });

    setNewComment('');
    setCommentPosition(null);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const renderDocumentSelector = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Select Document for Collaboration
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <List>
        {documents.map((doc) => (
          <ListItem
            key={doc.id}
            button
            onClick={() => setSelectedDocument(doc)}
            selected={selectedDocument?.id === doc.id}
          >
            <ListItemAvatar>
              <Avatar>
                <EditIcon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={doc.name}
              secondary={
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {doc.type} • {format(new Date(doc.lastModified), 'MMM dd, yyyy')}
                  </Typography>
                  <Chip
                    label={doc.status}
                    size="small"
                    color={doc.status === 'draft' ? 'warning' : 'success'}
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>

      {selectedDocument && (
        <Box sx={{ mt: 2 }}>
          <TextField
            label="Participants (Attorney IDs)"
            value={participants.join(', ')}
            onChange={(e) => setParticipants(e.target.value.split(',').map(p => p.trim()).filter(Boolean))}
            placeholder="attorney1, attorney2"
            fullWidth
            sx={{ mb: 2 }}
            helperText="Enter attorney IDs to invite for collaboration"
          />
          <Button
            variant="contained"
            onClick={() => startCollaboration(selectedDocument.id, participants)}
            disabled={participants.length === 0 || loading}
            fullWidth
          >
            {loading ? <CircularProgress size={20} /> : 'Start Collaboration'}
          </Button>
        </Box>
      )}
    </Box>
  );

  const renderCollaborationEditor = () => {
    if (!collaboration) return null;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Toolbar */}
        <Toolbar
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">
              {selectedDocument?.name}
            </Typography>
            <Chip
              label={`v${collaboration.version.major}.${collaboration.version.minor}.${collaboration.version.patch}`}
              size="small"
              variant="outlined"
            />
            <Badge
              badgeContent={collaboration.participants.filter(p => p.online).length}
              color="success"
            >
              <PersonIcon />
            </Badge>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              size="small"
              startIcon={<UndoIcon />}
              onClick={() => {/* Undo logic */}}
            >
              Undo
            </Button>
            <Button
              size="small"
              startIcon={<RedoIcon />}
              onClick={() => {/* Redo logic */}}
            >
              Redo
            </Button>
            <Button
              size="small"
              startIcon={<SaveIcon />}
              onClick={() => {/* Save logic */}}
              variant="contained"
            >
              Save
            </Button>
            <IconButton onClick={handleMenuClick}>
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Toolbar>

        {/* Mode Selector */}
        <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant={mode === EDITOR_MODES.EDIT ? 'contained' : 'outlined'}
              onClick={() => setMode(EDITOR_MODES.EDIT)}
              startIcon={<EditIcon />}
            >
              Edit
            </Button>
            <Button
              size="small"
              variant={mode === EDITOR_MODES.REVIEW ? 'contained' : 'outlined'}
              onClick={() => setMode(EDITOR_MODES.REVIEW)}
              startIcon={<VisibilityIcon />}
            >
              Review
            </Button>
            <Button
              size="small"
              variant={mode === EDITOR_MODES.COMMENT ? 'contained' : 'outlined'}
              onClick={() => setMode(EDITOR_MODES.COMMENT)}
              startIcon={<CommentIcon />}
            >
              Comment
            </Button>
            <Button
              size="small"
              startIcon={showParticipants ? <VisibilityOffIcon /> : <VisibilityIcon />}
              onClick={() => setShowParticipants(!showParticipants)}
            >
              {showParticipants ? 'Hide' : 'Show'} Participants
            </Button>
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Document Editor */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Paper
              sx={{
                flex: 1,
                m: 1,
                p: 2,
                position: 'relative',
                overflow: 'auto',
              }}
            >
              <TextField
                ref={editorRef}
                value={documentContent}
                onChange={(e) => handleDocumentChange(e.target.value)}
                multiline
                fullWidth
                variant="outlined"
                minRows={20}
                maxRows={20}
                disabled={mode === EDITOR_MODES.REVIEW}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    lineHeight: 1.5,
                  },
                }}
                onSelect={(e) => {
                  if (mode === EDITOR_MODES.COMMENT) {
                    const target = e.target as HTMLTextAreaElement;
                    setCommentPosition(target.selectionStart);
                  }
                }}
              />

              {/* Comments Overlay */}
              {collaboration.comments.map((comment) => (
                <Paper
                  key={comment.id}
                  sx={{
                    position: 'absolute',
                    right: 10,
                    top: 100 + (comment.position / 10), // Simplified positioning
                    width: 250,
                    p: 1,
                    bgcolor: comment.resolved ? 'success.50' : 'warning.50',
                    border: 1,
                    borderColor: comment.resolved ? 'success.200' : 'warning.200',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="caption" fontWeight="bold">
                    Comment by {comment.userId}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {comment.content}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(new Date(comment.timestamp), 'MMM dd, h:mm a')}
                  </Typography>
                  {!comment.resolved && (
                    <Button
                      size="small"
                      onClick={() => {
                        setCollaboration({
                          ...collaboration,
                          comments: collaboration.comments.map(c =>
                            c.id === comment.id ? { ...c, resolved: true } : c
                          ),
                        });
                      }}
                      sx={{ mt: 1 }}
                    >
                      Resolve
                    </Button>
                  )}
                </Paper>
              ))}
            </Paper>

            {/* Comment Input */}
            {mode === EDITOR_MODES.COMMENT && commentPosition !== null && (
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <TextField
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  fullWidth
                  multiline
                  rows={2}
                  sx={{ mb: 1 }}
                />
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button onClick={() => setCommentPosition(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => addComment(commentPosition, newComment)}
                    disabled={!newComment.trim()}
                  >
                    Add Comment
                  </Button>
                </Box>
              </Box>
            )}
          </Box>

          {/* Participants Panel */}
          {showParticipants && (
            <Paper
              sx={{
                width: 250,
                m: 1,
                p: 2,
                borderLeft: 1,
                borderColor: 'divider',
              }}
            >
              <Typography variant="h6" gutterBottom>
                Participants
              </Typography>
              <List>
                {collaboration.participants.map((participant) => (
                  <ListItem key={participant.userId}>
                    <ListItemAvatar>
                      <Badge
                        variant="dot"
                        color={participant.online ? 'success' : 'default'}
                      >
                        <Avatar>
                          {participant.userId.charAt(0).toUpperCase()}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={participant.userId}
                      secondary={
                        <Box>
                          <Typography variant="caption">
                            {participant.role}
                          </Typography>
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            {participant.online ? 'Online' : 
                             `Last seen ${format(new Date(participant.lastSeen), 'MMM dd, h:mm a')}`}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Recent Changes
              </Typography>
              <List dense>
                {collaboration.changes.slice(-5).map((change) => (
                  <ListItem key={change.id}>
                    <ListItemText
                      primary={`${change.operation} by ${change.userId}`}
                      secondary={format(new Date(change.timestamp), 'h:mm a')}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Box>

        {/* Menu */}
        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
          <MenuItem onClick={() => { /* Export */ handleMenuClose(); }}>
            <DownloadIcon sx={{ mr: 1 }} />
            Export Document
          </MenuItem>
          <MenuItem onClick={() => { /* Print */ handleMenuClose(); }}>
            <PrintIcon sx={{ mr: 1 }} />
            Print Document
          </MenuItem>
          <MenuItem onClick={() => { /* Share */ handleMenuClose(); }}>
            <ShareIcon sx={{ mr: 1 }} />
            Share Link
          </MenuItem>
          <MenuItem onClick={() => { /* Security */ handleMenuClose(); }}>
            <SecurityIcon sx={{ mr: 1 }} />
            Security Settings
          </MenuItem>
        </Menu>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: { height: '90vh', display: 'flex', flexDirection: 'column' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Document Collaboration
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ flex: 1, p: 0, overflow: 'hidden' }}>
        {!collaboration ? renderDocumentSelector() : renderCollaborationEditor()}
      </DialogContent>

      {!collaboration && (
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default DocumentCollaborationDialog;
