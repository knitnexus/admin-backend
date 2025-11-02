# Project Structure Guide

## Directory Overview

```
admin-backend/
├── src/
│   ├── constants/          # Configuration constants
│   │   └── index.ts        # AUTH, S3, APP constants
│   │
│   ├── config/             # External service configurations
│   │   └── prisma.ts       # Prisma client singleton
│   │
│   ├── types/              # Type definitions & schemas
│   │   ├── index.ts        # Barrel export
│   │   └── schemas.ts      # Zod validation schemas
│   │
│   ├── middleware/         # Request/response processing
│   │   ├── auth.ts         # JWT authentication
│   │   ├── error.ts        # Error handling
│   │   └── logger.ts       # Request logging
│   │
│   ├── services/           # Business logic & data operations
│   │   ├── auth.service.ts     # Auth operations
│   │   ├── company.service.ts  # Company CRUD
│   │   └── upload.service.ts   # S3 file uploads
│   │
│   ├── controllers/        # HTTP request handlers
│   │   ├── auth.controller.ts     # Login/logout/admin
│   │   └── company.controller.ts  # Company endpoints
│   │
│   ├── routes/             # Route definitions
│   │   ├── index.ts            # Main router
│   │   ├── auth.routes.ts      # /auth endpoints
│   │   ├── company.routes.ts   # /companies endpoints
│   │   └── jobposts.ts         # /jobposts endpoints
│   │
│   ├── generated/          # Auto-generated Prisma client
│   │   └── prisma/
│   │
│   └── index.ts            # App entry point
│
├── prisma/                 # Database schema & migrations
│   ├── schema.prisma
│   └── migrations/
│
├── CLAUDE.md               # AI assistant guidance
├── REFACTORING_SUMMARY.md  # Refactoring changes
└── PROJECT_STRUCTURE.md    # This file
```

## Layer Responsibilities

### 1. Routes (`src/routes/`)

**Purpose:** Define API endpoints and attach controllers

**Rules:**

- Only define routes and middleware
- No business logic
- Import and use controllers

**Example:**

```typescript
import { Hono } from 'hono';
import * as controller from '../controllers/auth.controller';

const auth = new Hono();
auth.post('/login', controller.login);
export default auth;
```

### 2. Controllers (`src/controllers/`)

**Purpose:** Handle HTTP requests and responses

**Rules:**

- Parse request data (body, params, query)
- Call services for business logic
- Format and return responses
- Handle HTTP-specific concerns (status codes, headers)

**Example:**

```typescript
export async function login(c: Context) {
  const { email, password } = await c.req.json();
  const isValid = await authService.validateCredentials(email, password);
  if (!isValid) {
    return c.json({ success: false, message: 'Invalid credentials' }, 401);
  }
  const token = await authService.createToken(email);
  setCookie(c, 'token', token, { httpOnly: true });
  return c.json({ success: true });
}
```

### 3. Services (`src/services/`)

**Purpose:** Business logic and data operations

**Rules:**

- No HTTP-specific code (no Context, no status codes)
- Interact with database
- Perform validations
- Return data or throw errors

**Example:**

```typescript
export async function validateCredentials(
  email: string,
  password: string
): Promise<boolean> {
  const isPasswordValid = password === AUTH_CONSTANTS.ADMIN_PASSWORD;
  return email === AUTH_CONSTANTS.ADMIN_EMAIL && isPasswordValid;
}
```

### 4. Middleware (`src/middleware/`)

**Purpose:** Request/response processing

**Rules:**

- Run before controllers
- Authentication, logging, error handling
- Can modify request/response objects

**Example:**

```typescript
export const requireAdmin = async (c: Context, next: Next) => {
  const token = getCookie(c, 'token');
  if (!token) return c.json({ message: 'Unauthorized' }, 401);
  await next();
};
```

### 5. Types (`src/types/`)

**Purpose:** TypeScript types and Zod schemas

**Rules:**

- All validation schemas (Zod)
- Type definitions
- Shared interfaces

**Example:**

```typescript
export const onBoardCompany = z.object({
  name: z.string().min(1),
  contactNumber: z.string(),
  unitType: unitType,
  // ...
});
```

### 6. Constants (`src/constants/`)

**Purpose:** Configuration and environment variables

**Rules:**

- Centralize all env vars
- Group by domain (AUTH, S3, APP)
- Use `as const` for immutability

**Example:**

```typescript
export const AUTH_CONSTANTS = {
  JWT_SECRET: process.env.JWT_SECRET || 'superAdmin',
  COOKIE_NAME: 'token',
} as const;
```

### 7. Config (`src/config/`)

**Purpose:** External service configurations

**Rules:**

- Database connections
- Third-party service setup
- Singleton instances

**Example:**

```typescript
export const prisma = new PrismaClient();
```

## Request Flow

```
1. Client Request
   ↓
2. Routes (define endpoint)
   ↓
3. Middleware (auth, logging)
   ↓
4. Controller (handle request)
   ↓
5. Service (business logic)
   ↓
6. Database/External API
   ↓
7. Service (return data)
   ↓
8. Controller (format response)
   ↓
9. Client Response
```

## Adding New Features

### Example: Adding a "Products" feature

1. **Types** - `src/types/schemas.ts`

```typescript
export const createProductSchema = z.object({
  name: z.string(),
  price: z.number(),
});
```

2. **Service** - `src/services/product.service.ts`

```typescript
export async function createProduct(data: any) {
  return await prisma.product.create({ data });
}
```

3. **Controller** - `src/controllers/product.controller.ts`

```typescript
export async function create(c: Context) {
  const body = await c.req.json();
  const validation = createProductSchema.safeParse(body);
  if (!validation.success) {
    return c.json({ errors: validation.error }, 400);
  }
  const product = await productService.createProduct(validation.data);
  return c.json({ success: true, product });
}
```

4. **Routes** - `src/routes/product.routes.ts`

```typescript
import * as productController from '../controllers/product.controller';
const products = new Hono();
products.post('/', requireAdmin, productController.create);
export default products;
```

5. **Mount** - `src/routes/index.ts`

```typescript
import products from './product.routes';
routes.route('/products', products);
```

## Best Practices

### ✅ DO

- Keep functions small and focused
- Use meaningful variable names
- Extract reusable logic to services
- Validate all input data
- Handle errors properly
- Use TypeScript types
- Write self-documenting code

### ❌ DON'T

- Put business logic in controllers
- Put HTTP logic in services
- Duplicate code across files
- Hardcode configuration values
- Ignore TypeScript errors
- Mix concerns between layers

## Code Style

### Imports Order

```typescript
// 1. External packages
import { Hono } from 'hono';
import z from 'zod';

// 2. Internal modules (absolute paths)
import { prisma } from '../config/prisma';
import { AUTH_CONSTANTS } from '../constants';
import * as authService from '../services/auth.service';

// 3. Types
import type { Context } from 'hono';
```

### Naming Conventions

- Files: `kebab-case.ts` (e.g., `auth.service.ts`)
- Functions: `camelCase` (e.g., `validateCredentials`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `JWT_SECRET`)
- Types/Interfaces: `PascalCase` (e.g., `CompanyFilters`)
- Routes: plural nouns (e.g., `/companies`, `/products`)

## Current State

- **Total Source Files:** 17 TypeScript files
- **Build Status:** ✅ Successful (877 modules bundled)
- **Architecture:** ✅ Standard backend patterns
- **Code Quality:** ✅ Clean, organized, no duplicates

## Useful Commands

```bash
# Development
bun run dev              # Start with hot reload

# Database
bunx prisma studio       # Open database GUI
bunx prisma migrate dev  # Run migrations
bunx prisma generate     # Regenerate Prisma client

# Testing
bun build src/index.ts   # Test build
```
