// PDF coordinate mappings — calibrated from actual PDF element positions
// Origin: bottom-left, Units: PDF points
//
// Text Y = fill-line Y + 3pt (baseline above underline, like handwriting on a form)
// Signature Y = anchor Y + offsetY (less negative = higher on page)

export const COORDINATES = {
  // =========================================================================
  // client-info-update — US Legal 612x1008pt, 2 pages
  // =========================================================================
  'client-info-update': {
    fields: {
      // Page 0 — y:819 (top) down to y:226 (banking)
      clientName:        { x: 150, y: 819, size: 10, page: 0 },
      accountType:       { x: 76,  y: 739, size: 9,  page: 0 },
      cdsAccountNo:      { x: 235, y: 739, size: 9,  page: 0 },
      newName:           { x: 120, y: 624, size: 10, page: 0 },
      nric:              { x: 245, y: 585, size: 10, page: 0 },
      residentStatus:    { x: 162, y: 564, size: 9,  page: 0 },
      addressType:       { x: 64,  y: 543, size: 9,  page: 0 },
      address:           { x: 100, y: 510, size: 9,  page: 0 },
      mobileNo:          { x: 120, y: 467, size: 10, page: 0 },
      homeTel:           { x: 405, y: 467, size: 10, page: 0 },
      officeNo:          { x: 120, y: 454, size: 10, page: 0 },
      email:             { x: 140, y: 435, size: 10, page: 0 },
      standingInstruction:{ x: 52,  y: 305, size: 9,  page: 0 },
      bankName:          { x: 130, y: 256, size: 10, page: 0 },
      bankAccountName:   { x: 170, y: 243, size: 10, page: 0 },
      bankAccountNo:     { x: 155, y: 230, size: 10, page: 0 },

      // Page 1 — y:886 (top) down to y:186 (signature)
      employmentStatus:  { x: 264, y: 886, size: 9,  page: 1 },
      employerName:      { x: 170, y: 867, size: 10, page: 1 },
      employerAddress:   { x: 210, y: 846, size: 9,  page: 1 },
      natureOfBusiness:  { x: 155, y: 799, size: 10, page: 1 },
      occupation:        { x: 170, y: 779, size: 10, page: 1 },
      grossAnnualIncome: { x: 154, y: 674, size: 8,  page: 1 },
      netWorth:          { x: 154, y: 633, size: 8,  page: 1 },
      sourceOfFunds:     { x: 154, y: 599, size: 8,  page: 1 },
      sourceOfWealth:    { x: 154, y: 550, size: 8,  page: 1 },
      kinName:           { x: 90,  y: 475, size: 10, page: 1 },
      kinRelationship:   { x: 170, y: 433, size: 10, page: 1 },
      kinMobile:         { x: 120, y: 416, size: 10, page: 1 },
      kinEmployment:     { x: 171, y: 399, size: 9,  page: 1 },
    },
  },

  // =========================================================================
  // change-of-dr — A4 595x842pt, 1 page
  // =========================================================================
  'change-of-dr': {
    fields: {
      clientName:        { x: 160, y: 745, size: 11, page: 0 },
      tradingAccountNo:  { x: 480, y: 745, size: 11, page: 0 },
      existingDrName:    { x: 160, y: 724, size: 11, page: 0 },
      existingDrCode:    { x: 460, y: 724, size: 11, page: 0 },
      newDrName:         { x: 160, y: 636, size: 11, page: 0 },
      newDrCode:         { x: 380, y: 636, size: 11, page: 0 },
      clientNric:        { x: 155, y: 377, size: 11, page: 0 },
    },
  },

  // =========================================================================
  // fen-declaration — A4 595x842pt, 4 pages
  // =========================================================================
  'fen-declaration': {
    fields: {
      applicantName:     { x: 150, y: 710, size: 11, page: 0 },
      tradingAccountNo:  { x: 200, y: 674, size: 11, page: 0 },
      dealerCode:        { x: 435, y: 674, size: 11, page: 0 },
      fenOption:         { x: 154, y: 552, size: 9,  page: 0 },
    },
  },

  // =========================================================================
  // w8ben — US Letter 612x792pt, 1 page
  // =========================================================================
  'w8ben': {
    fields: {
      beneficialOwnerName: { x: 250, y: 556, size: 10, page: 0 },
      countryOfCitizenship:{ x: 495, y: 556, size: 10, page: 0 },
      permanentAddress:    { x: 250, y: 532, size: 9,  page: 0 },
      mailingAddress:      { x: 250, y: 484, size: 9,  page: 0 },
      usTin:               { x: 250, y: 436, size: 10, page: 0 },
      foreignTaxId:        { x: 250, y: 410, size: 10, page: 0 },
      referenceNumber:     { x: 200, y: 386, size: 10, page: 0 },
      dateOfBirth:         { x: 490, y: 386, size: 10, page: 0 },
      treatyCountry:       { x: 250, y: 351, size: 10, page: 0 },
      specialRates:        { x: 250, y: 327, size: 9,  page: 0 },
    },
  },
};

// Signature anchor configs — higher offsetY = signature sits higher on the line
export const SIGNATURE_ANCHORS = {
  'client-info-update': [
    {
      page: 1,
      anchors: ['Signature of Client', 'Authorised Signatory'],
      offsetX: 40,
      offsetY: -5,
      sigWidth: 146,
      sigMaxHeight: 50,
      fallbackX: 87,
      fallbackY: 181,
    },
  ],
  'fen-declaration': [
    {
      page: 0,
      anchors: ['Signature', 'Tick'],
      offsetX: 20,
      offsetY: -15,
      sigWidth: 120,
      sigMaxHeight: 40,
      fallbackX: 90,
      fallbackY: 345,
    },
    {
      page: 1,
      anchors: ['Signature of Applicant'],
      offsetX: 0,
      offsetY: -30,
      sigWidth: 150,
      sigMaxHeight: 50,
      fallbackX: 41,
      fallbackY: 291,
    },
  ],
  'change-of-dr': [
    {
      page: 0,
      anchors: ['Signature', 'Confirmed by'],
      offsetX: -40,
      offsetY: 0,
      sigWidth: 150,
      sigMaxHeight: 55,
      fallbackX: 144,
      fallbackY: 398,
    },
  ],
  'w8ben': [
    {
      page: 0,
      anchors: ['Sign Here', 'Signature of beneficial owner'],
      offsetX: 120,
      offsetY: -25,
      sigWidth: 200,
      sigMaxHeight: 45,
      fallbackX: 156,
      fallbackY: 63,
    },
  ],
};
