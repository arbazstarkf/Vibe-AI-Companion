import React from 'react';
import { Box, Button, Typography, Container, Card, CardContent, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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

const LandingPage = () => {
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();

  React.useEffect(() => {
    if (!loading && currentUser) {
      navigate('/chat', { replace: true });
    }
  }, [loading, currentUser, navigate]);

  const handleGetStarted = () => {
    navigate('/auth');
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
      position: 'relative',
      overflow: 'hidden',
      pt: 8,
      pb: 4
    }}>
      {/* Animated background elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #ec4899)',
          opacity: 0.1,
          animation: 'float 6s ease-in-out infinite'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '20%',
          right: '15%',
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ec4899, #6366f1)',
          opacity: 0.1,
          animation: 'float 8s ease-in-out infinite reverse'
        }}
      />
      
      <Container maxWidth="md">
        <Box textAlign="center">
          <motion.div 
            initial={{ opacity: 0, y: -40 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8 }}
          >
            <Typography 
              variant="h1" 
              className="gradient-text" 
              fontWeight={700} 
              gutterBottom
              sx={{ 
                fontSize: { xs: '2.5rem', sm: '3rem', md: '4rem', lg: '4.5rem' },
                mb: 2,
                lineHeight: 1.2
              }}
            >
              VIBE
            </Typography>
            
            <Typography 
              variant="h4" 
              color="text.secondary" 
              gutterBottom
              sx={{ 
                fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem', lg: '2rem' },
                mb: 3,
                lineHeight: 1.3
              }}
            >
              Voice Interactive Behavioural E-Companion
            </Typography>
            
            <Typography 
              variant="h6" 
              color="text.secondary" 
              mb={4}
              sx={{ 
                fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem', lg: '1.25rem' },
                maxWidth: { xs: '100%', sm: 600 },
                mx: 'auto',
                lineHeight: 1.6,
                px: { xs: 2, sm: 0 }
              }}
            >
              Experience the future of AI conversation. Talk naturally, get intelligent responses, 
              and enjoy seamless voice interactions with your personal AI companion.
            </Typography>

            <motion.div 
              animate={{ scale: [1, 1.05, 1] }} 
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Box 
                sx={{ 
                  width: { xs: 80, sm: 100, md: 120 }, 
                  height: { xs: 80, sm: 100, md: 120 }, 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg,rgba(99, 165, 241, 0.24),rgba(236, 72, 233, 0.25))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 32px',
                  boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)',
                  overflow: 'hidden'
                }}
              >
                <img 
                  src="/logo.png" 
                  alt="VIBE Logo" 
                  style={{
                    width: '70%',
                    height: '70%',
                    objectFit: 'contain'
                  }}
                />
              </Box>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="contained"
                size="large"
                onClick={handleGetStarted}
                sx={{ 
                  px: { xs: 4, sm: 5, md: 6 }, 
                  py: { xs: 1.5, sm: 2 }, 
                  fontWeight: 600, 
                  fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' }, 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                  boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)',
                  minHeight: { xs: 48, sm: 56 },
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5b5bdb, #db2777)',
                    boxShadow: '0 12px 40px rgba(99, 102, 241, 0.4)'
                  }
                }}
              >
                Get Started
              </Button>
            </motion.div>
          </motion.div>
        </Box>
        
        {/* Feature Cards */}
        <Box mt={{ xs: 6, sm: 8 }}>
          <Grid container spacing={{ xs: 2, sm: 3 }} justifyContent="center">
            {features.map((feature, idx) => (
              <Grid item xs={12} sm={6} md={3} key={feature.title}>
                <motion.div 
                  initial={{ opacity: 0, y: 30 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.3 + idx * 0.1 }}
                >
                  <Card 
                    className="glass" 
                    sx={{ 
                      height: { xs: 140, sm: 160 }, 
                      border: '1px solid rgba(99, 102, 241, 0.3)', 
                      boxShadow: '0 4px 20px rgba(99, 102, 241, 0.1)',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 8px 30px rgba(99, 102, 241, 0.2)',
                        border: '1px solid rgba(99, 102, 241, 0.5)'
                      }
                    }}
                  >
                    <CardContent sx={{ 
                      textAlign: 'center', 
                      p: { xs: 2, sm: 3 },
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}>
                      <Typography variant="h6" fontWeight={600} gutterBottom sx={{ 
                        color: 'white',
                        fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                        mb: 1
                      }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: { xs: '0.8rem', sm: '0.9rem' },
                        lineHeight: 1.4
                      }}>
                        {feature.desc}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
      
      {/* Footer */}
      <Box mt={8} textAlign="center" color="text.secondary" sx={{ pb: 4 }}>
        <Typography variant="body2">
          Created by Arbaz for Edunet Microsoft Internship Program by AICTE
        </Typography>
      </Box>
    </Box>
  );
};

export default LandingPage; 