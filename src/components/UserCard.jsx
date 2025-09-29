import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Button,
  Tabs,
  Tab,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { serverTimestamp } from 'firebase/firestore';

function UserCard({
  user,
  monthlyRents,
  monthlyBills,
  handleOpenDialog,
  handleDeleteUser,
  handleOpenRentDialog,
  handleOpenBillDialog,
  handleDeleteRent,
  handleDeleteBill,
  theme,
  months,
  years,
  getTransactionTypeLabel,
  getTransactionIcon,
  calculateRemainingBalance,
  getStatusColor,
  currentUser,
  updateRentEntry,
  updateBillEntry,
}) {
  const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [cardTab, setCardTab] = useState(0);
  const [openReceiveDialog, setOpenReceiveDialog] = useState(false);
  const [receiveAmount, setReceiveAmount] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [entryType, setEntryType] = useState('');

  const userRents = monthlyRents.filter(
    (r) => r.userId === user.id && r.month === selectedMonth && r.year === selectedYear
  );
  const userBills = monthlyBills.filter(
    (b) => b.userId === user.id && b.month === selectedMonth && b.year === selectedYear
  );

  const totalRent = userRents.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const receivedRent = userRents.reduce((sum, r) => sum + (Number(r.receivedAmount) || 0), 0);
  const totalBill = userBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const paidBill = userBills.reduce((sum, b) => sum + (Number(b.paidAmount) || 0), 0);

  const total = totalRent + totalBill;
  const received = receivedRent + paidBill;
  const monthBalance = total - received;
  
  const calculatePreviousBalance = () => {
    const userTransactions = [
      ...monthlyRents.filter((r) => r.userId === user.id).map((r) => ({
        month: r.month,
        year: Number(r.year),
        type: 'rent',
        amount: Number(r.amount) || 0,
        receivedAmount: Number(r.receivedAmount) || 0,
      })),
      ...monthlyBills.filter((b) => b.userId === user.id).map((b) => ({
        month: b.month,
        year: Number(b.year),
        type: 'bill',
        amount: Number(b.amount) || 0,
        paidAmount: Number(b.paidAmount) || 0,
      })),
    ];

    if (userTransactions.length === 0) return 0;

    // Group by month-year
    const grouped = {};
    userTransactions.forEach((t) => {
      const key = `${t.month}-${t.year}`;
      if (!grouped[key]) {
        grouped[key] = {
          month: t.month,
          year: t.year,
          totalRent: 0,
          totalBills: 0,
          totalReceivedRent: 0,
          totalPaidBills: 0,
        };
      }
      if (t.type === 'rent') {
        grouped[key].totalRent += t.amount;
        grouped[key].totalReceivedRent += t.receivedAmount || 0;
      } else {
        grouped[key].totalBills += t.amount;
        grouped[key].totalPaidBills += t.paidAmount || 0;
      }
    });

    // Sort ascending by year, then month index
    const ordered = Object.values(grouped).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return months.indexOf(a.month) - months.indexOf(b.month);
    });

    // Build cumulative remaining balance by month
    const cumulativeByKey = {};
    let running = 0;
    ordered.forEach((m) => {
      const monthNet = m.totalRent + m.totalBills - (m.totalReceivedRent + m.totalPaidBills);
      running += monthNet;
      const key = `${m.month}-${m.year}`;
      cumulativeByKey[key] = running;
    });

    // Determine previous month-year of the selected filters
    const selectedMonthIndex = months.indexOf(selectedMonth);
    const selectedYearNum = Number(selectedYear);
    const prevMonth = selectedMonthIndex === 0 ? months[11] : months[selectedMonthIndex - 1];
    const prevYear = selectedMonthIndex === 0 ? selectedYearNum - 1 : selectedYearNum;
    const prevKey = `${prevMonth}-${prevYear}`;

    return cumulativeByKey[prevKey] || 0;
  };

  const previousBalance = calculatePreviousBalance();
  const currentBalance = previousBalance + monthBalance;

  const handleOpenReceiveDialog = (entry, type) => {
    setSelectedEntry(entry);
    setEntryType(type);
    setReceiveAmount('');
    setOpenReceiveDialog(true);
  };

  const handleCloseReceiveDialog = () => {
    setOpenReceiveDialog(false);
    setSelectedEntry(null);
    setEntryType('');
    setReceiveAmount('');
  };

  const handleAddReceivedAmount = async () => {
    if (!selectedEntry || !receiveAmount || isNaN(receiveAmount) || Number(receiveAmount) < 0) {
      return;
    }

    try {
      const amountToAdd = Number(receiveAmount);
      if (entryType === 'rent') {
        const newReceivedAmount = (Number(selectedEntry.receivedAmount) || 0) + amountToAdd;
        const updatedRent = {
          ...selectedEntry,
          receivedAmount: newReceivedAmount,
          status: newReceivedAmount >= Number(selectedEntry.amount) ? 'paid' : selectedEntry.status,
          paidDate: newReceivedAmount >= Number(selectedEntry.amount) ? new Date().toISOString().split('T')[0] : selectedEntry.paidDate,
          updatedAt: serverTimestamp(),
        };
        await updateRentEntry(updatedRent);
      } else if (entryType === 'bill') {
        const newPaidAmount = (Number(selectedEntry.paidAmount) || 0) + amountToAdd;
        const updatedBill = {
          ...selectedEntry,
          paidAmount: newPaidAmount,
          status: newPaidAmount >= Number(selectedEntry.amount) ? 'paid' : selectedEntry.status,
          paidDate: newPaidAmount >= Number(selectedEntry.amount) ? new Date().toISOString().split('T')[0] : selectedEntry.paidDate,
          updatedAt: serverTimestamp(),
        };
        await updateBillEntry(updatedBill);
      }
      handleCloseReceiveDialog();
    } catch (error) {
      console.error('Error adding received amount:', error);
    }
  };

  return (
    <Card elevation={3} sx={{ borderRadius: 3 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center">
            <Avatar 
              src={user.profilePicture?.url || user.profilePicture} 
              sx={{ mr: 2, bgcolor: 'primary.main' }}
            >
              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="600">
                {user.firstName} {user.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email} • {user.role}
              </Typography>
            </Box>
          </Box>
          <Box>
            <IconButton onClick={() => handleOpenDialog(user)} color="primary">
              <EditIcon />
            </IconButton>
            <IconButton
              onClick={() => handleDeleteUser(user.id)}
              disabled={user.id === currentUser.uid}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>Month</InputLabel>
              <Select
                value={selectedMonth}
                label="Month"
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {months.map((month) => (
                  <MenuItem key={month} value={month}>
                    {month}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>Year</InputLabel>
              <Select
                value={selectedYear}
                label="Year"
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {years.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" fontWeight="500">
            Total: Rs. {total.toLocaleString()}
          </Typography>
          
          <Typography variant="body1" color="success.main">
            Received/Paid: Rs. {received.toLocaleString()}
          </Typography>
         
          <Typography variant="body2" color="text.secondary">
            Previous balance: Rs. {previousBalance.toLocaleString()}
          </Typography>
          <Typography
            variant="body1"
            color={currentBalance > 0 ? 'error.main' : 'success.main'}
            fontWeight="500"
          >
            Balance: Rs. {currentBalance.toLocaleString()}
          </Typography>
        </Box>

        <Tabs
          value={cardTab}
          onChange={(_, newValue) => setCardTab(newValue)}
          variant="fullWidth"
        >
          <Tab label="Rent" />
          <Tab label="Bills" />
        </Tabs>

        {cardTab === 0 && (
          <Box sx={{ mt: 2 }}>
            {userRents.length > 0 ? (
              userRents.map((rent) => (
                <Paper key={rent.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography>Amount: Rs. {Number(rent.amount).toLocaleString()}</Typography>
                      <Typography>Received: Rs. {Number(rent.receivedAmount || 0).toLocaleString()}</Typography>
                      <Typography
                        color={calculateRemainingBalance(rent.amount, rent.receivedAmount) > 0 ? 'error.main' : 'success.main'}
                      >
                        Balance: Rs. {calculateRemainingBalance(rent.amount, rent.receivedAmount).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton onClick={() => handleOpenReceiveDialog(rent, 'rent')}>
                        <MoneyIcon />
                      </IconButton>
                      <IconButton onClick={() => handleOpenRentDialog(rent)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteRent(rent.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>
              ))
            ) : (
              <Typography color="text.secondary" sx={{ my: 2 }}>
                No rent entry for this month.
              </Typography>
            )}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              fullWidth
              onClick={() =>
                handleOpenRentDialog(null, {
                  userId: user.id,
                  userName: `${user.firstName} ${user.lastName}`,
                  month: selectedMonth,
                  year: selectedYear,
                  amount: user.monthlyRent || 0,
                })
              }
            >
              Add Rent Entry
            </Button>
          </Box>
        )}

        {cardTab === 1 && (
          <Box sx={{ mt: 2 }}>
            {userBills.length > 0 ? (
              userBills.map((bill) => (
                <Paper key={bill.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Box display="flex" alignItems="center" mb={1}>
                    {getTransactionIcon('bill', bill.type)}
                    <Typography sx={{ ml: 1 }} fontWeight="500">
                      {getTransactionTypeLabel('bill', bill.type)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography>Amount: Rs. {Number(bill.amount).toLocaleString()}</Typography>
                      <Typography>Paid: Rs. {Number(bill.paidAmount || 0).toLocaleString()}</Typography>
                      <Typography
                        color={calculateRemainingBalance(bill.amount, bill.paidAmount) > 0 ? 'error.main' : 'success.main'}
                      >
                        Balance: Rs. {calculateRemainingBalance(bill.amount, bill.paidAmount).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton onClick={() => handleOpenReceiveDialog(bill, 'bill')}>
                        <MoneyIcon />
                      </IconButton>
                      <IconButton onClick={() => handleOpenBillDialog(bill)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteBill(bill.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>
              ))
            ) : (
              <Typography color="text.secondary" sx={{ my: 2 }}>
                No bills for this month.
              </Typography>
            )}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              fullWidth
              onClick={() =>
                handleOpenBillDialog(null, {
                  userId: user.id,
                  userName: `${user.firstName} ${user.lastName}`,
                  month: selectedMonth,
                  year: selectedYear,
                })
              }
            >
              Add Bill Entry
            </Button>
          </Box>
        )}

        <Dialog
          open={openReceiveDialog}
          onClose={handleCloseReceiveDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle>
            <Typography variant="h6" fontWeight="600">
              Add Received Amount
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Enter the amount received for {entryType === 'rent' ? 'rent' : getTransactionTypeLabel('bill', selectedEntry?.type)} for {selectedEntry?.userName} ({selectedEntry?.month} {selectedEntry?.year})
              </Typography>
              <TextField
                fullWidth
                label="Received Amount"
                type="number"
                value={receiveAmount}
                onChange={(e) => setReceiveAmount(e.target.value)}
                margin="normal"
                variant="outlined"
                InputProps={{
                  startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                }}
                required
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={handleCloseReceiveDialog}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddReceivedAmount}
              variant="contained"
              sx={{ borderRadius: 2 }}
              disabled={!receiveAmount || Number(receiveAmount) < 0}
            >
              Add Amount
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default UserCard;