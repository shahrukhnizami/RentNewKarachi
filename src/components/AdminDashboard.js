import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
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
  Avatar,
  LinearProgress,
  useTheme,
  useMediaQuery,
  Fade,
  Zoom,
  Fab,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Menu,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Logout as LogoutIcon,
  Receipt as ReceiptIcon,
  Refresh as RefreshIcon,
  Dashboard as DashboardIcon,
  AccountBalance as BalanceIcon,
  Payment as PaymentIcon,
  ElectricBolt as ElectricIcon,
  LocalGasStation as GasIcon,
  Build as MaintenanceIcon,
  Visibility,
  VisibilityOff,
  PhotoCamera,
  CloudUpload,
  Share as ShareIcon,
  WhatsApp as WhatsAppIcon,
  Sms as SmsIcon,
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
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { uploadImageToCloudinary, deleteImageFromCloudinary, validateImageFile } from '../cloudinary/uploadUtils';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import UserCard from './UserCard';

// Main AdminDashboard component
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
  const [showPassword, setShowPassword] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(
    [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ][new Date().getMonth()]
  );
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
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
    rentEndDate: '',
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
    notes: '',
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
    notes: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [nicFrontImage, setNicFrontImage] = useState(null);
  const [nicFrontPreview, setNicFrontPreview] = useState(null);
  const [nicBackImage, setNicBackImage] = useState(null);
  const [nicBackPreview, setNicBackPreview] = useState(null);
  const [uploadingNic, setUploadingNic] = useState(false);
  const [shareAnchorEl, setShareAnchorEl] = useState(null);
  const [selectedUserForShare, setSelectedUserForShare] = useState(null);

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i).map(String);

  const billTypes = [
    { value: 'electric', label: 'Electric Bill' },
    { value: 'ssgc', label: 'SSGC Bill' },
    { value: 'motor', label: 'Motor Bill' },
    { value: 'maintenance', label: 'Maintenance Charges' },
  ];

  useEffect(() => {
    fetchUsers();
    fetchMonthlyRents();
    fetchMonthlyBills();
  }, []);

  // Share functionality
  const handleShareClick = (event, user) => {
    setShareAnchorEl(event.currentTarget);
    setSelectedUserForShare(user);
  };

  const handleShareClose = () => {
    setShareAnchorEl(null);
    setSelectedUserForShare(null);
  };

  const generateMonthlyQuotation = (user) => {
    if (!user) return '';

    // UserCard ke same calculations use karein
    const userRents = monthlyRents.filter(
      rent => rent.userId === user.id &&
        rent.month === selectedMonth &&
        rent.year === selectedYear
    );

    const userBills = monthlyBills.filter(
      bill => bill.userId === user.id &&
        bill.month === selectedMonth &&
        bill.year === selectedYear
    );

    // Current month ke totals - exactly UserCard ke hisaab se
    const totalRent = userRents.reduce((sum, rent) => sum + (Number(rent.amount) || 0), 0);
    const receivedRent = userRents.reduce((sum, rent) => sum + (Number(rent.receivedAmount) || 0), 0);
    const totalBill = userBills.reduce((sum, bill) => sum + (Number(bill.amount) || 0), 0);
    const paidBill = userBills.reduce((sum, bill) => sum + (Number(bill.paidAmount) || 0), 0);

    const total = totalRent + totalBill;
    const received = receivedRent + paidBill;
    const monthBalance = total - received;

    // Previous balance - exactly UserCard ke hisaab se
    const previousRents = monthlyRents.filter(rent => {
      if (rent.userId !== user.id) return false;

      const rentDate = new Date(`${rent.month} 1, ${rent.year}`);
      const selectedDate = new Date(`${selectedMonth} 1, ${selectedYear}`);

      return rentDate < selectedDate;
    });

    const previousBills = monthlyBills.filter(bill => {
      if (bill.userId !== user.id) return false;

      const billDate = new Date(`${bill.month} 1, ${bill.year}`);
      const selectedDate = new Date(`${selectedMonth} 1, ${selectedYear}`);

      return billDate < selectedDate;
    });

    const previousRentBalance = previousRents.reduce((sum, rent) => {
      const rentAmount = Number(rent.amount) || 0;
      const receivedAmount = Number(rent.receivedAmount) || 0;
      return sum + Math.max(0, rentAmount - receivedAmount);
    }, 0);

    const previousBillBalance = previousBills.reduce((sum, bill) => {
      const billAmount = Number(bill.amount) || 0;
      const paidAmount = Number(bill.paidAmount) || 0;
      return sum + Math.max(0, billAmount - paidAmount);
    }, 0);

    const previousBalance = previousRentBalance + previousBillBalance;
    const currentBalance = previousBalance + monthBalance;

    // Detailed breakdown - UserCard ke format ke hisaab se
    const rentBreakdown = userRents.map(rent => {
      const rentAmount = Number(rent.amount) || 0;

      return `• Monthly Rent: Rs. ${rentAmount.toLocaleString()})`;
    });

    const billBreakdown = userBills.map(bill => {

      return `• ${getTransactionTypeLabel('bill', bill.type)}}`;
    }).join('\n');

    return `🏠 *Monthly Quotation - ${selectedMonth} ${selectedYear}*

👤 *Tenant Details:*
• Name: ${user.firstName} ${user.lastName}
• Property: ${user.propertyName || 'Rental Property'}

📊 *Payment Summary:*

*Previous Balance: Rs. ${previousBalance.toLocaleString()}*
*Current Month (${selectedMonth} ${selectedYear}):*
${rentBreakdown || '• No rent entries for this month'}

${billBreakdown || '• No bills for this month'}

*Current Month Totals:*
• Total Rent: Rs. ${totalRent.toLocaleString()}
• Total Bills: Rs. ${totalBill.toLocaleString()}
• Total Received/Paid: Rs. ${received.toLocaleString()}
• Month Balance: Rs. ${monthBalance.toLocaleString()}

*GRAND TOTAL DUE: Rs. ${currentBalance.toLocaleString()}*
Thank you for your timely payments! 🏡`;
  };

  const shareViaWhatsApp = (user) => {
    const message = generateMonthlyQuotation(user);
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    handleShareClose();
    setSuccess(`Monthly quotation sent via WhatsApp to ${user.firstName} ${user.lastName}`);
  };

  const shareViaSMS = (user) => {
    const message = generateMonthlyQuotation(user);
    const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
    window.open(smsUrl, '_blank');
    handleShareClose();
    setSuccess(`Monthly quotation sent via SMS to ${user.firstName} ${user.lastName}`);
  };

  const shareAllTenants = (method) => {
    const tenants = users.filter(user => user.role === 'user');
    tenants.forEach((user, index) => {
      setTimeout(() => {
        if (method === 'whatsapp') {
          const message = generateMonthlyQuotation(user);
          const encodedMessage = encodeURIComponent(message);
          const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
          window.open(whatsappUrl, '_blank');
        } else if (method === 'sms') {
          const message = generateMonthlyQuotation(user);
          const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
          window.open(smsUrl, '_blank');
        }
      }, index * 1000); // Stagger openings to avoid popup blockers
    });
    handleShareClose();
    setSuccess(`Monthly quotations sent to all ${tenants.length} tenants via ${method === 'whatsapp' ? 'WhatsApp' : 'SMS'}`);
  };

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
      const usersList = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
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
      const rentsList = rentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        type: 'rent',
        ...doc.data(),
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
      const billsList = billsSnapshot.docs.map((doc) => ({
        id: doc.id,
        type: 'bill',
        ...doc.data(),
      }));
      setMonthlyBills(billsList);
    } catch (error) {
      console.error('Error fetching monthly bills:', error);
      setError('Failed to fetch monthly bills');
    }
  };

  const calculateMonthlyReceivedAmounts = () => {
    const receivedByUser = users.map((user) => {
      const userRents = monthlyRents.filter(
        (rent) => rent.userId === user.id && rent.month === selectedMonth && rent.year === selectedYear
      );
      const userBills = monthlyBills.filter(
        (bill) => bill.userId === user.id && bill.month === selectedMonth && bill.year === selectedYear
      );

      const totalReceivedRent = userRents.reduce((sum, rent) => sum + (Number(rent.receivedAmount) || 0), 0);
      const totalPaidBill = userBills.reduce((sum, bill) => sum + (Number(bill.paidAmount) || 0), 0);
      const totalReceived = totalReceivedRent + totalPaidBill;

      return {
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        totalReceived,
      };
    });

    const totalReceivedAllUsers = receivedByUser.reduce((sum, user) => sum + user.totalReceived, 0);

    return { receivedByUser, totalReceivedAllUsers };
  };

  const updateRentEntry = async (rent) => {
    try {
      await updateDoc(doc(db, 'monthlyRents', rent.id), {
        userId: rent.userId,
        userName: rent.userName,
        month: rent.month,
        year: rent.year,
        amount: Number(rent.amount),
        receivedAmount: Number(rent.receivedAmount),
        status: rent.status,
        paidDate: rent.paidDate,
        notes: rent.notes,
        updatedAt: serverTimestamp(),
      });

      const totalRemainingBalance = await calculateUserTotalBalance(rent.userId);
      await updateDoc(doc(db, 'users', rent.userId), {
        balance: totalRemainingBalance,
      });

      setSuccess('Rent entry updated successfully');
      fetchMonthlyRents();
      fetchUsers();
    } catch (error) {
      console.error('Error updating rent entry:', error);
      setError('Failed to update rent entry');
    }
  };

  const updateBillEntry = async (bill) => {
    try {
      await updateDoc(doc(db, 'monthlyBills', bill.id), {
        userId: bill.userId,
        userName: bill.userName,
        month: bill.month,
        year: bill.year,
        type: bill.type,
        amount: Number(bill.amount),
        paidAmount: Number(bill.paidAmount),
        status: bill.status,
        paidDate: bill.paidDate,
        notes: bill.notes,
        updatedAt: serverTimestamp(),
      });

      const totalRemainingBalance = await calculateUserTotalBalance(bill.userId);
      await updateDoc(doc(db, 'users', bill.userId), {
        balance: totalRemainingBalance,
      });

      setSuccess('Bill entry updated successfully');
      fetchMonthlyBills();
      fetchUsers();
    } catch (error) {
      console.error('Error updating bill entry:', error);
      setError('Failed to update bill entry');
    }
  };

  const calculateBillsTotals = (userId) => {
    const filteredBills = userId === 'all' ? monthlyBills : monthlyBills.filter((bill) => bill.userId === userId);
    const totalBills = filteredBills.reduce((sum, bill) => sum + (Number(bill.amount) || 0), 0);
    const totalBillsPaid = filteredBills.reduce((sum, bill) => sum + (Number(bill.paidAmount) || 0), 0);
    const totalBillsBalance = totalBills - totalBillsPaid;
    return { totalBills, totalBillsPaid, totalBillsBalance };
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
        rentEndDate: user.rentEndDate || '',
      });
      setImagePreview(user.profilePicture?.url || null);
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
        rentEndDate: '',
      });
      setImagePreview(null);
    }
    setSelectedImage(null);
    setOpenDialog(true);
  };

  const handleOpenRentDialog = (rent = null, prefill = {}) => {
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
        notes: rent.notes || '',
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
        notes: '',
        ...prefill,
      });
    }
    setOpenRentDialog(true);
  };

  const handleOpenBillDialog = (bill = null, prefill = {}) => {
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
        notes: bill.notes || '',
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
        notes: '',
        ...prefill,
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
      rentEndDate: '',
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
      notes: '',
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
      notes: '',
    });
  };

  const handleSubmit = async () => {
    try {
      setError('');

      if (editingUser) {
        let profilePictureData = editingUser.profilePicture;
        if (selectedImage) {
          if (editingUser.profilePicture && editingUser.profilePicture.public_id) {
            await deleteOldProfilePicture(editingUser.profilePicture);
          }
          profilePictureData = await uploadProfilePicture(editingUser.id);
          if (!profilePictureData && editingUser.profilePicture) {
            profilePictureData = editingUser.profilePicture;
          }
        }

        let nicDocuments = editingUser.nicDocuments;
        if (nicFrontImage || nicBackImage) {
          if (editingUser.nicDocuments) {
            await deleteOldNicImages(editingUser.nicDocuments);
          }

          const newNicDocuments = await uploadNicImages(editingUser.id);
          if (newNicDocuments) {
            nicDocuments = {
              ...nicDocuments,
              ...newNicDocuments
            };
          }
        }

        await updateDoc(doc(db, 'users', editingUser.id), {
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          monthlyRent: Number(formData.monthlyRent),
          advanceAmount: Number(formData.advanceAmount),
          advanceDate: formData.advanceDate,
          rentStartDate: formData.rentStartDate,
          rentEndDate: formData.rentEndDate,
          profilePicture: profilePictureData,
          nicDocuments: nicDocuments,
          updatedAt: serverTimestamp(),
        });
        setSuccess('User updated successfully');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

        let profilePictureData = null;
        if (selectedImage) {
          profilePictureData = await uploadProfilePicture(userCredential.user.uid);
        }

        let nicDocuments = null;
        if (nicFrontImage || nicBackImage) {
          nicDocuments = await uploadNicImages(userCredential.user.uid);
        }

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
          profilePicture: profilePictureData,
          nicDocuments: nicDocuments,
          balance: 0,
          createdAt: serverTimestamp(),
        };
        await addDoc(collection(db, 'users'), newUserData);
        await generateRentEntries(newUserData);
        setSuccess('User added successfully and rent entries generated');
      }

      setSelectedImage(null);
      setImagePreview(null);
      setNicFrontImage(null);
      setNicFrontPreview(null);
      setNicBackImage(null);
      setNicBackPreview(null);

      handleCloseDialog();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      setError('Failed to save user: ' + error.message);
    }
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }

      setSelectedImage(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadProfilePicture = async (userId) => {
    if (!selectedImage) return null;

    try {
      setUploadingImage(true);
      setError('');

      console.log('Starting image upload for user:', userId);

      const result = await uploadImageToCloudinary(selectedImage, 'profile-pictures');

      if (result.success) {
        console.log('Image upload successful:', result);
        return {
          url: result.url,
          public_id: result.public_id
        };
      } else {
        const errorMsg = `Failed to upload image: ${result.error}`;
        console.error(errorMsg);
        setError(errorMsg);
        return null;
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image: ' + error.message);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const deleteOldProfilePicture = async (imageData) => {
    if (!imageData || !imageData.public_id) return;

    try {
      const result = await deleteImageFromCloudinary(imageData.public_id);
      if (!result.success) {
        console.warn('Failed to delete old image:', result.error);
      }
    } catch (error) {
      console.error('Error deleting old image:', error);
    }
  };

  const handleNicFrontSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }

      setNicFrontImage(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setNicFrontPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNicBackSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }

      setNicBackImage(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setNicBackPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadNicImages = async (userId) => {
    if (!nicFrontImage && !nicBackImage) return null;

    try {
      setUploadingNic(true);
      setError('');

      const nicDocuments = {};

      if (nicFrontImage) {
        console.log('📷 Uploading NIC Front...');
        const frontResult = await uploadImageToCloudinary(nicFrontImage, 'nic-documents');

        if (frontResult.success) {
          nicDocuments.front = {
            url: frontResult.url,
            public_id: frontResult.public_id
          };
          console.log('✅ NIC Front uploaded successfully');
        } else {
          throw new Error(`NIC Front upload failed: ${frontResult.error}`);
        }
      }

      if (nicBackImage) {
        console.log('📷 Uploading NIC Back...');
        const backResult = await uploadImageToCloudinary(nicBackImage, 'nic-documents');

        if (backResult.success) {
          nicDocuments.back = {
            url: backResult.url,
            public_id: backResult.public_id
          };
          console.log('✅ NIC Back uploaded successfully');
        } else {
          throw new Error(`NIC Back upload failed: ${backResult.error}`);
        }
      }

      return nicDocuments;

    } catch (error) {
      console.error('❌ Error uploading NIC images:', error);
      setError('Failed to upload NIC images: ' + error.message);
      return null;
    } finally {
      setUploadingNic(false);
    }
  };

  const deleteOldNicImages = async (nicDocuments) => {
    if (!nicDocuments) return;

    try {
      if (nicDocuments.front && nicDocuments.front.public_id) {
        await deleteImageFromCloudinary(nicDocuments.front.public_id);
      }
      if (nicDocuments.back && nicDocuments.back.public_id) {
        await deleteImageFromCloudinary(nicDocuments.back.public_id);
      }
    } catch (error) {
      console.error('Error deleting old NIC images:', error);
    }
  };

  const generateRentEntries = async (userData) => {
    if (!userData.rentStartDate || !userData.rentEndDate) return;
    const startDate = new Date(userData.rentStartDate);
    const endDate = new Date(userData.rentEndDate);
    const monthlyRent = userData.monthlyRent || 0;
    const currentDate = new Date(startDate);
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
          updatedAt: serverTimestamp(),
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
        receivedAmount: rentFormData.status === 'paid' ? Number(rentFormData.amount) : Number(rentFormData.receivedAmount),
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
          updatedAt: serverTimestamp(),
        });
        const totalRemainingBalance = await calculateUserTotalBalance(updatedRentFormData.userId);
        await updateDoc(doc(db, 'users', updatedRentFormData.userId), {
          balance: totalRemainingBalance,
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
          updatedAt: serverTimestamp(),
        });
        const totalRemainingBalance = await calculateUserTotalBalance(updatedRentFormData.userId);
        await updateDoc(doc(db, 'users', updatedRentFormData.userId), {
          balance: totalRemainingBalance,
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
        paidAmount: billFormData.status === 'paid' ? Number(billFormData.amount) : Number(billFormData.paidAmount),
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
          updatedAt: serverTimestamp(),
        });
        const totalRemainingBalance = await calculateUserTotalBalance(updatedBillFormData.userId);
        await updateDoc(doc(db, 'users', updatedBillFormData.userId), {
          balance: totalRemainingBalance,
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
          updatedAt: serverTimestamp(),
        });
        const totalRemainingBalance = await calculateUserTotalBalance(updatedBillFormData.userId);
        await updateDoc(doc(db, 'users', updatedBillFormData.userId), {
          balance: totalRemainingBalance,
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
            balance: totalRemainingBalance,
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
            balance: totalRemainingBalance,
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
    const selectedUser = users.find((user) => user.id === userId);
    if (selectedUser) {
      if (isRent) {
        setRentFormData({
          ...rentFormData,
          userId: selectedUser.id,
          userName: `${selectedUser.firstName} ${selectedUser.lastName}`,
          amount: selectedUser.monthlyRent || 0,
        });
      } else {
        setBillFormData({
          ...billFormData,
          userId: selectedUser.id,
          userName: `${selectedUser.firstName} ${selectedUser.lastName}`,
        });
      }
    }
  };

  const getTransactionTypeLabel = (type, billType) => {
    if (type === 'rent') return 'Rent';
    switch (billType) {
      case 'electric':
        return 'Electric Bill';
      case 'ssgc':
        return 'SSGC Bill';
      case 'motor':
        return 'Motor Bill';
      case 'maintenance':
        return 'Maintenance';
      default:
        return billType || 'Bill';
    }
  };

  const getTransactionIcon = (type, billType) => {
    if (type === 'rent') return <PaymentIcon />;
    switch (billType) {
      case 'electric':
        return <ElectricIcon />;
      case 'ssgc':
        return <GasIcon />;
      case 'motor':
        return <WindPowerIcon />;
      case 'maintenance':
        return <MaintenanceIcon />;
      default:
        return <ReceiptIcon />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  const calculateRemainingBalance = (amount, receivedAmount) => {
    return Math.max(0, amount - (receivedAmount || 0));
  };

  const calculateUserTotalBalance = async (userId) => {
    try {
      const rentsQuery = query(collection(db, 'monthlyRents'), where('userId', '==', userId));
      const rentsSnapshot = await getDocs(rentsQuery);
      const userRents = rentsSnapshot.docs.map((doc) => doc.data());
      let totalRentBalance = 0;
      userRents.forEach((rent) => {
        const rentAmount = Number(rent.amount) || 0;
        const receivedAmount = Number(rent.receivedAmount) || 0;
        const remainingAmount = Math.max(0, rentAmount - receivedAmount);
        if (rent.status === 'pending' || rent.status === 'overdue') {
          totalRentBalance += remainingAmount;
        }
      });
      const billsQuery = query(collection(db, 'monthlyBills'), where('userId', '==', userId));
      const billsSnapshot = await getDocs(billsQuery);
      const userBills = billsSnapshot.docs.map((doc) => doc.data());
      let totalBillBalance = 0;
      userBills.forEach((bill) => {
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
          balance: totalRemainingBalance,
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

  const ShareMenu = () => (
    <Menu
      anchorEl={shareAnchorEl}
      open={Boolean(shareAnchorEl)}
      onClose={handleShareClose}
      PaperProps={{
        sx: {
          borderRadius: 2,
          mt: 1,
          minWidth: 200
        }
      }}
    >
      {selectedUserForShare && (
        <>
          <MenuItem onClick={() => shareViaWhatsApp(selectedUserForShare)}>
            <ListItemIcon>
              <WhatsAppIcon color="success" />
            </ListItemIcon>
            <ListItemText primary="Share via WhatsApp" />
          </MenuItem>
          <MenuItem onClick={() => shareViaSMS(selectedUserForShare)}>
            <ListItemIcon>
              <SmsIcon color="info" />
            </ListItemIcon>
            <ListItemText primary="Share via SMS" />
          </MenuItem>
        </>
      )}
      <MenuItem onClick={() => shareAllTenants('whatsapp')}>
        <ListItemIcon>
          <WhatsAppIcon color="success" />
        </ListItemIcon>
        <ListItemText primary="Share All via WhatsApp" />
      </MenuItem>
      <MenuItem onClick={() => shareAllTenants('sms')}>
        <ListItemIcon>
          <SmsIcon color="info" />
        </ListItemIcon>
        <ListItemText primary="Share All via SMS" />
      </MenuItem>
    </Menu>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" flexDirection="column">
        <Avatar sx={{ width: 80, height: 80, mb: 2, bgcolor: 'primary.main' }}>
          <DashboardIcon fontSize="large" />
        </Avatar>
        <Typography variant="h6" gutterBottom>
          Loading Admin Dashboard...
        </Typography>
        <LinearProgress sx={{ width: '50%', maxWidth: 300, mt: 2 }} />
      </Box>
    );
  }

  const { receivedByUser, totalReceivedAllUsers } = calculateMonthlyReceivedAmounts();
  const totalUsers = users.length;
  const totalRent = users.reduce((sum, user) => sum + (user.monthlyRent || 0), 0);
  const totalBalance = users.reduce((sum, user) => sum + (user.balance || 0), 0);

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
            <Tooltip title="Share Monthly Quotations">
              <IconButton
                color="inherit"
                onClick={(e) => handleShareClick(e)}
                sx={{ mr: 1 }}
              >
                <ShareIcon />
              </IconButton>
            </Tooltip>

            <Avatar
              sx={{
                width: 40,
                height: 40,
                mr: 1,
                bgcolor: 'secondary.main',
                fontSize: '1rem',
              }}
            >
              {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'A'}
            </Avatar>
            {!isMobile && (
              <Typography variant="body2" sx={{ mr: 2 }}>
                {currentUser?.displayName || currentUser?.email}
              </Typography>
            )}
            <IconButton color="inherit" onClick={refreshAllData} sx={{ mr: 1 }} size="large">
              <RefreshIcon />
            </IconButton>
            <IconButton color="inherit" onClick={handleLogout} size="large">
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <ShareMenu />

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Fade in={!!error}>
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          </Fade>
        )}
        {success && (
          <Fade in={!!success}>
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
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

        <Paper elevation={2} sx={{ borderRadius: 3, mb: 4, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <Typography variant="h6" fontWeight="600">
              Monthly Received Amounts ({selectedMonth} {selectedYear})
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<ShareIcon />}
                onClick={(e) => handleShareClick(e)}
                size="small"
              >
                Share Quotations
              </Button>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Month</InputLabel>
                <Select
                  value={selectedMonth}
                  label="Month"
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  variant="outlined"
                >
                  {months.map((month) => (
                    <MenuItem key={month} value={month}>
                      {month}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 100 }}>
                <InputLabel>Year</InputLabel>
                <Select
                  value={selectedYear}
                  label="Year"
                  onChange={(e) => setSelectedYear(e.target.value)}
                  variant="outlined"
                >
                  {years.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Tenant</TableCell>
                  <TableCell align="right">Total Received (Rs.)</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {receivedByUser.map((user) => {
                  const userData = users.find(u => u.id === user.userId);
                  return (
                    <TableRow key={user.userId} hover>
                      <TableCell>
                        <Typography variant="body1" fontWeight="500">
                          {user.userName}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body1" color="success.main">
                          Rs. {user.totalReceived.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Share monthly quotation">
                          <IconButton
                            size="small"
                            onClick={(e) => handleShareClick(e, userData)}
                            color="primary"
                          >
                            <ShareIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow>
                  <TableCell>
                    <Typography variant="body1" fontWeight="600">
                      Total
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body1" fontWeight="600" color="success.main">
                      Rs. {totalReceivedAllUsers.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          {receivedByUser.every((user) => user.totalReceived === 0) && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <ReceiptIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No payments received for {selectedMonth} {selectedYear}.
              </Typography>
            </Box>
          )}
        </Paper>

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
                  overflow: 'hidden',
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
                  overflow: 'hidden',
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
                  overflow: 'hidden',
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
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ position: 'absolute', top: 0, right: 0, p: 1, opacity: 0.1 }}>
                  <ReceiptIcon sx={{ fontSize: 80 }} />
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
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6" fontWeight="600">
              User Management
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" onClick={recalculateAllUserBalances} startIcon={<RefreshIcon />}>
                Recalculate Balances
              </Button>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                Add Tenant
              </Button>
            </Box>
          </Box>
          <Grid container spacing={3} sx={{ p: 2 }}>
            {users.map((user) => (
              <Grid item xs={12} md={6} lg={4} key={user.id}>
                <UserCard
                  user={user}
                  monthlyRents={monthlyRents}
                  monthlyBills={monthlyBills}
                  handleOpenDialog={handleOpenDialog}
                  handleDeleteUser={handleDeleteUser}
                  handleOpenRentDialog={handleOpenRentDialog}
                  handleOpenBillDialog={handleOpenBillDialog}
                  handleDeleteRent={handleDeleteRent}
                  handleDeleteBill={handleDeleteBill}
                  theme={theme}
                  months={months}
                  years={years}
                  getTransactionTypeLabel={getTransactionTypeLabel}
                  getTransactionIcon={getTransactionIcon}
                  calculateRemainingBalance={calculateRemainingBalance}
                  getStatusColor={getStatusColor}
                  currentUser={currentUser}
                  updateRentEntry={updateRentEntry}
                  updateBillEntry={updateBillEntry}
                  onShareClick={handleShareClick} // Yeh line add karein
                />
              </Grid>
            ))}
          </Grid>
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

                <Grid item xs={12}>
                  <Box sx={{ mt: 2, mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Profile Picture
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        src={imagePreview}
                        sx={{
                          width: 80,
                          height: 80,
                          border: '2px solid',
                          borderColor: 'primary.main'
                        }}
                      >
                        <PhotoCamera />
                      </Avatar>

                      <Box>
                        <input
                          accept="image/*"
                          style={{ display: 'none' }}
                          id="profile-picture-upload"
                          type="file"
                          onChange={handleImageSelect}
                        />
                        <label htmlFor="profile-picture-upload">
                          <Button
                            variant="outlined"
                            component="span"
                            startIcon={<CloudUpload />}
                            disabled={uploadingImage}
                            sx={{ mb: 1 }}
                          >
                            {uploadingImage ? 'Uploading...' : 'Upload Photo'}
                          </Button>
                        </label>
                        <Typography variant="caption" display="block" color="text.secondary">
                          Max size: 5MB. Supported formats: JPG, PNG, GIF
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ mt: 2, mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      NIC Documents (Front & Back)
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" gutterBottom>
                          NIC Front Side
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            src={nicFrontPreview || (editingUser?.nicDocuments?.front?.url)}
                            sx={{
                              width: 120,
                              height: 80,
                              border: '2px solid',
                              borderColor: 'primary.main'
                            }}
                            variant="rounded"
                          >
                            <PhotoCamera />
                          </Avatar>
                          <Box>
                            <input
                              accept="image/*"
                              style={{ display: 'none' }}
                              id="nic-front-upload"
                              type="file"
                              onChange={handleNicFrontSelect}
                            />
                            <label htmlFor="nic-front-upload">
                              <Button
                                variant="outlined"
                                component="span"
                                startIcon={<CloudUpload />}
                                disabled={uploadingNic}
                                size="small"
                              >
                                {uploadingNic ? 'Uploading...' : 'NIC Front'}
                              </Button>
                            </label>
                          </Box>
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" gutterBottom>
                          NIC Back Side
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            src={nicBackPreview || (editingUser?.nicDocuments?.back?.url)}
                            sx={{
                              width: 120,
                              height: 80,
                              border: '2px solid',
                              borderColor: 'primary.main'
                            }}
                            variant="rounded"
                          >
                            <PhotoCamera />
                          </Avatar>
                          <Box>
                            <input
                              accept="image/*"
                              style={{ display: 'none' }}
                              id="nic-back-upload"
                              type="file"
                              onChange={handleNicBackSelect}
                            />
                            <label htmlFor="nic-back-upload">
                              <Button
                                variant="outlined"
                                component="span"
                                startIcon={<CloudUpload />}
                                disabled={uploadingNic}
                                size="small"
                              >
                                {uploadingNic ? 'Uploading...' : 'NIC Back'}
                              </Button>
                            </label>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                      Upload both sides of National Identity Card. Max size: 5MB each.
                    </Typography>
                  </Box>
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
                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
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
            <Button onClick={handleCloseDialog} variant="outlined" sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              sx={{ borderRadius: 2 }}
              disabled={
                !formData.firstName ||
                !formData.lastName ||
                !formData.email ||
                (!editingUser && !formData.password) ||
                !formData.rentStartDate ||
                !formData.rentEndDate
              }
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
                      onChange={(e) => setRentFormData({ ...rentFormData, status: e.target.value })}
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
            <Button onClick={handleCloseRentDialog} variant="outlined" sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
            <Button onClick={handleRentSubmit} variant="contained" sx={{ borderRadius: 2 }}>
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
                      onChange={(e) => setBillFormData({ ...billFormData, status: e.target.value })}
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
            <Button onClick={handleCloseBillDialog} variant="outlined" sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
            <Button onClick={handleBillSubmit} variant="contained" sx={{ borderRadius: 2 }}>
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
            onClick={() => handleOpenDialog()}
          >
            <AddIcon />
          </Fab>
        )}
      </Container>
    </>
  );
}