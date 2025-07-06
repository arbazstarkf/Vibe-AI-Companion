import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Container, 
  Paper, 
  TextField, 
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import GoogleIcon from '@mui/icons-material/Google';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

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
    desc: 'See your previous conversations',
  },
  {
    title: 'Modern UI',
    desc: 'Fast, responsive, and beautiful design',
  },
];

const AuthPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, loading } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!isLogin && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      if (isLogin) {
        await signInWithEmail(formData.email, formData.password);
      } else {
        await signUpWithEmail(formData.email, formData.password);
      }
      navigate('/chat');
    } catch (error) {
      // Error handling is done in AuthContext
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      navigate('/chat');
    } catch (error) {
      // Error handling is done in AuthContext
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
      display: 'flex',
      alignItems: 'center',
      py: { xs: 2, sm: 4 }
    }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 3 }}>
          <IconButton 
            onClick={() => navigate('/')}
            sx={{ 
              color: 'white', 
              mb: 2,
              minWidth: 44,
              minHeight: 44
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Box>
        
        {isMobile ? (
          // Mobile Layout - Stacked
          <Box>
            {/* Google Sign-in Section */}
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Paper 
                elevation={8}
                sx={{ 
                  p: { xs: 3, sm: 4 }, 
                  mb: 3,
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 3
                }}
              >
                <Box textAlign="center" mb={3}>
                  <Typography variant="h5" fontWeight={600} gutterBottom sx={{ color: 'white' }}>
                    Quick Start
                  </Typography>
                  <Typography variant="body1" color="text.secondary" mb={4}>
                    Sign in with your Google account for instant access
                  </Typography>
                </Box>
                
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<GoogleIcon />}
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  sx={{ 
                    py: 1.5,
                    minHeight: 48,
                    background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5b5bdb, #db2777)'
                    }
                  }}
                >
                  Continue with Google
                </Button>
              </Paper>
            </motion.div>

            {/* Email/Password Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Paper 
                elevation={8}
                sx={{ 
                  p: { xs: 3, sm: 4 },
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 3
                }}
              >
                <Box textAlign="center" mb={3}>
                  <Typography variant="h5" fontWeight={600} gutterBottom sx={{ color: 'white' }}>
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {isLogin ? 'Sign in to your account' : 'Join VIBE today'}
                  </Typography>
                </Box>

                <form onSubmit={handleEmailAuth}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    error={!!errors.email}
                    helperText={errors.email}
                    sx={{ mb: 3 }}
                    InputProps={{
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#6366f1',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255, 255, 255, 0.7)',
                        },
                        '& .MuiInputBase-input': {
                          color: 'white',
                        },
                      }
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    error={!!errors.password}
                    helperText={errors.password}
                    sx={{ mb: 3 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            sx={{ 
                              color: 'rgba(255, 255, 255, 0.7)',
                              minWidth: 44,
                              minHeight: 44
                            }}
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#6366f1',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255, 255, 255, 0.7)',
                        },
                        '& .MuiInputBase-input': {
                          color: 'white',
                        },
                      }
                    }}
                  />

                  {!isLogin && (
                    <TextField
                      fullWidth
                      label="Confirm Password"
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      error={!!errors.confirmPassword}
                      helperText={errors.confirmPassword}
                      sx={{ mb: 3 }}
                      InputProps={{
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.3)',
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.5)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#6366f1',
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: 'rgba(255, 255, 255, 0.7)',
                          },
                          '& .MuiInputBase-input': {
                            color: 'white',
                          },
                        }
                      }}
                    />
                  )}

                  <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{ 
                      py: 1.5,
                      mb: 3,
                      minHeight: 48,
                      background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5b5bdb, #db2777)'
                      }
                    }}
                  >
                    {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up')}
                  </Button>
                </form>

                <Box textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <Button
                      variant="text"
                      onClick={() => setIsLogin(!isLogin)}
                      sx={{ 
                        color: '#6366f1',
                        textTransform: 'none',
                        p: 0,
                        minWidth: 'auto'
                      }}
                    >
                      {isLogin ? 'Sign Up' : 'Sign In'}
                    </Button>
                  </Typography>
                </Box>
              </Paper>
            </motion.div>
          </Box>
        ) : (
          // Desktop Layout - Side by Side
          <Grid container spacing={4} justifyContent="center" alignItems="stretch">
            {/* Google Sign-in Side */}
            <Grid item xs={12} md={5}>
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                style={{ height: '100%' }}
              >
                <Paper 
                  elevation={8}
                  sx={{ 
                    p: 4, 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 3
                  }}
                >
                  <Box textAlign="center" mb={3}>
                    <Typography variant="h4" fontWeight={600} gutterBottom sx={{ color: 'white' }}>
                      Quick Start
                    </Typography>
                    <Typography variant="body1" color="text.secondary" mb={4}>
                      Sign in with your Google account for instant access
                    </Typography>
                  </Box>
                  
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      startIcon={<GoogleIcon />}
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                      sx={{ 
                        py: 1.5,
                        background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5b5bdb, #db2777)'
                        }
                      }}
                    >
                      Continue with Google
                    </Button>
                  </Box>
                  
                  <Box textAlign="center" pt={4}>
                    <Typography variant="body2" color="text.secondary">
                      By continuing, you agree to our Terms of Service and Privacy Policy
                    </Typography>
                  </Box>
                </Paper>
              </motion.div>
            </Grid>

            {/* Divider */}
            <Grid item xs={12} md={1} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', height: '100%' }}>
                <Divider orientation="vertical" sx={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />
              </Box>
            </Grid>

            {/* Email/Password Side */}
            <Grid item xs={12} md={5}>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                style={{ height: '100%' }}
              >
                <Paper 
                  elevation={8}
                  sx={{ 
                    p: 4,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 3
                  }}
                >
                  <Box textAlign="center" mb={3}>
                    <Typography variant="h4" fontWeight={600} gutterBottom sx={{ color: 'white' }}>
                      {isLogin ? 'Welcome Back' : 'Create Account'}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {isLogin ? 'Sign in to your account' : 'Join VIBE today'}
                    </Typography>
                  </Box>

                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <form onSubmit={handleEmailAuth}>
                      <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        error={!!errors.email}
                        helperText={errors.email}
                        sx={{ mb: 3 }}
                        InputProps={{
                          sx: {
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.3)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.5)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#6366f1',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: 'rgba(255, 255, 255, 0.7)',
                            },
                            '& .MuiInputBase-input': {
                              color: 'white',
                            },
                          }
                        }}
                      />

                      <TextField
                        fullWidth
                        label="Password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleInputChange}
                        error={!!errors.password}
                        helperText={errors.password}
                        sx={{ mb: 3 }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                                sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                              >
                                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            </InputAdornment>
                          ),
                          sx: {
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.3)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(255, 255, 255, 0.5)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#6366f1',
                              },
                            },
                            '& .MuiInputLabel-root': {
                              color: 'rgba(255, 255, 255, 0.7)',
                            },
                            '& .MuiInputBase-input': {
                              color: 'white',
                            },
                          }
                        }}
                      />

                      {!isLogin && (
                        <TextField
                          fullWidth
                          label="Confirm Password"
                          name="confirmPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          error={!!errors.confirmPassword}
                          helperText={errors.confirmPassword}
                          sx={{ mb: 3 }}
                          InputProps={{
                            sx: {
                              '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                  borderColor: 'rgba(255, 255, 255, 0.3)',
                                },
                                '&:hover fieldset': {
                                  borderColor: 'rgba(255, 255, 255, 0.5)',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: '#6366f1',
                                },
                              },
                              '& .MuiInputLabel-root': {
                                color: 'rgba(255, 255, 255, 0.7)',
                              },
                              '& .MuiInputBase-input': {
                                color: 'white',
                              },
                            }
                          }}
                        />
                      )}

                      <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={loading}
                        sx={{ 
                          py: 1.5,
                          mb: 3,
                          background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #5b5bdb, #db2777)'
                          }
                        }}
                      >
                        {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up')}
                      </Button>
                    </form>
                  </Box>

                  <Box textAlign="center" pt={4}>
                    <Typography variant="body2" color="text.secondary">
                      {isLogin ? "Don't have an account? " : "Already have an account? "}
                      <Button
                        variant="text"
                        onClick={() => setIsLogin(!isLogin)}
                        sx={{ 
                          color: '#6366f1',
                          textTransform: 'none',
                          p: 0,
                          minWidth: 'auto'
                        }}
                      >
                        {isLogin ? 'Sign Up' : 'Sign In'}
                      </Button>
                    </Typography>
                  </Box>
                </Paper>
              </motion.div>
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default AuthPage; 