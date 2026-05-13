export const FIELD_TYPES = {
  TEXT: 'text',
  SELECT: 'select',
  TEXTAREA: 'textarea',
  CHECKBOX: 'checkbox',
};

export const TEMPLATES = [
  {
    id: 'client-info-update',
    name: 'Client Info Update Form',
    pages: 2,
    sigCount: 1,
    fields: [
      { key: 'clientName', labelKey: 'clientName', type: 'text' },
      { key: 'accountType', labelKey: 'accountType', type: 'select', options: [
        { value: 'equities', label: 'Equities Trading & CDS Account' },
        { value: 'margin', label: 'Margin Trading & CDS Account' },
        { value: 'all', label: 'All Account(s)' },
      ]},
      { key: 'cdsAccountNo', labelKey: 'cdsAccountNo', type: 'text' },
      { key: 'newName', labelKey: 'newName', type: 'text' },
      { key: 'nric', labelKey: 'nric', type: 'text' },
      { key: 'residentStatus', labelKey: 'residentStatus', type: 'select', options: [
        { value: 'resident', label: 'Resident' },
        { value: 'non-resident', label: 'Non-Resident' },
      ]},
      { key: 'addressType', labelKey: 'addressType', type: 'select', options: [
        { value: 'registered', label: 'Registered Address' },
        { value: 'correspondence', label: 'Correspondence Address' },
      ]},
      { key: 'address', labelKey: 'address', type: 'textarea' },
      { key: 'mobileNo', labelKey: 'mobile', type: 'text' },
      { key: 'homeTel', labelKey: 'homeTel', type: 'text' },
      { key: 'officeNo', labelKey: 'officeNo', type: 'text' },
      { key: 'email', labelKey: 'email', type: 'text' },
      { key: 'standingInstruction', labelKey: 'standingInstruction', type: 'select', options: [
        { value: 'trust', label: 'Trust Account' },
        { value: 'bank', label: 'Designated Bank Account' },
      ]},
      { key: 'bankName', labelKey: 'bankName', type: 'text' },
      { key: 'bankAccountName', labelKey: 'bankAccountName', type: 'text' },
      { key: 'bankAccountNo', labelKey: 'bankAccountNo', type: 'text' },
      { key: 'employmentStatus', labelKey: 'employmentStatus', type: 'select', options: [
        { value: 'employed', label: 'Employed' },
        { value: 'self-employed', label: 'Self Employed' },
        { value: 'others', label: 'Others' },
      ]},
      { key: 'employerName', labelKey: 'employerName', type: 'text' },
      { key: 'employerAddress', labelKey: 'employerAddress', type: 'textarea' },
      { key: 'natureOfBusiness', labelKey: 'natureOfBusiness', type: 'text' },
      { key: 'occupation', labelKey: 'occupation', type: 'text' },
      { key: 'grossAnnualIncome', labelKey: 'grossAnnualIncome', type: 'select', options: [
        { value: 'below-12k', label: 'Below RM 12,000' },
        { value: '12k-24k', label: 'RM 12,000 – RM 24,000' },
        { value: '24k-36k', label: 'RM 24,001 – RM 36,000' },
        { value: '36k-48k', label: 'RM 36,001 – RM 48,000' },
        { value: '48k-60k', label: 'RM 48,001 – RM 60,000' },
        { value: '60k-100k', label: 'RM 60,001 – RM 100,000' },
        { value: '100k-300k', label: 'RM 100,001 – RM 300,000' },
        { value: '300k-600k', label: 'RM 300,001 – RM 600,000' },
        { value: '600k-800k', label: 'RM 600,001 – RM 800,000' },
        { value: '800k-1m', label: 'RM 800,001 – RM 1,000,000' },
        { value: '1m-3m', label: 'RM 1,000,001 – RM 3,000,000' },
        { value: 'above-3m', label: 'Above RM 3,000,001' },
      ]},
      { key: 'netWorth', labelKey: 'netWorth', type: 'select', options: [
        { value: 'below-50k', label: 'Below RM 50,000' },
        { value: '50k-100k', label: 'RM 50,000 – RM 100,000' },
        { value: '100k-200k', label: 'RM 100,001 – RM 200,000' },
        { value: '200k-500k', label: 'RM 200,001 – RM 500,000' },
        { value: '500k-1m', label: 'RM 500,001 – RM 1,000,000' },
        { value: '1m-2m', label: 'RM 1,000,001 – RM 2,000,000' },
        { value: '2m-3m', label: 'RM 2,000,001 – RM 3,000,000' },
        { value: 'above-3m', label: 'Above RM 3,000,001' },
      ]},
      { key: 'sourceOfFunds', labelKey: 'sourceOfFunds', type: 'select', options: [
        { value: 'salary', label: 'Salary' },
        { value: 'commission', label: 'Commission' },
        { value: 'business', label: 'Business Income' },
        { value: 'interest', label: 'Interest Income' },
        { value: 'rental', label: 'Rental' },
        { value: 'investment', label: 'Investment Income' },
      ]},
      { key: 'sourceOfWealth', labelKey: 'sourceOfWealth', type: 'select', options: [
        { value: 'savings', label: 'Savings' },
        { value: 'epf', label: 'Pension Fund / EPF' },
        { value: 'inheritance', label: 'Inheritance' },
        { value: 'gift', label: 'Gift' },
        { value: 'sale-property', label: 'Sale of Real Estate' },
      ]},
      { key: 'kinName', labelKey: 'kinName', type: 'text' },
      { key: 'kinRelationship', labelKey: 'kinRelationship', type: 'text' },
      { key: 'kinMobile', labelKey: 'kinMobile', type: 'text' },
      { key: 'kinEmployment', labelKey: 'kinEmployment', type: 'select', options: [
        { value: 'employed', label: 'Employed' },
        { value: 'self-employed', label: 'Self Employed' },
        { value: 'others', label: 'Others' },
      ]},
    ],
  },
  {
    id: 'fen-declaration',
    name: 'Individual FEN Declaration Form',
    pages: 4,
    sigCount: 2,
    fields: [
      { key: 'applicantName', labelKey: 'applicantName', type: 'text' },
      { key: 'tradingAccountNo', labelKey: 'tradingAccount', type: 'text' },
      { key: 'dealerCode', labelKey: 'dealerCode', type: 'text' },
      { key: 'fenOption', labelKey: 'fenOption', type: 'select', options: [
        { value: 'no-borrowing', label: 'No domestic Ringgit borrowing/financing' },
        { value: 'has-borrowing-within', label: 'Has borrowing, within threshold' },
        { value: 'has-borrowing-exceed', label: 'Has borrowing, exceeds threshold' },
      ]},
    ],
  },
  {
    id: 'change-of-dr',
    name: 'Request for Change of DR',
    pages: 1,
    sigCount: 1,
    fields: [
      { key: 'clientName', labelKey: 'clientName', type: 'text' },
      { key: 'tradingAccountNo', labelKey: 'tradingAccount', type: 'text' },
      { key: 'existingDrName', labelKey: 'existingDrName', type: 'text' },
      { key: 'existingDrCode', labelKey: 'existingDrCode', type: 'text' },
      { key: 'newDrName', labelKey: 'newDrName', type: 'text' },
      { key: 'newDrCode', labelKey: 'newDrCode', type: 'text' },
      { key: 'clientNric', labelKey: 'clientNric', type: 'text' },
    ],
  },
  {
    id: 'w8ben',
    name: 'W-8BEN Form',
    pages: 1,
    sigCount: 1,
    fields: [
      { key: 'beneficialOwnerName', labelKey: 'beneficialOwnerName', type: 'text' },
      { key: 'countryOfCitizenship', labelKey: 'countryOfCitizenship', type: 'text' },
      { key: 'permanentAddress', labelKey: 'permanentAddress', type: 'textarea' },
      { key: 'mailingAddress', labelKey: 'mailingAddress', type: 'textarea' },
      { key: 'usTin', labelKey: 'usTin', type: 'text' },
      { key: 'foreignTaxId', labelKey: 'foreignTaxId', type: 'text' },
      { key: 'referenceNumber', labelKey: 'referenceNumber', type: 'text' },
      { key: 'dateOfBirth', labelKey: 'dateOfBirth', type: 'text' },
      { key: 'treatyCountry', labelKey: 'treatyCountry', type: 'text' },
      { key: 'specialRates', labelKey: 'specialRates', type: 'text' },
    ],
  },
];

export function getTemplate(id) {
  return TEMPLATES.find(t => t.id === id) || null;
}

// Short names for PDF file naming
export const TEMPLATE_SHORT_NAMES = {
  'client-info-update': 'ClientInfoUpdate',
  'fen-declaration': 'FENDeclaration',
  'change-of-dr': 'ChangeOfDR',
  'w8ben': 'W8BEN',
};
