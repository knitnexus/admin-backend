# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Admin backend API for KnitNexus, a textile/garment industry platform that manages companies, job postings, and machinery inventory across various unit types (spinning, weaving, knitting, dyeing, stitching, etc.).

**Tech Stack:**
- Runtime: Bun
- Framework: Hono (lightweight web framework)
- Database: PostgreSQL via Prisma ORM
- File Storage: AWS S3
- Auth: JWT with HTTP-only cookies

## Development Commands

```bash
# Install dependencies
bun install

# Run development server with hot reload (localhost:3000)
bun run dev

# Run production server
bun run start

# Prisma operations
bunx prisma generate              # Generate Prisma client
bunx prisma migrate dev           # Create and apply migrations
bunx prisma studio                # Open database GUI
bunx prisma db push               # Push schema changes without migrations
```

## Architecture

### Route Structure
All routes are mounted in `src/routes/index.ts`:
- `/auth` - Authentication (login/logout)
- `/companies` - Company onboarding and management
- `/jobs` - Job posting creation and management

### Prisma Client Location
**IMPORTANT:** Prisma client is generated to a custom location:
- Generated path: `src/generated/prisma`
- Import from: `"../generated/prisma"` (not `"@prisma/client"`)
- Configured in `prisma/schema.prisma` via `output` directive

### File Upload Flow
1. Files received via `formData` in route handlers
2. Uploaded to S3 using `uploadToS3()` or `uploadMultipleToS3()` from `src/services/ImageUploads.ts`
3. Returns public S3 URLs
4. URLs stored as strings/arrays in database

S3 folder structure:
- `logos/` - Company logos
- `units/` - Unit images
- `jobs/` - Job posting images

### Authentication
- Admin-only system (no user registration)
- Credentials stored in environment variables
- JWT stored in HTTP-only cookie named "token"
- Protected routes use `requireAdmin` middleware from `src/middleware/auth.ts`
- Password comparison is currently plaintext (see auth.ts:28)

### Data Validation
- Zod schemas defined in `src/lib/types.ts`
- Parse multipart form data, validate with Zod, then create database records
- Use `z.safeParse()` and return `z.treeifyError()` for validation errors

### Key Models
- **Company**: Represents textile units with machinery, services, certifications
- **Machinery**: Tied to a company, stores machine type and quantity
- **Service**: Company services/capabilities
- **JobPosting**: Work orders/opportunities posted by companies
- **FormConfiguration**: Dynamic form schemas for different unit types

### UnitType Enum
Defines 19+ textile industry unit types (YARN_SPINNING, WEAVING_UNIT, KNITTING_UNIT, DYEING_UNIT, STITCHING_UNIT, etc.) - central to the data model.

## Environment Variables Required

```
DATABASE_URL           # PostgreSQL connection string
FRONTEND_SERVICE_URL   # CORS allowed origin
JWT_SECRET            # JWT signing secret
ADMIN_EMAIL           # Admin login email
ADMIN_PASSWORD        # Admin login password
AWS_ACCESS_KEY_ID     # S3 credentials
AWS_SECRET_ACCESS_KEY # S3 credentials
AWS_REGION            # S3 region
AWS_S3_BUCKET_NAME    # S3 bucket name
```

## Known Issues & Patterns

1. Password authentication is currently plaintext comparison (auth.ts:28) - bcrypt is imported but commented out
2. Multiple `@ts-ignore` comments in route files - consider fixing type issues
3. CORS is configured for a single frontend origin via environment variable
4. Error handling uses custom middleware in `src/middleware/error.ts`
5. FormData parsing extracts arrays using `getAll()` for multi-value fields like certifications
