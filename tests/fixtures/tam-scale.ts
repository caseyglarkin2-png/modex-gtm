export type TamCompanyFixture = {
  companyId: string;
  name: string;
  domain: string;
};

export type TamContactFixture = {
  contactId: string;
  companyId: string;
  fullName: string;
  email: string;
};

export function buildTamScaleFixture(companyCount = 1000, contactCount = 13000): {
  companies: TamCompanyFixture[];
  contacts: TamContactFixture[];
} {
  const companies = Array.from({ length: companyCount }, (_, idx) => {
    const n = idx + 1;
    return {
      companyId: `c-${n}`,
      name: `TAM Company ${n}`,
      domain: `tam-company-${n}.example.com`,
    };
  });

  const contacts = Array.from({ length: contactCount }, (_, idx) => {
    const n = idx + 1;
    const company = companies[idx % companies.length];
    return {
      contactId: `p-${n}`,
      companyId: company.companyId,
      fullName: `Contact ${n}`,
      email: `contact${n}@${company.domain}`,
    };
  });

  return { companies, contacts };
}
