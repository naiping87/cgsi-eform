// PDF coordinate mappings — calibrated from actual PDF element positions
// Origin: bottom-left, Units: PDF points
//
// Method: extracted all underline/dotted-line positions (the form's fill-in blanks)
// from each PDF using pdfjs-dist. These are the intended fill positions.

export const COORDINATES = {
  // =========================================================================
  // client-info-update — US Legal 612x1008pt, 2 pages
  // Fill lines found at:
  //   Page 0: CDS number lines at x:76/235/394 y:735, cancel line at x:183 y:412
  //   Page 1: Relationship at x:170 y:433, Designation x:170 y:366, Employer x:170 y:346
  // =========================================================================
  'client-info-update': {
    fields: {
      // Page 0 — Personal / Contact / Banking (y ranges from 819 down to 226)
      clientName:        { x: 150, y: 815, size: 10, page: 0 },  // label at x:47,y:819
      accountType:       { x: 76,  y: 735, size: 9,  page: 0 },  // CDS col1 underline
      cdsAccountNo:      { x: 235, y: 730, size: 9,  page: 0 },  // CDS col2 underline
      newName:           { x: 120, y: 620, size: 10, page: 0 },  // label at x:47,y:624
      nric:              { x: 245, y: 581, size: 10, page: 0 },  // label at x:47,y:585
      residentStatus:    { x: 162, y: 560, size: 9,  page: 0 },  // checkbox at x:147,y:564
      addressType:       { x: 64,  y: 539, size: 9,  page: 0 },  // checkbox at x:49,y:543
      address:           { x: 100, y: 505, size: 9,  page: 0 },  // label at x:47,y:514
      mobileNo:          { x: 120, y: 463, size: 10, page: 0 },  // label at x:47,y:467
      homeTel:           { x: 405, y: 463, size: 10, page: 0 },  // label at x:333,y:467
      officeNo:          { x: 120, y: 450, size: 10, page: 0 },  // label at x:47,y:454
      email:             { x: 140, y: 431, size: 10, page: 0 },  // label at x:52,y:435
      standingInstruction:{ x: 52,  y: 300, size: 9,  page: 0 },  // checkbox at y:300
      bankName:          { x: 130, y: 252, size: 10, page: 0 },  // label at x:52,y:256
      bankAccountName:   { x: 170, y: 239, size: 10, page: 0 },  // label at x:52,y:243
      bankAccountNo:     { x: 155, y: 226, size: 10, page: 0 },  // label at x:52,y:230

      // Page 1 — Employment / Financial / Kin (y ranges from 886 down to 186)
      employmentStatus:  { x: 264, y: 882, size: 9,  page: 1 },  // checkbox at x:246,y:886
      employerName:      { x: 170, y: 863, size: 10, page: 1 },  // label at x:47,y:867; fill line at x:170,y:346 (wrong page, use label offset)
      employerAddress:   { x: 210, y: 842, size: 9,  page: 1 },  // label at x:47,y:846
      natureOfBusiness:  { x: 155, y: 795, size: 10, page: 1 },  // label at x:47,y:799
      occupation:        { x: 170, y: 775, size: 10, page: 1 },  // fill line at x:170,y:366 (same x as page 1 relationship line)
      grossAnnualIncome: { x: 154, y: 670, size: 8,  page: 1 },  // 1st checkbox grid row
      netWorth:          { x: 154, y: 629, size: 8,  page: 1 },  // 1st checkbox grid row
      sourceOfFunds:     { x: 154, y: 595, size: 8,  page: 1 },  // 1st checkbox grid row
      sourceOfWealth:    { x: 154, y: 546, size: 8,  page: 1 },  // 1st checkbox grid row
      kinName:           { x: 90,  y: 471, size: 10, page: 1 },  // label at x:47,y:475
      kinRelationship:   { x: 170, y: 430, size: 10, page: 1 },  // fill line at x:170,y:433
      kinMobile:         { x: 120, y: 412, size: 10, page: 1 },  // label at x:47,y:416
      kinEmployment:     { x: 171, y: 391, size: 9,  page: 1 },  // checkbox at x:156,y:395
    },
  },

  // =========================================================================
  // change-of-dr — A4 595x842pt, 1 page
  // Fill lines (dotted) at:
  //   Client name underline in text at x:300 y:745
  //   Trading A/C underline at x:507 y:745
  //   Existing DR code at x:407-497 y:724
  //   New DR name underline at x:301 y:636
  //   New DR code at x:407-468 y:636
  //   Signature dotted lines at y:398, y:228
  // =========================================================================
  'change-of-dr': {
    fields: {
      clientName:        { x: 160, y: 740, size: 11, page: 0 },  // right of "Client's Name :"
      tradingAccountNo:  { x: 480, y: 740, size: 11, page: 0 },  // right of "Trading A/C No. :"
      existingDrName:    { x: 160, y: 720, size: 11, page: 0 },  // right of "Name & Code of Existing DR :"
      existingDrCode:    { x: 460, y: 720, size: 11, page: 0 },  // on "Code: ______" line
      newDrName:         { x: 160, y: 632, size: 11, page: 0 },  // right of "Name & Code of DR :"
      newDrCode:         { x: 380, y: 632, size: 11, page: 0 },  // on "Code_____" line
      clientNric:        { x: 155, y: 373, size: 11, page: 0 },  // right of "NRIC/Company No. :"
    },
  },

  // =========================================================================
  // fen-declaration — A4 595x842pt, 4 pages
  // No fill lines detected — placing values right of labels
  // =========================================================================
  'fen-declaration': {
    fields: {
      applicantName:     { x: 150, y: 706, size: 11, page: 0 },  // label at x:41,y:710
      tradingAccountNo:  { x: 200, y: 670, size: 11, page: 0 },  // label at x:41,y:674
      dealerCode:        { x: 435, y: 670, size: 11, page: 0 },  // label at x:345,y:674
      fenOption:         { x: 154, y: 548, size: 9,  page: 0 },  // near checkbox area
    },
  },

  // =========================================================================
  // w8ben — US Letter 612x792pt, 1 page
  // No fill lines — placing on form lines to the right of labels
  // =========================================================================
  'w8ben': {
    fields: {
      beneficialOwnerName: { x: 250, y: 552, size: 10, page: 0 },  // Line 1, label at x:64,y:556
      countryOfCitizenship:{ x: 495, y: 552, size: 10, page: 0 },  // Line 2, label at x:394,y:556
      permanentAddress:    { x: 250, y: 528, size: 9,  page: 0 },  // Line 3, label at x:64,y:532
      mailingAddress:      { x: 250, y: 480, size: 9,  page: 0 },  // Line 4, label at x:64,y:484
      usTin:               { x: 250, y: 432, size: 10, page: 0 },  // Line 5, label at x:65,y:436
      foreignTaxId:        { x: 250, y: 406, size: 10, page: 0 },  // Line 6a, label at x:64,y:410
      referenceNumber:     { x: 200, y: 382, size: 10, page: 0 },  // Line 7, label at x:64,y:386
      dateOfBirth:         { x: 490, y: 382, size: 10, page: 0 },  // Line 8, label at x:311,y:386
      treatyCountry:       { x: 250, y: 347, size: 10, page: 0 },  // Line 9, label at x:65,y:351
      specialRates:        { x: 250, y: 323, size: 9,  page: 0 },  // Line 10, label at x:65,y:327
    },
  },
};

// Signature anchor configs — searched text → offset → placement
export const SIGNATURE_ANCHORS = {
  'client-info-update': [
    {
      page: 1,
      anchors: ['Signature of Client', 'Authorised Signatory'],
      offsetX: 0,
      offsetY: -60,
      sigWidth: 146,
      sigMaxHeight: 50,
      fallbackX: 47,
      fallbackY: 126,
    },
  ],
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
      offsetY: -50,
      sigWidth: 150,
      sigMaxHeight: 50,
      fallbackX: 41,
      fallbackY: 271,
    },
  ],
  'change-of-dr': [
    {
      page: 0,
      anchors: ['Signature', 'Confirmed by'],
      offsetX: -40,
      offsetY: -60,
      sigWidth: 150,
      sigMaxHeight: 55,
      fallbackX: 144,
      fallbackY: 338,
    },
  ],
  'w8ben': [
    {
      page: 0,
      anchors: ['Sign Here', 'Signature of beneficial owner'],
      offsetX: 120,
      offsetY: -20,
      sigWidth: 200,
      sigMaxHeight: 45,
      fallbackX: 156,
      fallbackY: 68,
    },
  ],
};
