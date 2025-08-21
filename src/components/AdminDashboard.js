import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Avatar,
  Chip,
  LinearProgress,
  useTheme,
  useMediaQuery,
  Fade,
  Zoom,
  Fab
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Logout as LogoutIcon,
  Receipt as ReceiptIcon,
  Refresh as RefreshIcon,
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as BalanceIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  query,
  where,
  orderBy,
  getDoc
} from 'firebase/firestore';
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

export default function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [users, setUsers] = useState([]);
  const [monthlyRents, setMonthlyRents] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openRentDialog, setOpenRentDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingRent, setEditingRent] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'user',
    monthlyRent: 0,
    advanceAmount: 0,
    advanceDate: '',
    rentStartDate: '',
    rentEndDate: ''
  });
  const [rentFormData, setRentFormData] = useState({
    userId: '',
    userName: '',
    month: '',
    year: '',
    amount: 0,
    receivedAmount: 0,
    status: 'pending',
    dueDate: '',
    paidDate: '',
    notes: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
    fetchMonthlyRents();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyRents = async () => {
    try {
      const rentsCollection = collection(db, 'monthlyRents');
      const rentsSnapshot = await getDocs(rentsCollection);
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
      
      setMonthlyRents(rentsList);
    } catch (error) {
      console.error('Error fetching monthly rents:', error);
      setError('Failed to fetch monthly rents');
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        role: user.role || 'user',
        monthlyRent: user.monthlyRent || 0,
        advanceAmount: user.advanceAmount || 0,
        advanceDate: user.advanceDate || '',
        rentStartDate: user.rentStartDate || '',
        rentEndDate: user.rentEndDate || ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        role: 'user',
        monthlyRent: 0,
        balance: '',
        advanceAmount: 0,
        advanceDate: '',
        rentStartDate: '',
        rentEndDate: ''
      });
    }
    setOpenDialog(true);
  };

  const handleOpenRentDialog = (rent = null) => {
    if (rent) {
      setEditingRent(rent);
      setRentFormData({
        userId: rent.userId || '',
        userName: rent.userName || '',
        month: rent.month || '',
        year: rent.year || '',
        amount: rent.amount || 0,
        receivedAmount: rent.receivedAmount || 0,
        status: rent.status || 'pending',
        dueDate: rent.dueDate || '',
        paidDate: rent.paidDate || '',
        notes: rent.notes || ''
      });
    } else {
      setEditingRent(null);
      setRentFormData({
        userId: '',
        userName: '',
        month: '',
        year: '',
        amount: 0,
        receivedAmount: 0,
        status: 'pending',
        dueDate: '',
        paidDate: '',
        notes: ''
      });
    }
    setOpenRentDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: 'user',
      monthlyRent: 0,
      advanceAmount: 0,
      advanceDate: '',
      rentStartDate: '',
      rentEndDate: ''
    });
  };

  const handleCloseRentDialog = () => {
    setOpenRentDialog(false);
    setEditingRent(null);
    setRentFormData({
      userId: '',
      userName: '',
      month: '',
      year: '',
      amount: 0,
      receivedAmount: 0,
      status: 'pending',
      dueDate: '',
      paidDate: '',
      notes: ''
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingUser) {
        // Update existing user
        await updateDoc(doc(db, 'users', editingUser.id), {
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          monthlyRent: Number(formData.monthlyRent),
          advanceAmount: Number(formData.advanceAmount),
          advanceDate: formData.advanceDate,
          rentStartDate: formData.rentStartDate,
          rentEndDate: formData.rentEndDate
        });
        setSuccess('User updated successfully');
      } else {
        // Add new user directly to Firestore
        const newUserData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: formData.role,
          monthlyRent: Number(formData.monthlyRent),
          advanceAmount: Number(formData.advanceAmount),
          advanceDate: formData.advanceDate,
          rentStartDate: formData.rentStartDate,
          rentEndDate: formData.rentEndDate,
          createdAt: new Date()
        };
        
        await addDoc(collection(db, 'users'), newUserData);
        setSuccess('User added successfully');
      }
      handleCloseDialog();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      setError('Failed to save user');
    }
  };

  const handleRentSubmit = async () => {
    try {
      if (editingRent) {
        // Update existing rent entry
        await updateDoc(doc(db, 'monthlyRents', editingRent.id), {
          userId: rentFormData.userId,
          userName: rentFormData.userName,
          month: rentFormData.month,
          year: rentFormData.year,
          amount: Number(rentFormData.amount),
          receivedAmount: Number(rentFormData.receivedAmount),
          status: rentFormData.status,
          dueDate: rentFormData.dueDate,
          paidDate: rentFormData.paidDate,
          notes: rentFormData.notes,
          updatedAt: new Date()
        });

        // Calculate and update total remaining balance for the user
        const totalRemainingBalance = await calculateUserTotalBalance(rentFormData.userId);
        await updateDoc(doc(db, 'users', rentFormData.userId), {
          balance: totalRemainingBalance
        });

        setSuccess('Rent entry updated successfully');
      } else {
        // Add new rent entry
        await addDoc(collection(db, 'monthlyRents'), {
          userId: rentFormData.userId,
          userName: rentFormData.userName,
          month: rentFormData.month,
          year: rentFormData.year,
          amount: Number(rentFormData.amount),
          receivedAmount: Number(rentFormData.receivedAmount),
          status: rentFormData.status,
          dueDate: rentFormData.dueDate,
          paidDate: rentFormData.paidDate,
          notes: rentFormData.notes,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Calculate and update total remaining balance for the user
        const totalRemainingBalance = await calculateUserTotalBalance(rentFormData.userId);
        await updateDoc(doc(db, 'users', rentFormData.userId), {
          balance: totalRemainingBalance
        });

        setSuccess('Rent entry added successfully');
      }
      handleCloseRentDialog();
      fetchMonthlyRents();
      fetchUsers(); // Refresh users to show updated balances
    } catch (error) {
      console.error('Error saving rent entry:', error);
      setError('Failed to save rent entry');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        setSuccess('User deleted successfully');
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        setError('Failed to delete user');
      }
    }
  };

  const handleDeleteRent = async (rentId) => {
    if (window.confirm('Are you sure you want to delete this rent entry?')) {
      try {
        // Get the rent entry before deleting to know which user to update
        const rentDoc = await getDoc(doc(db, 'monthlyRents', rentId));
        const rentData = rentDoc.data();
        const userId = rentData?.userId;
        
        await deleteDoc(doc(db, 'monthlyRents', rentId));
        
        // Recalculate and update user balance after deletion
        if (userId) {
          const totalRemainingBalance = await calculateUserTotalBalance(userId);
          await updateDoc(doc(db, 'users', userId), {
            balance: totalRemainingBalance
          });
        }
        
        setSuccess('Rent entry deleted successfully');
        fetchMonthlyRents();
        fetchUsers(); // Refresh users to show updated balances
      } catch (error) {
        console.error('Error deleting rent entry:', error);
        setError('Failed to delete rent entry');
      }
    }
  };

  const handleUserSelect = (userId) => {
    const selectedUser = users.find(user => user.id === userId);
    if (selectedUser) {
      setRentFormData({
        ...rentFormData,
        userId: selectedUser.id,
        userName: `${selectedUser.firstName} ${selectedUser.lastName}`,
        amount: selectedUser.monthlyRent || 0
      });
    }
  };

  const totalUsers = users.length;
  const totalRent = users.reduce((sum, user) => sum + (user.monthlyRent || 0), 0);
  const totalBalance = users.reduce((sum, user) => sum + (user.balance || 0), 0);
  const totalAdvance = users.reduce((sum, user) => sum + (user.advanceAmount || 0), 0);

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

  // Function to calculate total remaining balance for a user from all rent entries
  const calculateUserTotalBalance = async (userId) => {
    try {
      const rentsQuery = query(
        collection(db, 'monthlyRents'),
        where('userId', '==', userId)
      );
      const rentsSnapshot = await getDocs(rentsQuery);
      const userRents = rentsSnapshot.docs.map(doc => doc.data());
      
      let totalRemainingBalance = 0;
      
      userRents.forEach(rent => {
        const rentAmount = Number(rent.amount) || 0;
        const receivedAmount = Number(rent.receivedAmount) || 0;
        const remainingAmount = Math.max(0, rentAmount - receivedAmount);
        
        if (rent.status === 'pending' || rent.status === 'overdue') {
          totalRemainingBalance += remainingAmount;
        }
      });
      
      return totalRemainingBalance;
    } catch (error) {
      console.error('Error calculating user balance:', error);
      return 0;
    }
  };

  // Function to recalculate all user balances
  const recalculateAllUserBalances = async () => {
    try {
      setSuccess('Recalculating all user balances...');
      
      for (const user of users) {
        const totalRemainingBalance = await calculateUserTotalBalance(user.id);
        await updateDoc(doc(db, 'users', user.id), {
          balance: totalRemainingBalance
        });
      }
      
      setSuccess('All user balances recalculated successfully');
      fetchUsers(); // Refresh the users list
    } catch (error) {
      console.error('Error recalculating user balances:', error);
      setError('Failed to recalculate user balances');
    }
  };

  const refreshAllData = async () => {
    setSuccess('Refreshing data...');
    await fetchUsers();
    await fetchMonthlyRents();
    setSuccess('Data refreshed successfully');
    setTimeout(() => setSuccess(''), 2000);
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

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
          <DashboardIcon fontSize="large" />
        </Avatar>
        <Typography variant="h6" gutterBottom>Loading Admin Dashboard...</Typography>
        <LinearProgress sx={{ width: '50%', maxWidth: 300, mt: 2 }} />
      </Box>
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
            <DashboardIcon sx={{ mr: 1 }} />
            <Typography variant="h6" component="div">
              Admin Dashboard
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
              {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'A'}
            </Avatar>
            
            {!isMobile && (
              <Typography variant="body2" sx={{ mr: 2 }}>
                {currentUser?.displayName || currentUser?.email}
              </Typography>
            )}
            
            <IconButton 
              color="inherit" 
              onClick={refreshAllData}
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
            Welcome, Administrator!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage users, track payments, and monitor rental activity.
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
                    Total Users
                  </Typography>
                  <Typography variant="h3" fontWeight="600">
                    {totalUsers}
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
                  <Typography variant="h3" fontWeight="600">
                    Rs. {totalRent.toLocaleString()}
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
                  background: `linear-gradient(135deg, ${theme.palette.warning.light} 0%, ${theme.palette.warning.main} 100%)`,
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
                  <Typography variant="h3" fontWeight="600">
                    Rs. {totalBalance.toLocaleString()}
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
                  background: `linear-gradient(135deg, ${theme.palette.info.light} 0%, ${theme.palette.info.main} 100%)`,
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
                    Total Advance
                  </Typography>
                  <Typography variant="h3" fontWeight="600">
                    Rs. {totalAdvance.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
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
            <Tab icon={<PersonIcon />} iconPosition="start" label="User Management" />
            <Tab icon={<PaymentIcon />} iconPosition="start" label="Rent Management" />
          </Tabs>

          {/* User Management Tab */}
          <TabPanel value={activeTab} index={0}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6" fontWeight="600">User Management</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={recalculateAllUserBalances}
                  startIcon={<RefreshIcon />}
                >
                  Recalculate Balances
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                >
                  Add User
                </Button>
              </Box>
            </Box>
            
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Monthly Rent</TableCell>
                    <TableCell>Balance</TableCell>
                    <TableCell>Advance</TableCell>
                    <TableCell>Rent Period</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ 
                              width: 40, 
                              height: 40, 
                              mr: 2,
                              bgcolor: 'primary.main',
                              fontSize: '1rem'
                            }}
                          >
                            {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight="500">
                              {user.firstName} {user.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Joined: {user.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip 
                          label={user.role} 
                          color={user.role === 'admin' ? 'primary' : 'default'}
                          size="small"
                          variant={user.role === 'admin' ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight="500">
                          ${user.monthlyRent || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body1" 
                          fontWeight="500"
                          color={user.balance > 0 ? 'error.main' : 'success.main'}
                        >
                          ${user.balance || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1">
                          ${user.advanceAmount || 0}
                        </Typography>
                        {user.advanceDate && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            {user.advanceDate}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.rentStartDate && user.rentEndDate 
                          ? (
                            <Box>
                              <Typography variant="body2">{user.rentStartDate}</Typography>
                              <Typography variant="body2">to</Typography>
                              <Typography variant="body2">{user.rentEndDate}</Typography>
                            </Box>
                          )
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell align="center">
                        <IconButton 
                          onClick={() => handleOpenDialog(user)}
                          color="primary"
                          size="large"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={user.id === currentUser.uid}
                          color="error"
                          size="large"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Monthly Rent Management Tab */}
          <TabPanel value={activeTab} index={1}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6" fontWeight="600">Rent Management</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenRentDialog()}
              >
                Add Rent Entry
              </Button>
            </Box>
            
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Tenant</TableCell>
                    <TableCell>Period</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Received</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell>Paid Date</TableCell>
                    <TableCell>Balance</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {monthlyRents.map((rent) => (
                    <TableRow key={rent.id} hover>
                      <TableCell>
                        <Typography variant="body1" fontWeight="500">
                          {rent.userName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight="500">
                          {rent.month}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {rent.year}
                        </Typography>
                      </TableCell>
                      <TableCell>${rent.amount}</TableCell>
                      <TableCell>${rent.receivedAmount}</TableCell>
                      <TableCell>
                        <Chip 
                          label={rent.status} 
                          color={getStatusColor(rent.status)}
                          size="small"
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell>{rent.dueDate || 'N/A'}</TableCell>
                      <TableCell>{rent.paidDate || 'N/A'}</TableCell>
                      <TableCell>
                        <Typography 
                          variant="body1" 
                          fontWeight="500"
                          color={calculateRemainingBalance(rent.amount, rent.receivedAmount) > 0 ? 'error.main' : 'success.main'}
                        >
                          ${calculateRemainingBalance(rent.amount, rent.receivedAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton 
                          onClick={() => handleOpenRentDialog(rent)}
                          color="primary"
                          size="large"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleDeleteRent(rent.id)}
                          color="error"
                          size="large"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </Paper>

        {/* Edit/Add User Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog} 
          maxWidth="md" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle>
            <Typography variant="h6" fontWeight="600">
              {editingUser ? 'Edit User' : 'Add New User'}
            </Typography>
          </DialogTitle>
          <DialogContent>
            {!editingUser && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Note: This will create a user record in the system. The user will need to sign up separately to access their account.
              </Alert>
            )}
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    margin="normal"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    margin="normal"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    margin="normal"
                    variant="outlined"
                    disabled={!!editingUser}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={formData.role}
                      label="Role"
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      variant="outlined"
                    >
                      <MenuItem value="user">User</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Monthly Rent"
                    type="number"
                    value={formData.monthlyRent}
                    onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                    margin="normal"
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Advance Amount"
                    type="number"
                    value={formData.advanceAmount}
                    onChange={(e) => setFormData({ ...formData, advanceAmount: e.target.value })}
                    margin="normal"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Advance Date"
                    type="date"
                    value={formData.advanceDate}
                    onChange={(e) => setFormData({ ...formData, advanceDate: e.target.value })}
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Rent Start Date"
                    type="date"
                    value={formData.rentStartDate}
                    onChange={(e) => setFormData({ ...formData, rentStartDate: e.target.value })}
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Rent End Date"
                    type="date"
                    value={formData.rentEndDate}
                    onChange={(e) => setFormData({ ...formData, rentEndDate: e.target.value })}
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={handleCloseDialog} 
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
              {editingUser ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit/Add Monthly Rent Dialog */}
        <Dialog 
          open={openRentDialog} 
          onClose={handleCloseRentDialog} 
          maxWidth="md" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle>
            <Typography variant="h6" fontWeight="600">
              {editingRent ? 'Edit Monthly Rent' : 'Add Monthly Rent'}
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Select Tenant</InputLabel>
                    <Select
                      value={rentFormData.userId}
                      label="Select Tenant"
                      onChange={(e) => handleUserSelect(e.target.value)}
                      disabled={!!editingRent}
                      variant="outlined"
                    >
                      {users.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Tenant Name"
                    value={rentFormData.userName}
                    margin="normal"
                    disabled
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Month</InputLabel>
                    <Select
                      value={rentFormData.month}
                      label="Month"
                      onChange={(e) => setRentFormData({ ...rentFormData, month: e.target.value })}
                      variant="outlined"
                    >
                      {months.map((month) => (
                        <MenuItem key={month} value={month}>
                          {month}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Year</InputLabel>
                    <Select
                      value={rentFormData.year}
                      label="Year"
                      onChange={(e) => setRentFormData({ ...rentFormData, year: e.target.value })}
                      variant="outlined"
                    >
                      {years.map((year) => (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Amount"
                    type="number"
                    value={rentFormData.amount}
                    onChange={(e) => setRentFormData({ ...rentFormData, amount: e.target.value })}
                    margin="normal"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Received Amount"
                    type="number"
                    value={rentFormData.receivedAmount}
                    onChange={(e) => setRentFormData({ ...rentFormData, receivedAmount: e.target.value })}
                    margin="normal"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={rentFormData.status}
                      label="Status"
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        setRentFormData({ 
                          ...rentFormData, 
                          status: newStatus,
                          // Auto-set received amount to rent amount when status is paid
                          receivedAmount: newStatus === 'paid' ? rentFormData.amount : rentFormData.receivedAmount
                        });
                      }}
                      variant="outlined"
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="paid">Paid</MenuItem>
                      <MenuItem value="overdue">Overdue</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Due Date"
                    type="date"
                    value={rentFormData.dueDate}
                    onChange={(e) => setRentFormData({ ...rentFormData, dueDate: e.target.value })}
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Paid Date"
                    type="date"
                    value={rentFormData.paidDate}
                    onChange={(e) => setRentFormData({ ...rentFormData, paidDate: e.target.value })}
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    multiline
                    rows={3}
                    value={rentFormData.notes}
                    onChange={(e) => setRentFormData({ ...rentFormData, notes: e.target.value })}
                    margin="normal"
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={handleCloseRentDialog} 
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRentSubmit} 
              variant="contained"
              sx={{ borderRadius: 2 }}
            >
              {editingRent ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Floating Action Button for Mobile */}
        {isMobile && (
          <Fab
            color="primary"
            aria-label="add"
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
            }}
            onClick={() => activeTab === 0 ? handleOpenDialog() : handleOpenRentDialog()}
          >
            <AddIcon />
          </Fab>
        )}
      </Container>
    </>
  );
}