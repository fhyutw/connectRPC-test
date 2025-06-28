// Mock setup for tests since we don't have a real database
const mockMembers: any[] = [];
const mockMemberPII: any[] = [];

// Create a mock prisma client
const mockPrisma = {
  member: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn(),
  },
  memberPII: {
    create: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn(),
  $disconnect: jest.fn(),
};

// Mock the prisma import
jest.mock('../src/utils/prisma', () => ({
  prisma: mockPrisma,
}));

beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Clear mock data
  mockMembers.length = 0;
  mockMemberPII.length = 0;
  
  // Setup mock implementations
  mockPrisma.$transaction.mockImplementation(async (callback: any) => {
    return await callback(mockPrisma);
  });
  
  mockPrisma.$disconnect.mockResolvedValue(undefined);
});

afterAll(async () => {
  // Nothing to do for mock
});