export const mockApolloPerson = {
  id: 'apollo-person-0001',
  first_name: 'Casey',
  last_name: 'Larkin',
  email: 'casey@freightroll.com',
  title: 'GTM Lead',
  confidence: 0.92,
  organization: {
    name: 'FreightRoll',
    website_url: 'https://freightroll.com',
    industry: 'Logistics Technology',
  },
};

export const mockApolloSearchResponse = {
  people: [mockApolloPerson],
  pagination: {
    page: 1,
    per_page: 25,
    total_entries: 1,
  },
};
