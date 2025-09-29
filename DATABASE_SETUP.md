# Database Setup Guide

## Centralized Database Connection

This project uses a **centralized database connection** system to ensure consistency and prevent connection issues.

### Key Files

- **`lib/prisma.ts`** - Centralized database connection (SINGLE SOURCE OF TRUTH)
- **`env.example`** - Environment template
- **`.env.local`** - Your local environment configuration (create from template)

### Quick Setup

1. **Create environment file:**
   ```bash
   cp env.example .env.local
   ```

2. **Update database URL in `.env.local`:**
   ```env
   DATABASE_URL="postgresql://username:password@host:port/database"
   ```

3. **Setup database:**
   ```bash
   npm run setup:db
   ```

4. **Create admin user:**
   ```bash
   npm run create:admin
   ```

5. **Test connection:**
   ```bash
   npm run test:db
   ```

6. **Start development:**
   ```bash
   npm run dev
   ```

### Available Scripts

- `npm run setup:db` - Setup database schema and generate client
- `npm run create:admin` - Create default admin user
- `npm run test:db` - Test database connection and show statistics
- `npm run db:push` - Push schema changes to database
- `npm run db:generate` - Generate Prisma client
- `npm run db:studio` - Open Prisma Studio
- `npm run db:migrate` - Create and run migrations
- `npm run db:reset` - Reset database (WARNING: deletes all data)

### Database Connection Rules

#### ✅ REQUIRED
```typescript
// Always use centralized connection
import { prisma, checkDatabaseConnection } from '@/lib/prisma'

// Use helper functions when needed
const isConnected = await checkDatabaseConnection()
```

#### ❌ FORBIDDEN
```typescript
// Never create new PrismaClient instances
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// Never use manual disconnect
await prisma.$disconnect()
```

### Environment Configuration

- **Single database URL**: Use only `DATABASE_URL` in `.env.local`
- **No multiple databases**: One connection per environment
- **Secure**: Never commit `.env.local` to git
- **Template**: Use `env.example` as reference

### Troubleshooting

#### Connection Issues
1. Check `DATABASE_URL` in `.env.local`
2. Verify database is accessible
3. Run `npm run test:db` to diagnose

#### Schema Issues
1. Run `npm run db:push` to sync schema
2. Run `npm run db:generate` to regenerate client
3. Check Prisma schema in `prisma/schema.prisma`

#### Admin User Issues
1. Run `npm run create:admin` to create admin
2. Default credentials: `admin@newstatebranding.com` / `admin123`

### Database Models

The system includes these main models:
- **User** - Admin users
- **Client** - Client information
- **Project** - Projects with theme customization
- **Review** - Client reviews
- **Element** - Project elements/files
- **Comment** - Comments and annotations
- **Approval** - Approval tracking
- **Settings** - System settings
- **Annotation** - Project annotations
- **Version** - File versions

### Production Deployment

1. Set `DATABASE_URL` environment variable in production
2. Run `npm run db:push` to sync schema
3. Run `npm run create:admin` to create admin user
4. Test with `npm run test:db`

### Support

- Check `.cursorrules` for detailed coding standards
- Review `prisma/schema.prisma` for database structure
- Use `npm run db:studio` for database inspection
