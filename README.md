# 🌙 Cosmic Astrology - Node.js Backend

Complete Node.js + Express.js backend for the Cosmic Astrology website with PostgreSQL database, REST API, file uploads, email notifications, and OpenAI chatbot integration.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)

## ✨ Features

- ✅ **Admin Authentication** - Secure admin login system
- ✅ **Content Management** - Full CRUD operations for all website content
- ✅ **Image Upload** - Multer-based file upload with validation
- ✅ **Email Notifications** - Nodemailer integration for bookings and contact forms
- ✅ **OpenAI Chatbot** - AI-powered customer support chatbot
- ✅ **PostgreSQL Database** - Robust data storage and management
- ✅ **REST API** - Complete RESTful API for all operations
- ✅ **Security** - Helmet.js security headers and CORS configuration
- ✅ **Compression** - Response compression for better performance

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **File Upload**: Multer
- **Email**: Nodemailer
- **AI**: OpenAI GPT-4
- **Security**: Helmet, CORS
- **Authentication**: bcryptjs

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** or **yarn** (comes with Node.js)

## 🚀 Installation

1. **Install Node.js dependencies**:
   ```powershell
   npm install
   ```

2. **Verify installation**:
   ```powershell
   node --version
   npm --version
   ```

## ⚙️ Configuration

1. **Copy the environment example file**:
   ```powershell
   Copy-Item .env.example .env
   ```

2. **Edit the `.env` file** and configure your settings:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=astrology_db
   DB_USER=postgres
   DB_PASSWORD=your_database_password

   # Admin Password
   ADMIN_PASSWORD=your_secure_admin_password

   # Email Configuration (Gmail example)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_gmail_app_password
   EMAIL_FROM=Cosmic Astrology <your_email@gmail.com>
   CONTACT_NOTIFICATION_EMAIL=admin@cosmicastrology.com
   BOOKING_NOTIFICATION_EMAIL=bookings@cosmicastrology.com

   # OpenAI Configuration
   OPENAI_API_KEY=sk-your-openai-api-key-here
   OPENAI_MODEL=gpt-4
   OPENAI_MAX_TOKENS=500

   # Server Configuration
   PORT=3000
   NODE_ENV=development
   CORS_ORIGIN=*
   ```

### 📧 Gmail Setup (for Email Notifications)

To use Gmail for sending emails:

1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password:
   - Go to Security → 2-Step Verification → App passwords
   - Select "Mail" and your device
   - Copy the generated 16-character password
4. Use this app password in `EMAIL_PASSWORD`

## 🗄️ Database Setup

1. **Install PostgreSQL** if not already installed

2. **Create the database**:
   ```powershell
   # Open PostgreSQL command line
   psql -U postgres

   # Create database
   CREATE DATABASE astrology_db;

   # Exit psql
   \q
   ```

3. **Tables will be created automatically** when you first start the server. The application includes automatic database initialization.

### Database Tables Created:

- `hero_slides` - Homepage hero slider content
- `gallery_slides` - Gallery images and videos
- `bookings` - Customer booking appointments
- `contact_messages` - Contact form submissions
- `business_info` - Business information and settings
- `chatbot_config` - Chatbot configuration
- `about_section` - About section content
- `navbar_settings` - Navbar configuration
- `menu_items` - Navigation menu items
- `announcements` - Website announcements
- `astrological_services` - Astrology services
- `pooja_services` - Pooja services
- `expert_solutions` - Expert solutions

## 🏃 Running the Application

### Development Mode (with auto-reload):
```powershell
npm run dev
```

### Production Mode:
```powershell
npm start
```

The server will start on `http://localhost:3000`

You'll see:
```
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🌙 Cosmic Astrology Backend Server                 ║
║                                                       ║
║   Status: Running                                     ║
║   Port: 3000                                          ║
║   Environment: development                            ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

## 📡 API Documentation

### Authentication

#### Admin Login
```http
POST /api/admin/login
Content-Type: application/json

{
  "password": "admin_password"
}
```

### Content Management

#### Hero Slides
- `GET /api/hero-slides` - Get all hero slides
- `POST /api/hero-slides` - Add new hero slide
- `PUT /api/hero-slides/:id` - Update hero slide
- `DELETE /api/hero-slides/:id` - Delete hero slide

#### Gallery
- `GET /api/gallery-slides` - Get all gallery items
- `POST /api/gallery-slides` - Add gallery item
- `DELETE /api/gallery-slides/:id` - Delete gallery item

#### Business Info
- `GET /api/business-info` - Get business information
- `POST /api/business-info` - Update business information

#### Services
- `GET /api/astrological-services` - Get all astrological services
- `POST /api/astrological-services` - Update astrological services (bulk)
- `GET /api/pooja-services` - Get all pooja services
- `POST /api/pooja-services` - Update pooja services (bulk)
- `GET /api/expert-solutions` - Get all expert solutions
- `POST /api/expert-solutions` - Update expert solutions (bulk)

#### Menu & Navigation
- `GET /api/navbar-settings` - Get navbar settings
- `POST /api/navbar-settings` - Update navbar settings
- `GET /api/menu-items` - Get menu items
- `POST /api/menu-items` - Update menu items (bulk)

#### Announcements
- `GET /api/announcements` - Get active announcements
- `POST /api/announcements` - Update announcements (bulk)

#### About Section
- `GET /api/about-section` - Get about section content
- `POST /api/about-section` - Update about section

### Bookings & Messages

#### Bookings
- `GET /api/bookings` - Get all bookings
- `POST /api/bookings` - Create new booking (sends email)
- `PUT /api/bookings/:id` - Update booking status
- `DELETE /api/bookings/:id` - Delete booking

#### Contact Messages
- `GET /api/contact-messages` - Get all contact messages
- `POST /api/contact-messages` - Submit contact form (sends email)
- `PUT /api/contact-messages/:id` - Mark as read
- `DELETE /api/contact-messages/:id` - Delete message

### File Upload

#### Upload Image
```http
POST /api/upload
Content-Type: multipart/form-data

file: [image file]
```

Response:
```json
{
  "success": true,
  "url": "/uploads/filename-123456.jpg",
  "filename": "filename-123456.jpg"
}
```

#### Upload Multiple Images
```http
POST /api/upload-multiple
Content-Type: multipart/form-data

files: [multiple image files]
```

#### Delete Uploaded File
```http
DELETE /api/upload/:filename
```

#### List Uploaded Files
```http
GET /api/uploads
```

### Chatbot

#### Send Message to Chatbot
```http
POST /api/chatbot
Content-Type: application/json

{
  "message": "What services do you offer?",
  "conversation_history": [
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi! How can I help?"}
  ]
}
```

#### Test Chatbot Configuration
```http
GET /api/chatbot/test
```

#### Chatbot Configuration
- `GET /api/chatbot-config` - Get chatbot configuration
- `POST /api/chatbot-config` - Update chatbot configuration

### Health Check
```http
GET /health
```

## 📁 Project Structure

```
Astrology/
├── config/
│   └── database.js           # Database configuration and initialization
├── routes/
│   ├── admin.js              # Admin authentication routes
│   ├── booking.js            # Booking and contact routes
│   ├── chatbot.js            # OpenAI chatbot integration
│   ├── content.js            # Content management routes
│   └── upload.js             # File upload routes
├── static/
│   ├── assets/               # Static assets (images, videos)
│   ├── styles/               # CSS files
│   └── uploads/              # User uploaded files
├── templates/
│   ├── index.html            # Homepage
│   ├── admin.html            # Admin dashboard
│   ├── contact.html          # Contact page
│   └── privacy.html          # Privacy policy
├── .env                      # Environment variables (create from .env.example)
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
├── package.json              # Node.js dependencies
├── server.js                 # Main application entry point
└── README.md                 # This file
```

## 🔐 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `astrology_db` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `your_password` |
| `ADMIN_PASSWORD` | Admin login password | `secure_password` |
| `EMAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USER` | Email address | `your@email.com` |
| `EMAIL_PASSWORD` | Email password/app password | `app_password` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `CORS_ORIGIN` | CORS origin | `*` |
| `MAX_FILE_SIZE` | Max upload size (bytes) | `5242880` (5MB) |
| `OPENAI_MODEL` | OpenAI model | `gpt-4` |
| `OPENAI_MAX_TOKENS` | Max response tokens | `500` |

## 🔧 Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database `astrology_db` exists

### Email Not Sending
- Verify Gmail app password is correct
- Check SMTP settings
- Enable "Less secure app access" if using regular password (not recommended)

### File Upload Errors
- Check `static/uploads/` directory exists and is writable
- Verify `MAX_FILE_SIZE` in `.env`
- Ensure file types are allowed (images only)

### Chatbot Not Working
- Verify `OPENAI_API_KEY` is set correctly
- Check OpenAI account has credits
- Test with `/api/chatbot/test` endpoint

## 📝 Scripts

```powershell
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Check Node.js version
node --version

# Check npm version
npm --version
```

## 🔒 Security Notes

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Change default admin password** immediately after setup
3. **Use strong passwords** for database and admin access
4. **Enable HTTPS** in production
5. **Set specific CORS_ORIGIN** in production (not `*`)
6. **Keep dependencies updated**: `npm audit` and `npm update`

## 📞 Support

For issues or questions:
- Check the troubleshooting section above
- Review API documentation
- Verify environment variables are set correctly
- Check server logs for error messages

## 📄 License

This project is proprietary software for Cosmic Astrology.

---

Made with 🌙 by Cosmic Astrology Team
