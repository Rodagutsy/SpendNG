# SpendNG Validation Rules

## Overview
This skill defines all validation rules for user inputs in SpendNG. Use this whenever implementing forms, manual transaction entry, or data validation.

## Manual Transaction Entry Validation

### Amount
- **Minimum**: 0.01
- **Maximum**: 999999999.99
- **Constraints**: 
  - Must be positive only
  - Maximum 2 decimal places
  - No negative values allowed
- **Error messages**:
  - Below minimum: "Amount must be at least 0.01"
  - Above maximum: "Amount cannot exceed 999,999,999.99"
  - Invalid format: "Amount must have at most 2 decimal places"
  - Zero or negative: "Amount must be greater than zero"

### Currency
- **Allowed values**: NGN, USD, GBP
- **Default**: NGN
- **Case**: Uppercase only
- **Error messages**:
  - Invalid currency: "Currency must be NGN, USD, or GBP"

### Transaction Type
- **Allowed values**: credit, debit
- **Case**: Lowercase only
- **Required**: Yes
- **Error messages**:
  - Missing: "Transaction type is required"
  - Invalid: "Transaction type must be credit or debit"

### Date
- **Format**: YYYY-MM-DD
- **Validation**:
  - Must be valid calendar date
  - Cannot be more than 100 years in the past
  - Can be future-dated (allowed per PRD section 6.5)
- **Error messages**:
  - Invalid format: "Date must be in format YYYY-MM-DD"
  - Invalid date: "Please enter a valid date"
  - Too far past: "Date cannot be more than 100 years ago"

### Category
- **Required**: Yes
- **Validation**: Must match existing category_id from categories table
- **Error messages**:
  - Missing: "Category is required"
  - Invalid: "Please select a valid category"

### Merchant/Payer Name
- **Optional**: Yes
- **Maximum length**: 255 characters
- **Allowed characters**: Alphanumeric, spaces, hyphens, apostrophes, periods
- **Error messages**:
  - Too long: "Merchant name cannot exceed 255 characters"

### Description/Notes
- **Optional**: Yes
- **Maximum length**: 120 characters
- **Error messages**:
  - Too long: "Notes cannot exceed 120 characters"

## User Account Validation

### Email
- **Required**: Yes
- **Format**: RFC 5322 compliant
- **Maximum length**: 255 characters
- **Validation pattern**: Must contain @ symbol, valid domain, no spaces
- **Error messages**:
  - Missing: "Email is required"
  - Invalid format: "Please enter a valid email address"
  - Too long: "Email cannot exceed 255 characters"
  - Already exists: "This email is already registered"

### Password
- **Minimum length**: 8 characters
- **Maximum length**: 255 characters
- **Requirements**: 
  - At least one number
  - At least one letter
  - No specific special character requirement (for Nigerian user accessibility)
- **Error messages**:
  - Too short: "Password must be at least 8 characters"
  - Missing number: "Password must contain at least one number"
  - Missing letter: "Password must contain at least one letter"

### Phone Number
- **Optional**: Yes
- **Format**: Nigerian phone numbers (11 digits starting with 0, or international format)
- **Validation pattern**: `^0[7-9][0-1]\d{8}$` or `^\+234[7-9][0-1]\d{8}$`
- **Error messages**:
  - Invalid format: "Please enter a valid Nigerian phone number"
  - Already exists: "This phone number is already registered"

### Display Name
- **Optional**: Yes
- **Maximum length**: 100 characters
- **Minimum length**: 2 characters if provided
- **Error messages**:
  - Too short: "Display name must be at least 2 characters"
  - Too long: "Display name cannot exceed 100 characters"

## Export Validation

### Date Range
- **Start date**: Required
- **End date**: Required
- **Validation**:
  - End date must be after or equal to start date
  - Range cannot exceed 5 years (per PRD section 6.7)
  - Both dates must be valid YYYY-MM-DD format
- **Error messages**:
  - Invalid order: "End date must be after start date"
  - Too large: "Date range cannot exceed 5 years"
  - Missing: "Please select both start and end dates"

### Export Format
- **Allowed values**: PDF, CSV
- **Required**: Yes
- **Error messages**:
  - Missing: "Please select an export format"

## Search Validation

### Amount Range
- **Minimum**: 0.01
- **Maximum**: 999999999.99
- **Validation**: If both min and max provided, min must be less than max
- **Error messages**:
  - Invalid range: "Minimum amount must be less than maximum amount"

### Date Range
- **Validation**: Same as Export date range
- **Optional**: Both start and end, or neither

### Free Text Search
- **Minimum length**: 1 character
- **Maximum length**: 255 characters
- **Trimmed**: Leading and trailing whitespace removed
- **Error messages**:
  - Too long: "Search query cannot exceed 255 characters"

## Recategorization Validation

### Category Selection
- **Required**: Yes
- **Validation**: Must be valid category_id from categories table
- **Error messages**:
  - Missing: "Please select a category"
  - Invalid: "Please select a valid category"

## Implementation Notes

### Client-Side Validation
All validation rules must be enforced on the client before submission to prevent unnecessary network requests and provide immediate feedback.

### Server-Side Validation
All validation rules must also be enforced server-side as the authoritative source of truth, even if client validation passes.

### Validation Timing
- Amount fields: Validate on blur and on submit
- Text fields: Validate on blur
- Required fields: Validate on submit
- Format fields (email, date): Validate on blur

### Error Display
- Show inline validation errors below the relevant field
- Use error color from design tokens: `{roles.system.error.main}`
- Error text should use `{typography.label.medium.r}` (12sp, regular)
- Clear error when user begins correcting the field

### Success Feedback
- Do not show success indicators for individual fields
- Only show success state after full form submission

### Accessibility
- All error messages must be announced by screen readers
- Error fields must have `aria-invalid="true"` attribute
- Error messages must have unique IDs referenced by `aria-describedby`

## Regular Expression Patterns

### Email (RFC 5322 simplified)
^[a-zA-Z0-9.!#

### Nigerian Phone Number
^(0[7-9][0-1]\d{8}|+234[7-9][0-1]\d{8})$

### Date Format (YYYY-MM-DD)
^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$

### Amount Format
^\d{1,9}(.\d{1,2})?$

## Testing Checklist

Before deploying any form or validation:
- [ ] Test minimum and maximum values for all numeric fields
- [ ] Test with empty/null values for optional fields
- [ ] Test with empty/null values for required fields
- [ ] Test with special characters in text fields
- [ ] Test with extremely long text inputs
- [ ] Test with invalid date formats
- [ ] Test with future dates
- [ ] Test with past dates beyond acceptable range
- [ ] Test with duplicate values where uniqueness is required
- [ ] Verify all error messages display correctly
- [ ] Verify all error messages are accessible to screen readers
- [ ] Test validation with reduced motion enabled
- [ ] Test validation on low-end Android devices
- [ ] Test server-side validation rejects invalid client-side submissions

