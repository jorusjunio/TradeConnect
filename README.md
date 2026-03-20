# TradeConnect - Social Trading Platform

A full-stack social platform designed for traders to connect, share trades, strategies, and market insights.

## 📋 Project Overview

TradeConnect is a niche social network tailored for traders where users can:
- Share trading strategies and market insights
- Follow other traders and build a network
- Post trades with charts and analysis
- Engage through comments and likes
- Set up trade alerts (optional feature)

## 🛠 Tech Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla JS)
- **Backend**: Node.js + Express.js
- **Database**: MySQL / TiDB Cloud
- **Authentication**: JWT + Google OAuth 2.0
- **Hosting**: Render
- **Domain**: Namecheap

## 📁 Project Structure

```
tradeconnect/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── posts.js
│   │   ├── users.js
│   │   ├── comments.js
│   │   ├── follows.js
│   │   └── alerts.js
│   ├── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── app.js
│   │   ├── auth.js
│   │   ├── feed.js
│   │   └── profile.js
│   ├── pages/
│   │   ├── index.html
│   │   ├── login.html
│   │   ├── register.html
│   │   ├── feed.html
│   │   ├── profile.html
│   │   └── explore.html
│   └── assets/
│       └── images/
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- TiDB Cloud account (free tier)
- Google Cloud Console account (for OAuth)

### Step 1: Setup TiDB Database

1. Sign up for TiDB Cloud: https://tidbcloud.com/
2. Create a new cluster (free tier)
3. Get your connection credentials
4. Run the `schema.sql` file to create tables

```bash
# Connect to your TiDB cluster and run:
mysql -h <your-host> -P 4000 -u <username> -p < schema.sql
```

### Step 2: Setup Google OAuth

1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Client Secret

### Step 3: Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from env-template.txt):
```env
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=your-tidb-host
DB_PORT=4000
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=tradeconnect
DB_SSL=true

# JWT Configuration
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRE=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

4. Start the server:
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

Server will run on http://localhost:5000

### Step 4: Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. For local development, use a simple HTTP server:
```bash
# Using Python
python -m http.server 3000

# OR using Node.js http-server (install globally first)
npm install -g http-server
http-server -p 3000
```

Frontend will be available at http://localhost:3000

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/verify` - Verify JWT token

### Users
- `GET /api/users` - Get all users / search
- `GET /api/users/:id` - Get user profile
- `GET /api/users/me/profile` - Get current user profile
- `PUT /api/users/me/profile` - Update profile
- `GET /api/users/:id/posts` - Get user's posts
- `GET /api/users/:id/followers` - Get user's followers
- `GET /api/users/:id/following` - Get users being followed

### Posts
- `GET /api/posts` - Get all posts
- `GET /api/posts/feed` - Get personalized feed (authenticated)
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create new post (authenticated)
- `PUT /api/posts/:id` - Update post (authenticated)
- `DELETE /api/posts/:id` - Delete post (authenticated)
- `POST /api/posts/:id/like` - Like/unlike post (authenticated)

### Comments
- `GET /api/comments/post/:postId` - Get comments for post
- `POST /api/comments` - Create comment (authenticated)
- `PUT /api/comments/:id` - Update comment (authenticated)
- `DELETE /api/comments/:id` - Delete comment (authenticated)

### Follows
- `POST /api/follows/:userId` - Follow user (authenticated)
- `DELETE /api/follows/:userId` - Unfollow user (authenticated)
- `GET /api/follows/check/:userId` - Check if following (authenticated)

### Trade Alerts (Optional)
- `GET /api/alerts` - Get all alerts
- `GET /api/alerts/me` - Get user's alerts (authenticated)
- `GET /api/alerts/:id` - Get single alert
- `POST /api/alerts` - Create alert (authenticated)
- `PUT /api/alerts/:id` - Update alert (authenticated)
- `DELETE /api/alerts/:id` - Delete alert (authenticated)

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📅 Development Timeline

### Day 1: Foundation & Authentication
- ✅ Setup project structure
- ✅ Initialize database and create tables
- ✅ Implement authentication (Register/Login)
- ✅ Setup Google OAuth
- ✅ Create JWT middleware
- ✅ Build basic UI (landing, login, register)

### Day 2: Core Features
- ⬜ CRUD operations for posts
- ⬜ Comment system
- ⬜ Like/unlike functionality
- ⬜ Follow/unfollow system
- ⬜ Build feed/timeline page
- ⬜ Create explore/search page
- ⬜ Build profile page
- ⬜ Create dashboard
- ⬜ Deploy to Render

### Day 3: Polish & Launch
- ⬜ Bug fixes and testing
- ⬜ UI polish and responsive design
- ⬜ Optional: Trade alerts feature
- ⬜ Domain setup (Namecheap)
- ⬜ Final testing
- ⬜ Go live! 🚀

## 🚢 Deployment to Render

### Backend Deployment

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure build settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Add environment variables from your `.env` file
5. Deploy!

### Frontend Deployment

1. Create a new Static Site on Render
2. Connect your frontend directory
3. Configure:
   - Build Command: (leave empty for static HTML)
   - Publish Directory: `frontend`
4. Deploy!

## 🌐 Domain Setup (Namecheap)

1. Purchase domain from Namecheap
2. In Render, add custom domain to your services
3. Update Namecheap DNS settings with Render's nameservers
4. Wait for DNS propagation (24-48 hours)

## 🔒 Security Best Practices

- ✅ Never commit `.env` file to Git
- ✅ Always hash passwords with bcrypt
- ✅ Validate and sanitize all user inputs
- ✅ Use HTTPS in production
- ✅ Implement rate limiting
- ✅ Use prepared statements for SQL queries
- ✅ Set secure HTTP headers

## 📚 Additional Resources

- [TiDB Cloud Documentation](https://docs.pingcap.com/tidbcloud/)
- [Express.js Guide](https://expressjs.com/)
- [JWT.io](https://jwt.io/)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [Render Deployment Guide](https://render.com/docs)

## 🤝 Contributing

This is a portfolio project. Feel free to fork and customize for your own use!

## 📄 License

MIT License

## 👨‍💻 Developer

Built with 💙 for the trading community

---

**Happy Trading! 📈**
