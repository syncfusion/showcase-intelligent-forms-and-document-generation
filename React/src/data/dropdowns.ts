import type { DropdownKey } from '@/types';

/**
 * Static option lists for runtime dropdown fields, keyed by DropdownKey.
 * Served asynchronously by mockApi.getDropdown() to simulate a backend call.
 */
export const dropdownOptions: Record<DropdownKey, string[]> = {
  department: [
    'Engineering',
    'Human Resources',
    'Sales',
    'Marketing',
    'Finance',
    'Legal',
    'Operations',
    'Customer Success',
  ],
  designation: [
    'Software Engineer',
    'Senior Software Engineer',
    'Engineering Manager',
    'QA Engineer',
    'Product Designer',
    'HR Business Partner',
    'Recruiter',
    'Account Executive',
    'Sales Director',
    'Marketing Manager',
    'Financial Analyst',
    'Controller',
    'Corporate Counsel',
    'Operations Coordinator',
    'Facilities Manager',
  ],
  location: [
    'San Francisco, CA',
    'New York, NY',
    'Austin, TX',
    'Chicago, IL',
    'Denver, CO',
    'Boston, MA',
    'Seattle, WA',
    'Atlanta, GA',
    'Miami, FL',
    'Dallas, TX',
    'Portland, OR',
    'Phoenix, AZ',
    'Minneapolis, MN',
    'Charlotte, NC',
    'Remote - United States',
  ],
  employmentType: ['Full-Time', 'Part-Time', 'Contract', 'Intern', 'Temporary'],
  assetType: [
    'Laptop - Standard',
    'Laptop - Developer',
    'Monitor (24")',
    'Monitor (27")',
    'Docking Station',
    'Mobile Phone',
    'Headset',
    'Office Chair',
    'Company Vehicle',
  ],
  benefitPlan: [
    'Medical - PPO Base',
    'Medical - PPO Plus',
    'Medical - HDHP + HSA',
    'Dental - Standard',
    'Vision - Standard',
    '401(k) - Standard Match',
    'Life Insurance - Basic',
    'Life Insurance - Supplemental',
  ],
  /** Two-letter USPS state/territory abbreviations, used on any US address field. */
  usState: [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
    'DC',
  ],
};

/**
 * Maps a form-field *name* (aligned to EmployeeRecord keys, per CLAUDE.md §9) to the
 * DropdownKey the mock backend should populate it from at runtime.
 */
export const FIELD_TO_DROPDOWN_KEY: Partial<Record<string, DropdownKey>> = {
  department: 'department',
  designation: 'designation',
  location: 'location',
  employmentType: 'employmentType',
  state: 'usState',
  assetType: 'assetType',
};
