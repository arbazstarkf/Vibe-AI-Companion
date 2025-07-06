import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ChatIcon from '@mui/icons-material/Chat';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, signOutUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMobileMenuAnchor(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await signOutUser();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { label: 'Chat', path: '/chat', icon: <ChatIcon /> },
    { label: 'Profile', path: '/profile', icon: <PersonIcon /> }
  ];

  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        background: 'rgba(26, 26, 46, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 2px 20px rgba(0, 0, 0, 0.1)',
        top: 0,
        zIndex: 1000
      }}
    >
      <Toolbar sx={{ 
        justifyContent: 'space-between',
        minHeight: { xs: 64, sm: 70 },
        px: { xs: 2, sm: 3 }
      }}>
        {/* Logo and Brand */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          cursor: 'pointer' 
        }} onClick={() => navigate('/chat')}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1 
          }}>
            <img 
              src="/logo.png" 
              alt="VIBE Logo" 
              style={{
                width: '32px',
                height: '32px',
                objectFit: 'contain'
              }}
            />
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '1.1rem', sm: '1.25rem' }
              }}
            >
              VIBE
            </Typography>
          </Box>
        </Box>

        {/* Desktop Navigation */}
        {!isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                startIcon={item.icon}
                onClick={() => navigate(item.path)}
                sx={{
                  color: isActive(item.path) ? '#6366f1' : 'rgba(255, 255, 255, 0.8)',
                  backgroundColor: isActive(item.path) ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  '&:hover': {
                    backgroundColor: isActive(item.path) ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                    color: isActive(item.path) ? '#6366f1' : 'white'
                  },
                  borderRadius: 2,
                  px: 2,
                  py: 1,
                  minHeight: 44,
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        )}

        {/* User Profile Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }}>
                {currentUser?.displayName || currentUser?.email}
              </Typography>
              <Avatar
                src={currentUser?.photoURL}
                alt={currentUser?.displayName || 'User'}
                sx={{ 
                  width: { xs: 36, sm: 40 }, 
                  height: { xs: 36, sm: 40 },
                  cursor: 'pointer',
                  border: '2px solid rgba(255, 255, 255, 0.2)'
                }}
                onClick={handleProfileMenuOpen}
              />
            </Box>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              color="inherit"
              onClick={handleMobileMenuOpen}
              sx={{ 
                ml: 1,
                minWidth: 44,
                minHeight: 44
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Box>

        {/* Desktop Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              background: 'rgba(26, 26, 46, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              mt: 1,
              minWidth: 150
            }
          }}
        >
          <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
            <PersonIcon sx={{ mr: 1 }} />
            Profile
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <LogoutIcon sx={{ mr: 1 }} />
            Logout
          </MenuItem>
        </Menu>

        {/* Mobile Menu */}
        <Menu
          anchorEl={mobileMenuAnchor}
          open={Boolean(mobileMenuAnchor)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              background: 'rgba(26, 26, 46, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              mt: 1,
              minWidth: 200
            }
          }}
        >
          {navItems.map((item) => (
            <MenuItem
              key={item.path}
              onClick={() => { handleMenuClose(); navigate(item.path); }}
              sx={{
                color: isActive(item.path) ? '#6366f1' : 'rgba(255, 255, 255, 0.8)',
                backgroundColor: isActive(item.path) ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                minHeight: 48,
                fontSize: '1rem'
              }}
            >
              {item.icon}
              <Typography sx={{ ml: 1 }}>{item.label}</Typography>
            </MenuItem>
          ))}
          <MenuItem onClick={handleLogout} sx={{ minHeight: 48, fontSize: '1rem' }}>
            <LogoutIcon sx={{ mr: 1 }} />
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation; 