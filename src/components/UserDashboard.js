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
  Fade,
  Zoom,
  Tooltip,
  Tabs,
  Tab,
  Divider,
  CardHeader,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Popover
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
  ElectricBolt as ElectricIcon,
  LocalGasStation as GasIcon,
  DirectionsCar as CarIcon,
  Build as MaintenanceIcon,
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Warning as WarningIcon,
  AccountBalanceWallet as WalletIcon
} from '@mui/icons-material';
import IconButton from '@mui/material/IconButton';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function UserDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [userData, setUserData] = useState(null);
  const [rentHistory, setRentHistory] = useState([]);
  const [billHistory, setBillHistory] = useState([]);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [advanceAnchorEl, setAdvanceAnchorEl] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchUserData();
    fetchRentHistory();
    fetchBillHistory();
  }, [currentUser]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleAdvanceClick = (event) => {
    setAdvanceAnchorEl(event.currentTarget);
  };

  const handleAdvanceClose = () => {
    setAdvanceAnchorEl(null);
  };

  const advanceOpen = Boolean(advanceAnchorEl);

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
      
      rentsList.sort((a, b) => {
        if (b.year !== a.year) {
          return b.year - a.year;
        }
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
      
      billsList.sort((a, b) => {
        if (b.year !== a.year) {
          return b.year - a.year;
        }
        return months.indexOf(b.month) - months.indexOf(a.month);
      });
      
      setBillHistory(billsList);
    } catch (error) {
      console.error('Error fetching bill history:', error);
      setError('Failed to fetch bill history');
    }
  };

  const calculateMonthlySummary = () => {
    const combined = [...rentHistory, ...billHistory];
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
          totalPaidBills: 0,
          previousBalance: 0,
          totalAmountDue: 0,
          totalPaid: 0,
          remainingBalance: 0
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

    const summaryArrayAsc = Object.values(summary).sort((a, b) => {
      if (a.year !== b.year) {
        return a.year - b.year;
      }
      return months.indexOf(a.month) - months.indexOf(b.month);
    });

    let runningPrevious = 0;
    for (let i = 0; i < summaryArrayAsc.length; i++) {
      const item = summaryArrayAsc[i];
      item.previousBalance = runningPrevious;
      item.totalAmountDue = item.previousBalance + item.totalRent + item.totalBills;
      item.totalPaid = item.totalReceivedRent + item.totalPaidBills;
      item.remainingBalance = item.totalAmountDue - item.totalPaid;
      runningPrevious = item.remainingBalance;
    }

    return summaryArrayAsc.sort((a, b) => {
      if (b.year !== a.year) {
        return b.year - a.year;
      }
      return months.indexOf(b.month) - months.indexOf(a.month);
    });
  };

  const getConsolidatedTransactions = () => {
    const combined = [...rentHistory, ...billHistory];
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

  const getStatusChip = (remainingBalance) => {
    if (remainingBalance === 0) {
      return <Chip icon={<CheckCircleIcon />} label="Paid" color="success" size="small" />;
    } else if (remainingBalance > 0) {
      return <Chip icon={<WarningIcon />} label="Pending" color="warning" size="small" />;
    }
    return <Chip icon={<PendingIcon />} label="Processing" color="info" size="small" />;
  };

  const latestSummary = calculateMonthlySummary()[0] || {};
  const totalBalance = latestSummary.remainingBalance || 0;

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        flexDirection="column"
      >
        <Avatar sx={{ width: 80, height: 80, mb: 2, bgcolor: 'primary.main', color: 'white' }}>
          <AccountBalanceIcon fontSize="large" />
        </Avatar>
        <Typography variant="h6" gutterBottom>
          Loading your dashboard...
        </Typography>
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
      {/* AppBar - Simple design like AdminDashboard */}
      <AppBar 
        position="sticky" 
        elevation={2}
        sx={{
          background: theme.palette.primary.main,
        }}
      >
        <Toolbar>
          <Box display="flex" alignItems="center" flexGrow={1}>
            <AccountBalanceIcon sx={{ mr: 1 }} />
            <Typography variant="h6" component="div">
              RentEase
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={2}>
            {/* Advance Amount Display */}
            {userData.advanceAmount && (
              <>
                {!isMobile ? (
                  <Tooltip title="Click to view advance details">
                    <Button
                      variant="outlined"
                      startIcon={<WalletIcon />}
                      onClick={handleAdvanceClick}
                      sx={{
                        borderColor: 'rgba(255,255,255,0.3)',
                        color: 'white',
                        '&:hover': {
                          borderColor: 'rgba(255,255,255,0.5)',
                          backgroundColor: 'rgba(255,255,255,0.1)'
                        }
                      }}
                    >
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography variant="caption" display="block" sx={{ opacity: 0.8, lineHeight: 1 }}>
                          Advance
                        </Typography>
                        <Typography variant="body2" fontWeight="600">
                          Rs. {userData.advanceAmount.toLocaleString()}
                        </Typography>
                      </Box>
                    </Button>
                  </Tooltip>
                ) : (
                  <Tooltip title="Advance Amount">
                    <IconButton 
                      onClick={handleAdvanceClick}
                      sx={{ 
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.3)'
                      }}
                    >
                      <WalletIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </>
            )}

            <Badge badgeContent={3} color="error">
              <IconButton color="inherit" size="large">
                <NotificationsIcon />
              </IconButton>
            </Badge>
            
            <IconButton 
              color="inherit" 
              onClick={refreshData}
              size="large"
            >
              <RefreshIcon />
            </IconButton>
            
            <Box display="flex" alignItems="center" sx={{ ml: 1 }}>
              <Avatar 
                src={userData.profilePicture?.url}
                sx={{ 
                  width: 40, 
                  height: 40, 
                  mr: 1,
                  bgcolor: userData.profilePicture?.url ? 'transparent' : 'white',
                  color: theme.palette.primary.main,
                  fontWeight: 'bold',
                }}
              >
                {!userData.profilePicture?.url && `${userData.firstName?.charAt(0)}${userData.lastName?.charAt(0)}`}
              </Avatar>
              
              {!isMobile && (
                <Box>
                  <Typography variant="body2" fontWeight="600">
                    Hi, {userData.firstName}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {userData.role}
                  </Typography>
                </Box>
              )}
            </Box>
            
            <IconButton 
              color="inherit" 
              onClick={handleLogout}
              size="large"
              sx={{ ml: 1 }}
            >
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Advance Details Popover */}
      <Popover
        open={advanceOpen}
        anchorEl={advanceAnchorEl}
        onClose={handleAdvanceClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            p: 2,
            minWidth: 250,
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <WalletIcon sx={{ mr: 1 }} />
          <Typography variant="h6" fontWeight="600">Advance Details</Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>Advance Amount</Typography>
          <Typography variant="h5" fontWeight="700">
            Rs. {userData.advanceAmount?.toLocaleString() || 0}
          </Typography>
        </Box>
        
        {userData.advanceDate && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>Advance Date</Typography>
            <Typography variant="body1" fontWeight="600">
              {userData.advanceDate}
            </Typography>
          </Box>
        )}
        
        <Box>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>Status</Typography>
          <Chip 
            label="Paid" 
            color="success" 
            size="small"
          />
        </Box>
      </Popover>

      {/* Main Content - Removed gradient background */}
      <Box sx={{ py: 4 }}>
        <Container maxWidth="xl">
          {error && (
            <Fade in={!!error}>
              <Alert 
                severity="error" 
                sx={{ mb: 3, borderRadius: 2 }} 
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
                sx={{ mb: 3, borderRadius: 2 }} 
                onClose={() => setSuccess('')}
              >
                {success}
              </Alert>
            </Fade>
          )}

          {/* Header Section */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h4" fontWeight="600" gutterBottom>
                  Welcome back, {userData.firstName}!
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                  Here's your complete rental overview and payment dashboard
                </Typography>
              </Box>
              
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleOpenEditDialog}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                }}
              >
                Edit Profile
              </Button>
            </Box>
          </Box>

          {/* Key Metrics Cards - Simple cards like AdminDashboard */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Zoom in={true} style={{ transitionDelay: '100ms' }}>
                <Card 
                  elevation={3}
                  sx={{ 
                    borderRadius: 2,
                    background: theme.palette.primary.main,
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <Box sx={{ position: 'absolute', top: 0, right: 0, p: 1, opacity: 0.1 }}>
                    <PersonIcon sx={{ fontSize: 80 }} />
                  </Box>
                  <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                    <Typography variant="body2" gutterBottom sx={{ opacity: 0.8 }}>
                      Tenant
                    </Typography>
                    <Typography variant="h4" fontWeight="700">
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
                    borderRadius: 2,
                    background: theme.palette.success.main,
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <Box sx={{ position: 'absolute', top: 0, right: 0, p: 1, opacity: 0.1 }}>
                    <MoneyIcon sx={{ fontSize: 80 }} />
                  </Box>
                  <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                    <Typography variant="body2" gutterBottom sx={{ opacity: 0.8 }}>
                      Monthly Rent
                    </Typography>
                    <Typography variant="h4" fontWeight="700">
                      Rs. {rentHistory.length > 0 ? rentHistory[0].amount?.toLocaleString() || 0 : 0}
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
                      borderRadius: 2,
                      background: totalBalance > 0 ? theme.palette.error.main : theme.palette.info.main,
                      color: 'white',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <Box sx={{ position: 'absolute', top: 0, right: 0, p: 1, opacity: 0.1 }}>
                      <BalanceIcon sx={{ fontSize: 80 }} />
                    </Box>
                    <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                      <Typography variant="body2" gutterBottom sx={{ opacity: 0.8 }}>
                        Total Balance
                      </Typography>
                      <Typography variant="h4" fontWeight="700">
                        Rs. {totalBalance.toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Tooltip>
              </Zoom>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Zoom in={true} style={{ transitionDelay: '400ms' }}>
                <Tooltip title="Total bill amount for latest month">
                  <Card 
                    elevation={3}
                    sx={{ 
                      borderRadius: 2,
                      background: theme.palette.warning.main,
                      color: 'white',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <Box sx={{ position: 'absolute', top: 0, right: 0, p: 1, opacity: 0.1 }}>
                      <ReceiptIcon sx={{ fontSize: 80 }} />
                    </Box>
                    <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                      <Typography variant="body2" gutterBottom sx={{ opacity: 0.8 }}>
                        Total Bills
                      </Typography>
                      <Typography variant="h4" fontWeight="700">
                        Rs. {latestSummary.totalBills?.toLocaleString() || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Tooltip>
              </Zoom>
            </Grid>
          </Grid>

          {/* Main Content Area */}
          <Grid container spacing={3}>
            {/* Left Side - Profile and Quick Actions */}
            <Grid item xs={12} lg={4}>
              <Grid container spacing={3}>
                {/* Profile Card */}
                <Grid item xs={12}>
                  <Card 
                    elevation={3}
                    sx={{ 
                      borderRadius: 2,
                    }}
                  >
                    <CardHeader
                      avatar={
                        <Avatar 
                          src={userData.profilePicture?.url}
                          sx={{ 
                            width: 60, 
                            height: 60,
                            bgcolor: userData.profilePicture?.url ? 'transparent' : theme.palette.primary.main,
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                          }}
                        >
                          {!userData.profilePicture?.url && `${userData.firstName?.charAt(0)}${userData.lastName?.charAt(0)}`}
                        </Avatar>
                      }
                      title={
                        <Typography variant="h6" fontWeight="600">
                          {userData.firstName} {userData.lastName}
                        </Typography>
                      }
                      subheader={userData.email}
                    />
                    <CardContent>
                      <List dense>
                        <ListItem>
                          <ListItemIcon>
                            <PersonIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Role" 
                            secondary={
                              <Chip 
                                label={userData.role} 
                                color={userData.role === 'admin' ? 'primary' : 'default'}
                                size="small"
                              />
                            } 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <CalendarIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Member Since" 
                            secondary={userData.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'} 
                          />
                        </ListItem>
                        {userData.advanceAmount && (
                          <ListItem>
                            <ListItemIcon>
                              <WalletIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Advance Amount" 
                              secondary={`Rs. ${userData.advanceAmount.toLocaleString()}`} 
                            />
                          </ListItem>
                        )}
                      </List>

                      {/* NIC Documents Section */}
                      {(userData.nicDocuments?.front || userData.nicDocuments?.back) && (
                        <Box sx={{ mt: 3 }}>
                          <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                            NIC Documents
                          </Typography>
                          <Grid container spacing={2}>
                            {userData.nicDocuments?.front && (
                              <Grid item xs={6}>
                                <Box 
                                  sx={{ 
                                    textAlign: 'center',
                                    p: 1,
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: 2,
                                    backgroundColor: theme.palette.background.default
                                  }}
                                >
                                  <Typography variant="caption" display="block" gutterBottom>
                                    NIC Front
                                  </Typography>
                                  <Box
                                    component="img"
                                    src={userData.nicDocuments.front.url}
                                    alt="NIC Front"
                                    sx={{
                                      width: '100%',
                                      maxWidth: 120,
                                      height: 80,
                                      objectFit: 'cover',
                                      borderRadius: 1,
                                      cursor: 'pointer',
                                      '&:hover': {
                                        transform: 'scale(1.05)',
                                        transition: 'transform 0.3s'
                                      }
                                    }}
                                    onClick={() => window.open(userData.nicDocuments.front.url, '_blank')}
                                  />
                                </Box>
                              </Grid>
                            )}
                            {userData.nicDocuments?.back && (
                              <Grid item xs={6}>
                                <Box 
                                  sx={{ 
                                    textAlign: 'center',
                                    p: 1,
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: 2,
                                    backgroundColor: theme.palette.background.default
                                  }}
                                >
                                  <Typography variant="caption" display="block" gutterBottom>
                                    NIC Back
                                  </Typography>
                                  <Box
                                    component="img"
                                    src={userData.nicDocuments.back.url}
                                    alt="NIC Back"
                                    sx={{
                                      width: '100%',
                                      maxWidth: 120,
                                      height: 80,
                                      objectFit: 'cover',
                                      borderRadius: 1,
                                      cursor: 'pointer',
                                      '&:hover': {
                                        transform: 'scale(1.05)',
                                        transition: 'transform 0.3s'
                                      }
                                    }}
                                    onClick={() => window.open(userData.nicDocuments.back.url, '_blank')}
                                  />
                                </Box>
                              </Grid>
                            )}
                          </Grid>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>

            {/* Right Side - Tabs Content */}
            <Grid item xs={12} lg={8}>
              <Card 
                elevation={3}
                sx={{ 
                  borderRadius: 2,
                }}
              >
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable">
                    <Tab label="Monthly Summary" icon={<TrendingUpIcon />} iconPosition="start" />
                    <Tab label="Payment History" icon={<HistoryIcon />} iconPosition="start" />
                    <Tab label="All Transactions" icon={<ReceiptIcon />} iconPosition="start" />
                  </Tabs>
                </Box>

                <CardContent>
                  {activeTab === 0 && (
                    <Box>
                      <Typography variant="h6" fontWeight="600" gutterBottom>
                        Current Month Overview
                      </Typography>
                      {calculateMonthlySummary().length > 0 ? (
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          {calculateMonthlySummary().slice(0, 1).map((summary, index) => (
                            <Grid item xs={12} key={index}>
                              <Paper 
                                elevation={2}
                                sx={{ 
                                  p: 3, 
                                  borderRadius: 2,
                                  background: theme.palette.info.main,
                                  color: 'white'
                                }}
                              >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                  <Typography variant="h6" fontWeight="600">
                                    {summary.month} {summary.year}
                                  </Typography>
                                  {getStatusChip(summary.remainingBalance)}
                                </Box>
                                <Grid container spacing={2}>
                                  <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Previous Balance</Typography>
                                    <Typography variant="h6" fontWeight="600">Rs. {summary.previousBalance.toLocaleString()}</Typography>
                                  </Grid>
                                  <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Rent</Typography>
                                    <Typography variant="h6" fontWeight="600">Rs. {summary.totalRent.toLocaleString()}</Typography>
                                  </Grid>
                                  <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Bills</Typography>
                                    <Typography variant="h6" fontWeight="600">Rs. {summary.totalBills.toLocaleString()}</Typography>
                                  </Grid>
                                  <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Paid</Typography>
                                    <Typography variant="h6" fontWeight="600">Rs. {summary.totalPaid.toLocaleString()}</Typography>
                                  </Grid>
                                </Grid>
                                <Divider sx={{ my: 2, opacity: 0.3 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Remaining Balance</Typography>
                                  <Typography 
                                    variant="h5" 
                                    fontWeight="700"
                                    color={summary.remainingBalance > 0 ? 'error.light' : 'success.light'}
                                  >
                                    Rs. {summary.remainingBalance.toLocaleString()}
                                  </Typography>
                                </Box>
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          <ReceiptIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                          <Typography variant="body1" color="text.secondary">
                            No monthly payment data available yet.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}

                  {activeTab === 1 && (
                    <Box>
                      <Typography variant="h6" fontWeight="600" gutterBottom>
                        Recent Transactions
                      </Typography>
                      {getConsolidatedTransactions().length > 0 ? (
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Type</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell align="right">Amount</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {getConsolidatedTransactions().slice(0, 5).map((transaction) => (
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
                                    <Typography variant="body2">{transaction.month} {transaction.year}</Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="body2" fontWeight="600">
                                      Rs. {transaction.amount?.toLocaleString()}
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
                            No transaction history available.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}

                  {activeTab === 2 && (
                    <Box>
                      <Typography variant="h6" fontWeight="600" gutterBottom>
                        Complete Transaction History
                      </Typography>
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <ReceiptIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                        <Typography variant="body1" color="text.secondary">
                          Full transaction history view
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Edit Profile Dialog */}
      <Dialog 
        open={openEditDialog} 
        onClose={handleCloseEditDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ 
          sx: { 
            borderRadius: 2,
          } 
        }}
      >
        <DialogTitle>
          <Typography variant="h5" fontWeight="600">
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
            sx={{ borderRadius: 2, px: 3 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            sx={{ 
              borderRadius: 2, 
              px: 3,
            }}
          >
            Update Profile
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}