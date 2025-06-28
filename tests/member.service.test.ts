import { ConnectError, Code } from '@connectrpc/connect';
import { memberService } from '../src/services/member.service';
import {
  CreateMemberRequest,
  GetMemberRequest,
  UpdateMemberRequest,
  DeleteMemberRequest,
  ListMembersRequest,
} from '../src/gen/src/proto/member/v1/member_pb';

// Mock prisma
const mockPrisma = require('../src/utils/prisma').prisma;

// Mock context for Connect RPC
const mockContext = {
  signal: new AbortController().signal,
  requestMethod: 'POST',
  url: new URL('http://localhost:8080'),
  requestHeader: new Headers(),
  responseHeader: new Headers(),
  responseTrailer: new Headers(),
  timeoutMs: undefined,
  method: {
    name: 'CreateMember',
    I: {} as any,
    O: {} as any,
    kind: 'unary' as any,
    idempotency: undefined,
  },
  service: {
    typeName: 'member.v1.MemberService',
  },
  protocolName: 'connect',
  values: new Map(),
} as any;

describe('MemberService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createMember', () => {
    it('should create a member with PII data successfully', async () => {
      const request = new CreateMemberRequest({
        account: 'testuser@example.com',
        password: 'password123',
        name: 'Test User',
        birthday: '1990-01-01',
        phone: '+1234567890',
        gender: 'male',
        address: '123 Test Street',
      });

      const mockMember = {
        id: 'member1',
        account: 'testuser@example.com',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockMemberPII = {
        id: 'pii1',
        memberId: 'member1',
        name: 'Test User',
        birthday: new Date('1990-01-01'),
        phone: '+1234567890',
        gender: 'male',
        address: '123 Test Street',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.member.findUnique.mockResolvedValue(null);
      mockPrisma.member.create.mockResolvedValue(mockMember);
      mockPrisma.memberPII.create.mockResolvedValue(mockMemberPII);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const result = await callback(mockPrisma);
        return { member: mockMember, memberPII: mockMemberPII };
      });

      const response = await memberService.createMember(request, mockContext);

      expect(response.member).toBeDefined();
      expect(response.member?.member?.account).toBe('testuser@example.com');
      expect(response.member?.memberPii?.name).toBe('Test User');
      expect(response.member?.memberPii?.phone).toBe('+1234567890');
    });

    it('should throw error when account already exists', async () => {
      const request = new CreateMemberRequest({
        account: 'duplicate@example.com',
        password: 'password123',
        name: 'First User',
      });

      mockPrisma.member.findUnique.mockResolvedValue({
        id: 'existing',
        account: 'duplicate@example.com',
      });

      await expect(memberService.createMember(request, mockContext))
        .rejects
        .toThrow(new ConnectError('Account already exists', Code.AlreadyExists));
    });
  });

  describe('getMember', () => {
    it('should get a member with PII data', async () => {
      const mockMemberWithPII = {
        id: 'member1',
        account: 'gettest@example.com',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
        memberPII: {
          id: 'pii1',
          memberId: 'member1',
          name: 'Get Test User',
          birthday: new Date('1985-05-15'),
          phone: '+9876543210',
          gender: 'female',
          address: '456 Get Street',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      mockPrisma.member.findUnique.mockResolvedValue(mockMemberWithPII);

      const getRequest = new GetMemberRequest({
        id: 'member1',
      });

      const response = await memberService.getMember(getRequest, mockContext);

      expect(response.member).toBeDefined();
      expect(response.member?.member?.id).toBe('member1');
      expect(response.member?.member?.account).toBe('gettest@example.com');
      expect(response.member?.memberPii?.name).toBe('Get Test User');
    });

    it('should throw error when member not found', async () => {
      mockPrisma.member.findUnique.mockResolvedValue(null);

      const request = new GetMemberRequest({
        id: 'non-existent-id',
      });

      await expect(memberService.getMember(request, mockContext))
        .rejects
        .toThrow(new ConnectError('Member not found', Code.NotFound));
    });
  });

  describe('updateMember', () => {
    it('should update member account and PII data', async () => {
      const existingMember = {
        id: 'member1',
        account: 'updatetest@example.com',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
        memberPII: {
          id: 'pii1',
          memberId: 'member1',
          name: 'Update Test User',
          birthday: new Date('1990-01-01'),
          phone: '+1111111111',
          gender: 'male',
          address: '789 Update Street',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      const updatedMember = {
        ...existingMember,
        account: 'updated@example.com',
        updatedAt: new Date(),
      };

      const updatedPII = {
        ...existingMember.memberPII,
        name: 'Updated Name',
        phone: '+2222222222',
        address: '999 Updated Street',
        updatedAt: new Date(),
      };

      mockPrisma.member.findUnique.mockResolvedValue(existingMember);
      mockPrisma.member.findFirst.mockResolvedValue(null);
      mockPrisma.member.update.mockResolvedValue(updatedMember);
      mockPrisma.memberPII.update.mockResolvedValue(updatedPII);
      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        await callback(mockPrisma);
        return { member: updatedMember, memberPII: updatedPII };
      });

      const updateRequest = new UpdateMemberRequest({
        id: 'member1',
        account: 'updated@example.com',
        name: 'Updated Name',
        phone: '+2222222222',
        address: '999 Updated Street',
      });

      const response = await memberService.updateMember(updateRequest, mockContext);

      expect(response.member?.member?.account).toBe('updated@example.com');
      expect(response.member?.memberPii?.name).toBe('Updated Name');
      expect(response.member?.memberPii?.phone).toBe('+2222222222');
      expect(response.member?.memberPii?.address).toBe('999 Updated Street');
    });

    it('should throw error when member not found', async () => {
      mockPrisma.member.findUnique.mockResolvedValue(null);

      const request = new UpdateMemberRequest({
        id: 'non-existent-id',
        name: 'Updated Name',
      });

      await expect(memberService.updateMember(request, mockContext))
        .rejects
        .toThrow(new ConnectError('Member not found', Code.NotFound));
    });
  });

  describe('deleteMember', () => {
    it('should delete a member successfully', async () => {
      const existingMember = {
        id: 'member1',
        account: 'deletetest@example.com',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.member.findUnique.mockResolvedValue(existingMember);
      mockPrisma.member.delete.mockResolvedValue(existingMember);

      const deleteRequest = new DeleteMemberRequest({
        id: 'member1',
      });

      const response = await memberService.deleteMember(deleteRequest, mockContext);
      expect(response.success).toBe(true);
    });

    it('should throw error when member not found', async () => {
      mockPrisma.member.findUnique.mockResolvedValue(null);

      const request = new DeleteMemberRequest({
        id: 'non-existent-id',
      });

      await expect(memberService.deleteMember(request, mockContext))
        .rejects
        .toThrow(new ConnectError('Member not found', Code.NotFound));
    });
  });

  describe('listMembers', () => {
    it('should list all members with default pagination', async () => {
      const mockMembers = [
        {
          id: 'member1',
          account: 'user1@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
          memberPII: {
            id: 'pii1',
            memberId: 'member1',
            name: 'User 1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        {
          id: 'member2',
          account: 'user2@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
          memberPII: {
            id: 'pii2',
            memberId: 'member2',
            name: 'User 2',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      mockPrisma.member.findMany.mockResolvedValue(mockMembers);
      mockPrisma.member.count.mockResolvedValue(2);

      const request = new ListMembersRequest({
        page: 1,
        limit: 10,
      });

      const response = await memberService.listMembers(request, mockContext);

      expect(response.members).toHaveLength(2);
      expect(response.total).toBe(2);
      expect(response.page).toBe(1);
      expect(response.limit).toBe(10);
    });

    it('should handle empty result', async () => {
      mockPrisma.member.findMany.mockResolvedValue([]);
      mockPrisma.member.count.mockResolvedValue(0);

      const request = new ListMembersRequest({
        page: 1,
        limit: 10,
      });

      const response = await memberService.listMembers(request, mockContext);

      expect(response.members).toHaveLength(0);
      expect(response.total).toBe(0);
    });
  });
});