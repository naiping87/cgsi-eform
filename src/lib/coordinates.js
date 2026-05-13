// PDF coordinate mappings — origin is bottom-left corner
// Units: PDF points (1pt = 1/72 inch)

// Text field coordinates — precisely mapped via PDF text extraction
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

// Signature anchor configurations — calibrated from actual PDF text extraction
//
// Each entry defines what text to search for as an anchor, and the relative
// offset to place the signature from that anchor point.
//
// offsetX: move right from anchor (+ = right)
// offsetY: move down from anchor (- = lower on page, since PDF origin is bottom-left)
//
// Calibrated 2026-05-13 using pdfjs-dist text extraction.
export const SIGNATURE_ANCHORS = {
  // ---------------------------------------------------------------------------
  // client-info-update: 2 pages (612 x 1008 pt), 1 signature on page 1
  // Anchor: "Signature of Client / Authorised Signatory" at x:47, y:186
  // Signature goes below anchor, above "FOR OFFICE USE ONLY" at y:137
  // ---------------------------------------------------------------------------
  'client-info-update': [
    {
      page: 1,
      anchors: ['Signature of Client', 'Authorised Signatory'],
      offsetX: 0,
      offsetY: -60,  // below "Signature of Client" label
      sigWidth: 146,
      sigMaxHeight: 50,
      fallbackX: 47,
      fallbackY: 126,
    },
  ],

  // ---------------------------------------------------------------------------
  // fen-declaration: 4 pages (595 x 842 pt), 2 signatures
  // sig1 (page 0): checkbox "Signature" column at x:90, y:362
  // sig2 (page 1): "Signature of Applicant" at x:41, y:321
  // ---------------------------------------------------------------------------
  'fen-declaration': [
    {
      page: 0,
      anchors: ['Signature', 'Tick'],
      offsetX: 20,
      offsetY: -30,
      sigWidth: 120,
      sigMaxHeight: 40,
      fallbackX: 90,
      fallbackY: 330,
    },
    {
      page: 1,
      anchors: ['Signature of Applicant'],
      offsetX: 0,
      offsetY: -50,  // below "Signature of Applicant", above Name/Date fields
      sigWidth: 150,
      sigMaxHeight: 50,
      fallbackX: 41,
      fallbackY: 271,
    },
  ],

  // ---------------------------------------------------------------------------
  // change-of-dr: 1 page (595 x 842 pt), 1 signature
  // Client section: "(Signature)" at x:183, y:398
  // Dotted signature line starts at x:144, y:398
  // Below: "Name:" at y:388, "NRIC/Company No.:" at y:377
  // Dealer section: "TO BE COMPLETED BY NEW DEALER'S REPRESENTATIVE" at y:343
  // ---------------------------------------------------------------------------
  'change-of-dr': [
    {
      page: 0,
      anchors: ['(Signature)', 'Confirmed by'],
      offsetX: -40,  // left of "(Signature)" text, onto the dotted line
      offsetY: -60,  // below the signature line
      sigWidth: 150,
      sigMaxHeight: 55,
      fallbackX: 144,
      fallbackY: 338,
    },
  ],

  // ---------------------------------------------------------------------------
  // w8ben: 1 page (612 x 792 pt), 1 signature
  // "Sign Here" at x:36, y:88 ← PERFECT anchor
  // "Signature of beneficial owner..." at x:139, y:64
  // "Print name of signer" at x:108, y:40
  // Signature goes between y:64 and y:40
  // ---------------------------------------------------------------------------
  'w8ben': [
    {
      page: 0,
      anchors: ['Sign Here', 'Signature of beneficial owner'],
      offsetX: 65,   // centered under "Sign Here", aligned with signature line
      offsetY: -40,  // below "Sign Here" text, above "Print name"
      sigWidth: 200,
      sigMaxHeight: 50,
      fallbackX: 100,
      fallbackY: 48,
    },
  ],
};
