import type { DocumentEditor } from '@syncfusion/ej2-documenteditor';
import { buildEmployeeOnboarding } from './authoring/buildEmployeeOnboarding';
import { buildEmployeeInformationSheet } from './authoring/buildEmployeeInformationSheet';
import { buildWelcomeLetter } from './authoring/buildWelcomeLetter';
import { buildOfferLetter } from './authoring/buildOfferLetter';
import { buildNdaAgreement } from './authoring/buildNdaAgreement';
import { buildAssetRequestForm } from './authoring/buildAssetRequestForm';
import { buildBenefitsEnrollmentForm } from './authoring/buildBenefitsEnrollmentForm';
import { buildBackgroundVerificationForm } from './authoring/buildBackgroundVerificationForm';

/**
 * Predefined templates are constructed at runtime from these builders (each uses the live
 * DocumentEditor's own editing APIs) rather than loaded from a static .sfdt. This keeps the
 * shipped forms in lock-step with the builder source — no regeneration step — and every
 * field name stays aligned to an EmployeeRecord key so auto-fill maps cleanly (CLAUDE.md §9).
 */
export const PREDEFINED_BUILDERS: Record<string, (editor: DocumentEditor) => void> = {
  'employee-onboarding': buildEmployeeOnboarding,
  'employee-information-sheet': buildEmployeeInformationSheet,
  'welcome-letter': buildWelcomeLetter,
  'offer-letter': buildOfferLetter,
  'nda-agreement': buildNdaAgreement,
  'asset-request-form': buildAssetRequestForm,
  'benefits-enrollment-form': buildBenefitsEnrollmentForm,
  'background-verification-form': buildBackgroundVerificationForm,
};
