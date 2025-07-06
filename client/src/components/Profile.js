import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Avatar, 
  Button, 
  Stack, 
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { useAuth } from '../contexts/AuthContext';
import { getFirestore, collection, getDocs, query, deleteDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { handleError } from '../utils/errorHandler';
import toast from 'react-hot-toast';

const db = getFirestore();

const Profile = () => {
  const { currentUser, signOutUser, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clearChatDialog, setClearChatDialog] = useState(false);
  const navigate = useNavigate();

  // Handle logout
  const handleLogout = async () => {
    try {
      setLoading(true);
      await signOutUser();
      navigate('/');
    } catch (error) {
      handleError(error, 'Logout', true);
    } finally {
      setLoading(false);
    }
  };

  // Handle clear chat
  const handleClearChat = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const chatRef = collection(db, 'users', currentUser.uid, 'chats');
      const snapshot = await getDocs(chatRef);
      
      // Delete all chat documents
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      toast.success('Chat history cleared successfully');
      setClearChatDialog(false);
    } catch (error) {
      handleError(error, 'Clearing chat history', true);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)'
        }}
      >
        <CircularProgress size={60} color="secondary" />
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
        py: { xs: 2, sm: 4 }
      }}
    >
      <Box sx={{ 
        maxWidth: 500, 
        mx: 'auto', 
        px: { xs: 2, sm: 3 }
      }}>
        <Typography 
          variant="h4" 
          fontWeight={700} 
          mb={{ xs: 3, sm: 4 }} 
          align="center" 
          sx={{ 
            background: 'linear-gradient(135deg, #6366f1, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' }
          }}
        >
          Profile
        </Typography>
        
        <Paper 
          sx={{ 
            p: { xs: 3, sm: 4 }, 
            borderRadius: 3, 
            background: 'rgba(26,26,46,0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          {/* User Info Section */}
          <Box display="flex" flexDirection="column" alignItems="center" mb={{ xs: 3, sm: 4 }}>
            <Avatar 
              src={currentUser?.photoURL} 
              sx={{ 
                width: { xs: 70, sm: 80 }, 
                height: { xs: 70, sm: 80 }, 
                mb: 2,
                border: '3px solid #6366f1'
              }} 
            />
            <Typography 
              variant="h5" 
              fontWeight={600}
              sx={{ 
                color: '#ffffff', 
                mb: 1,
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                textAlign: 'center'
              }}
            >
              {currentUser?.displayName || 'User'}
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#a0a0a0',
                fontSize: { xs: '0.9rem', sm: '1rem' },
                textAlign: 'center',
                wordBreak: 'break-word'
              }}
            >
              {currentUser?.email}
            </Typography>
          </Box>

          <Divider sx={{ my: { xs: 2, sm: 3 }, borderColor: 'rgba(255,255,255,0.1)' }} />

          {/* Account Info */}
          <Box mb={{ xs: 3, sm: 4 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#ffffff', 
                mb: 2,
                fontSize: { xs: '1.1rem', sm: '1.25rem' }
              }}
            >
              Account Information
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" sx={{ 
                  color: '#a0a0a0', 
                  mb: 0.5,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }
                }}>
                  User ID
                </Typography>
                <Typography variant="body1" sx={{ 
                  color: '#ffffff', 
                  fontFamily: 'monospace',
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  wordBreak: 'break-all'
                }}>
                  {currentUser?.uid || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ 
                  color: '#a0a0a0', 
                  mb: 0.5,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }
                }}>
                  Account Created
                </Typography>
                <Typography variant="body1" sx={{ 
                  color: '#ffffff',
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}>
                  {currentUser?.metadata?.creationTime 
                    ? new Date(currentUser.metadata.creationTime).toLocaleDateString()
                    : 'N/A'
                  }
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ 
                  color: '#a0a0a0', 
                  mb: 0.5,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }
                }}>
                  Last Sign In
                </Typography>
                <Typography variant="body1" sx={{ 
                  color: '#ffffff',
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}>
                  {currentUser?.metadata?.lastSignInTime 
                    ? new Date(currentUser.metadata.lastSignInTime).toLocaleDateString()
                    : 'N/A'
                  }
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Divider sx={{ my: { xs: 2, sm: 3 }, borderColor: 'rgba(255,255,255,0.1)' }} />

          {/* Action Buttons */}
          <Stack spacing={2}>
            <Button
              variant="outlined"
              startIcon={<DeleteSweepIcon />}
              onClick={() => setClearChatDialog(true)}
              disabled={loading}
              sx={{
                color: '#ec4899',
                borderColor: '#ec4899',
                minHeight: { xs: 48, sm: 56 },
                fontSize: { xs: '0.9rem', sm: '1rem' },
                '&:hover': {
                  borderColor: '#ec4899',
                  backgroundColor: 'rgba(236, 72, 153, 0.1)'
                }
              }}
            >
              Clear Chat History
            </Button>
            <Button
              variant="contained"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              disabled={loading}
              sx={{
                background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                minHeight: { xs: 48, sm: 56 },
                fontSize: { xs: '0.9rem', sm: '1rem' },
                '&:hover': {
                  background: 'linear-gradient(135deg, #5b5bdb, #db2777)'
                }
              }}
            >
              Logout
            </Button>
          </Stack>
        </Paper>
      </Box>

      {/* Clear Chat Dialog */}
      <Dialog 
        open={clearChatDialog} 
        onClose={() => setClearChatDialog(false)}
        PaperProps={{
          sx: {
            background: 'rgba(26,26,46,0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 3,
            minWidth: { xs: '90%', sm: 400 }
          }
        }}
      >
        <DialogTitle sx={{ color: '#ffffff' }}>
          Clear Chat History
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#a0a0a0' }}>
            Are you sure you want to clear all your chat history? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setClearChatDialog(false)}
            sx={{ color: '#a0a0a0' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleClearChat}
            variant="contained"
            color="error"
            disabled={loading}
            sx={{ minHeight: 44 }}
          >
            {loading ? 'Clearing...' : 'Clear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile; 