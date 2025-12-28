import { 
  User, 
  Organization, 
  OrganizationMember, 
  Invitation, 
  Document, 
  ChatSession, 
  ChatMessage,
  LLMSettings 
} from '@/types';

// Mock Users
export const mockUsers: User[] = [
  { id: '1', name: 'Alex Johnson', email: 'alex@acme.com', avatarUrl: undefined },
  { id: '2', name: 'Sarah Chen', email: 'sarah@acme.com', avatarUrl: undefined },
  { id: '3', name: 'Mike Roberts', email: 'mike@acme.com', avatarUrl: undefined },
];

export const currentUser: User = mockUsers[0];

// Mock Organizations
export const mockOrganizations: Organization[] = [
  {
    id: 'org-1',
    name: 'Acme Corporation',
    createdDate: '2024-01-15T10:00:00Z',
    stats: {
      fileCount: 24,
      totalChunks: 1847,
      totalSize: 156000000,
      lastUpdated: '2024-12-28T09:30:00Z',
    },
  },
  {
    id: 'org-2',
    name: 'Tech Startup Inc',
    createdDate: '2024-06-20T14:30:00Z',
    stats: {
      fileCount: 8,
      totalChunks: 423,
      totalSize: 45000000,
      lastUpdated: '2024-12-27T16:45:00Z',
    },
  },
];

// Mock Members
export const mockMembers: OrganizationMember[] = [
  { id: 'm1', user: mockUsers[0], role: 'ADMIN', joinedDate: '2024-01-15T10:00:00Z' },
  { id: 'm2', user: mockUsers[1], role: 'USER', joinedDate: '2024-02-20T14:30:00Z' },
  { id: 'm3', user: mockUsers[2], role: 'USER', joinedDate: '2024-03-10T09:15:00Z' },
];

// Mock Invitations
export const mockInvitations: Invitation[] = [
  { id: 'inv1', email: 'john@example.com', role: 'USER', status: 'PENDING', invitedDate: '2024-12-26T10:00:00Z' },
  { id: 'inv2', email: 'jane@example.com', role: 'ADMIN', status: 'PENDING', invitedDate: '2024-12-25T14:30:00Z' },
];

// Mock Documents
export const mockDocuments: Document[] = [
  { id: 'd1', fileName: 'Company Handbook 2024.pdf', fileType: 'pdf', fileSize: 2500000, status: 'READY', uploadedDate: '2024-12-20T10:00:00Z', uploadedBy: 'Alex Johnson', chunks: 145 },
  { id: 'd2', fileName: 'Product Requirements.docx', fileType: 'docx', fileSize: 850000, status: 'READY', uploadedDate: '2024-12-22T14:30:00Z', uploadedBy: 'Sarah Chen', chunks: 67 },
  { id: 'd3', fileName: 'Technical Documentation.pdf', fileType: 'pdf', fileSize: 4200000, status: 'PROCESSING', uploadedDate: '2024-12-28T08:15:00Z', uploadedBy: 'Alex Johnson', chunks: undefined },
  { id: 'd4', fileName: 'Meeting Notes Q4.txt', fileType: 'txt', fileSize: 125000, status: 'READY', uploadedDate: '2024-12-18T16:45:00Z', uploadedBy: 'Mike Roberts', chunks: 23 },
  { id: 'd5', fileName: 'API Reference.pdf', fileType: 'pdf', fileSize: 1800000, status: 'FAILED', uploadedDate: '2024-12-27T11:00:00Z', uploadedBy: 'Alex Johnson', chunks: undefined, errorMessage: 'Failed to parse PDF structure' },
  { id: 'd6', fileName: 'Onboarding Guide.docx', fileType: 'docx', fileSize: 620000, status: 'UPLOADED', uploadedDate: '2024-12-28T09:30:00Z', uploadedBy: 'Sarah Chen', chunks: undefined },
];

// Mock Chat Sessions
export const mockChatSessions: ChatSession[] = [
  { id: 'cs1', title: 'Product feature discussion', createdDate: '2024-12-28T08:00:00Z', lastUpdatedDate: '2024-12-28T09:45:00Z', messageCount: 12 },
  { id: 'cs2', title: 'Technical architecture questions', createdDate: '2024-12-27T14:00:00Z', lastUpdatedDate: '2024-12-27T16:30:00Z', messageCount: 8 },
  { id: 'cs3', title: 'Onboarding process inquiry', createdDate: '2024-12-26T10:00:00Z', lastUpdatedDate: '2024-12-26T11:15:00Z', messageCount: 5 },
  { id: 'cs4', title: 'API integration help', createdDate: '2024-12-24T09:00:00Z', lastUpdatedDate: '2024-12-24T10:00:00Z', messageCount: 6 },
];

// Mock Chat Messages
export const mockChatMessages: Record<string, ChatMessage[]> = {
  'cs1': [
    { id: 'msg1', role: 'user', content: 'What are the key features of our product roadmap for Q1?', timestamp: '2024-12-28T08:00:00Z' },
    { id: 'msg2', role: 'assistant', content: 'Based on the Product Requirements document, the Q1 roadmap includes three major initiatives:\n\n1. **User Dashboard Redesign** - Complete overhaul of the analytics dashboard with real-time data visualization\n2. **API v2 Launch** - New REST API with improved rate limiting and webhook support\n3. **Mobile App Beta** - Initial release of the iOS and Android applications\n\nWould you like more details on any of these initiatives?', timestamp: '2024-12-28T08:01:00Z', sources: [{ documentId: 'd2', fileName: 'Product Requirements.docx', chunk: 'Q1 Roadmap section', relevanceScore: 0.94 }] },
    { id: 'msg3', role: 'user', content: 'Tell me more about the API v2 changes', timestamp: '2024-12-28T08:05:00Z' },
    { id: 'msg4', role: 'assistant', content: 'The API v2 introduces several significant improvements:\n\n**Authentication:**\n- OAuth 2.0 support with refresh tokens\n- API key scoping for granular permissions\n\n**Rate Limiting:**\n- Tiered limits based on subscription plan\n- Burst allowance for temporary spikes\n\n**New Endpoints:**\n- Batch operations for bulk data processing\n- Real-time webhooks for event notifications\n- GraphQL endpoint for flexible queries\n\nThe documentation is being updated in the Technical Documentation file.', timestamp: '2024-12-28T08:06:00Z', sources: [{ documentId: 'd2', fileName: 'Product Requirements.docx', chunk: 'API v2 specifications', relevanceScore: 0.91 }] },
  ],
  'cs2': [
    { id: 'msg5', role: 'user', content: 'What database architecture are we using?', timestamp: '2024-12-27T14:00:00Z' },
    { id: 'msg6', role: 'assistant', content: 'According to the Technical Documentation, we use a hybrid database architecture:\n\n- **PostgreSQL** for relational data (users, organizations, permissions)\n- **Redis** for caching and session management\n- **Elasticsearch** for full-text search and analytics\n- **S3** for file storage with CDN distribution\n\nThe system is designed for horizontal scaling with read replicas.', timestamp: '2024-12-27T14:01:00Z' },
  ],
  'cs3': [
    { id: 'msg7', role: 'user', content: 'How do new employees get started?', timestamp: '2024-12-26T10:00:00Z' },
    { id: 'msg8', role: 'assistant', content: 'The onboarding process for new employees follows these steps:\n\n1. **Day 1**: IT setup, access credentials, meet the team\n2. **Week 1**: Product training, shadow senior team members\n3. **Week 2-4**: Assigned mentor, first small projects\n4. **Month 2**: Independent work with regular check-ins\n\nAll details are in the Company Handbook and Onboarding Guide.', timestamp: '2024-12-26T10:01:00Z', sources: [{ documentId: 'd1', fileName: 'Company Handbook 2024.pdf', chunk: 'New Employee Onboarding', relevanceScore: 0.96 }] },
  ],
  'cs4': [],
};

// Mock LLM Settings
export const mockLLMSettings: LLMSettings = {
  provider: 'OpenAI',
  apiKey: 'sk-proj-...xxxx',
  keyStatus: 'SET',
};

// Empty state mock for new org
export const emptyOrganization: Organization = {
  id: 'new-org',
  name: '',
  createdDate: new Date().toISOString(),
  stats: {
    fileCount: 0,
    totalChunks: 0,
    totalSize: 0,
  },
};

export const emptyLLMSettings: LLMSettings = {
  provider: 'OpenAI',
  apiKey: '',
  keyStatus: 'NOT_SET',
};
