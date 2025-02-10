const dataSourceComboBoxData = [
  {
    value: '1',
    label: 'Elon tweets',
    title: 'Elon tweets',
    type: 'Airtable',
  },
  {
    value: '2',
    label: 'Sample Datasource',
    title: 'Sample Datasource',
    type: 'File',
  },
  {
    value: '3',
    label: 'Grants',
    title: 'Grants',
    type: 'Airtable',
  },
];

export const toolsData = [
  {
    title: 'Agent Cloud RAG Tool',
    label: 'Agent Cloud RAG Tool',
    value: '1',
    description:
      'Use this to RAG datasources which you have synced or added to Agent Cloud',
    isInstalled: false,
    tags: [
      {
        name: 'RAG',
        textColor: '#B43403',
        backgroundColor: '#FEECDC',
      },
    ],
  },
  {
    title: 'Search LinkedIn',
    label: 'Search LinkedIn 1',
    value: '2',
    description:
      'This tool allows you to search for LinkedIn professional Profiles',
    isInstalled: false,
    tags: [
      {
        name: 'RAG',
        textColor: '#B43403',
        backgroundColor: '#FEECDC',
      },
    ],
  },
  {
    title: 'Search LinkedIn',
    label: 'Search LinkedIn 2',
    value: '3',
    description:
      'This tool allows you to search for LinkedIn professional Profiles',
    isInstalled: false,
    tags: [
      {
        name: 'RAG',
        textColor: '#B43403',
        backgroundColor: '#FEECDC',
      },
    ],
  },
  {
    title: 'Search LinkedIn',
    label: 'Search LinkedIn 3',
    value: '4',
    description:
      'This tool allows you to search for LinkedIn professional Profiles',
    isInstalled: false,
    tags: [
      {
        name: 'RAG',
        textColor: '#B43403',
        backgroundColor: '#FEECDC',
      },
    ],
  },
  {
    title: 'Search LinkedIn',
    label: 'Search LinkedIn 4',
    value: '5',
    description:
      'This tool allows you to search for LinkedIn professional Profiles',
    isInstalled: false,
    tags: [
      {
        name: 'RAG',
        textColor: '#B43403',
        backgroundColor: '#FEECDC',
      },
    ],
  },
  {
    title: 'Search LinkedIn',
    label: 'Search LinkedIn 5',
    value: '6',
    description:
      'This tool allows you to search for LinkedIn professional Profiles',
    isInstalled: false,
    tags: [
      {
        name: 'RAG',
        textColor: '#B43403',
        backgroundColor: '#FEECDC',
      },
    ],
  },
  {
    title: 'Search LinkedIn',
    label: 'Search LinkedIn 6',
    value: '7',
    description:
      'This tool allows you to search for LinkedIn professional Profiles',
    isInstalled: false,
    tags: [
      {
        name: 'RAG',
        textColor: '#B43403',
        backgroundColor: '#FEECDC',
      },
    ],
  },
  {
    title: 'Search LinkedIn',
    label: 'Search LinkedIn 7',
    value: '8',
    description:
      'This tool allows you to search for LinkedIn professional Profiles',
    isInstalled: false,
    tags: [
      {
        name: 'RAG',
        textColor: '#B43403',
        backgroundColor: '#FEECDC',
      },
    ],
  },
  {
    title: 'Search LinkedIn',
    label: 'Search LinkedIn 8',
    value: '9',
    description:
      'This tool allows you to search for LinkedIn professional Profiles',
    isInstalled: false,
    tags: [
      {
        name: 'RAG',
        textColor: '#B43403',
        backgroundColor: '#FEECDC',
      },
    ],
  },
  {
    title: 'Search LinkedIn',
    label: 'Search LinkedIn 9',
    value: '10',
    description:
      'This tool allows you to search for LinkedIn professional Profiles',
    isInstalled: false,
    tags: [
      {
        name: 'RAG',
        textColor: '#B43403',
        backgroundColor: '#FEECDC',
      },
    ],
  },
  {
    title: 'Search LinkedIn',
    label: 'Search LinkedIn 10',
    value: '11',
    description:
      'This tool allows you to search for LinkedIn professional Profiles',
    isInstalled: false,
    tags: [
      {
        name: 'RAG',
        textColor: '#B43403',
        backgroundColor: '#FEECDC',
      },
    ],
  },
];

const agentsData = [
  {
    id: 1,
    name: 'Conversation Agent',
    label: 'Conversation Agent',
    role: 'Customer Support',
    dataSource: 'Feedback and Reviews',
    tool: 'Email Scraper',
    users: [
      {
        id: 2,
        name: "Adonia Product Recommender V2"
      },
      {
        id: 4,
        name: "Customer Support Bot"
      },
      {
        id: 7,
        name: "CRM Auto Chat"
      },
    ],
  },
  {
    id: 2,
    name: 'Leo Lead',
    label: 'Leo Lead',
    role: 'Lead Generator',
    dataSource: 'Feedback and Reviews',
    tool: 'LinkedIn API',
  },
  {
    id: 3,
    name: 'Alex Assistant',
    label: 'Alex Assistant',
    role: 'Brief Writer',
    dataSource: 'Company Data',
    tool: null,
  },
  {
    id: 4,
    name: 'Sam Scheduler',
    label: 'Sam Scheduler',
    role: 'Meeting Scheduler',
    dataSource: 'Calendar Events',
    tool: 'Google Calendar API',
  },
  {
    id: 5,
    name: 'Max Analyzer',
    label: 'Max Analyzer',
    role: 'Data Analyst',
    dataSource: 'HubSpot HRM',
    tool: 'LinkedIn Profile Search',
  },
  {
    id: 6,
    name: 'Mia Marketer',
    label: 'Mia Marketer',
    role: 'Social Media Manager',
    dataSource: 'Feedback and Reviews',
    tool: 'Email Scraper',
  },
];

export { dataSourceComboBoxData, agentsData };
