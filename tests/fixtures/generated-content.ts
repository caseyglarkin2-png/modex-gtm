export type GeneratedContentFixture = {
  id: number;
  accountName: string;
  version: number;
  isPublished: boolean;
  content: string;
  externalSendCount: number;
};

export type GenerationJobFixture = {
  id: number;
  accountName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
};

export type PersonaFixture = {
  id: number;
  accountName: string;
  name: string;
  email: string | null;
  doNotContact: boolean;
};

export type GeneratedContentFixtureBundle = {
  generatedContent: GeneratedContentFixture[];
  generationJobs: GenerationJobFixture[];
  personas: PersonaFixture[];
};

export function buildGeneratedContentFixtures(): GeneratedContentFixtureBundle {
  return {
    generatedContent: [
      {
        id: 1001,
        accountName: 'General Mills',
        version: 1,
        isPublished: false,
        content: '{"headline":"v1","subheadline":"test"}',
        externalSendCount: 0,
      },
      {
        id: 1002,
        accountName: 'General Mills',
        version: 2,
        isPublished: true,
        content: '{"headline":"v2","subheadline":"test"}',
        externalSendCount: 3,
      },
      {
        id: 1003,
        accountName: 'No Recipient Co',
        version: 1,
        isPublished: false,
        content: '{"headline":"none","subheadline":"test"}',
        externalSendCount: 0,
      },
    ],
    generationJobs: [
      { id: 2001, accountName: 'General Mills', status: 'failed', retryCount: 1 },
      { id: 2002, accountName: 'General Mills', status: 'pending', retryCount: 0 },
      { id: 2003, accountName: 'General Mills', status: 'processing', retryCount: 0 },
    ],
    personas: [
      { id: 3001, accountName: 'General Mills', name: 'Jane Ops', email: 'jane.ops@generalmills.com', doNotContact: false },
      { id: 3002, accountName: 'General Mills', name: 'John Yard', email: 'john.yard@generalmills.com', doNotContact: false },
      { id: 3003, accountName: 'No Recipient Co', name: 'Suppressed Contact', email: null, doNotContact: true },
    ],
  };
}
