# Rental Management System

A comprehensive rental management system built with React, Material-UI, and Firebase. The system features two user panels: Admin and User, with role-based access control and authentication.

## Features

### Admin Panel
- **User Management**: Add, update, and delete users
- **Dashboard Overview**: View total users, monthly rent, and balances
- **User Statistics**: Monitor user data and financial information
- **Role Management**: Assign admin or user roles

### User Panel
- **Profile Management**: Edit personal information
- **Rent Information**: View monthly rent and current balance
- **Payment History**: Track rent payment history
- **Balance Monitoring**: Monitor outstanding balances

### Authentication
- **Firebase Authentication**: Secure user login and registration
- **Role-based Access**: Different dashboards for admin and user roles
- **Protected Routes**: Secure access to dashboard features

## Technology Stack

- **Frontend**: React 18 with Material-UI
- **Backend**: Google Firebase (Authentication & Firestore)
- **Routing**: React Router DOM
- **State Management**: React Context API

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Firebase account

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rental-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Setup**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Get your Firebase configuration

4. **Configure Firebase**
   - Open `src/firebase/config.js`
   - Replace the placeholder configuration with your actual Firebase config:
   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project-id.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project-id.appspot.com",
     messagingSenderId: "your-messaging-sender-id",
     appId: "your-app-id"
   };
   ```

5. **Start the development server**
   ```bash
   npm start
   ```

The application will open at `http://localhost:3000`

## Usage

### First Time Setup
1. Navigate to the signup page
2. Create an admin account by selecting "Admin" role
3. Create additional user accounts as needed

### Admin Features
- **Dashboard**: View system overview and statistics
- **User Management**: 
  - View all users in a table format
  - Edit user information (name, role, rent, balance)
  - Delete users (except yourself)
- **Financial Overview**: Monitor total monthly rent and balances

### User Features
- **Profile**: Edit personal information (first name, last name)
- **Rent Information**: View monthly rent amount and current balance
- **Payment History**: View past rent payments and status

## Project Structure

```
src/
├── components/
│   ├── AdminDashboard.js    # Admin panel with user management
│   ├── UserDashboard.js     # User panel with profile and rent info
│   ├── Dashboard.js         # Main dashboard router
│   ├── Login.js            # Login component
│   ├── Signup.js           # Registration component
│   └── PrivateRoute.js     # Protected route wrapper
├── contexts/
│   └── AuthContext.js      # Authentication context
├── firebase/
│   └── config.js           # Firebase configuration
├── App.js                  # Main application component
└── index.js               # Application entry point
```

## Firebase Collections

### Users Collection
```javascript
{
  firstName: string,
  lastName: string,
  email: string,
  role: 'admin' | 'user',
  createdAt: timestamp,
  monthlyRent: number,
  balance: number
}
```

## Security Rules

Make sure to set up proper Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init`
4. Deploy: `firebase deploy`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
