# Divine Matrimony Backend Setup Guide

## Prerequisites

- Node.js (v18+)
- MySQL (v8+)
- npm or yarn

## Installation Steps

### 1. Database Setup

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE divnematrimony CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Optionally create a dedicated database user
mysql -u root -p -e "CREATE USER 'divine'@'localhost' IDENTIFIED BY 'secure_password_123'; GRANT ALL PRIVILEGES ON divnematrimony.* TO 'divine'@'localhost'; FLUSH PRIVILEGES;"
```

### 2. Server Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file from template
cp .env.example .env

# Edit .env with your configuration
# Important: Update these values:
# - DB_USER (default: root)
# - DB_PASSWORD (your MySQL password)
# - DB_NAME (default: divnematrimony)
# - JWT_SECRET (generate a strong 32+ character secret)
# - JWT_REFRESH_SECRET (generate a strong 32+ character secret)
```

### 3. Environment Configuration

Edit `.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=divine
DB_PASSWORD=secure_password_123
DB_NAME=divnematrimony

# JWT (Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your_generated_secret_here_min_32_chars
JWT_REFRESH_SECRET=your_generated_refresh_secret_min_32_chars

# Server
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Security
BCRYPT_ROUNDS=10
```

### 4. Run Migrations

```bash
# Run database migrations
npm run migrate

# This will:
# - Create all necessary tables
# - Set up indexes
# - Initialize the schema
```

### 5. Start Server

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start

# You should see:
# ✅ Server started successfully on port 5000
# 📍 API Base URL: http://localhost:5000/api/v1
```

## API Endpoints

### Authentication

```
POST   /api/v1/auth/register        - Register new user
POST   /api/v1/auth/login           - Login user
POST   /api/v1/auth/refresh-token   - Refresh access token
POST   /api/v1/auth/logout          - Logout user
GET    /api/v1/auth/me              - Get current user (Protected)
```

### Profiles

```
POST   /api/v1/profiles             - Create profile (Protected)
PUT    /api/v1/profiles             - Update profile (Protected)
GET    /api/v1/profiles/me           - Get own profile (Protected)
GET    /api/v1/profiles/:id          - Get profile by ID
GET    /api/v1/profiles/search       - Search profiles (with filters)
```

### Connections

```
GET    /api/v1/connections          - Get all connections (Protected)
POST   /api/v1/connections/send     - Send connection request (Protected)
PUT    /api/v1/connections/:id/accept - Accept connection (Protected)
PUT    /api/v1/connections/:id/reject - Reject connection (Protected)
```

## Testing Endpoints

### 1. Register User

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "mobileNumber": "+919876543210",
    "password": "SecurePass123!",
    "gender": "male",
    "role": "self"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### 3. Create Profile (with token from login response)

```bash
curl -X POST http://localhost:5000/api/v1/profiles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "age": 28,
    "height": "5'\''10\"",
    "education": "B.Tech",
    "occupation": "Software Engineer",
    "location": "Chennai",
    "religion": "Hindu",
    "caste": "Iyer",
    "raasi": "Mesha",
    "nakshatra": "Aswini"
  }'
```

### 4. Search Profiles

```bash
curl "http://localhost:5000/api/v1/profiles/search?minAge=25&maxAge=35&religion=Hindu&location=Chennai"
```

## Security Features Implemented

✅ **Authentication**

- JWT-based authentication
- Refresh token mechanism
- Secure token storage in database

✅ **Password Security**

- Bcrypt hashing (10 rounds)
- Strong password validation (8+ chars, uppercase, lowercase, numbers, special chars)

✅ **API Security**

- CORS protection
- Helmet.js security headers
- Rate limiting on all endpoints
- Request validation

✅ **Database Security**

- SQL injection prevention (parameterized queries)
- UNIQUE constraints on sensitive fields
- Timestamps for audit trails
- Foreign key constraints

✅ **Infrastructure**

- Environment-based configuration
- Error handling and logging
- Graceful shutdown
- Database connection pooling

## Troubleshooting

### Database Connection Failed

```
Error: ECONNREFUSED 127.0.0.1:3306
```

- Ensure MySQL is running
- Check DB_HOST and DB_PORT in .env
- Verify DB_USER and DB_PASSWORD

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::5000
```

- Change PORT in .env
- Or kill process: `lsof -i :5000` then `kill -9 <PID>`

### Migration Fails

```
Error: Table already exists
```

- Migrations are idempotent (can be run multiple times)
- Check database logs for specific errors

### JWT Secret Error

```
Error: JWT_SECRET not found or too short
```

- Generate new secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Update .env with the generated secret

## Project Structure

```
server/
├── src/
│   ├── index.js                 # Main server file
│   ├── config/
│   │   └── database.js          # Database connection & pooling
│   ├── controllers/
│   │   ├── authController.js    # Auth logic
│   │   └── profileController.js # Profile logic
│   ├── routes/
│   │   ├── authRoutes.js        # Auth endpoints
│   │   ├── profileRoutes.js     # Profile endpoints
│   │   └── connectionRoutes.js  # Connection endpoints
│   ├── middleware/
│   │   ├── auth.js              # JWT & RBAC
│   │   └── rateLimiter.js       # Rate limiting
│   └── utils/
│       ├── tokenManager.js      # JWT operations
│       ├── passwordUtils.js     # Hashing & validation
│       └── validators.js        # Data validation
├── migrations/
│   └── run.js                   # Database migrations
├── package.json
├── .env.example
└── README.md (this file)
```

## Next Steps

1. **Frontend Integration**: Update frontend to use backend APIs
2. **Email Verification**: Implement OTP via email
3. **Admin Dashboard**: Add admin endpoints
4. **Payments**: Integrate Razorpay/Stripe
5. **File Upload**: Implement document upload with AWS S3
6. **Testing**: Add unit and integration tests
7. **Deployment**: Deploy to production (AWS, Heroku, etc.)

## Support

For issues or questions, refer to:

- API documentation at `/docs`
- Database logs in the console
- Application logs (implement Winston/Morgan)

---

**Happy Matching! 💒**
