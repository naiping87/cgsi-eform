// PDF coordinate mappings - origin is bottom-left corner
// Units: PDF points (1pt = 1/72 inch)

// Text field coordinates (absolute — these are precisely mapped to form fields)
export const COORDINATES = {
  'client-info-update': {
    fields: {
      clientName:        { x: 120, y: 710, size: 10, page: 0 },
      accountType:       { x: 120, y: 680, size: 10, page: 0 },
      cdsAccountNo:      { x: 120, y: 660, size: 10, page: 0 },
      newName:           { x: 120, y: 560, size: 10, page: 0 },
      nric:              { x: 120, y: 530, size: 10, page: 0 },
      residentStatus:    { x: 120, y: 510, size: 10, page: 0 },
      addressType:       { x: 120, y: 490, size: 10, page: 0 },
      address:           { x: 120, y: 450, size: 10, page: 0 },
      mobileNo:          { x: 120, y: 380, size: 10, page: 0 },
      homeTel:           { x: 300, y: 380, size: 10, page: 0 },
      officeNo:          { x: 480, y: 380, size: 10, page: 0 },
      email:             { x: 120, y: 350, size: 10, page: 0 },
      standingInstruction: { x: 120, y: 300, size: 10, page: 0 },
      bankName:          { x: 120, y: 260, size: 10, page: 0 },
      bankAccountName:   { x: 120, y: 245, size: 10, page: 0 },
      bankAccountNo:     { x: 120, y: 230, size: 10, page: 0 },
      employmentStatus:  { x: 120, y: 680, size: 10, page: 1 },
      employerName:      { x: 120, y: 640, size: 10, page: 1 },
      employerAddress:   { x: 120, y: 610, size: 10, page: 1 },
      natureOfBusiness:  { x: 120, y: 570, size: 10, page: 1 },
      occupation:        { x: 120, y: 540, size: 10, page: 1 },
      grossAnnualIncome: { x: 120, y: 460, size: 10, page: 1 },
      netWorth:          { x: 120, y: 420, size: 10, page: 1 },
      sourceOfFunds:     { x: 120, y: 380, size: 10, page: 1 },
      sourceOfWealth:    { x: 120, y: 340, size: 10, page: 1 },
      kinName:           { x: 120, y: 240, size: 10, page: 1 },
      kinRelationship:   { x: 350, y: 240, size: 10, page: 1 },
      kinMobile:         { x: 120, y: 210, size: 10, page: 1 },
      kinEmployment:     { x: 120, y: 190, size: 10, page: 1 },
    },
  },

  'fen-declaration': {
    fields: {
      applicantName:     { x: 150, y: 620, size: 11, page: 0 },
      tradingAccountNo:  { x: 150, y: 600, size: 11, page: 0 },
      dealerCode:        { x: 150, y: 580, size: 11, page: 0 },
      fenOption:         { x: 80,  y: 480, size: 10, page: 0 },
    },
  },

  'change-of-dr': {
    fields: {
      clientName:        { x: 150, y: 650, size: 11, page: 0 },
      tradingAccountNo:  { x: 400, y: 650, size: 11, page: 0 },
      existingDrName:    { x: 150, y: 610, size: 11, page: 0 },
      existingDrCode:    { x: 450, y: 610, size: 11, page: 0 },
      newDrName:         { x: 150, y: 540, size: 11, page: 0 },
      newDrCode:         { x: 450, y: 540, size: 11, page: 0 },
      clientNric:        { x: 120, y: 270, size: 11, page: 0 },
    },
  },

  'w8ben': {
    fields: {
      beneficialOwnerName: { x: 120, y: 620, size: 10, page: 0 },
      countryOfCitizenship:{ x: 120, y: 600, size: 10, page: 0 },
      permanentAddress:    { x: 120, y: 570, size: 10, page: 0 },
      mailingAddress:      { x: 120, y: 520, size: 10, page: 0 },
      usTin:               { x: 120, y: 480, size: 10, page: 0 },
      foreignTaxId:        { x: 120, y: 460, size: 10, page: 0 },
      referenceNumber:     { x: 120, y: 440, size: 10, page: 0 },
      dateOfBirth:         { x: 120, y: 420, size: 10, page: 0 },
      treatyCountry:       { x: 120, y: 350, size: 10, page: 0 },
      specialRates:        { x: 120, y: 310, size: 10, page: 0 },
    },
  },
};

// Signature anchor configurations — keyword-based relative positioning
// The system searches PDF text for anchor keywords, then places the signature
// at: anchor.x + offsetX, anchor.y + offsetY (PDF coords, origin bottom-left)
//
// offsetY should be NEGATIVE to place signature BELOW the anchor text
//
// sigWidth: target signature width in PDF points (~216pt = 3 inches)
// sigHeight: auto-calculated from aspect ratio, capped by sigMaxHeight
export const SIGNATURE_ANCHORS = {
  'client-info-update': [
    {
      page: 1,
      anchors: ['Signature', 'Tandatangan', 'Tandatangan Pelanggan', 'Client Signature'],
      offsetX: 0,
      offsetY: -40,
      sigWidth: 216,
      sigMaxHeight: 60,
      // Fallback: bottom-left area of page 1 (pdf-lib A4 page: 595 x 842)
      fallbackX: 80,
      fallbackY: 100,
    },
  ],

  'fen-declaration': [
    {
      page: 0,
      anchors: ['Signature', 'Tandatangan', 'Applicant'],
      offsetX: 250,
      offsetY: -20,
      sigWidth: 150,
      sigMaxHeight: 50,
      fallbackX: 400,
      fallbackY: 450,
    },
    {
      page: 3,
      anchors: ['Signature', 'Tandatangan', 'Date'],
      offsetX: 0,
      offsetY: -40,
      sigWidth: 180,
      sigMaxHeight: 60,
      fallbackX: 80,
      fallbackY: 150,
    },
  ],

  'change-of-dr': [
    {
      page: 0,
      anchors: ['Signature', 'Tandatangan', 'Confirmed', 'Client'],
      offsetX: 80,
      offsetY: -50,
      sigWidth: 216,
      sigMaxHeight: 60,
      fallbackX: 350,
      fallbackY: 280,
    },
  ],

  'w8ben': [
    {
      page: 0,
      anchors: ['Signature', 'Sign Here', '11.', 'Part II'],
      offsetX: 0,
      offsetY: -45,
      sigWidth: 216,
      sigMaxHeight: 60,
      fallbackX: 80,
      fallbackY: 160,
    },
  ],
};
