import { ConnectError, Code } from '@connectrpc/connect';
import type { ServiceImpl } from '@connectrpc/connect';
import { MemberService } from '../gen/src/proto/member/v1/member_connect';
import {
  CreateMemberRequest,
  CreateMemberResponse,
  GetMemberRequest,
  GetMemberResponse,
  UpdateMemberRequest,
  UpdateMemberResponse,
  DeleteMemberRequest,
  DeleteMemberResponse,
  ListMembersRequest,
  ListMembersResponse,
  Member,
  MemberPII,
  MemberWithPII,
} from '../gen/src/proto/member/v1/member_pb';
import { prisma } from '../utils/prisma';
import { PasswordUtils } from '../utils/password';

export const memberService: ServiceImpl<typeof MemberService> = {
  async createMember(req: CreateMemberRequest): Promise<CreateMemberResponse> {
    try {
      // Check if account already exists
      const existingMember = await prisma.member.findUnique({
        where: { account: req.account },
      });

      if (existingMember) {
        throw new ConnectError('Account already exists', Code.AlreadyExists);
      }

      // Hash password
      const hashedPassword = await PasswordUtils.hashPassword(req.password);

      // Create member with PII in a transaction
      const result = await prisma.$transaction(async (tx: any) => {
        const member = await tx.member.create({
          data: {
            account: req.account,
            password: hashedPassword,
          },
        });

        let memberPII = null;
        if (req.name) {
          memberPII = await tx.memberPII.create({
            data: {
              memberId: member.id,
              name: req.name,
              birthday: req.birthday ? new Date(req.birthday) : null,
              phone: req.phone || null,
              gender: req.gender || null,
              address: req.address || null,
            },
          });
        }

        return { member, memberPII };
      });

      const response = new CreateMemberResponse();
      response.member = convertToMemberWithPII(result.member, result.memberPII);
      return response;
    } catch (error) {
      if (error instanceof ConnectError) {
        throw error;
      }
      throw new ConnectError('Failed to create member', Code.Internal);
    }
  },

  async getMember(req: GetMemberRequest): Promise<GetMemberResponse> {
    try {
      const memberWithPII = await prisma.member.findUnique({
        where: { id: req.id },
        include: { memberPII: true },
      });

      if (!memberWithPII) {
        throw new ConnectError('Member not found', Code.NotFound);
      }

      const response = new GetMemberResponse();
      response.member = convertToMemberWithPII(memberWithPII, memberWithPII.memberPII);
      return response;
    } catch (error) {
      if (error instanceof ConnectError) {
        throw error;
      }
      throw new ConnectError('Failed to get member', Code.Internal);
    }
  },

  async updateMember(req: UpdateMemberRequest): Promise<UpdateMemberResponse> {
    try {
      const existingMember = await prisma.member.findUnique({
        where: { id: req.id },
        include: { memberPII: true },
      });

      if (!existingMember) {
        throw new ConnectError('Member not found', Code.NotFound);
      }

      const result = await prisma.$transaction(async (tx: any) => {
        const updateData: any = {};
        
        if (req.account) {
          // Check if new account already exists
          const accountExists = await tx.member.findFirst({
            where: { 
              account: req.account,
              id: { not: req.id }
            },
          });
          if (accountExists) {
            throw new ConnectError('Account already exists', Code.AlreadyExists);
          }
          updateData.account = req.account;
        }

        if (req.password) {
          updateData.password = await PasswordUtils.hashPassword(req.password);
        }

        const member = await tx.member.update({
          where: { id: req.id },
          data: updateData,
        });

        let memberPII = existingMember.memberPII;

        // Update or create PII data
        const piiUpdateData: any = {};
        if (req.name !== undefined) piiUpdateData.name = req.name;
        if (req.birthday !== undefined) piiUpdateData.birthday = req.birthday ? new Date(req.birthday) : null;
        if (req.phone !== undefined) piiUpdateData.phone = req.phone || null;
        if (req.gender !== undefined) piiUpdateData.gender = req.gender || null;
        if (req.address !== undefined) piiUpdateData.address = req.address || null;

        if (Object.keys(piiUpdateData).length > 0) {
          if (memberPII) {
            memberPII = await tx.memberPII.update({
              where: { memberId: req.id },
              data: piiUpdateData,
            });
          } else {
            memberPII = await tx.memberPII.create({
              data: {
                memberId: req.id,
                ...piiUpdateData,
                name: piiUpdateData.name || '',
              },
            });
          }
        }

        return { member, memberPII };
      });

      const response = new UpdateMemberResponse();
      response.member = convertToMemberWithPII(result.member, result.memberPII);
      return response;
    } catch (error) {
      if (error instanceof ConnectError) {
        throw error;
      }
      throw new ConnectError('Failed to update member', Code.Internal);
    }
  },

  async deleteMember(req: DeleteMemberRequest): Promise<DeleteMemberResponse> {
    try {
      const existingMember = await prisma.member.findUnique({
        where: { id: req.id },
      });

      if (!existingMember) {
        throw new ConnectError('Member not found', Code.NotFound);
      }

      await prisma.member.delete({
        where: { id: req.id },
      });

      const response = new DeleteMemberResponse();
      response.success = true;
      return response;
    } catch (error) {
      if (error instanceof ConnectError) {
        throw error;
      }
      throw new ConnectError('Failed to delete member', Code.Internal);
    }
  },

  async listMembers(req: ListMembersRequest): Promise<ListMembersResponse> {
    try {
      const page = req.page || 1;
      const limit = req.limit || 10;
      const skip = (page - 1) * limit;

      const [members, total] = await Promise.all([
        prisma.member.findMany({
          skip,
          take: limit,
          include: { memberPII: true },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.member.count(),
      ]);

      const convertedMembers = members.map((member: any) =>
        convertToMemberWithPII(member, member.memberPII)
      );

      const response = new ListMembersResponse();
      response.members = convertedMembers;
      response.total = total;
      response.page = page;
      response.limit = limit;
      return response;
    } catch (error) {
      throw new ConnectError('Failed to list members', Code.Internal);
    }
  },
};

// Helper function to convert Prisma objects to protobuf messages
function convertToMemberWithPII(
  member: any,
  memberPII: any | null
): MemberWithPII {
  const memberMsg = new Member();
  memberMsg.id = member.id;
  memberMsg.account = member.account;
  memberMsg.createdAt = member.createdAt.toISOString();
  memberMsg.updatedAt = member.updatedAt.toISOString();

  let memberPIIMsg: MemberPII | undefined;
  if (memberPII) {
    memberPIIMsg = new MemberPII();
    memberPIIMsg.id = memberPII.id;
    memberPIIMsg.memberId = memberPII.memberId;
    memberPIIMsg.name = memberPII.name;
    memberPIIMsg.birthday = memberPII.birthday ? memberPII.birthday.toISOString() : '';
    memberPIIMsg.phone = memberPII.phone || '';
    memberPIIMsg.gender = memberPII.gender || '';
    memberPIIMsg.address = memberPII.address || '';
    memberPIIMsg.createdAt = memberPII.createdAt.toISOString();
    memberPIIMsg.updatedAt = memberPII.updatedAt.toISOString();
  }

  const memberWithPII = new MemberWithPII();
  memberWithPII.member = memberMsg;
  memberWithPII.memberPii = memberPIIMsg;
  return memberWithPII;
}