import { createConnectTransport } from '@connectrpc/connect-node';
import { createPromiseClient } from '@connectrpc/connect';
import { MemberService } from './src/gen/src/proto/member/v1/member_connect';
import {
  CreateMemberRequest,
  GetMemberRequest,
  UpdateMemberRequest,
  DeleteMemberRequest,
  ListMembersRequest,
} from './src/gen/src/proto/member/v1/member_pb';

// Create transport and client
const transport = createConnectTransport({
  baseUrl: 'http://localhost:8080',
});

const client = createPromiseClient(MemberService, transport);

async function exampleUsage() {
  try {
    console.log('🚀 Connect RPC Member Management Demo\n');

    // 1. Create a new member
    console.log('1. Creating a new member...');
    const createRequest = new CreateMemberRequest({
      account: 'john.doe@example.com',
      password: 'securepassword123',
      name: 'John Doe',
      birthday: '1990-05-15',
      phone: '+1-555-0123',
      gender: 'male',
      address: '123 Main St, Anytown, USA',
    });

    const createResponse = await client.createMember(createRequest);
    const memberId = createResponse.member?.member?.id!;
    console.log(`✅ Created member with ID: ${memberId}\n`);

    // 2. Get the member
    console.log('2. Retrieving the member...');
    const getRequest = new GetMemberRequest({
      id: memberId,
    });

    const getResponse = await client.getMember(getRequest);
    console.log('✅ Member details:');
    console.log(`   Account: ${getResponse.member?.member?.account}`);
    console.log(`   Name: ${getResponse.member?.memberPii?.name}`);
    console.log(`   Phone: ${getResponse.member?.memberPii?.phone}\n`);

    // 3. Update the member
    console.log('3. Updating member information...');
    const updateRequest = new UpdateMemberRequest({
      id: memberId,
      phone: '+1-555-9999',
      address: '456 Oak Ave, Newtown, USA',
    });

    const updateResponse = await client.updateMember(updateRequest);
    console.log('✅ Updated member:');
    console.log(`   New Phone: ${updateResponse.member?.memberPii?.phone}`);
    console.log(`   New Address: ${updateResponse.member?.memberPii?.address}\n`);

    // 4. List all members
    console.log('4. Listing all members...');
    const listRequest = new ListMembersRequest({
      page: 1,
      limit: 10,
    });

    const listResponse = await client.listMembers(listRequest);
    console.log(`✅ Found ${listResponse.total} members:`);
    listResponse.members.forEach((member, index) => {
      console.log(`   ${index + 1}. ${member.member?.account} - ${member.memberPii?.name}`);
    });
    console.log();

    // 5. Delete the member
    console.log('5. Deleting the member...');
    const deleteRequest = new DeleteMemberRequest({
      id: memberId,
    });

    const deleteResponse = await client.deleteMember(deleteRequest);
    console.log(`✅ Member deleted successfully: ${deleteResponse.success}\n`);

    console.log('🎉 Demo completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  exampleUsage();
}