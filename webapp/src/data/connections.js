const connectionsData = [
  {
    id: 1,
    name: 'Elon Tweets',
    created_at: 'Aug 13, 2024 5:52 AM',
    source: 'Google Sheets',
    destination: 'Pinecone',
    status: 'Ready',
    sync: 'Oct 12, 5:50 PM',
  },
  {
    id: 2,
    name: 'Q2 Sales Data',
    created_at: 'Aug 14, 2024 6:10 AM',
    source: 'Q2SalesData.pdf',
    destination: 'Qdrant',
    status: 'Draft',
    sync: 'Oct 16, 8:30 AM',
  },
  {
    id: 3,
    name: 'User Feedback',
    created_at: 'Sept 12, 2024 9:20 PM',
    source: 'MySQL',
    destination: 'AC Vector DB',
    status: 'Processing',
    sync: 'Oct 16, 8:30 AM',
  },
  {
    id: 4,
    name: 'Marketing Reports',
    created_at: 'Oct 10, 2024 10:10 AM',
    source: 'MarketingReports.xls',
    destination: 'Pinecone',
    status: 'Embedding',
    sync: 'Oct 16, 8:30 AM',
  },
  {
    id: 5,
    name: 'Bug Tracking',
    created_at: 'Aug 26, 2024 2:15 PM',
    source: 'Atlassian Jira',
    destination: 'Qdrant',
    status: 'Failed',
    sync: 'Oct 16, 8:30 AM',
  },
];

const jobHistoryData = [
  {
    jobId: 18,
    status: 'Success',
    duration: '2m 20s',
    last_updated: 'Aug 10, 5:52 AM - 5:59 AM',
  },
  {
    jobId: 12,
    status: 'Success',
    duration: '12m 20s',
    last_updated: 'Aug 10, 5:52 AM - 5:59 AM',
  },
  {
    jobId: 9,
    status: 'Success',
    duration: '12m 20s',
    last_updated: 'Aug10, 5:52 AM - 5:59 AM',
  },
];

export { connectionsData, jobHistoryData };
