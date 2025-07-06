import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, IconButton, TextField, Button, Paper, CircularProgress, Stack, Avatar, Tooltip, Alert } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import SendIcon from '@mui/icons-material/Send';
import StopIcon from '@mui/icons-material/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import PauseIcon from '@mui/icons-material/Pause';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useAuth } from '../contexts/AuthContext';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, doc, deleteDoc, limit, startAfter } from 'firebase/firestore';
import { handleError, handleApiError, retryWithBackoff, isOnline, initConnectivityMonitoring } from '../utils/errorHandler';
import '../App.css';

const db = getFirestore();

const features = [
  {
    title: 'Smart Voice Interaction',
    desc: 'Talk naturally, get intelligent responses',
  },
  {
    title: 'Text-to-Speech',
    desc: 'AI responses converted to audio',
  },
  {
    title: 'Chat History',
    desc: 'Persistent conversation storage',
  },
  {
    title: 'Seamless Authentication',
    desc: 'Quick Google sign-in',
  },
];

const Chat = () => {
  const { currentUser, profileSettings } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I am VIBE, your AI companion. How can I help you today?',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingStart, setRecordingStart] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ttsAudioUrl, setTtsAudioUrl] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [lastMessageDoc, setLastMessageDoc] = useState(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const inputRef = useRef();
  const audioRef = useRef();
  const timerRef = useRef();
  const messagesEndRef = useRef(null);
  const messagesStartRef = useRef(null);

  // Initialize connectivity monitoring
  useEffect(() => {
    const cleanup = initConnectivityMonitoring();
    return cleanup;
  }, []);

  // Load initial chat history from Firestore
  useEffect(() => {
    if (!currentUser) {
      setMessages([
        {
          id: 1,
          type: 'bot',
          content: 'Hello! I am VIBE, your AI companion. How can I help you today?',
          timestamp: new Date().toISOString(),
        },
      ]);
      return;
    }
    
    const loadInitialHistory = async () => {
      try {
        setLoading(true);
        const chatRef = collection(db, 'users', currentUser.uid, 'chats');
        const q = query(chatRef, orderBy('timestamp', 'desc'), limit(20));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // Reverse to show oldest first
          const reversedMessages = loaded.reverse();
          setMessages(reversedMessages);
          
          // Set the last document for pagination
          setLastMessageDoc(snapshot.docs[snapshot.docs.length - 1]);
          setHasMoreMessages(snapshot.docs.length === 20);
        } else {
          // No messages found, keep default welcome message
          setMessages([
            {
              id: 1,
              type: 'bot',
              content: 'Hello! I am VIBE, your AI companion. How can I help you today?',
              timestamp: new Date().toISOString(),
            },
          ]);
          setHasMoreMessages(false);
        }
        setInitialLoadComplete(true);
      } catch (error) {
        handleError(error, 'Loading chat history', true);
        // Continue with default message if history fails to load
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialHistory();
  }, [currentUser]);

  // Load older messages
  const loadOlderMessages = async () => {
    if (!currentUser || !lastMessageDoc || loadingOlderMessages || !hasMoreMessages) return;
    
    try {
      setLoadingOlderMessages(true);
      const chatRef = collection(db, 'users', currentUser.uid, 'chats');
      const q = query(
        chatRef, 
        orderBy('timestamp', 'desc'), 
        startAfter(lastMessageDoc), 
        limit(20)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const olderMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Reverse to show oldest first and prepend to existing messages
        const reversedOlderMessages = olderMessages.reverse();
        setMessages(prev => [...reversedOlderMessages, ...prev]);
        
        // Update the last document for next pagination
        setLastMessageDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMoreMessages(snapshot.docs.length === 20);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      handleError(error, 'Loading older messages', true);
    } finally {
      setLoadingOlderMessages(false);
    }
  };

  // Save message to Firestore with error handling
  const saveMessage = async (msg) => {
    if (!currentUser) return;
    try {
      const chatRef = collection(db, 'users', currentUser.uid, 'chats');
      await addDoc(chatRef, msg);
    } catch (error) {
      handleError(error, 'Saving message', false); // Don't show toast for save errors
      console.warn('Failed to save message to Firestore:', error);
    }
  };

  // Clear chat history on logout
  useEffect(() => {
    if (!currentUser) return;
    return () => {
      setMessages([
        {
          id: 1,
          type: 'bot',
          content: 'Hello! I am VIBE, your AI companion. How can I help you today?',
          timestamp: new Date().toISOString(),
        },
      ]);
      setHasMoreMessages(true);
      setLastMessageDoc(null);
      setInitialLoadComplete(false);
    };
  }, [currentUser]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (messagesEndRef.current && initialLoadComplete) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, initialLoadComplete]);

  // Start recording with enhanced error handling
  const handleStartRecording = async () => {
    if (!isOnline()) {
      handleError(new Error('No internet connection'), 'Voice recording', true);
      return;
    }

    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setRecordingStart(Date.now());
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new window.MediaRecorder(stream);
      let chunks = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
        clearInterval(timerRef.current);
      };
      
      recorder.onerror = (event) => {
        handleError(new Error('Recording failed'), 'Voice recording', true);
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        clearInterval(timerRef.current);
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
      timerRef.current = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - recordingStart) / 1000));
      }, 200);
    } catch (err) {
      handleError(err, 'Voice recording', true);
      setRecording(false);
      clearInterval(timerRef.current);
    }
  };

  // Stop recording
  const handleStopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setMediaRecorder(null);
      setRecording(false);
      setRecordingTime(Math.floor((Date.now() - recordingStart) / 1000));
      clearInterval(timerRef.current);
    }
  };

  // Play recorded audio
  const handlePlayAudio = () => {
    if (audioRef.current) {
      setPlaying(true);
      audioRef.current.play();
      audioRef.current.onended = () => setPlaying(false);
    }
  };

  // Delete recorded audio
  const handleDeleteAudio = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setPlaying(false);
  };

  // Play TTS audio with error handling
  const handlePlayTTS = (audioUrl) => {
    try {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      const audio = new window.Audio(audioUrl);
      
      audio.onerror = (error) => {
        handleError(error, 'TTS playback', true);
        setIsPlayingTTS(false);
        setCurrentAudio(null);
      };
      
      audio.play().catch((error) => {
        handleError(error, 'TTS playback', true);
        setIsPlayingTTS(false);
        setCurrentAudio(null);
      });
      
      setCurrentAudio(audio);
      setIsPlayingTTS(true);
      audio.onended = () => {
        setIsPlayingTTS(false);
        setCurrentAudio(null);
      };
    } catch (error) {
      handleError(error, 'TTS playback', true);
    }
  };

  // Stop TTS audio
  const handleStopTTS = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
      setIsPlayingTTS(false);
    }
  };

  // Enhanced send message with retry logic
  const handleSend = async () => {
    if (!input.trim()) return;
    if (!isOnline()) {
      handleError(new Error('No internet connection'), 'Sending message', true);
      return;
    }

    const userMsg = {
      id: Date.now(),
      type: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };
    setMessages((msgs) => [...msgs, userMsg]);
    saveMessage(userMsg);
    setInput('');
    setLoading(true);
    setConnectionError(false);
    
    try {
      const sendMessage = async () => {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/conversation/text`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: input,
            personality: 'young_friend',
            language: 'english',
          }),
        });
        
        const apiError = await handleApiError(res, 'Sending message');
        if (apiError) {
          throw new Error(apiError.userMessage);
        }
        
        const data = await res.json();
        return data;
      };

      const data = await retryWithBackoff(sendMessage, 3, 1000);
      
      const botMsg = {
        id: Date.now() + 1,
        type: 'bot',
        content: data.response || 'VIBE could not process your message.',
        timestamp: new Date().toISOString(),
        ttsAudioUrl: data.ttsAudioUrl || null,
      };
      setMessages((msgs) => [...msgs, botMsg]);
      saveMessage(botMsg);
      
      if (data.ttsAudioUrl) {
        setTimeout(() => {
          handlePlayTTS(data.ttsAudioUrl);
        }, 500);
      }
      
      setRetryCount(0);
    } catch (err) {
      setConnectionError(true);
      setRetryCount(prev => prev + 1);
      
      const errMsg = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Sorry, I\'m having trouble responding right now. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages((msgs) => [...msgs, errMsg]);
      saveMessage(errMsg);
    }
    setLoading(false);
  };

  // Enhanced send audio with retry logic
  const handleSendAudio = async () => {
    if (!audioBlob) return;
    if (!isOnline()) {
      handleError(new Error('No internet connection'), 'Sending voice message', true);
      return;
    }

    setLoading(true);
    setConnectionError(false);
    
    try {
      const sendAudio = async () => {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        formData.append('personality', 'young_friend');
        formData.append('language', 'english');
        
        const res = await fetch(`${process.env.REACT_APP_API_URL}/conversation/voice`, {
          method: 'POST',
          body: formData,
        });
        
        const apiError = await handleApiError(res, 'Sending voice message');
        if (apiError) {
          throw new Error(apiError.userMessage);
        }
        
        const data = await res.json();
        return data;
      };

      const data = await retryWithBackoff(sendAudio, 3, 1000);
      
      const userMsg = {
        id: Date.now(),
        type: 'user',
        content: data.transcription || '[Voice message]',
        timestamp: new Date().toISOString(),
      };
      setMessages((msgs) => [...msgs, userMsg]);
      saveMessage(userMsg);
      
      const botMsg = {
        id: Date.now() + 1,
        type: 'bot',
        content: data.response || 'VIBE could not process your voice message.',
        timestamp: new Date().toISOString(),
        ttsAudioUrl: data.ttsAudioUrl || null,
      };
      setMessages((msgs) => [...msgs, botMsg]);
      saveMessage(botMsg);
      
      if (data.ttsAudioUrl) {
        setTimeout(() => {
          handlePlayTTS(data.ttsAudioUrl);
        }, 500);
      }
      
      setRetryCount(0);
    } catch (err) {
      setConnectionError(true);
      setRetryCount(prev => prev + 1);
      
      const errMsg = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Sorry, I couldn\'t process your voice message. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages((msgs) => [...msgs, errMsg]);
      saveMessage(errMsg);
    }
    setLoading(false);
    setAudioBlob(null);
    setAudioUrl(null);
  };

  // Retry last failed request
  const handleRetry = () => {
    setConnectionError(false);
    if (audioBlob) {
      handleSendAudio();
    } else if (input.trim()) {
      handleSend();
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
      pt: { xs: 0, sm: 2 }
    }}>
      <Box sx={{ 
        flex: 1, 
        width: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        height: { xs: 'calc(100vh - 64px)', sm: 'calc(100vh - 70px)' }
      }}>
        {/* Connection Error Alert */}
        {connectionError && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 0,
              borderRadius: 0,
              '& .MuiAlert-message': {
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }
            }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                startIcon={<RefreshIcon />}
                onClick={handleRetry}
                sx={{ minHeight: 32 }}
              >
                Retry
              </Button>
            }
          >
            Connection failed. Please check your internet connection and try again.
          </Alert>
        )}
        
        {/* Chat Messages Area */}
        <Paper 
          elevation={0}
          sx={{ 
            flex: 1, 
            p: { xs: 1, sm: 2 }, 
            overflowY: 'auto', 
            background: 'transparent',
            borderRadius: 0,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box sx={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            minHeight: 0
          }}>
            <Stack spacing={1.5} sx={{ flex: 1, justifyContent: 'flex-end' }}>
              {/* Load Older Messages Button */}
              {hasMoreMessages && initialLoadComplete && (
                <Box display="flex" justifyContent="center" py={1}>
                  <Button
                    variant="outlined"
                    startIcon={loadingOlderMessages ? <CircularProgress size={16} /> : <ExpandMoreIcon />}
                    onClick={loadOlderMessages}
                    disabled={loadingOlderMessages}
                    sx={{
                      color: 'rgba(255,255,255,0.7)',
                      borderColor: 'rgba(255,255,255,0.3)',
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      minHeight: 36,
                      '&:hover': {
                        borderColor: 'rgba(255,255,255,0.5)',
                        color: 'rgba(255,255,255,0.9)'
                      }
                    }}
                  >
                    {loadingOlderMessages ? 'Loading...' : 'Load Older Messages'}
                  </Button>
                </Box>
              )}
              
              {/* Messages */}
              {messages.map((msg) => (
                <Box key={msg.id} display="flex" flexDirection={msg.type === 'user' ? 'row-reverse' : 'row'} alignItems="flex-end">
                  {msg.type === 'user' ? (
                    <Avatar 
                      src={currentUser?.photoURL}
                      alt={currentUser?.displayName || 'User'}
                      sx={{ 
                        bgcolor: currentUser?.photoURL ? 'transparent' : '#6366f1',
                        width: { xs: 28, sm: 36 }, 
                        height: { xs: 28, sm: 36 },
                        fontSize: { xs: '0.7rem', sm: '1rem' },
                        display: { xs: 'none', sm: 'flex' }
                      }}
                    >
                      {!currentUser?.photoURL && (currentUser?.displayName?.[0] || 'U')}
                    </Avatar>
                  ) : (
                    <Avatar 
                      src="/logo.png"
                      alt="VIBE"
                      sx={{ 
                        bgcolor: msg.isError ? '#dc2626' : '#fff',
                        width: { xs: 28, sm: 36 }, 
                        height: { xs: 28, sm: 36 },
                        fontSize: { xs: '0.7rem', sm: '1rem' },
                        display: { xs: 'none', sm: 'flex' },
                        '& img': {
                          objectFit: 'contain',
                          padding: '4px'
                        }
                      }}
                    >
                      {msg.isError ? '!' : 'V'}
                    </Avatar>
                  )}
                  <Box
                    sx={{
                      bgcolor: msg.type === 'user' ? '#6366f1' : (msg.isError ? '#dc2626' : '#ec4899'),
                      color: '#fff',
                      px: { xs: 2, sm: 2 },
                      py: { xs: 1.5, sm: 1.5 },
                      borderRadius: { xs: '18px', sm: 2 },
                      maxWidth: { xs: '85%', sm: '70%' },
                      ml: msg.type === 'user' ? 0 : { xs: 0, sm: 1.5 },
                      mr: msg.type === 'user' ? { xs: 0, sm: 1.5 } : 0,
                      fontSize: { xs: 15, sm: 16 },
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      wordBreak: 'break-word',
                      lineHeight: 1.4
                    }}
                  >
                    {msg.content}
                    {msg.type === 'bot' && msg.ttsAudioUrl && (
                      <Box sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
                        <Tooltip title={isPlayingTTS ? 'Stop' : 'Play'}>
                          <IconButton 
                            size="small" 
                            color="secondary" 
                            onClick={() => {
                              if (isPlayingTTS) {
                                handleStopTTS();
                              } else {
                                handlePlayTTS(msg.ttsAudioUrl);
                              }
                            }}
                            sx={{ 
                              minWidth: 28, 
                              minHeight: 28,
                              color: 'rgba(255,255,255,0.8)'
                            }}
                          >
                            {isPlayingTTS ? <PauseIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                        {isPlayingTTS && (
                          <span className="waveform" style={{ marginLeft: 4 }}>
                            <span className="wave-bar" />
                            <span className="wave-bar" />
                            <span className="wave-bar" />
                          </span>
                        )}
                      </Box>
                    )}
                  </Box>
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    sx={{ 
                      mx: { xs: 0.5, sm: 1 }, 
                      minWidth: { xs: 40, sm: 60 },
                      fontSize: { xs: '0.65rem', sm: '0.75rem' },
                      alignSelf: 'flex-end',
                      mb: 0.5
                    }}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
              ))}
              <div ref={messagesEndRef} />
              {loading && (
                <Box display="flex" alignItems="center" justifyContent="center" py={2}>
                  <CircularProgress size={24} color="secondary" />
                  <Typography variant="body2" color="text.secondary" ml={2} sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    VIBE is thinking...
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        </Paper>
        
        {/* Input Area - Fixed at bottom */}
        <Box 
          className="chat-input-area"
          sx={{ 
            background: 'rgba(26,26,46,0.95)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            p: { xs: 1.5, sm: 2 },
            position: 'sticky',
            bottom: 0,
            zIndex: 10,
            width: '100%'
          }}
        >
          {/* Voice recording controls */}
          {audioUrl ? (
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <audio ref={audioRef} src={audioUrl} />
              <Tooltip title="Play">
                <IconButton 
                  color="primary" 
                  onClick={handlePlayAudio} 
                  disabled={playing}
                  sx={{ minWidth: 44, minHeight: 44 }}
                >
                  <PlayArrowIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton 
                  color="error" 
                  onClick={handleDeleteAudio}
                  sx={{ minWidth: 44, minHeight: 44 }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSendAudio} 
                disabled={loading}
                sx={{ 
                  minHeight: 55,
                  flex: 1,
                  maxWidth: { xs: '150px', sm: 'none' }
                }}
              >
                Send Voice
              </Button>
              <Typography variant="caption" color="text.secondary">
                {recordingTime}s
              </Typography>
            </Box>
          ) : (
            <Box display="flex" alignItems="center" gap={1}>
              <Tooltip title={recording ? 'Stop Recording' : 'Start Recording'}>
                <IconButton 
                  color={recording ? 'error' : 'primary'} 
                  onClick={recording ? handleStopRecording : handleStartRecording} 
                  sx={{ 
                    minWidth: 44,
                    minHeight: 44,
                    bgcolor: recording ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)'
                  }}
                >
                  {recording ? <MicIcon className="pulse" /> : <MicIcon />}
                </IconButton>
              </Tooltip>
              <TextField
                inputRef={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                fullWidth
                size="small"
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.05)',
                  borderRadius: '24px',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '24px',
                    '& fieldset': {
                      borderColor: 'rgba(255,255,255,0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255,255,255,0.2)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#6366f1',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: '#fff',
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    padding: { xs: '12px 16px', sm: '14px 20px' }
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: 'rgba(255,255,255,0.5)',
                    opacity: 1
                  }
                }}
                disabled={loading}
              />
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSend} 
                disabled={!input.trim() || loading} 
                sx={{ 
                  minWidth: 44, 
                  minHeight: 44,
                  borderRadius: '50%',
                  bgcolor: input.trim() ? '#6366f1' : 'rgba(255,255,255,0.1)',
                  '&:hover': {
                    bgcolor: input.trim() ? '#5b5bdb' : 'rgba(255,255,255,0.2)'
                  }
                }}
              >
                <SendIcon />
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Chat; 