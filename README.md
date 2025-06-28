# ConnectRPC Member Management System

A Node.js Connect RPC project for managing member data with PostgreSQL and Prisma ORM.

## Features

- **Connect RPC** framework for high-performance, type-safe APIs
- **PostgreSQL** database with **Prisma ORM**
- **Member Management** with CRUD operations
- **Secure password hashing** with bcrypt
- **Comprehensive unit tests** with Jest
- **TypeScript** for type safety

## Database Schema

### Member Table
- `id`: Unique member identifier (CUID)
- `account`: Unique account name/email
- `password`: Encrypted password (bcrypt)
- `createdAt`: Timestamp when member was created
- `updatedAt`: Timestamp when member was last updated

### Member PII Table
- `id`: Unique PII record identifier (CUID)
- `memberId`: Foreign key to Member table
- `name`: Member's full name
- `birthday`: Member's birthday (optional)
- `phone`: Member's phone number (optional)
- `gender`: Member's gender (optional)
- `address`: Member's address (optional)
- `createdAt`: Timestamp when PII was created
- `updatedAt`: Timestamp when PII was last updated

## API Methods

### CreateMember
Creates a new member with optional PII data.

**Request:**
```proto
message CreateMemberRequest {
  string account = 1;
  string password = 2;
  string name = 3;
  string birthday = 4;
  string phone = 5;
  string gender = 6;
  string address = 7;
}
```

### GetMember
Retrieves a member by ID with their PII data.

**Request:**
```proto
message GetMemberRequest {
  string id = 1;
}
```

### UpdateMember
Updates member account and/or PII data.

**Request:**
```proto
message UpdateMemberRequest {
  string id = 1;
  optional string account = 2;
  optional string password = 3;
  optional string name = 4;
  optional string birthday = 5;
  optional string phone = 6;
  optional string gender = 7;
  optional string address = 8;
}
```

### DeleteMember
Deletes a member and their associated PII data.

**Request:**
```proto
message DeleteMemberRequest {
  string id = 1;
}
```

### ListMembers
Lists members with pagination support.

**Request:**
```proto
message ListMembersRequest {
  int32 page = 1;
  int32 limit = 2;
}
```

## Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd connectRPC-test
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your database configuration
```

4. Generate Prisma client
```bash
npm run db:generate
```

5. Push database schema
```bash
npm run db:push
```

6. Build the project
```bash
npm run build
```

### Running the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:8080`

## Testing

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Development Scripts

- `npm run build` - Build TypeScript to JavaScript
- `npm run dev` - Start development server with ts-node
- `npm run test` - Run tests with Jest
- `npm run generate` - Generate protobuf TypeScript code
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database

### CI Environment

For CI/CD environments where network access to Prisma binaries is restricted, use the CI setup script:

```bash
node scripts/ci-setup.js
```

This script creates minimal Prisma client type definitions without downloading binary engines, allowing builds and tests to run in firewall-restricted environments. The tests use mocked Prisma clients, so real database engines are not needed for testing.

## Continuous Integration

The project includes GitHub Actions workflow that:
- Tests against Node.js 18.x and 20.x
- Runs protobuf code generation
- Creates CI-compatible Prisma client types
- Builds the TypeScript project
- Executes all unit tests

All 15 unit tests must pass for CI to succeed.

## Project Structure

```
src/
├── gen/                    # Generated protobuf code
├── proto/                  # Protobuf definitions
│   └── member/v1/
│       └── member.proto
├── services/               # RPC service implementations
│   └── member.service.ts
├── utils/                  # Utility functions
│   ├── password.ts         # Password hashing utilities
│   └── prisma.ts          # Prisma client setup
└── server.ts              # Main server file

tests/                     # Unit tests
├── member.service.test.ts
├── password.test.ts
└── setup.ts

prisma/
└── schema.prisma          # Database schema
```

## Security Features

- Password hashing with bcrypt (10 salt rounds)
- Input validation via protobuf schema
- CORS headers for cross-origin requests
- Separate PII table for data protection compliance

## Error Handling

The API uses Connect RPC error codes:
- `ALREADY_EXISTS` - Account already exists
- `NOT_FOUND` - Member not found
- `INTERNAL` - Internal server errors

## License

ISC License