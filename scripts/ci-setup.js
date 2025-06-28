#!/usr/bin/env node

/**
 * CI Setup Script
 * This script creates minimal type definitions for Prisma client
 * to allow building in CI environments where binary downloads are blocked
 */

const fs = require('fs');
const path = require('path');

// Create the .prisma/client directory structure
const clientDir = path.join(__dirname, '..', 'node_modules', '.prisma', 'client');
const defaultDir = path.join(clientDir, 'default');

// Create directories if they don't exist
if (!fs.existsSync(clientDir)) {
  fs.mkdirSync(clientDir, { recursive: true });
}
if (!fs.existsSync(defaultDir)) {
  fs.mkdirSync(defaultDir, { recursive: true });
}

// Create minimal type definitions based on our schema
const typeDefinitions = `
export interface Member {
  id: string;
  account: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  memberPII?: MemberPII | null;
}

export interface MemberPII {
  id: string;
  memberId: string;
  name: string;
  birthday?: Date | null;
  phone?: string | null;
  gender?: string | null;
  address?: string | null;
  createdAt: Date;
  updatedAt: Date;
  member: Member;
}

export interface MemberCreateInput {
  id?: string;
  account: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
  memberPII?: MemberPIICreateNestedOneWithoutMemberInput;
}

export interface MemberPIICreateInput {
  id?: string;
  memberId: string;
  name: string;
  birthday?: Date | null;
  phone?: string | null;
  gender?: string | null;
  address?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MemberPIICreateNestedOneWithoutMemberInput {
  create?: MemberPIICreateWithoutMemberInput;
  connectOrCreate?: MemberPIICreateOrConnectWithoutMemberInput;
  connect?: MemberPIIWhereUniqueInput;
}

export interface MemberCreateNestedOneWithoutMemberPIIInput {
  create?: MemberCreateWithoutMemberPIIInput;
  connectOrCreate?: MemberCreateOrConnectWithoutMemberPIIInput;
  connect?: MemberWhereUniqueInput;
}

export interface MemberPIICreateWithoutMemberInput {
  id?: string;
  name: string;
  birthday?: Date | null;
  phone?: string | null;
  gender?: string | null;
  address?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MemberCreateWithoutMemberPIIInput {
  id?: string;
  account: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MemberPIICreateOrConnectWithoutMemberInput {
  where: MemberPIIWhereUniqueInput;
  create: MemberPIICreateWithoutMemberInput;
}

export interface MemberCreateOrConnectWithoutMemberPIIInput {
  where: MemberWhereUniqueInput;
  create: MemberCreateWithoutMemberPIIInput;
}

export interface MemberWhereUniqueInput {
  id?: string;
  account?: string;
}

export interface MemberPIIWhereUniqueInput {
  id?: string;
  memberId?: string;
}

export interface MemberWhereInput {
  id?: string | { not?: string };
  account?: string;
  AND?: MemberWhereInput[];
  OR?: MemberWhereInput[];
  NOT?: MemberWhereInput[];
}

export interface MemberInclude {
  memberPII?: boolean;
}

export interface MemberDelegate {
  findUnique(args: { where: MemberWhereUniqueInput; include?: MemberInclude }): Promise<Member | null>;
  findFirst(args: { where: MemberWhereInput; include?: MemberInclude }): Promise<Member | null>;
  findMany(args?: { where?: MemberWhereInput; include?: MemberInclude; skip?: number; take?: number; orderBy?: any }): Promise<Member[]>;
  create(args: { data: MemberCreateInput; include?: MemberInclude }): Promise<Member>;
  update(args: { where: MemberWhereUniqueInput; data: any; include?: MemberInclude }): Promise<Member>;
  delete(args: { where: MemberWhereUniqueInput }): Promise<Member>;
  count(args?: { where?: MemberWhereInput }): Promise<number>;
  deleteMany(args?: { where?: MemberWhereInput }): Promise<{ count: number }>;
}

export interface MemberPIIDelegate {
  create(args: { data: MemberPIICreateInput }): Promise<MemberPII>;
  update(args: { where: MemberPIIWhereUniqueInput; data: any }): Promise<MemberPII>;
  deleteMany(args?: { where?: any }): Promise<{ count: number }>;
}

export class PrismaClient {
  member: MemberDelegate;
  memberPII: MemberPIIDelegate;
  
  constructor(options?: any) {
    this.member = {} as MemberDelegate;
    this.memberPII = {} as MemberPIIDelegate;
  }
  
  $transaction<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    return fn(this);
  }
  
  $disconnect(): Promise<void> {
    return Promise.resolve();
  }
}
`;

// Write the type definitions to the default directory (this is what @prisma/client exports)
const indexPath = path.join(defaultDir, 'index.d.ts');
fs.writeFileSync(indexPath, typeDefinitions);

// Also create index.js for runtime (stub)
const indexJsPath = path.join(defaultDir, 'index.js');
const runtimeStub = `
class PrismaClient {
  constructor(options = {}) {
    this.member = {};
    this.memberPII = {};
  }
  
  $transaction(fn) {
    return fn(this);
  }
  
  $disconnect() {
    return Promise.resolve();
  }
}

module.exports = { PrismaClient };
`;

fs.writeFileSync(indexJsPath, runtimeStub);

console.log('✅ Created minimal Prisma client types for CI environment');