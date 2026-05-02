export type SendJobFixture = {
  id: number;
  status: 'pending' | 'processing' | 'completed' | 'partial' | 'failed';
  totalRecipients: number;
  sentRecipients: number;
  failedRecipients: number;
};

export type SendJobRecipientFixture = {
  id: number;
  sendJobId: number;
  email: string;
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'skipped';
  errorMessage: string | null;
  retryable: boolean;
};

export type SendJobFixtureBundle = {
  jobs: SendJobFixture[];
  recipients: SendJobRecipientFixture[];
};

export function buildSendJobFixtures(): SendJobFixtureBundle {
  return {
    jobs: [
      { id: 4001, status: 'pending', totalRecipients: 2, sentRecipients: 0, failedRecipients: 0 },
      { id: 4002, status: 'processing', totalRecipients: 3, sentRecipients: 1, failedRecipients: 0 },
      { id: 4003, status: 'completed', totalRecipients: 2, sentRecipients: 2, failedRecipients: 0 },
      { id: 4004, status: 'partial', totalRecipients: 3, sentRecipients: 2, failedRecipients: 1 },
      { id: 4005, status: 'failed', totalRecipients: 1, sentRecipients: 0, failedRecipients: 1 },
    ],
    recipients: [
      { id: 5001, sendJobId: 4004, email: 'ok1@example.com', status: 'sent', errorMessage: null, retryable: false },
      { id: 5002, sendJobId: 4004, email: 'ok2@example.com', status: 'sent', errorMessage: null, retryable: false },
      { id: 5003, sendJobId: 4004, email: 'bounce@example.com', status: 'failed', errorMessage: 'Mailbox unavailable', retryable: true },
      { id: 5004, sendJobId: 4005, email: 'blocked@example.com', status: 'failed', errorMessage: 'Recipient blocked', retryable: false },
    ],
  };
}
