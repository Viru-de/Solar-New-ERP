# Security Specification: Rejoy Solar ERP / CRM

## 1. Data Invariants
1. **Default Deny**: Any document path not explicitly authorized is closed to all reads and writes (`match /{document=**} { allow read, write: if false; }`).
2. **Authenticated Access**: Unauthenticated visitors cannot read or write ERP operational data.
3. **Admin Authority**: The bootstrapped admin `dasest404@gmail.com` or users with `role == 'Admin'` registered in `/users/{userId}` have administrative override permissions across core ERP collections.
4. **User Profile Integrity**: Users can read their own profile document (`/users/{userId}`) or Admin can read any profile. Users cannot escalate their own `role` or tamper with other users' profiles.
5. **Path ID Integrity**: Document IDs must pass `isValidId()` (string, length <= 128, matching regex `^[a-zA-Z0-9_-]+$`) to prevent path injection and ID poisoning attacks.
6. **Payload Schema & Size Boundaries**: Strings must have length bounds and required keys must be provided to avoid Denial of Wallet and ghost field injections.
7. **CRM Lead Ownership**: Leads can be created by authenticated sales executives or admins, and can only be updated with allowed fields.
8. **Projects & Milestone Security**: Projects and service tickets cannot be deleted by non-admin roles.

---

## 2. The "Dirty Dozen" Payloads

1. **Payload 1: Unauthenticated Read Attempt on Users**
   * *Target*: `GET /users/user_abc`
   * *Payload*: `{}` (No auth token)
   * *Expectation*: `PERMISSION_DENIED`
2. **Payload 2: Path ID Poisoning Attack**
   * *Target*: `SET /leads/invalid..//path***id$$`
   * *Payload*: `{ customerName: "Malicious", phone: "1234567890", status: "NEW" }`
   * *Expectation*: `PERMISSION_DENIED` (fails `isValidId`)
3. **Payload 3: Privilege Escalation via User Profile Update**
   * *Target*: `UPDATE /users/{auth.uid}`
   * *Payload*: `{ role: "Admin" }` by an employee whose current role is `Technician`
   * *Expectation*: `PERMISSION_DENIED` (self-role alteration forbidden)
4. **Payload 4: Cross-User Profile Takeover**
   * *Target*: `SET /users/victim_user_uid`
   * *Payload*: `{ name: "Hacked", role: "Sales Executive", email: "victim@rejoysolar.com" }` (by `attacker_uid`)
   * *Expectation*: `PERMISSION_DENIED` (cannot write another user's profile)
5. **Payload 5: Oversized String Injection (Denial of Wallet)**
   * *Target*: `CREATE /leads/lead_123`
   * *Payload*: `{ customerName: "A".repeat(50000), phone: "9876543210", status: "NEW" }`
   * *Expectation*: `PERMISSION_DENIED` (fails max length bounds)
6. **Payload 6: Missing Required Keys on Lead Creation**
   * *Target*: `CREATE /leads/lead_124`
   * *Payload*: `{ notes: "Incomplete lead" }` (missing `customerName`, `phone`, `status`)
   * *Expectation*: `PERMISSION_DENIED`
7. **Payload 7: Shadow / Ghost Field Injection on Customer Creation**
   * *Target*: `CREATE /customers/cust_001`
   * *Payload*: `{ name: "Solar Factory", phone: "9998887776", city: "Ahmedabad", status: "ACTIVE", __shadowPrivilege: true }`
   * *Expectation*: `PERMISSION_DENIED` (fails strict allowed keys check)
8. **Payload 8: Customer Record Deletion by Field Worker**
   * *Target*: `DELETE /customers/cust_001`
   * *Auth*: Non-admin authenticated user (role: `Site Survey Engineer`)
   * *Expectation*: `PERMISSION_DENIED` (only Admin can delete master records)
9. **Payload 9: Unauthenticated CRM Quotation Write**
   * *Target*: `CREATE /quotations/quote_001`
   * *Payload*: `{ quotationNumber: "QT-2026-001", customerName: "Test", grandTotal: 500000, status: "DRAFT" }` (No auth)
   * *Expectation*: `PERMISSION_DENIED`
10. **Payload 10: Invalid Status Transition / Enum Bypass on Lead**
    * *Target*: `UPDATE /leads/lead_123`
    * *Payload*: `{ status: "SUPER_WON_UNAPPROVED" }`
    * *Expectation*: `PERMISSION_DENIED` (status not in enum)
11. **Payload 11: Non-Admin Project Deletion**
    * *Target*: `DELETE /projects/proj_999`
    * *Auth*: Non-admin employee
    * *Expectation*: `PERMISSION_DENIED` (project deletion restricted to Admin)
12. **Payload 12: Blank Email Spoofing Attack**
    * *Target*: `CREATE /users/admin_spoof`
    * *Auth*: `request.auth.token.email = "dasest404@gmail.com"` with `email_verified = false`
    * *Expectation*: `PERMISSION_DENIED` (email spoofing prevention)

---

## 3. Test Runner Reference
The test runner is specified in `firestore.rules.test.ts`. All 12 test vectors are validated to return `PERMISSION_DENIED`.
