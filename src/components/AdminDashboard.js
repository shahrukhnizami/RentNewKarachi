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
  Fab,
  InputAdornment,
  Icon
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
  Payment as PaymentIcon,
  ElectricBolt as ElectricIcon,
  LocalGasStation as GasIcon,
  Build as MaintenanceIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import WindPowerIcon from '@mui/icons-material/WindPower';
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
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';

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
  const [monthlyBills, setMonthlyBills] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openRentDialog, setOpenRentDialog] = useState(false);
  const [openBillDialog, setOpenBillDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingRent, setEditingRent] = useState(null);
  const [editingBill, setEditingBill] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('all'); // New state for selected user in Bills Management
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
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
    paidDate: '',
    notes: ''
  });
  const [billFormData, setBillFormData] = useState({
    userId: '',
    userName: '',
    month: '',
    year: '',
    type: '',
    amount: 0,
    paidAmount: 0,
    status: 'pending',
    paidDate: '',
    notes: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
    fetchMonthlyRents();
    fetchMonthlyBills();
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
        type: 'rent',
        ...doc.data()
      }));
      setMonthlyRents(rentsList);
    } catch (error) {
      console.error('Error fetching monthly rents:', error);
      setError('Failed to fetch monthly rents');
    }
  };

  const fetchMonthlyBills = async () => {
    try {
      const billsCollection = collection(db, 'monthlyBills');
      const billsSnapshot = await getDocs(billsCollection);
      const billsList = billsSnapshot.docs.map(doc => ({
        id: doc.id,
        type: 'bill',
        ...doc.data()
      }));
      setMonthlyBills(billsList);
    } catch (error) {
      console.error('Error fetching monthly bills:', error);
      setError('Failed to fetch monthly bills');
    }
  };

  // Calculate total amount and received amount for a user
  const calculateUserAmounts = (userId) => {
    const userRents = monthlyRents.filter(rent => rent.userId === userId);
    const userBills = monthlyBills.filter(bill => bill.userId === userId);

    const totalRentAmount = userRents.reduce((sum, rent) => sum + (Number(rent.amount) || 0), 0);
    const totalRentReceived = userRents.reduce((sum, rent) => sum + (Number(rent.receivedAmount) || 0), 0);
    
    const totalBillAmount = userBills.reduce((sum, bill) => sum + (Number(bill.amount) || 0), 0);
    const totalBillPaid = userBills.reduce((sum, bill) => sum + (Number(bill.paidAmount) || 0), 0);

    const totalAmount = totalRentAmount + totalBillAmount;
    const totalReceived = totalRentReceived + totalBillPaid;

    return { totalAmount, totalReceived };
  };

  // Calculate totals for filtered bills in Bills Management tab
  const calculateBillsTotals = (userId) => {
    const filteredBills = userId === 'all' ? monthlyBills : monthlyBills.filter(bill => bill.userId === userId);
    const totalBills = filteredBills.reduce((sum, bill) => sum + (Number(bill.amount) || 0), 0);
    const totalBillsPaid = filteredBills.reduce((sum, bill) => sum + (Number(bill.paidAmount) || 0), 0);
    const totalBillsBalance = totalBills - totalBillsPaid;
    return { totalBills, totalBillsPaid, totalBillsBalance };
  };

  // Combine and sort rent and bill records
  const getConsolidatedTransactions = () => {
    const combined = [...monthlyRents, ...monthlyBills];
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

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        password: '',
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
        password: '',
        role: 'user',
        monthlyRent: 0,
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
        paidDate: '',
        notes: ''
      });
    }
    setOpenRentDialog(true);
  };

  const handleOpenBillDialog = (bill = null) => {
    if (bill) {
      setEditingBill(bill);
      setBillFormData({
        userId: bill.userId || '',
        userName: bill.userName || '',
        month: bill.month || '',
        year: bill.year || '',
        type: bill.type || '',
        amount: bill.amount || 0,
        paidAmount: bill.paidAmount || 0,
        status: bill.status || 'pending',
        paidDate: bill.paidDate || '',
        notes: bill.notes || ''
      });
    } else {
      setEditingBill(null);
      setBillFormData({
        userId: '',
        userName: '',
        month: '',
        year: '',
        type: '',
        amount: 0,
        paidAmount: 0,
        status: 'pending',
        paidDate: '',
        notes: ''
      });
    }
    setOpenBillDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'user',
      monthlyRent: 0,
      advanceAmount: 0,
      advanceDate: '',
      rentStartDate: '',
      rentEndDate: ''
    });
    setShowPassword(false);
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
      paidDate: '',
      notes: ''
    });
  };

  const handleCloseBillDialog = () => {
    setOpenBillDialog(false);
    setEditingBill(null);
    setBillFormData({
      userId: '',
      userName: '',
      month: '',
      year: '',
      type: '',
      amount: 0,
      paidAmount: 0,
      status: 'pending',
      paidDate: '',
      notes: ''
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingUser) {
        await updateDoc(doc(db, 'users', editingUser.id), {
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          monthlyRent: Number(formData.monthlyRent),
          advanceAmount: Number(formData.advanceAmount),
          advanceDate: formData.advanceDate,
          rentStartDate: formData.rentStartDate,
          rentEndDate: formData.rentEndDate,
          updatedAt: serverTimestamp()
        });
        setSuccess('User updated successfully');
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          formData.email, 
          formData.password
        );
        
        const newUserData = {
          uid: userCredential.user.uid,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: formData.role,
          monthlyRent: Number(formData.monthlyRent),
          advanceAmount: Number(formData.advanceAmount),
          advanceDate: formData.advanceDate,
          rentStartDate: formData.rentStartDate,
          rentEndDate: formData.rentEndDate,
          balance: 0,
          createdAt: serverTimestamp()
        };
        
        await addDoc(collection(db, 'users'), newUserData);
        await generateRentEntries(newUserData);
        
        setSuccess('User added successfully and rent entries generated');
      }
      handleCloseDialog();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      setError('Failed to save user: ' + error.message);
    }
  };

  const generateRentEntries = async (userData) => {
    if (!userData.rentStartDate || !userData.rentEndDate) return;
    
    const startDate = new Date(userData.rentStartDate);
    const endDate = new Date(userData.rentEndDate);
    const monthlyRent = userData.monthlyRent || 0;
    
    const currentDate = new Date(startDate);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    while (currentDate <= endDate) {
      const month = months[currentDate.getMonth()];
      const year = currentDate.getFullYear();
      
      const existingRentQuery = query(
        collection(db, 'monthlyRents'),
        where('userId', '==', userData.uid || userData.id),
        where('month', '==', month),
        where('year', '==', year)
      );
      
      const existingRentSnapshot = await getDocs(existingRentQuery);
      
      if (existingRentSnapshot.empty) {
        await addDoc(collection(db, 'monthlyRents'), {
          userId: userData.uid || userData.id,
          userName: `${userData.firstName} ${userData.lastName}`,
          month: month,
          year: year,
          amount: monthlyRent,
          receivedAmount: 0,
          status: 'pending',
          paidDate: '',
          notes: 'Auto-generated rent entry',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  };

  const handleRentSubmit = async () => {
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const updatedRentFormData = {
        ...rentFormData,
        paidDate: rentFormData.status === 'paid' ? (rentFormData.paidDate || currentDate) : '',
        receivedAmount: rentFormData.status === 'paid' ? Number(rentFormData.amount) : Number(rentFormData.receivedAmount)
      };

      if (editingRent) {
        await updateDoc(doc(db, 'monthlyRents', editingRent.id), {
          userId: updatedRentFormData.userId,
          userName: updatedRentFormData.userName,
          month: updatedRentFormData.month,
          year: updatedRentFormData.year,
          amount: Number(updatedRentFormData.amount),
          receivedAmount: Number(updatedRentFormData.receivedAmount),
          status: updatedRentFormData.status,
          paidDate: updatedRentFormData.paidDate,
          notes: updatedRentFormData.notes,
          updatedAt: serverTimestamp()
        });

        const totalRemainingBalance = await calculateUserTotalBalance(updatedRentFormData.userId);
        await updateDoc(doc(db, 'users', updatedRentFormData.userId), {
          balance: totalRemainingBalance
        });

        setSuccess('Rent entry updated successfully');
      } else {
        await addDoc(collection(db, 'monthlyRents'), {
          userId: updatedRentFormData.userId,
          userName: updatedRentFormData.userName,
          month: updatedRentFormData.month,
          year: updatedRentFormData.year,
          amount: Number(updatedRentFormData.amount),
          receivedAmount: Number(updatedRentFormData.receivedAmount),
          status: updatedRentFormData.status,
          paidDate: updatedRentFormData.paidDate,
          notes: updatedRentFormData.notes,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        const totalRemainingBalance = await calculateUserTotalBalance(updatedRentFormData.userId);
        await updateDoc(doc(db, 'users', updatedRentFormData.userId), {
          balance: totalRemainingBalance
        });

        setSuccess('Rent entry added successfully');
      }
      handleCloseRentDialog();
      fetchMonthlyRents();
      fetchUsers();
    } catch (error) {
      console.error('Error saving rent entry:', error);
      setError('Failed to save rent entry');
    }
  };

  const handleBillSubmit = async () => {
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const updatedBillFormData = {
        ...billFormData,
        paidDate: billFormData.status === 'paid' ? (billFormData.paidDate || currentDate) : '',
        paidAmount: billFormData.status === 'paid' ? Number(billFormData.amount) : Number(billFormData.paidAmount)
      };

      if (editingBill) {
        await updateDoc(doc(db, 'monthlyBills', editingBill.id), {
          userId: updatedBillFormData.userId,
          userName: updatedBillFormData.userName,
          month: updatedBillFormData.month,
          year: updatedBillFormData.year,
          type: updatedBillFormData.type,
          amount: Number(updatedBillFormData.amount),
          paidAmount: Number(updatedBillFormData.paidAmount),
          status: updatedBillFormData.status,
          paidDate: updatedBillFormData.paidDate,
          notes: updatedBillFormData.notes,
          updatedAt: serverTimestamp()
        });

        const totalRemainingBalance = await calculateUserTotalBalance(updatedBillFormData.userId);
        await updateDoc(doc(db, 'users', updatedBillFormData.userId), {
          balance: totalRemainingBalance
        });

        setSuccess('Bill entry updated successfully');
      } else {
        await addDoc(collection(db, 'monthlyBills'), {
          userId: updatedBillFormData.userId,
          userName: updatedBillFormData.userName,
          month: updatedBillFormData.month,
          year: updatedBillFormData.year,
          type: updatedBillFormData.type,
          amount: Number(updatedBillFormData.amount),
          paidAmount: Number(updatedBillFormData.paidAmount),
          status: updatedBillFormData.status,
          paidDate: updatedBillFormData.paidDate,
          notes: updatedBillFormData.notes,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        const totalRemainingBalance = await calculateUserTotalBalance(updatedBillFormData.userId);
        await updateDoc(doc(db, 'users', updatedBillFormData.userId), {
          balance: totalRemainingBalance
        });

        setSuccess('Bill entry added successfully');
      }
      handleCloseBillDialog();
      fetchMonthlyBills();
      fetchUsers();
    } catch (error) {
      console.error('Error saving bill entry:', error);
      setError('Failed to save bill entry');
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
        const rentDoc = await getDoc(doc(db, 'monthlyRents', rentId));
        const rentData = rentDoc.data();
        const userId = rentData?.userId;
        
        await deleteDoc(doc(db, 'monthlyRents', rentId));
        
        if (userId) {
          const totalRemainingBalance = await calculateUserTotalBalance(userId);
          await updateDoc(doc(db, 'users', userId), {
            balance: totalRemainingBalance
          });
        }
        
        setSuccess('Rent entry deleted successfully');
        fetchMonthlyRents();
        fetchUsers();
      } catch (error) {
        console.error('Error deleting rent entry:', error);
        setError('Failed to delete rent entry');
      }
    }
  };

  const handleDeleteBill = async (billId) => {
    if (window.confirm('Are you sure you want to delete this bill entry?')) {
      try {
        const billDoc = await getDoc(doc(db, 'monthlyBills', billId));
        const billData = billDoc.data();
        const userId = billData?.userId;
        
        await deleteDoc(doc(db, 'monthlyBills', billId));
        
        if (userId) {
          const totalRemainingBalance = await calculateUserTotalBalance(userId);
          await updateDoc(doc(db, 'users', userId), {
            balance: totalRemainingBalance
          });
        }
        
        setSuccess('Bill entry deleted successfully');
        fetchMonthlyBills();
        fetchUsers();
      } catch (error) {
        console.error('Error deleting bill entry:', error);
        setError('Failed to delete bill entry');
      }
    }
  };

  const handleUserSelect = (userId, isRent = true) => {
    const selectedUser = users.find(user => user.id === userId);
    if (selectedUser) {
      if (isRent) {
        setRentFormData({
          ...rentFormData,
          userId: selectedUser.id,
          userName: `${selectedUser.firstName} ${selectedUser.lastName}`,
          amount: selectedUser.monthlyRent || 0
        });
      } else {
        setBillFormData({
          ...billFormData,
          userId: selectedUser.id,
          userName: `${selectedUser.firstName} ${selectedUser.lastName}`
        });
      }
    }
  };

  const totalUsers = users.length;
  const totalRent = users.reduce((sum, user) => sum + (user.monthlyRent || 0), 0);
  const totalBalance = users.reduce((sum, user) => sum + (user.balance || 0), 0);

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
      case 'motor': return <WindPowerIcon />;
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

  const calculateUserTotalBalance = async (userId) => {
    try {
      const rentsQuery = query(
        collection(db, 'monthlyRents'),
        where('userId', '==', userId)
      );
      const rentsSnapshot = await getDocs(rentsQuery);
      const userRents = rentsSnapshot.docs.map(doc => doc.data());
      
      let totalRentBalance = 0;
      userRents.forEach(rent => {
        const rentAmount = Number(rent.amount) || 0;
        const receivedAmount = Number(rent.receivedAmount) || 0;
        const remainingAmount = Math.max(0, rentAmount - receivedAmount);
        
        if (rent.status === 'pending' || rent.status === 'overdue') {
          totalRentBalance += remainingAmount;
        }
      });

      const billsQuery = query(
        collection(db, 'monthlyBills'),
        where('userId', '==', userId)
      );
      const billsSnapshot = await getDocs(billsQuery);
      const userBills = billsSnapshot.docs.map(doc => doc.data());
      
      let totalBillBalance = 0;
      userBills.forEach(bill => {
        const billAmount = Number(bill.amount) || 0;
        const paidAmount = Number(bill.paidAmount) || 0;
        const remainingAmount = Math.max(0, billAmount - paidAmount);
        
        if (bill.status === 'pending' || bill.status === 'overdue') {
          totalBillBalance += remainingAmount;
        }
      });
      
      return totalRentBalance + totalBillBalance;
    } catch (error) {
      console.error('Error calculating user balance:', error);
      return 0;
    }
  };

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
      fetchUsers();
    } catch (error) {
      console.error('Error recalculating user balances:', error);
      setError('Failed to recalculate user balances');
    }
  };

  const refreshAllData = async () => {
    setSuccess('Refreshing data...');
    await fetchUsers();
    await fetchMonthlyRents();
    await fetchMonthlyBills();
    setSuccess('Data refreshed successfully');
    setTimeout(() => setSuccess(''), 2000);
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const billTypes = [
    { value: 'electric', label: 'Electric Bill' },
    { value: 'ssgc', label: 'SSGC Bill' },
    { value: 'motor', label: 'Motor Bill' },
    { value: 'maintenance', label: 'Maintenance Charges' }
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

        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="600" gutterBottom>
            Welcome, Administrator!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage users, track payments, and monitor rental activity.
          </Typography>
        </Box>

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
                    Total Bills
                  </Typography>
                  <Typography variant="h3" fontWeight="600">
                    Rs. {calculateBillsTotals('all').totalBills.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
        </Grid>

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
            <Tab icon={<ReceiptIcon />} iconPosition="start" label="Bills Management" />
            <Tab icon={<TrendingUpIcon />} iconPosition="start" label="Consolidated Transactions" />
          </Tabs>

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
                  Add Tenant
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
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Received Payment</TableCell>
                    <TableCell>Total Balance</TableCell>
                    <TableCell>Advance</TableCell>
                    <TableCell>Rent Period</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => {
                    const { totalAmount, totalReceived } = calculateUserAmounts(user.id);
                    return (
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
                            Rs. {user.monthlyRent || 0}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1" fontWeight="500">
                            Rs. {totalAmount.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body1" 
                            fontWeight="500"
                            color="success.main"
                          >
                            Rs. {totalReceived.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body1" 
                            fontWeight="500"
                            color={user.balance > 0 ? 'error.main' : 'success.main'}
                          >
                            Rs. {user.balance || 0}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1">
                            Rs. {user.advanceAmount || 0}
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
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

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
                      <TableCell>Rs. {rent.amount}</TableCell>
                      <TableCell>Rs. {rent.receivedAmount}</TableCell>
                      <TableCell>
                        <Chip 
                          label={rent.status} 
                          color={getStatusColor(rent.status)}
                          size="small"
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell>{rent.paidDate || 'N/A'}</TableCell>
                      <TableCell>
                        <Typography 
                          variant="body1" 
                          fontWeight="500"
                          color={calculateRemainingBalance(rent.amount, rent.receivedAmount) > 0 ? 'error.main' : 'success.main'}
                        >
                          Rs. {calculateRemainingBalance(rent.amount, rent.receivedAmount)}
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

          <TabPanel value={activeTab} index={2}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight="600">Bills Management</Typography>
                <Box sx={{ mt: 1, display: 'flex', gap: 2, alignItems: 'center' }}>
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Select Tenant</InputLabel>
                    <Select
                      value={selectedUserId}
                      label="Select Tenant"
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      variant="outlined"
                    >
                      <MenuItem value="all">All Tenants</MenuItem>
                      {users.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography variant="body2" color="text.secondary">
                    Total Bills: Rs. {calculateBillsTotals(selectedUserId).totalBills.toLocaleString()} | 
                    Paid: Rs. {calculateBillsTotals(selectedUserId).totalBillsPaid.toLocaleString()} | 
                    Balance: Rs. {calculateBillsTotals(selectedUserId).totalBillsBalance.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenBillDialog()}
              >
                Add Bill Entry
              </Button>
            </Box>
            
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Tenant</TableCell>
                    <TableCell>Bill Type</TableCell>
                    <TableCell>Period</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Paid</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Paid Date</TableCell>
                    <TableCell>Balance</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(selectedUserId === 'all' ? monthlyBills : monthlyBills.filter(bill => bill.userId === selectedUserId)).map((bill) => (
                    <TableRow key={bill.id} hover>
                      <TableCell>
                        <Typography variant="body1" fontWeight="500">
                          {bill.userName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                            {getTransactionIcon(bill.type, bill.type)}
                          </Avatar>
                          <Typography variant="body1" fontWeight="500">
                            {getTransactionTypeLabel(bill.type, bill.type)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight="500">
                          {bill.month}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {bill.year}
                        </Typography>
                      </TableCell>
                      <TableCell>Rs. {bill.amount}</TableCell>
                      <TableCell>Rs. {bill.paidAmount}</TableCell>
                      <TableCell>
                        <Chip 
                          label={bill.status} 
                          color={getStatusColor(bill.status)}
                          size="small"
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell>{bill.paidDate || 'N/A'}</TableCell>
                      <TableCell>
                        <Typography 
                          variant="body1" 
                          fontWeight="500"
                          color={calculateRemainingBalance(bill.amount, bill.paidAmount) > 0 ? 'error.main' : 'success.main'}
                        >
                          Rs. {calculateRemainingBalance(bill.amount, bill.paidAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton 
                          onClick={() => handleOpenBillDialog(bill)}
                          color="primary"
                          size="large"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleDeleteBill(bill.id)}
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
            {(selectedUserId === 'all' ? monthlyBills : monthlyBills.filter(bill => bill.userId === selectedUserId)).length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ReceiptIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No bills available for {selectedUserId === 'all' ? 'any tenants' : 'this tenant'}.
                </Typography>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6" fontWeight="600">Consolidated Transactions</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenRentDialog()}
                >
                  Add Rent
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenBillDialog()}
                >
                  Add Bill
                </Button>
              </Box>
            </Box>
            
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Tenant</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Period</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Paid</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Paid Date</TableCell>
                    <TableCell>Balance</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getConsolidatedTransactions().map((transaction) => (
                    <TableRow key={transaction.id} hover>
                      <TableCell>
                        <Typography variant="body1" fontWeight="500">
                          {transaction.userName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                            {getTransactionIcon(transaction.type, transaction.type === 'bill' ? transaction.type : null)}
                          </Avatar>
                          <Typography variant="body1" fontWeight="500">
                            {getTransactionTypeLabel(transaction.type, transaction.type === 'bill' ? transaction.type : null)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" fontWeight="500">
                          {transaction.month}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {transaction.year}
                        </Typography>
                      </TableCell>
                      <TableCell>Rs. {transaction.amount}</TableCell>
                      <TableCell>Rs. {transaction.receivedAmount || transaction.paidAmount}</TableCell>
                      <TableCell>
                        <Chip 
                          label={transaction.status} 
                          color={getStatusColor(transaction.status)}
                          size="small"
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell>{transaction.paidDate || 'N/A'}</TableCell>
                      <TableCell>
                        <Typography 
                          variant="body1" 
                          fontWeight="500"
                          color={calculateRemainingBalance(transaction.amount, transaction.receivedAmount || transaction.paidAmount) > 0 ? 'error.main' : 'success.main'}
                        >
                          Rs. {calculateRemainingBalance(transaction.amount, transaction.receivedAmount || transaction.paidAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton 
                          onClick={() => transaction.type === 'rent' ? handleOpenRentDialog(transaction) : handleOpenBillDialog(transaction)}
                          color="primary"
                          size="large"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          onClick={() => transaction.type === 'rent' ? handleDeleteRent(transaction.id) : handleDeleteBill(transaction.id)}
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

        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog} 
          maxWidth="md" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle>
            <Typography variant="h6" fontWeight="600">
              {editingUser ? 'Edit User' : 'Add New Tenant'}
            </Typography>
          </DialogTitle>
          <DialogContent>
            {!editingUser && (
              <Alert severity="info" sx={{ mb: 2 }}>
                This will create a new tenant account with email and password.
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
                    required
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
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    margin="normal"
                    variant="outlined"
                    required
                    disabled={!!editingUser}
                  />
                </Grid>
                {!editingUser && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      margin="normal"
                      variant="outlined"
                      required
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                )}
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
                    required
                    InputProps={{
                      startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                    }}
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
                    InputProps={{
                      startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                    }}
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
                    required
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
                    required
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
              disabled={!formData.firstName || !formData.lastName || !formData.email || (!editingUser && !formData.password) || !formData.rentStartDate || !formData.rentEndDate}
            >
              {editingUser ? 'Update' : 'Add Tenant'}
            </Button>
          </DialogActions>
        </Dialog>

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
                      onChange={(e) => handleUserSelect(e.target.value, true)}
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
                    InputProps={{
                      startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                    }}
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
                    InputProps={{
                      startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                    }}
                    disabled={rentFormData.status === 'paid'}
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
                    label="Paid Date"
                    type="date"
                    value={rentFormData.paidDate}
                    onChange={(e) => setRentFormData({ ...rentFormData, paidDate: e.target.value })}
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                    disabled={rentFormData.status !== 'paid'}
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

        <Dialog 
          open={openBillDialog} 
          onClose={handleCloseBillDialog} 
          maxWidth="md" 
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle>
            <Typography variant="h6" fontWeight="600">
              {editingBill ? 'Edit Monthly Bill' : 'Add Monthly Bill'}
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Select Tenant</InputLabel>
                    <Select
                      value={billFormData.userId}
                      label="Select Tenant"
                      onChange={(e) => handleUserSelect(e.target.value, false)}
                      disabled={!!editingBill}
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
                    value={billFormData.userName}
                    margin="normal"
                    disabled
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Bill Type</InputLabel>
                    <Select
                      value={billFormData.type}
                      label="Bill Type"
                      onChange={(e) => setBillFormData({ ...billFormData, type: e.target.value })}
                      variant="outlined"
                    >
                      {billTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Month</InputLabel>
                    <Select
                      value={billFormData.month}
                      label="Month"
                      onChange={(e) => setBillFormData({ ...billFormData, month: e.target.value })}
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
                      value={billFormData.year}
                      label="Year"
                      onChange={(e) => setBillFormData({ ...billFormData, year: e.target.value })}
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
                    value={billFormData.amount}
                    onChange={(e) => setBillFormData({ ...billFormData, amount: e.target.value })}
                    margin="normal"
                    variant="outlined"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Paid Amount"
                    type="number"
                    value={billFormData.paidAmount}
                    onChange={(e) => setBillFormData({ ...billFormData, paidAmount: e.target.value })}
                    margin="normal"
                    variant="outlined"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                    }}
                    disabled={billFormData.status === 'paid'}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={billFormData.status}
                      label="Status"
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        setBillFormData({ 
                          ...billFormData, 
                          status: newStatus,
                          paidAmount: newStatus === 'paid' ? billFormData.amount : billFormData.paidAmount
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
                    label="Paid Date"
                    type="date"
                    value={billFormData.paidDate}
                    onChange={(e) => setBillFormData({ ...billFormData, paidDate: e.target.value })}
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                    disabled={billFormData.status !== 'paid'}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    multiline
                    rows={3}
                    value={billFormData.notes}
                    onChange={(e) => setBillFormData({ ...billFormData, notes: e.target.value })}
                    margin="normal"
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={handleCloseBillDialog} 
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBillSubmit} 
              variant="contained"
              sx={{ borderRadius: 2 }}
            >
              {editingBill ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>

        {isMobile && (
          <Fab
            color="primary"
            aria-label="add"
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
            }}
            onClick={() => {
              if (activeTab === 0) handleOpenDialog();
              else if (activeTab === 1 || activeTab === 3) handleOpenRentDialog();
              else if (activeTab === 2) handleOpenBillDialog();
            }}
          >
            <AddIcon />
          </Fab>
        )}
      </Container>
    </>
  );
}