import type { TemplateMeta } from '@/types';

/** Vite replaces import.meta.env.BASE_URL with the configured base at build time
 *  ('/intelligent-forms-doc-generation/react/' in production, '/' in dev). */
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/**
 * Predefined template catalog. Each entry is built at runtime by the matching function in
 * src/templates/predefinedBuilders.ts (keyed by `builderId`), so the shipped forms always
 * match the builder source and every field name stays aligned to an EmployeeRecord key.
 */
export const predefinedTemplates: TemplateMeta[] = [
  {
    id: 'employee-onboarding',
    docType: 'form',
    image: `${base}/gallery/OnBoarding.png`,
    title: 'Employee Onboarding Form',
    description:
      'New-hire intake: personal and role details, work location, emergency contact, and policy acknowledgments.',
    accent: 'indigo',
    source: 'predefined',
    builderId: 'employee-onboarding',
  },
  {
    id: 'employee-information-sheet',
    docType: 'form',
    image: `${base}/gallery/EmployeInformation.png`,
    title: 'Employee Information Sheet',
    description: 'A single-page master record of an employee’s identity, role, contact, and address details.',
    accent: 'teal',
    source: 'predefined',
    builderId: 'employee-information-sheet',
  },
  {
    id: 'welcome-letter',
    docType: 'letter',
    image: `${base}/gallery/WelcomeLetter.png`,
    title: 'Welcome Letter',
    description: 'A warm, personalized welcome letter sent ahead of an employee’s first day.',
    accent: 'amber',
    source: 'predefined',
    builderId: 'welcome-letter',
  },
  {
    id: 'offer-letter',
    docType: 'letter',
    image: `${base}/gallery/Offer_letter.png`,
    title: 'Offer Letter',
    description: 'Formal offer of employment with title, compensation, work location, and start date.',
    accent: 'rose',
    source: 'predefined',
    builderId: 'offer-letter',
  },
  {
    id: 'nda-agreement',
    docType: 'letter',
    image: `${base}/gallery/NDA.png`,
    title: 'NDA Agreement',
    description: 'Mutual non-disclosure agreement for new hires and contractors, with signature block.',
    accent: 'slate',
    source: 'predefined',
    builderId: 'nda-agreement',
  },
  {
    id: 'asset-request-form',
    docType: 'form',
    image: `${base}/gallery/AssestReq.png`,
    title: 'Asset Request Form',
    description: 'Requests company equipment issuance for an employee, with cost center and approval.',
    accent: 'sky',
    source: 'predefined',
    builderId: 'asset-request-form',
  },
  {
    id: 'benefits-enrollment-form',
    docType: 'form',
    image: `${base}/gallery/Benefits_enrollment.png`,
    title: 'Benefits Enrollment Form',
    description: 'Captures medical, dental, vision, life, and 401(k) elections with dependent details.',
    accent: 'violet',
    source: 'predefined',
    builderId: 'benefits-enrollment-form',
  },
  {
    id: 'background-verification-form',
    docType: 'form',
    image: `${base}/gallery/BackgroundVerification.png`,
    title: 'Background Verification Form',
    description: 'Authorizes and records employment, education, and reference verification checks.',
    accent: 'emerald',
    source: 'predefined',
    builderId: 'background-verification-form',
  },
];
