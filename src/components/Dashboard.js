import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AdminDashboard from './AdminDashboard';
import UserDashboard from './UserDashboard';
import { CircularProgress, Box, Container } from '@mui/material';

export default function Dashboard() {
  const { currentUser, userRole } = useAuth();

  if (!currentUser) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Render appropriate dashboard based on user role
  if (userRole === 'admin') {
    return <AdminDashboard />;
  } else {
    return <UserDashboard />;
  }
}
