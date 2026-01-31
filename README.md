# CampusVoice - School Service Request Voting Platform

A community-driven platform for students to voice their needs and prioritize service requests through a democratic voting system. Built for Hilcoe School, this platform enables students to submit service requests, vote on them, and engage in discussions to help the administration prioritize campus improvements.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Usage Guide](#usage-guide)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

CampusVoice is a full-stack web application that allows students to:
- Submit service requests with categories and media attachments
- Vote on requests to prioritize them
- Comment and discuss requests
- Filter and sort requests by category and popularity
- Share specific requests via deep links

The platform uses a voting system similar to Reddit, where requests with higher scores (upvotes - downvotes) appear at the top when sorted by popularity.

## ✨ Features

### Core Functionality
- **Request Creation**: Submit service requests with text content, category selection, and optional image/video attachments
- **Voting System**: Upvote or downvote requests to help prioritize them
- **Comments**: Engage in discussions by commenting on requests
- **Category Filtering**: Filter requests by category (Academic, Maintenance, Facility, IT, Other)
- **Sorting Options**: View requests sorted by "New" (most recent) or "Top" (highest votes)
- **Media Support**: Upload and display images/videos with requests
- **Deep Linking**: Share specific requests with unique URLs
- **Responsive Design**: Mobile-friendly interface with Bootstrap 5

### User Experience
- **Optimistic UI Updates**: Instant feedback for user actions
- **Client-side State Management**: Uses localStorage for user identification
- **Real-time Feed**: Dynamic rendering of requests, votes, and comments
- **Modern UI**: Clean, modern interface inspired by popular social platforms

## 🛠 Tech Stack

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Custom styling with CSS variables
- **JavaScript (ES6+)**: Vanilla JavaScript for client-side logic
- **Bootstrap 5**: UI framework and responsive grid system
- **Bootstrap Icons**: Icon library

### Backend
- **Node.js**: Runtime environment
- **Express.js 5.2.1**: Web application framework
- **Supabase**: Backend-as-a-Service (PostgreSQL database + Storage)
  - Database: PostgreSQL
  - Storage: File uploads (images/videos)
- **Multer 2.0.2**: File upload middleware
- **dotenv**: Environment variable management

### Deployment
- **Vercel**: Hosting platform
- **Vercel Analytics**: Usage analytics

## 📁 Project Structure

```
School-Service-Request-Voting-Platform/
├── api/
│   ├── index.js                 # Main Express server
│   └── supabase/
│       ├── supabaseClient.js    # Supabase client initialization
│       ├── supabase.js          # Database operations (CRUD)
│       └── databaseRoute.js     # API route definitions
├── Public/
│   ├── index.html               # Main HTML page
│   ├── script.js                # Frontend JavaScript logic
│   ├── styles.css               # Custom CSS styles
│   ├── bootstrap.min.css        # Bootstrap CSS
│   ├── bootstrap.bundle.min.js  # Bootstrap JavaScript
│   └── Icons/                   # Favicon and category icons
├── package.json                 # Dependencies and scripts
├── vercel.json                  # Vercel deployment configuration
└── README.md                    # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account and project
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd School-Service-Request-Voting-Platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_anon_key
   PORT=5000
   NODE_ENV=development
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Create the necessary tables (see [Database Schema](#database-schema))
   - Create a storage bucket named `Request_Img`
   - Configure storage bucket policies for public read access

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5000`

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_KEY` | Your Supabase anonymous/public key | Yes |
| `PORT` | Server port (default: 5000) | No |
| `NODE_ENV` | Environment mode (development/production) | No |

## 📡 API Endpoints

### Base URL
- Development: `http://localhost:5000`
- Production: Your Vercel deployment URL

### Endpoints

#### `GET /api/dbs/fetch`
Fetch all requests with votes and comments.

**Query Parameters:**
- `client_key` (optional): User's client key for personalized vote data

**Response:**
```json
[
  {
    "id": 1,
    "content": "Request description",
    "category": "Academic",
    "created_at": "2024-01-01T00:00:00Z",
    "photo_path": "https://...",
    "client_key": "user_abc123",
    "votes": {
      "up": 10,
      "down": 2,
      "score": 8,
      "userVote": 1
    },
    "comments": [
      {
        "id": 1,
        "text": "Comment text",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
]
```

#### `POST /api/dbs/upload`
Create a new service request.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `content` (string, required): Request description
- `category` (string, required): Category (Academic, Maintenance, Facility, IT, Other)
- `client_key` (string, required): User's client key
- `image` (file, optional): Image or video file (max 5MB)

**Response:**
```json
{
  "id": 1,
  "content": "Request description",
  "category": "Academic",
  "created_at": "2024-01-01T00:00:00Z",
  "photo_path": "https://...",
  "client_key": "user_abc123"
}
```

#### `POST /api/dbs/vote`
Vote on a request.

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "request_id": 1,
  "vote_type": 1,
  "client_key": "user_abc123"
}
```

**Vote Types:**
- `1`: Upvote
- `-1`: Downvote
- `0`: Remove vote

**Response:**
```json
{
  "success": true
}
```

#### `POST /api/dbs/comment`
Add a comment to a request.

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "request_id": 1,
  "content": "Comment text",
  "client_key": "user_abc123"
}
```

**Response:**
```json
{
  "comment": {
    "id": 1,
    "request_id": 1,
    "content": "Comment text",
    "created_at": "2024-01-01T00:00:00Z",
    "client_key": "user_abc123"
  }
}
```

#### `DELETE /api/dbs/requests/:id`
Delete a request (only by owner).

**Query Parameters:**
- `client_key` (required): User's client key

**Response:**
```json
{
  "success": true
}
```

## 🗄 Database Schema

### Tables

#### `requests`
Stores service requests submitted by users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL PRIMARY KEY | Unique request identifier |
| `content` | TEXT | Request description |
| `category` | VARCHAR | Category (Academic, Maintenance, Facility, IT, Other) |
| `client_key` | VARCHAR | User identifier |
| `photo_path` | TEXT | URL to uploaded image/video |
| `created_at` | TIMESTAMP | Creation timestamp |

#### `votes`
Stores user votes on requests.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL PRIMARY KEY | Unique vote identifier |
| `request_id` | INTEGER | Foreign key to requests.id |
| `client_key` | VARCHAR | User identifier |
| `vote_type` | INTEGER | 1 (upvote) or -1 (downvote) |
| `created_at` | TIMESTAMP | Vote timestamp |

**Unique Constraint:** `(request_id, client_key)` - One vote per user per request

#### `comments`
Stores comments on requests.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL PRIMARY KEY | Unique comment identifier |
| `request_id` | INTEGER | Foreign key to requests.id |
| `content` | TEXT | Comment text |
| `client_key` | VARCHAR | User identifier |
| `created_at` | TIMESTAMP | Comment timestamp |

### Views

#### `request_with_votes`
A database view that aggregates vote counts for each request.

**Columns:**
- All columns from `requests`
- `upvotes`: Count of upvotes
- `downvotes`: Count of downvotes
- `score`: upvotes - downvotes

### Storage

#### Bucket: `Request_Img`
Stores uploaded images and videos.

**Path Structure:** `requests/{timestamp}-{random}.{ext}`

**Policies:**
- Public read access
- Authenticated write access

### SQL Setup Script

```sql
-- Create requests table
CREATE TABLE requests (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  client_key VARCHAR(255) NOT NULL,
  photo_path TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create votes table
CREATE TABLE votes (
  id SERIAL PRIMARY KEY,
  request_id INTEGER REFERENCES requests(id) ON DELETE CASCADE,
  client_key VARCHAR(255) NOT NULL,
  vote_type INTEGER NOT NULL CHECK (vote_type IN (1, -1)),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(request_id, client_key)
);

-- Create comments table
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  request_id INTEGER REFERENCES requests(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  client_key VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create view for request with vote counts
CREATE VIEW request_with_votes AS
SELECT 
  r.*,
  COALESCE(SUM(CASE WHEN v.vote_type = 1 THEN 1 ELSE 0 END), 0) AS upvotes,
  COALESCE(SUM(CASE WHEN v.vote_type = -1 THEN 1 ELSE 0 END), 0) AS downvotes,
  COALESCE(SUM(v.vote_type), 0) AS score
FROM requests r
LEFT JOIN votes v ON r.id = v.request_id
GROUP BY r.id;
```

## 🚢 Deployment

### Vercel Deployment

1. **Install Vercel CLI** (optional)
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set Environment Variables**
   In Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add `SUPABASE_URL` and `SUPABASE_KEY`

4. **Configure vercel.json**
   The project includes a `vercel.json` configuration file that:
   - Builds the API serverless function from `api/index.js`
   - Serves static files from `Public/`
   - Routes all requests to the Express app

### Manual Deployment

1. Build the project (if needed)
   ```bash
   npm run build
   ```

2. Start the production server
   ```bash
   NODE_ENV=production npm start
   ```

## 📖 Usage Guide

### For Students

1. **Creating a Request**
   - Click "Create Request" or the input field
   - Select a category
   - Write your request description
   - Optionally attach an image/video
   - Click "Post"

2. **Voting**
   - Click the up arrow (↑) to upvote
   - Click the down arrow (↓) to downvote
   - Your vote is saved automatically

3. **Commenting**
   - Click "Comments" on any request
   - Type your comment
   - Click "Post"

4. **Filtering and Sorting**
   - Use the sidebar to filter by category
   - Toggle between "New" and "Top" sorting
   - Click "Home" to see all requests

5. **Sharing**
   - Click "Share" on any request
   - The link is copied to your clipboard
   - Share the link to direct others to the specific request

6. **Deleting Your Request**
   - Click the trash icon on your own requests
   - Confirm deletion

### For Administrators

- Monitor requests through the Supabase dashboard
- View vote counts to prioritize popular requests
- Access analytics through Vercel Analytics

## 💻 Development

### Scripts

- `npm run dev`: Start development server
- `npm start`: Start production server
- `npm run build`: Build script (placeholder)

### Code Structure

#### Frontend (`Public/script.js`)
- **State Management**: Global `requests` array, `clientKey` in localStorage
- **API Functions**: `fetchRequestsFromServer()`, `createRequestOnServer()`, etc.
- **Rendering**: `renderFeed()`, `createCardElement()`
- **Event Handlers**: Vote, comment, delete, form submission

#### Backend (`api/`)
- **Server Setup**: Express app with static file serving
- **Routes**: Modular route handlers in `databaseRoute.js`
- **Database Operations**: Supabase queries in `supabase.js`
- **File Upload**: Multer middleware for image handling

### Adding Features

1. **New API Endpoint**
   - Add route in `api/supabase/databaseRoute.js`
   - Implement handler in `api/supabase/supabase.js`
   - Update frontend in `Public/script.js`

2. **New Database Table**
   - Create table in Supabase
   - Add operations in `api/supabase/supabase.js`
   - Update API routes

3. **UI Changes**
   - Modify `Public/index.html` for structure
   - Update `Public/styles.css` for styling
   - Adjust `Public/script.js` for functionality

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Firaol Feyisa**

## 🙏 Acknowledgments

- Hilcoe School for the project opportunity
- Supabase for the backend infrastructure
- Bootstrap team for the UI framework
- Vercel for hosting platform

## 📞 Support

For issues, questions, or contributions, please open an issue on the repository.

---

**Note**: This is a final project for Web Technologies course at Hilcoe School. The platform is designed to facilitate communication between students and administration through a democratic voting system.
