# KnitNexus Admin Backend

A clean, modular backend API for managing textile/garment industry companies, machinery inventory, and job postings.

## Quick Start

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build project
bun build src/index.ts --outdir ./dist --target bun

# Database operations
bunx prisma studio              # Open database GUI
bunx prisma migrate dev         # Run migrations
bunx prisma generate            # Generate Prisma client
```

## Project Structure

```
src/
├── constants/      # Configuration constants
├── config/         # External service configs
├── types/          # Type definitions & schemas
├── middleware/     # Auth, logging, error handling
├── services/       # Business logic
├── controllers/    # Request handlers
├── routes/         # API endpoints
└── index.ts        # App entry point
```

📖 **Detailed Documentation:**

- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Complete architecture guide
- [REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md) - Refactoring changes
- [TEST_RESULTS.md](./TEST_RESULTS.md) - API testing results
- [CLAUDE.md](./CLAUDE.md) - AI assistant guidance

## API Endpoints

### Authentication

- `POST /auth/login` - Admin login
- `POST /auth/logout` - Logout
- `GET /auth/admin` - Verify admin token

### Companies

- `POST /companies/onboard` - Create company
- `GET /companies/list` - List with pagination
- `GET /companies/:id` - Get by ID
- `PUT /companies/:id` - Update company
- `DELETE /companies/:id` - Delete company

### Job Posts

- `GET /jobposts` - To be implemented

All company routes require authentication.

## Tech Stack

- **Runtime:** Bun
- **Framework:** Hono (lightweight web framework)
- **Database:** PostgreSQL via Prisma ORM
- **File Storage:** AWS S3
- **Auth:** JWT with HTTP-only cookies
- **Validation:** Zod schemas

## Environment Variables

Create a `.env` file:

```env
DATABASE_URL="postgresql://..."
FRONTEND_SERVICE_URL="http://localhost:5173"
JWT_SECRET="your-jwt-secret"
ADMIN_EMAIL="admin@gmail.com"
ADMIN_PASSWORD="admin123"
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
AWS_REGION="ap-south-1"
AWS_S3_BUCKET_NAME="your-bucket"
```

## Recent Updates

### Refactoring (November 2025)

✅ Removed duplicate files (13 files)
✅ Centralized constants
✅ Clean architecture (Routes → Controllers → Services)
✅ All tests passing
✅ Build successful

See [REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md) for details.

## Testing

```bash
# Test root endpoint
curl http://localhost:3000/

# Test login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"admin123"}'

# Test companies list (requires auth)
curl -b cookies.txt "http://localhost:3000/companies/list?page=1&limit=5"
```

See [TEST_RESULTS.md](./TEST_RESULTS.md) for complete test suite.

## Architecture Highlights

### Clean Separation of Concerns

```
Routes → Controllers → Services → Database
```

### Constants Layer

All configuration centralized in `src/constants/`:

- `AUTH_CONSTANTS` - JWT, cookies, credentials
- `S3_CONSTANTS` - AWS S3 configuration
- `APP_CONSTANTS` - Application settings

### Type Safety

Zod schemas for validation in `src/types/schemas.ts`:

- 19+ unit types (YARN_SPINNING, KNITTING_UNIT, etc.)
- Machine validation per unit type
- Company onboarding validation

## Unit Types Supported

- YARN_SPINNING
- YARN_PROCESSING
- WEAVING_UNIT
- KNITTING_UNIT
- DYEING_UNIT
- FABRIC_PROCESSING_UNIT
- FABRIC_FINISHING_UNIT
- WASHING_UNIT
- CUTTING_UNIT
- COMPUTERIZED_EMBROIDERY_UNIT
- MANUAL_EMBROIDERY_UNIT
- FUSING_UNIT
- PRINTING_UNIT
- STITCHING_UNIT
- CHECKING_UNIT
- IRONING_PACKING_UNIT
- KAJA_BUTTON_UNIT
- MULTI_NEEDLE_DOUBLE_CHAIN_UNIT
- OIL_REMOVING_MENDING_CENTER
- PATTERN_MAKING_CENTER
- FILM_SCREEN_MAKING_CENTER

## Database Schema

### Company

- Basic info (name, contact, GST, about)
- Location (latitude, longitude, city, state)
- Unit type and work type
- Logo and images
- Certifications

### Machinery

- Linked to company
- Unit-type specific validation
- Machine data and quantity

### Service

- Company services/capabilities
- Title and description

### FormConfiguration

- Dynamic form schemas for different unit types

## File Upload Structure

S3 folder organization:

- `logos/` - Company logos
- `units/` - Unit images
- `jobs/` - Job posting images (future)

## Security

✅ JWT authentication
✅ HTTP-only cookies
✅ Protected routes
✅ Input validation (Zod)
⚠️ TODO: Implement bcrypt password hashing

## Contributing

When adding new features:

1. Add types/schemas in `src/types/`
2. Create service functions in `src/services/`
3. Add controllers in `src/controllers/`
4. Define routes in `src/routes/`
5. Mount routes in `src/routes/index.ts`

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for detailed guidelines.

## License

Proprietary - KnitNexus Platform

## Support

For questions or issues, refer to:

- [CLAUDE.md](./CLAUDE.md) for development guidance
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for architecture details
