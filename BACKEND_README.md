# Lithuanian Transaction Verification System

A Node.js application that helps students in Lithuania verify the reliability of phone numbers used in peer-to-peer transactions on Mallus. The system prevents scams by allowing users to query transaction reliability, rate users, and enabling admin verification of phone numbers.

## Features

- **Phone Number Queries**: Check reliability and transaction history of any phone number
- **Rating System**: Rate transactions by timeliness and reliability
- **Admin Token System**: Only verified admin tokens can add ratings (prevents spam)
- **Admin Verification**: Admin must verify new phone numbers to prevent social engineering
- **JWT Authentication**: Secure admin panel access
- **Rate Limiting**: Protect API from abuse

## Tech Stack

- **Node.js** + Express - Backend framework
- **MongoDB** - NoSQL database
- **JWT** - Authentication
- **Helmet** - Security middleware
- **CORS** - Cross-origin support

## Prerequisites

- Node.js (v14+)
- MongoDB (local or cloud)
- npm

## Installation

1. **Clone repository**

   ```bash
   cd /Users/rocketman/Desktop/LT_Transfer_Verify
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Setup MongoDB**
   - Local: Install MongoDB and start it (`brew services start mongodb-community`)
   - Cloud: Use MongoDB Atlas and update `MONGODB_URI` in `.env`

4. **Environment Variables**
   Edit `.env` file:

   ```env
   MONGODB_URI=mongodb://localhost:27017/lt-transaction-verify
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   NODE_ENV=development
   PORT=3000
   ```

5. **Create Admin User** (run in Node REPL or create a setup script)

   ```javascript
   const mongoose = require("mongoose");
   const Admin = require("./src/models/Admin");

   mongoose.connect("mongodb://localhost:27017/lt-transaction-verify");

   const admin = new Admin({
     username: "admin",
     email: "admin@example.com",
     password: "securepassword123",
     role: "super_admin",
   });

   admin
     .save()
     .then(() => console.log("Admin created"))
     .catch((err) => console.error(err));
   ```

## Running the App

**Development mode** (with auto-reload):

```bash
npm run dev
```

**Production mode**:

```bash
npm start
```

Server will start at `http://localhost:3000`

## API Documentation

### 1. Phone Number Management

#### Query Phone Number

```bash
GET /api/phone/query?phoneNumber=+37060123456
```

Response:

```json
{
  "phoneNumber": "+37060123456",
  "ownerName": "John Doe",
  "verified": true,
  "status": "verified",
  "averageReliability": 4.5,
  "averageTimeliness": 4.8,
  "totalRatings": 12,
  "totalTransactions": 15,
  "verificationDate": "2024-01-15",
  "recentRatings": [
    {
      "reliability": 5,
      "timeliness": 5,
      "comment": "Fast and reliable",
      "ratedAt": "2024-01-20"
    }
  ]
}
```

#### Request Phone Number Verification

```bash
POST /api/phone/request-verification
Content-Type: application/json

{
  "phoneNumber": "+37060123456",
  "ownerName": "John Doe",
  "email": "john@example.com",
  "description": "I want to be verified for transactions"
}
```

Response:

```json
{
  "message": "Verification request submitted. Admin will review it.",
  "requestId": "507f1f77bcf86cd799439011"
}
```

### 2. Ratings

#### Add Rating (requires admin token)

```bash
POST /api/rating/add
Content-Type: application/json

{
  "phoneNumber": "+37060123456",
  "ratedByPhoneNumber": "+37060999999",
  "reliabilityRating": 5,
  "timelinessRating": 4,
  "transactionAmount": 50,
  "comment": "Great experience",
  "token": "admin_token_here"
}
```

Response:

```json
{
  "message": "Rating added successfully",
  "rating": {
    "reliabilityRating": 5,
    "timelinessRating": 4,
    "comment": "Great experience",
    "timestamp": "2024-01-20T10:30:00Z"
  },
  "phoneAverages": {
    "reliability": 4.5,
    "timeliness": 4.8
  }
}
```

### 3. Admin Operations

#### Admin Login

```bash
POST /api/admin/login
Content-Type: application/json

{
  "username": "admin",
  "password": "securepassword123"
}
```

Response:

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "admin": {
    "id": "507f1f77bcf86cd799439010",
    "username": "admin",
    "email": "admin@example.com",
    "role": "super_admin"
  }
}
```

#### Generate Admin Tokens

```bash
POST /api/admin/generate-token
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "quantity": 10,
  "purpose": "rating"
}
```

Response:

```json
{
  "message": "10 token(s) generated successfully",
  "tokens": ["abc123def456...", "xyz789uvw012..."],
  "expiresAt": "2024-02-20"
}
```

#### Get Pending Verifications

```bash
GET /api/admin/pending-verifications
Authorization: Bearer <jwt_token>
```

Response:

```json
{
  "count": 3,
  "requests": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "phoneNumber": "+37060123456",
      "ownerName": "Jane Doe",
      "email": "jane@example.com",
      "status": "pending",
      "createdAt": "2024-01-18"
    }
  ]
}
```

#### Approve Verification Request

```bash
POST /api/admin/approve-verification
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "requestId": "507f1f77bcf86cd799439012",
  "generateTokens": true
}
```

#### Reject Verification Request

```bash
POST /api/admin/reject-verification
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "requestId": "507f1f77bcf86cd799439012",
  "reason": "Insufficient documentation"
}
```

## Project Structure

```
src/
├── config/
│   ├── database.js       # MongoDB connection
├── models/
│   ├── Admin.js          # Admin user model
│   ├── PhoneNumber.js    # Phone number record
│   ├── Rating.js         # Transaction ratings
│   ├── AdminToken.js     # Admin-generated tokens
│   └── VerificationRequest.js  # Verification requests
├── middleware/
│   ├── auth.js           # JWT authentication
│   └── tokenValidation.js # Admin token validation
├── controllers/
│   ├── phoneController.js    # Phone query & registration
│   ├── ratingController.js   # Rating management
│   └── adminController.js    # Admin operations
├── routes/
│   ├── phoneRoutes.js    # Phone endpoints
│   ├── ratingRoutes.js   # Rating endpoints
│   └── adminRoutes.js    # Admin endpoints
└── server.js             # Express app & server setup
```

## Security Features

- **JWT Authentication** for admin operations
- **Password Hashing** with bcryptjs (admin passwords)
- **Token Hashing** - admin tokens stored as SHA256 hashes
- **Rate Limiting** - 100 requests per 15 minutes per IP
- **CORS Protection** - configurable origins
- **Helmet** - HTTP security headers
- **Social Engineering Prevention** - admin verification required to add phone numbers

## Future Enhancements

- [ ] Email notifications for admins
- [ ] SMS/email verification for phone number registration
- [ ] User reputation system
- [ ] Fraud detection algorithms
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Mobile app
- [ ] Integration with Mallus API

## Contributing

Please follow the existing code style and add tests for new features.

## License

MIT
