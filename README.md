# TradeConnect — Social Trading Platform

A full-stack social platform for traders to connect, share trades, strategies, and market insights.

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
TRADECONNECT/
├── Backend/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── alerts.js
│   │   ├── auth.js
│   │   ├── comments.js
│   │   ├── follows.js
│   │   ├── posts.js
│   │   └── users.js
│   ├── .env
│   ├── package.json
│   ├── package-lock.json
│   ├── schema.sql
│   └── server.js
├── Frontend/
│   ├── assets/
│   │   ├── logo.jpg
│   │   └── logo.svg
│   ├── css/
│   │   ├── CSS-GUIDE.md
│   │   ├── explore.css
│   │   ├── feed.css
│   │   ├── home.css
│   │   ├── login.css
│   │   ├── profile.css
│   │   └── register.css
│   ├── js/
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── config.js
│   │   ├── explore.js
│   │   ├── feed.js
│   │   ├── home.js
│   │   ├── profile.js
│   │   └── utils.js
│   └── pages/
│       ├── explore.html
│       ├── feed.html
│       ├── index.html
│       ├── login.html
│       ├── profile.html
│       └── register.html
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- TiDB Cloud account (free tier)
- Google Cloud Console account (for OAuth)

### Step 1: Setup TiDB Database

1. Sign up at https://tidbcloud.com/
2. Create a new cluster (free tier)
3. Get your connection credentials
4. Run the schema file to create tables:

```bash
mysql -h <your-host> -P 4000 -u <username> -p < Backend/schema.sql
```

### Step 2: Setup Google OAuth

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Client Secret

### Step 3: Backend Setup

```bash
cd Backend
npm install
```

Create a `.env` file inside `Backend/`:

```env
PORT=5000
NODE_ENV=development

# Database
DB_HOST=your-tidb-host
DB_PORT=4000
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=tradeconnect
DB_SSL=true

# JWT
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRE=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

Start the server:

```bash
npm run dev    # Development (auto-restart)
npm start      # Production
```

Server runs on http://localhost:5000

### Step 4: Frontend Setup

```bash
cd Frontend

# Using Python
python -m http.server 3000

# OR using Node.js
npm install -g http-server
http-server -p 3000
```

Frontend available at http://localhost:3000

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login user
- `POST /api/auth/google` — Google OAuth login
- `GET /api/auth/verify` — Verify JWT token

### Users
- `GET /api/users` — Get all users / search
- `GET /api/users/:id` — Get user profile
- `GET /api/users/me/profile` — Get current user profile
- `PUT /api/users/me/profile` — Update profile
- `GET /api/users/:id/posts` — Get user's posts
- `GET /api/users/:id/followers` — Get user's followers
- `GET /api/users/:id/following` — Get users being followed

### Posts
- `GET /api/posts` — Get all posts
- `GET /api/posts/feed` — Get personalized feed (auth required)
- `GET /api/posts/:id` — Get single post
- `POST /api/posts` — Create post (auth required)
- `PUT /api/posts/:id` — Update post (auth required)
- `DELETE /api/posts/:id` — Delete post (auth required)
- `POST /api/posts/:id/like` — Like/unlike post (auth required)

### Comments
- `GET /api/comments/post/:postId` — Get comments for post
- `POST /api/comments` — Create comment (auth required)
- `PUT /api/comments/:id` — Update comment (auth required)
- `DELETE /api/comments/:id` — Delete comment (auth required)

### Follows
- `POST /api/follows/:userId` — Follow user (auth required)
- `DELETE /api/follows/:userId` — Unfollow user (auth required)
- `GET /api/follows/check/:userId` — Check if following (auth required)

### Trade Alerts
- `GET /api/alerts` — Get all alerts
- `GET /api/alerts/me` — Get user's alerts (auth required)
- `GET /api/alerts/:id` — Get single alert
- `POST /api/alerts` — Create alert (auth required)
- `PUT /api/alerts/:id` — Update alert (auth required)
- `DELETE /api/alerts/:id` — Delete alert (auth required)

## 🔐 Authentication

JWT-based authentication. Include token in request headers:

```
Authorization: Bearer <your-jwt-token>
```

## 🚢 Deployment to Render

### Backend — Web Service

1. New Web Service → connect GitHub repo
2. Root Directory: `Backend`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add all `.env` variables under Environment
6. Deploy

### Frontend — Static Site

1. New Static Site → connect GitHub repo
2. Root Directory: `Frontend`
3. Build Command: *(leave empty)*
4. Publish Directory: `Frontend`
5. Deploy

## 🌐 Domain Setup (Namecheap)

1. Purchase domain from Namecheap
2. In Render, add custom domain to your services
3. Update Namecheap DNS with Render's nameservers
4. Wait 24–48 hours for DNS propagation

## 📅 Development Timeline

### Day 1 — Foundation & Auth ✅
- [x] Project structure setup
- [x] Database schema
- [x] Register / Login endpoints
- [x] Google OAuth
- [x] JWT middleware
- [x] Landing, login, register UI

### Day 2 — Core Features
- [ ] Posts CRUD
- [ ] Comment system
- [ ] Like / unlike
- [ ] Follow / unfollow
- [ ] Feed page
- [ ] Explore / search page
- [ ] Profile page
- [ ] Deploy to Render

### Day 3 — Polish & Launch
- [ ] Bug fixes and testing
- [ ] UI polish + responsive design
- [ ] Trade alerts feature
- [ ] Domain setup
- [ ] Go live 🚀

## 🔒 Security

- Never commit `.env` to Git
- Passwords hashed with bcrypt
- Input validation and sanitization
- HTTPS in production
- Rate limiting enabled
- Prepared statements for SQL
- Secure HTTP headers

## 📚 Resources

- [TiDB Cloud Docs](https://docs.pingcap.com/tidbcloud/)
- [Express.js Guide](https://expressjs.com/)
- [JWT.io](https://jwt.io/)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [Render Deployment Guide](https://render.com/docs)

## 📄 License

MIT License

## 👨‍💻 Developer

Built with 💙 for the trading community

---

**Happy Trading! 📈**
