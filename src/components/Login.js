import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
  Grid,
  Fade,
  Zoom,
  useTheme,
  useMediaQuery,
  Divider,
  InputAdornment,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  Home as HomeIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = (event) => event.preventDefault();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      setError('Failed to log in. Please check your credentials.');
      console.error('Login error:', error);
    }
    setLoading(false);
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.primary.dark} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4
      }}
    >
      <Container component="main" maxWidth="lg">
        <Grid container justifyContent="center">
          <Grid item xs={12} md={6} lg={5}>
            <Zoom in={true} style={{ transitionDelay: '100ms' }}>
              <Paper 
                elevation={10} 
                sx={{ 
                  borderRadius: 4,
                  overflow: 'hidden',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}
              >
                {/* Decorative Header */}
                <Box
                  sx={{
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    color: 'white',
                    py: 3,
                    px: 4,
                    textAlign: 'center'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                    <HomeIcon sx={{ fontSize: 32, mr: 1 }} />
                    <Typography variant="h4" component="h1" fontWeight="700">
                      RentEase
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    Property Management System
                  </Typography>
                </Box>

                <Box sx={{ px: 4, pb: 4, pt: 3 }}>
                  <Typography component="h2" variant="h5" align="center" gutterBottom fontWeight="600">
                    Welcome Back
                  </Typography>
                  <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
                    Sign in to manage your properties and tenants
                  </Typography>
                  
                  {error && (
                    <Fade in={!!error}>
                      <Alert 
                        severity="error" 
                        sx={{ 
                          mb: 3,
                          borderRadius: 2,
                          alignItems: 'center'
                        }}
                        onClose={() => setError('')}
                      >
                        {error}
                      </Alert>
                    </Fade>
                  )}
                  
                  <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      id="email"
                      label="Email Address"
                      name="email"
                      autoComplete="email"
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          transition: 'all 0.3s ease',
                          '&:hover fieldset': {
                            borderColor: theme.palette.primary.main,
                          },
                        }
                      }}
                    />
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      name="password"
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color="primary" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleClickShowPassword}
                              onMouseDown={handleMouseDownPassword}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          transition: 'all 0.3s ease',
                          '&:hover fieldset': {
                            borderColor: theme.palette.primary.main,
                          },
                        }
                      }}
                    />
                    
                    <Box sx={{ textAlign: 'right', mt: 1, mb: 2 }}>
                      <Link 
                        href="/forgot-password" 
                        variant="body2" 
                        sx={{ 
                          color: theme.palette.primary.main,
                          textDecoration: 'none',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        Forgot password?
                      </Link>
                    </Box>
                    
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      disabled={loading}
                      sx={{
                        mt: 2,
                        mb: 2,
                        py: 1.5,
                        borderRadius: 3,
                        fontSize: '1rem',
                        fontWeight: '600',
                        textTransform: 'none',
                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        boxShadow: `0 4px 15px 0 ${theme.palette.primary.main}40`,
                        '&:hover': {
                          boxShadow: `0 6px 20px 0 ${theme.palette.primary.main}60`,
                          transform: 'translateY(-2px)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {loading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        <>
                          Sign In
                          <DashboardIcon sx={{ ml: 1 }} />
                        </>
                      )}
                    </Button>
                    
                    <Divider sx={{ my: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Or
                      </Typography>
                    </Divider>
                    
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Don't have an account?
                      </Typography>
                      <Link 
                        href="/signup" 
                        variant="body1"
                        sx={{ 
                          color: theme.palette.primary.main,
                          fontWeight: '600',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        Create an account
                      </Link>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Zoom>
          </Grid>
          
          {!isMobile && (
            <Grid item md={6} lg={5} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Fade in={true} style={{ transitionDelay: '300ms' }}>
                <Box sx={{ textAlign: 'center', color: 'white', p: 4 }}>
                  <Box sx={{ 
                    background: 'rgba(255, 255, 255, 0.1)', 
                    borderRadius: 4, 
                    p: 4,
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    <HomeIcon sx={{ fontSize: 64, mb: 2 }} />
                    <Typography variant="h4" gutterBottom fontWeight="600">
                      Streamline Your Property Management
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 400, mx: 'auto' }}>
                      Access your dashboard to manage tenants, track payments, and monitor property performance all in one place.
                    </Typography>
                    
                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
                      {[
                        { icon: '🏠', text: 'Property Management' },
                        { icon: '💰', text: 'Rent Tracking' },
                        { icon: '📊', text: 'Financial Reports' }
                      ].map((item, index) => (
                        <Box key={index} sx={{ textAlign: 'center', maxWidth: 120 }}>
                          <Typography variant="h4">{item.icon}</Typography>
                          <Typography variant="caption" sx={{ opacity: 0.9 }}>{item.text}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Fade>
            </Grid>
          )}
        </Grid>
      </Container>
    </Box>
  );
}