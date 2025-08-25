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
  Zoom,
  Tooltip
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
  Info as InfoIcon,
  ElectricBolt as ElectricIcon,
  LocalGasStation as GasIcon,
  DirectionsCar as CarIcon,
  Build as MaintenanceIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
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
  const [billHistory, setBillHistory] = useState([]);
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
    fetchBillHistory();
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
    await fetchBillHistory();
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
        type: 'rent',
        ...doc.data()
      }));
      
      // Sort the data in JavaScript
      rentsList.sort((a, b) => {
        if (b.year !== a.year) {
          return b.year - a.year;
        }
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

  const fetchBillHistory = async () => {
    if (!currentUser) return;
    
    try {
      const billsCollection = collection(db, 'monthlyBills');
      const billsQuery = query(
        billsCollection, 
        where('userId', '==', currentUser.uid)
      );
      const billsSnapshot = await getDocs(billsQuery);
      const billsList = billsSnapshot.docs.map(doc => ({
        id: doc.id,
        type: 'bill',
        ...doc.data()
      }));
      
      // Sort the data in JavaScript
      billsList.sort((a, b) => {
        if (b.year !== a.year) {
          return b.year - a.year;
        }
        const months = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months.indexOf(b.month) - months.indexOf(a.month);
      });
      
      setBillHistory(billsList);
    } catch (error) {
      console.error('Error fetching bill history:', error);
      setError('Failed to fetch bill history');
    }
  };

  // Calculate monthly summary for rent and bills
  const calculateMonthlySummary = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    // Combine rent and bill histories
    const combined = [...rentHistory, ...billHistory];
    
    // Group by month and year
    const summary = {};
    combined.forEach((transaction) => {
      const key = `${transaction.month}-${transaction.year}`;
      if (!summary[key]) {
        summary[key] = {
          month: transaction.month,
          year: transaction.year,
          totalRent: 0,
          totalBills: 0,
          totalReceivedRent: 0,
          totalPaidBills: 0
        };
      }
      
      if (transaction.type === 'rent') {
        summary[key].totalRent += Number(transaction.amount) || 0;
        summary[key].totalReceivedRent += Number(transaction.receivedAmount) || 0;
      } else {
        summary[key].totalBills += Number(transaction.amount) || 0;
        summary[key].totalPaidBills += Number(transaction.paidAmount) || 0;
      }
    });
    
    // Convert to array and sort
    const summaryArray = Object.values(summary).sort((a, b) => {
      if (b.year !== a.year) {
        return b.year - a.year;
      }
      return months.indexOf(b.month) - months.indexOf(a.month);
    });
    
    return summaryArray;
  };

  // Combine and sort rent and bill histories
  const getConsolidatedTransactions = () => {
    const combined = [...rentHistory, ...billHistory];
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    combined.sort((a, b) => {
      if (b.year !== a.year) {
        return b.year - a.year;
      }
      return months.indexOf(b.month) - months.indexOf(a.month);
    });
    
    return combined;
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

  const getTransactionIcon = (type, billType) => {
    if (type === 'rent') return <PaymentIcon />;
    switch (billType) {
      case 'electric': return <ElectricIcon />;
      case 'ssgc': return <GasIcon />;
      case 'motor': return <CarIcon />;
      case 'maintenance': return <MaintenanceIcon />;
      default: return <ReceiptIcon />;
    }
  };

  const getTransactionTypeLabel = (type, billType) => {
    if (type === 'rent') return 'Rent';
    switch (billType) {
      case 'electric': return 'Electric Bill';
      case 'ssgc': return 'SSGC Bill';
      case 'motor': return 'Motor Bill';
      case 'maintenance': return 'Maintenance';
      default: return billType || 'Bill';
    }
  };

  const calculateRemainingBalance = (amount, receivedAmount) => {
    return Math.max(0, amount - (receivedAmount || 0));
  };

  // Calculate total bills for the user
  const calculateTotalBills = () => {
    return billHistory.reduce((sum, bill) => sum + (bill.amount || 0), 0);
  };

  // Calculate total bills paid for the user
  const calculateTotalBillsPaid = () => {
    return billHistory.reduce((sum, bill) => sum + (bill.paidAmount || 0), 0);
  };

  // Calculate total bills balance for the user
  const calculateTotalBillsBalance = () => {
    return calculateTotalBills() - calculateTotalBillsPaid();
  };

  // Calculate total rent balance for the user
  const calculateTotalRentBalance = () => {
    return rentHistory.reduce((sum, rent) => sum + calculateRemainingBalance(rent.amount, rent.receivedAmount), 0);
  };

  // Calculate total paid amount (rent + bills)
  const calculateTotalPaidAmount = () => {
    const totalRentPaid = rentHistory.reduce((sum, rent) => sum + (rent.receivedAmount || 0), 0);
    const totalBillsPaid = billHistory.reduce((sum, bill) => sum + (bill.paidAmount || 0), 0);
    return totalRentPaid + totalBillsPaid;
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
              onClose={() => setError.css('')}
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

        {/* Monthly Summary Section */}
        <Paper sx={{ p: 3, borderRadius: 2, mb: 4 }}>
          <Typography variant="h6" fontWeight="600" gutterBottom>
            Monthly Payment Summary
          </Typography>
          
          {calculateMonthlySummary().length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Month/Year</TableCell>
                    <TableCell>Total Rent</TableCell>
                    <TableCell>Total Bills</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Total Paid</TableCell>
                    <TableCell>Total Balance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {calculateMonthlySummary().map((summary, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="500">
                            {summary.month}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {summary.year}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>Rs. {summary.totalRent.toLocaleString()}</TableCell>
                      <TableCell>Rs. {summary.totalBills.toLocaleString()}</TableCell>
                      <TableCell>Rs. {(summary.totalRent + summary.totalBills).toLocaleString()}</TableCell>
                      <TableCell>
                        <Typography color="success.main">
                          Rs. {(summary.totalReceivedRent + summary.totalPaidBills).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          color={(summary.totalRent + summary.totalBills - summary.totalReceivedRent - summary.totalPaidBills) > 0 ? 'error.main' : 'success.main'}
                        >
                          Rs. {(summary.totalRent + summary.totalBills - summary.totalReceivedRent - summary.totalPaidBills).toLocaleString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <ReceiptIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No monthly payment data available yet.
              </Typography>
            </Box>
          )}
        </Paper>

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
              <Tooltip title="Total outstanding balance including rent and bills">
                <Card 
                  elevation={3}
                  sx={{ 
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${userData.balance > 0 ? theme.palette.error.light : theme.palette.info.main} 0%, ${userData.balance > 0 ? theme.palette.error.main : theme.palette.info.main} 100%)`,
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
                      Total Balance
                    </Typography>
                    <Typography variant="h5" fontWeight="600">
                      Rs. {userData.balance || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Tooltip>
            </Zoom>
          </Grid>
          
         
          
          <Grid item xs={12} sm={6} md={3}>
            <Zoom in={true} style={{ transitionDelay: '500ms' }}>
              <Tooltip title="Outstanding balance for bills only">
                <Card 
                  elevation={3}
                  sx={{ 
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${calculateTotalBillsBalance() > 0 ? theme.palette.warning.light : theme.palette.info.main} 0%, ${calculateTotalBillsBalance() > 0 ? theme.palette.warning.main : theme.palette.info.main} 100%)`,
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <Box sx={{ position: 'absolute', top: 0, right: 0, p: 1, opacity: 0.1 }}>
                    <ReceiptIcon sx={{ fontSize: 80 }} />
                  </Box>
                  <CardContent>
                    <Typography variant="body2" gutterBottom sx={{ opacity: 0.8 }}>
                      Bills Balance
                    </Typography>
                    <Typography variant="h5" fontWeight="600">
                      Rs. {calculateTotalBillsBalance().toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Tooltip>
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
            <Tab icon={<ReceiptIcon />} iconPosition="start" label="Bills" />
            <Tab icon={<TrendingUpIcon />} iconPosition="start" label="All Transactions" />
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
                          Rs. {userData.monthlyRent || 0}
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
                          Total Balance
                        </Typography>
                        <Typography 
                          variant="h5" 
                          color={userData.balance > 0 ? 'error.contrastText' : 'success.contrastText'} 
                          fontWeight="600"
                        >
                          Rs. {userData.balance || 0}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ mb: 2, p: 2, backgroundColor: 'info.light', borderRadius: 2 }}>
                        <Typography variant="body2" color="info.contrastText" gutterBottom>Advance Amount</Typography>
                        <Typography variant="h6" color="info.contrastText" fontWeight="600">
                          Rs. {userData.advanceAmount || 0}
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
                        <Typography variant="h4" color="primary" fontWeight="700">Rs. {userData.monthlyRent || 0}</Typography>
                        <Typography variant="body2" color="text.secondary">Per Month</Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ textAlign: 'center', p: 2, border: `2px solid ${theme.palette.info.main}`, borderRadius: 2 }}>
                        <Typography variant="h6" color="info.main">Advance Paid</Typography>
                        <Typography variant="h4" color="info.main" fontWeight="700">Rs. {userData.advanceAmount || 0}</Typography>
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
                          Total Balance
                        </Typography>
                        <Typography variant="h4" color={userData.balance > 0 ? 'error.main' : 'success.main'} fontWeight="700">
                          Rs. {userData.balance || 0}
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
                      You have an outstanding balance of Rs. {userData.balance}
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
                          <TableCell>Rs. {rent.amount}</TableCell>
                          <TableCell>Rs. {rent.receivedAmount || 0}</TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              color={calculateRemainingBalance(rent.amount, rent.receivedAmount) > 0 ? 'error.main' : 'success.main'}
                            >
                              Rs. {calculateRemainingBalance(rent.amount, rent.receivedAmount)}
                            </Typography>
                          </TableCell>
                          
                          
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

          {/* Bills Tab */}
          <TabPanel value={tabValue} index={3}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                Bill Payment History
              </Typography>
              
              {billHistory.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Bill Type</TableCell>
                        <TableCell>Month/Year</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Balance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {billHistory.map((bill) => (
                        <TableRow key={bill.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                                {getTransactionIcon(bill.type, bill.type)}
                              </Avatar>
                              <Typography variant="body2" fontWeight="500">
                                {getTransactionTypeLabel(bill.type, bill.type)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="500">
                                {bill.month}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {bill.year}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>Rs. {bill.amount}</TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              color={calculateRemainingBalance(bill.amount, bill.paidAmount) > 0 ? 'error.main' : 'success.main'}
                            >
                              Rs. {calculateRemainingBalance(bill.amount, bill.paidAmount)}
                            </Typography>
                          </TableCell>
                     
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <ReceiptIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No bill history available yet.
                  </Typography>
                </Box>
              )}
            </Paper>
          </TabPanel>

          {/* All Transactions Tab */}
          <TabPanel value={tabValue} index={4}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                All Transactions
              </Typography>
              
              {getConsolidatedTransactions().length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Month/Year</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Paid</TableCell>
                        <TableCell>Balance</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Paid Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getConsolidatedTransactions().map((transaction) => (
                        <TableRow key={transaction.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                                {getTransactionIcon(transaction.type, transaction.type === 'bill' ? transaction.type : null)}
                              </Avatar>
                              <Typography variant="body2" fontWeight="500">
                                {getTransactionTypeLabel(transaction.type, transaction.type === 'bill' ? transaction.type : null)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="500">
                                {transaction.month}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {transaction.year}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>Rs. {transaction.amount}</TableCell>
                          <TableCell>Rs. {transaction.receivedAmount || transaction.paidAmount || 0}</TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              color={calculateRemainingBalance(transaction.amount, transaction.receivedAmount || transaction.paidAmount) > 0 ? 'error.main' : 'success.main'}
                            >
                              Rs. {calculateRemainingBalance(transaction.amount, transaction.receivedAmount || transaction.paidAmount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={transaction.status} 
                              color={getStatusColor(transaction.status)}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{transaction.paidDate || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <TrendingUpIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No transactions available yet.
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