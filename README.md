# Newstate Branding Co. - Proofing System

A comprehensive client proofing and approval system built with Next.js 14, featuring real-time collaboration, file management, annotation tools, and automated email notifications.

## 🚀 Features

### 🔐 Authentication & User Management
- **Admin Login System**: Secure authentication for administrators
- **Role-based Access Control**: Admin and Client user roles
- **Session Management**: JWT-based authentication with secure cookies

### 📁 Project Management
- **Project Creation**: Create new projects with detailed information
- **Project Editing**: Update project details, descriptions, and settings
- **File Upload**: Support for multiple file types (PDF, images, documents)
- **Project Archiving**: Archive completed or inactive projects
- **Activity Logging**: Track all project activities and changes

### 🔗 Client Sharing & Review
- **Share Links**: Generate secure, unique links for client access
- **Client Review Interface**: Clean, user-friendly interface for clients
- **Download Controls**: Enable/disable file downloads for clients

### ✏️ Annotation & Collaboration Tools
- **Drawing Canvas**: Interactive drawing tools for annotations
- **Comment System**: Add comments with drawing overlays
- **PDF Support**: Full PDF viewing and annotation capabilities
- **Real-time Updates**: Live collaboration using WebSocket connections
- **Position Tracking**: Precise annotation positioning on files

### ✅ Approval Workflow
- **Approval Process**: Streamlined client approval workflow
- **Digital Signatures**: Capture client signatures for approvals
- **Status Tracking**: Track approval status (Pending, Approved, Revision Requested)
- **Decision Management**: Record approval decisions with notes

### 📧 Email System
- **Automated Notifications**: Send emails for project updates, approvals, and comments
- **Email Queue**: Reliable email delivery with retry mechanisms
- **Template System**: Customizable email templates
- **SMTP Integration**: Professional email delivery
- **Email Health Monitoring**: Track email delivery status

### 🎨 Modern UI/UX
- **Responsive Design**: Mobile-first, responsive interface
- **Dark Theme**: Professional dark theme with customizable branding
- **Component Library**: Built with Radix UI and Tailwind CSS
- **Accessibility**: WCAG compliant components
- **Loading States**: Smooth loading animations and transitions

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **React Hook Form** - Form management
- **Socket.io Client** - Real-time communication

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Database management
- **PostgreSQL** - Primary database
- **JWT Authentication** - Secure token-based auth
- **Socket.io** - Real-time WebSocket server

### Database
- **PostgreSQL** - Primary database
- **Prisma** - Database ORM and migrations
- **Neon Database** - Cloud PostgreSQL hosting

### Email & File Management
- **Nodemailer** - Email delivery
- **File Upload** - Secure file handling
- **PDF.js** - PDF viewing and annotation
- **React Sketch Canvas** - Drawing capabilities

## 📋 Prerequisites

- Node.js 18+ 
- npm or pnpm
- PostgreSQL database
- SMTP email service

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Newstate-Proofing-System
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Environment Setup**
   Create a `.env.local` file with the following variables:
   ```env
   # Database
   DATABASE_URL="postgresql://neondb_owner:npg_ft6DHlhFMQU5@ep-raspy-night-ad4utwoj-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
   
   # JWT Secret
   JWT_SECRET="your-jwt-secret-key"
   
   # Email Configuration
   SMTP_HOST="your-smtp-host"
   SMTP_PORT=587
   SMTP_USER="your-email@domain.com"
   SMTP_PASS="your-email-password"
   SMTP_FROM="art@newstatebranding.com"
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev
   
   # Seed the database
   npm run db:seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Start Socket Server** (in a separate terminal)
   ```bash
   npm run socket
   ```

7. **Start Email Processor** (in a separate terminal)
   ```bash
   npm run email:processor
   ```

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard pages
│   ├── api/               # API routes
│   └── review/            # Client review pages
├── components/            # Reusable UI components
│   └── ui/               # Base UI components
├── contexts/             # React contexts
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and configurations
├── prisma/               # Database schema and migrations
├── public/               # Static assets
└── scripts/              # Utility scripts
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:seed` - Seed database with initial data
- `npm run db:reset` - Reset and seed database
- `npm run socket` - Start Socket.io server
- `npm run email:processor` - Start email processing service
- `npm run email:process` - Process pending emails manually

## 🗄️ Database Schema

### Core Models
- **User** - Admin and client users
- **Project** - Project information and settings
- **Review** - Client review sessions
- **DesignItem** - Individual design files
- **Comment** - Comments and annotations
- **Approval** - Client approval records
- **ActivityLog** - System activity tracking
- **EmailQueue** - Email delivery queue

### Key Relationships
- Projects have multiple Reviews
- Reviews contain multiple DesignItems
- DesignItems have Comments and Annotations
- Reviews track Approval status

## 🔐 Authentication Flow

1. **Admin Login**: Secure login with JWT tokens
2. **Session Management**: Persistent sessions with secure cookies
3. **Route Protection**: Middleware-based route protection
4. **Client Access**: Secure share links for client access

## 📧 Email System

### Email Types
- **Project Notifications**: New project creation alerts
- **Review Invitations**: Client review access links
- **Approval Notifications**: Status change notifications
- **Comment Alerts**: New comment notifications

### Email Queue Features
- **Reliable Delivery**: Retry mechanism for failed emails
- **Priority System**: Email priority management
- **Error Handling**: Comprehensive error tracking
- **Health Monitoring**: Email delivery status tracking

## 🎨 Customization

### Branding
- **Logo Management**: Upload and manage company logos
- **Color Themes**: Customizable color schemes
- **Site Settings**: Configurable site information

### Email Templates
- **HTML Templates**: Rich email templates
- **Custom Styling**: Branded email styling
- **Dynamic Content**: Personalized email content

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Environment Variables
Ensure all production environment variables are set:
- Database connection string
- JWT secret key
- SMTP configuration
- File upload settings

### Database Migration
```bash
npx prisma migrate deploy
```

## 📊 Monitoring & Analytics

### Activity Logging
- User actions tracking
- Project activity monitoring
- System performance metrics

### Email Health
- Delivery success rates
- Failed email tracking
- Queue performance monitoring

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive input sanitization
- **File Upload Security**: Secure file handling
- **CORS Protection**: Cross-origin request protection
- **SQL Injection Prevention**: Prisma ORM protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is proprietary software developed for Newstate Branding Co.

## 🆘 Support

For technical support or questions:
- Email: art@newstatebranding.com
- Documentation: Check the `/docs` folder
- Issues: Use the GitHub issues tracker

## 🔄 Updates & Maintenance

### Regular Maintenance
- Database optimization
- Email queue monitoring
- Security updates
- Performance monitoring

### Backup Strategy
- Database backups
- File storage backups
- Configuration backups

---

**Built with ❤️ for Newstate Branding Co.**
