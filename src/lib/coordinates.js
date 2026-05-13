// PDF coordinate mappings - origin is bottom-left corner
// Units: PDF points (1pt = 1/72 inch)

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
    signatures: [
      { x: 80, y: 60, w: 150, h: 50, page: 1 },
    ],
  },

  'fen-declaration': {
    fields: {
      applicantName:     { x: 150, y: 620, size: 11, page: 0 },
      tradingAccountNo:  { x: 150, y: 600, size: 11, page: 0 },
      dealerCode:        { x: 150, y: 580, size: 11, page: 0 },
      fenOption:         { x: 80,  y: 480, size: 10, page: 0 },
    },
    signatures: [
      { x: 450, y: 480, w: 120, h: 40, page: 0 },
      { x: 80,  y: 100, w: 150, h: 50, page: 3 },
    ],
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
    signatures: [
      { x: 200, y: 320, w: 150, h: 50, page: 0 },
    ],
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
    signatures: [
      { x: 80, y: 140, w: 150, h: 50, page: 0 },
    ],
  },
};
