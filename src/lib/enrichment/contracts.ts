import { z } from 'zod';

export const HubSpotContactFixtureSchema = z.object({
  id: z.string().min(1),
  properties: z.object({
    email: z.string().email().or(z.literal('')),
    firstname: z.string(),
    lastname: z.string(),
    company: z.string(),
    jobtitle: z.string(),
    hs_lead_status: z.string().optional(),
    lifecyclestage: z.string().optional(),
  }).passthrough(),
}).passthrough();

export const HubSpotCompanyFixtureSchema = z.object({
  id: z.string().min(1),
  properties: z.object({
    name: z.string(),
    domain: z.string().optional(),
    industry: z.string().optional(),
  }).passthrough(),
}).passthrough();

export const ApolloPersonFixtureSchema = z.object({
  id: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email().optional(),
  title: z.string().optional(),
  organization: z.object({
    name: z.string().min(1),
    website_url: z.string().optional(),
    industry: z.string().optional(),
  }).optional(),
  confidence: z.number().min(0).max(1).optional(),
}).passthrough();

export const ApolloSearchResponseFixtureSchema = z.object({
  people: z.array(ApolloPersonFixtureSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    per_page: z.number().int().positive(),
    total_entries: z.number().int().nonnegative(),
  }),
}).passthrough();
