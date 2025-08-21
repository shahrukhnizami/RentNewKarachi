import React, { useState, useEffect } from 'react';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Alert,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  AppBar,
  Toolbar,
  Avatar,
  LinearProgress,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  IconButton,
  Fade,
  Zoom
} from '@mui/material';
import {
  Edit as EditIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  AccountBalance as BalanceIcon,
  Logout as LogoutIcon,
  CalendarToday as CalendarIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Payment as PaymentIcon,
  History as HistoryIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function UserDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [userData, setUserData] = useState(null);
  const [rentHistory, setRentHistory] = useState([]);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
    fetchRentHistory();
  }, [currentUser]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const fetchUserData = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || ''
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setSuccess('Refreshing data...');
    await fetchUserData();
    await fetchRentHistory();
    setSuccess('Data refreshed successfully');
    setTimeout(() => setSuccess(''), 2000);
  };

  const fetchRentHistory = async () => {
    if (!currentUser) return;
    
    try {
      const rentsCollection = collection(db, 'monthlyRents');
      const rentsQuery = query(
        rentsCollection, 
        where('userId', '==', currentUser.uid)
      );
      const rentsSnapshot = await getDocs(rentsQuery);
      const rentsList = rentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort the data in JavaScript instead of using Firestore orderBy
      rentsList.sort((a, b) => {
        // First sort by year (descending)
        if (b.year !== a.year) {
          return b.year - a.year;
        }
        // Then sort by month (descending)
        const months = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months.indexOf(b.month) - months.indexOf(a.month);
      });
      
      setRentHistory(rentsList);
    } catch (error) {
      console.error('Error fetching rent history:', error);
      setError('Failed to fetch rent history');
    }
  };

  const handleOpenEditDialog = () => {
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };

  const handleSubmit = async () => {
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName
      });
      setSuccess('Profile updated successfully');
      fetchUserData();
      handleCloseEditDialog();
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  const calculateRemainingBalance = (amount, receivedAmount) => {
    return Math.max(0, amount - (receivedAmount || 0));
  };

  // Calculate payment progress percentage
  const calculatePaymentProgress = () => {
    if (!userData || !userData.monthlyRent) return 0;
    const paidAmount = userData.monthlyRent - (userData.balance || 0);
    return (paidAmount / userData.monthlyRent) * 100;
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        flexDirection="column"
      >
        <Avatar sx={{ width: 80, height: 80, mb: 2, bgcolor: 'primary.main' }}>
          <PersonIcon fontSize="large" />
        </Avatar>
        <Typography variant="h6" gutterBottom>Loading your dashboard...</Typography>
        <LinearProgress sx={{ width: '50%', maxWidth: 300, mt: 2 }} />
      </Box>
    );
  }

  if (!userData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <>
      <AppBar 
        position="sticky" 
        elevation={2}
        sx={{ 
          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
        }}
      >
        <Toolbar>
          <Box display="flex" alignItems="center" flexGrow={1}>
            <AccountBalanceIcon sx={{ mr: 1 }} />
            <Typography variant="h6" component="div">
              RentEase
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center">
            <Avatar 
              sx={{ 
                width: 40, 
                height: 40, 
                mr: 1,
                bgcolor: 'secondary.main',
                fontSize: '1rem'
              }}
            >
              {userData.firstName?.charAt(0)}{userData.lastName?.charAt(0)}
            </Avatar>
            
            {!isMobile && (
              <Typography variant="body2" sx={{ mr: 2 }}>
                Hi, {userData.firstName}
              </Typography>
            )}
            
            <IconButton 
              color="inherit" 
              onClick={refreshData}
              sx={{ mr: 1 }}
              size="large"
            >
              <RefreshIcon />
            </IconButton>
            
            <IconButton 
              color="inherit" 
              onClick={handleLogout}
              size="large"
            >
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Fade in={!!error}>
            <Alert 
              severity="error" 
              sx={{ mb: 2 }} 
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          </Fade>
        )}
        
        {success && (
          <Fade in={!!success}>
            <Alert 
              severity="success" 
              sx={{ mb: 2 }} 
              onClose={() => setSuccess('')}
            >
              {success}
            </Alert>
          </Fade>
        )}

        {/* Welcome Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="600" gutterBottom>
            Welcome back, {userData.firstName}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's your rental overview and payment history.
          </Typography>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Zoom in={true} style={{ transitionDelay: '100ms' }}>
              <Card 
                elevation={3}
                sx={{ 
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <Box sx={{ position: 'absolute', top: 0, right: 0, p: 1, opacity: 0.1 }}>
                  <PersonIcon sx={{ fontSize: 80 }} />
                </Box>
                <CardContent>
                  <Typography variant="body2" gutterBottom sx={{ opacity: 0.8 }}>
                    Tenant
                  </Typography>
                  <Typography variant="h5" fontWeight="600">
                    {userData.firstName} {userData.lastName}
                  </Typography>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Zoom in={true} style={{ transitionDelay: '200ms' }}>
              <Card 
                elevation={3}
                sx={{ 
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${theme.palette.success.light} 0%, ${theme.palette.success.main} 100%)`,
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <Box sx={{ position: 'absolute', top: 0, right: 0, p: 1, opacity: 0.1 }}>
                  <MoneyIcon sx={{ fontSize: 80 }} />
                </Box>
                <CardContent>
                  <Typography variant="body2" gutterBottom sx={{ opacity: 0.8 }}>
                    Monthly Rent
                  </Typography>
                  <Typography variant="h5" fontWeight="600">
                    Rs. {userData.monthlyRent || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Zoom in={true} style={{ transitionDelay: '300ms' }}>
              <Card 
                elevation={3}
                sx={{ 
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${userData.balance > 0 ? theme.palette.error.light : theme.palette.info.light} 0%, ${userData.balance > 0 ? theme.palette.error.main : theme.palette.info.main} 100%)`,
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <Box sx={{ position: 'absolute', top: 0, right: 0, p: 1, opacity: 0.1 }}>
                  <BalanceIcon sx={{ fontSize: 80 }} />
                </Box>
                <CardContent>
                  <Typography variant="body2" gutterBottom sx={{ opacity: 0.8 }}>
                    {userData.balance > 0 ? 'Remaining Balance' : 'Account Status'}
                  </Typography>
                  <Typography variant="h5" fontWeight="600">
                    Rs. {userData.balance || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Zoom in={true} style={{ transitionDelay: '400ms' }}>
              <Card 
                elevation={3}
                sx={{ 
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${theme.palette.warning.light} 0%, ${theme.palette.warning.main} 100%)`,
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <Box sx={{ position: 'absolute', top: 0, right: 0, p: 1, opacity: 0.1 }}>
                  <TrendingUpIcon sx={{ fontSize: 80 }} />
                </Box>
                <CardContent>
                  <Typography variant="body2" gutterBottom sx={{ opacity: 0.8 }}>
                    Advance Paid
                  </Typography>
                  <Typography variant="h5" fontWeight="600">
                    Rs. {userData.advanceAmount || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
        </Grid>

        {/* Payment Progress */}
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 3,
            background: `linear-gradient(to right, ${theme.palette.background.paper}, ${theme.palette.grey[50]})`
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="600">
              Monthly Payment Progress
            </Typography>
            <Chip 
              label={`${calculatePaymentProgress().toFixed(0)}% Complete`} 
              color={calculatePaymentProgress() === 100 ? 'success' : 'primary'}
              variant="outlined"
            />
          </Box>
          
          <LinearProgress 
            variant="determinate" 
            value={calculatePaymentProgress()} 
            sx={{ 
              height: 10, 
              borderRadius: 5,
              mb: 2,
              backgroundColor: theme.palette.grey[300],
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                backgroundColor: calculatePaymentProgress() === 100 ? theme.palette.success.main : theme.palette.primary.main
              }
            }} 
          />
          
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              Paid: Rs. {userData.monthlyRent - (userData.balance || 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total: Rs. {userData.monthlyRent}
            </Typography>
          </Box>
        </Paper>

        {/* Tabs for different sections */}
        <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              '& .MuiTab-root': {
                py: 2,
                fontWeight: 500
              }
            }}
          >
            <Tab icon={<PersonIcon />} iconPosition="start" label="Profile" />
            <Tab icon={<PaymentIcon />} iconPosition="start" label="Payments" />
            <Tab icon={<HistoryIcon />} iconPosition="start" label="History" />
          </Tabs>

          {/* Profile Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" fontWeight="600">Personal Information</Typography>
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={handleOpenEditDialog}
                      size="small"
                    >
                      Edit
                    </Button>
                  </Box>
                  
                  <Box display="flex" alignItems="center" mb={3}>
                    <Avatar 
                      sx={{ 
                        width: 80, 
                        height: 80, 
                        mr: 3,
                        bgcolor: 'primary.main',
                        fontSize: '1.5rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {userData.firstName?.charAt(0)}{userData.lastName?.charAt(0)}
                    </Avatar>
                    
                    <Box>
                      <Typography variant="h6" fontWeight="600">
                        {userData.firstName} {userData.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {userData.email}
                      </Typography>
                      <Chip 
                        label={userData.role} 
                        color={userData.role === 'admin' ? 'primary' : 'default'}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>First Name</Typography>
                        <Typography variant="body1">{userData.firstName}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>Last Name</Typography>
                        <Typography variant="body1">{userData.lastName}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>Email</Typography>
                        <Typography variant="body1">{userData.email}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>Member Since</Typography>
                        <Typography variant="body1">
                          {userData.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <ReceiptIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" fontWeight="600">Rent Information</Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 3, p: 2, backgroundColor: 'primary.light', borderRadius: 2 }}>
                        <Typography variant="body2" color="primary.contrastText" gutterBottom>Monthly Rent</Typography>
                        <Typography variant="h5" color="primary.contrastText" fontWeight="600">
                          ${userData.monthlyRent || 0}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        mb: 3, 
                        p: 2, 
                        backgroundColor: userData.balance > 0 ? 'error.light' : 'success.light', 
                        borderRadius: 2 
                      }}>
                        <Typography variant="body2" color={userData.balance > 0 ? 'error.contrastText' : 'success.contrastText'} gutterBottom>
                          Remaining Balance
                        </Typography>
                        <Typography 
                          variant="h5" 
                          color={userData.balance > 0 ? 'error.contrastText' : 'success.contrastText'} 
                          fontWeight="600"
                        >
                          ${userData.balance || 0}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 2, p: 2, backgroundColor: 'info.light', borderRadius: 2 }}>
                        <Typography variant="body2" color="info.contrastText" gutterBottom>Advance Amount</Typography>
                        <Typography variant="h6" color="info.contrastText" fontWeight="600">
                          ${userData.advanceAmount || 0}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    {userData.advanceDate && (
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>Advance Date</Typography>
                          <Typography variant="body1">{userData.advanceDate}</Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                  
                  {userData.balance > 0 && (
                    <Alert 
                      severity="warning" 
                      icon={<InfoIcon />}
                      sx={{ mt: 2 }}
                    >
                      You have an outstanding balance. Please contact the admin for payment arrangements.
                    </Alert>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Payments Tab */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    Payment Summary
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ textAlign: 'center', p: 2, border: `2px solid ${theme.palette.primary.main}`, borderRadius: 2 }}>
                        <Typography variant="h6" color="primary">Monthly Rent</Typography>
                        <Typography variant="h4" color="primary" fontWeight="700">${userData.monthlyRent || 0}</Typography>
                        <Typography variant="body2" color="text.secondary">Per Month</Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ textAlign: 'center', p: 2, border: `2px solid ${theme.palette.info.main}`, borderRadius: 2 }}>
                        <Typography variant="h6" color="info.main">Advance Paid</Typography>
                        <Typography variant="h4" color="info.main" fontWeight="700">${userData.advanceAmount || 0}</Typography>
                        <Typography variant="body2" color="text.secondary">Advance Amount</Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ 
                        textAlign: 'center', 
                        p: 2, 
                        border: `2px solid ${userData.balance > 0 ? theme.palette.error.main : theme.palette.success.main}`, 
                        borderRadius: 2,
                        backgroundColor: userData.balance > 0 ? 'error.light' : 'success.light'
                      }}>
                        <Typography variant="h6" color={userData.balance > 0 ? 'error.main' : 'success.main'}>
                          Remaining Balance
                        </Typography>
                        <Typography variant="h4" color={userData.balance > 0 ? 'error.main' : 'success.main'} fontWeight="700">
                          ${userData.balance || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {userData.balance > 0 ? 'Outstanding' : 'All Paid'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  {(userData.rentStartDate || userData.rentEndDate) && (
                    <Box sx={{ mt: 4 }}>
                      <Typography variant="h6" fontWeight="600" gutterBottom>
                        Rent Period
                      </Typography>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            p: 2, 
                            backgroundColor: 'grey.50', 
                            borderRadius: 2 
                          }}>
                            <CalendarIcon color="primary" sx={{ mr: 2 }} />
                            <Box>
                              <Typography variant="body2" color="text.secondary">Rent Start Date</Typography>
                              <Typography variant="body1" fontWeight="500">
                                {userData.rentStartDate || 'Not set'}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            p: 2, 
                            backgroundColor: 'grey.50', 
                            borderRadius: 2 
                          }}>
                            <CalendarIcon color="primary" sx={{ mr: 2 }} />
                            <Box>
                              <Typography variant="body2" color="text.secondary">Rent End Date</Typography>
                              <Typography variant="body1" fontWeight="500">
                                {userData.rentEndDate || 'Not set'}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </Paper>
              </Grid>
              
              <Grid item xs={12} lg={4}>
                <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    Quick Actions
                  </Typography>
                  
                  <Box sx={{ mt: 3 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      sx={{ mb: 2, py: 1.5, borderRadius: 2 }}
                      startIcon={<PaymentIcon />}
                    >
                      Make a Payment
                    </Button>
                    
                    <Button
                      variant="outlined"
                      fullWidth
                      size="large"
                      sx={{ mb: 2, py: 1.5, borderRadius: 2 }}
                      startIcon={<ReceiptIcon />}
                    >
                      Download Invoice
                    </Button>
                    
                    <Button
                      variant="outlined"
                      fullWidth
                      size="large"
                      sx={{ py: 1.5, borderRadius: 2 }}
                      startIcon={<InfoIcon />}
                    >
                      Contact Support
                    </Button>
                  </Box>
                  
                  {userData.balance > 0 && (
                    <Alert 
                      severity="warning" 
                      sx={{ mt: 3 }}
                      action={
                        <Button color="inherit" size="small">
                          Pay Now
                        </Button>
                      }
                    >
                      You have an outstanding balance of ${userData.balance}
                    </Alert>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* History Tab */}
          <TabPanel value={tabValue} index={2}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                Rent Payment History
              </Typography>
              
              {rentHistory.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Month/Year</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Received</TableCell>
                        <TableCell>Balance</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Due Date</TableCell>
                        <TableCell>Paid Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rentHistory.map((rent) => (
                        <TableRow key={rent.id} hover>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="500">
                                {rent.month}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {rent.year}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>${rent.amount}</TableCell>
                          <TableCell>${rent.receivedAmount || 0}</TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              color={calculateRemainingBalance(rent.amount, rent.receivedAmount) > 0 ? 'error.main' : 'success.main'}
                            >
                              ${calculateRemainingBalance(rent.amount, rent.receivedAmount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={rent.status} 
                              color={getStatusColor(rent.status)}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{rent.dueDate || 'N/A'}</TableCell>
                          <TableCell>{rent.paidDate || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <HistoryIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No rent history available yet.
                  </Typography>
                </Box>
              )}
            </Paper>
          </TabPanel>
        </Paper>

        {/* Edit Profile Dialog */}
        <Dialog 
          open={openEditDialog} 
          onClose={handleCloseEditDialog} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle>
            <Typography variant="h6" fontWeight="600">
              Edit Profile
            </Typography>
          </DialogTitle>
          
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={formData.email}
                disabled
                margin="normal"
                helperText="Email cannot be changed"
                variant="outlined"
              />
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={handleCloseEditDialog} 
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained"
              sx={{ borderRadius: 2 }}
            >
              Update Profile
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}