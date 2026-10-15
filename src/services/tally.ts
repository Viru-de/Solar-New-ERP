import { PaymentRecord, ExpenseRecord, SystemSettings } from '../types/solar';

export interface TallyQueueItem {
  id: string;
  erpTransactionId: string;
  transactionType: 'PAYMENT_RECEIPT' | 'EXPENSE_VOUCHER' | 'SALES_INVOICE';
  entityName: string;
  amount: number;
  date: string;
  tallyVoucherType: 'Receipt' | 'Payment' | 'Sales' | 'Journal';
  tallyReference?: string;
  syncStatus: 'NOT SYNCED' | 'SYNCING' | 'SYNCED' | 'FAILED';
  lastAttemptAt?: string;
  errorMessage?: string;
  xmlPayload: string;
}

export function generateTallyReceiptXML(payment: PaymentRecord, settings: SystemSettings): string {
  const formattedDate = payment.paidDate ? payment.paidDate.replace(/-/g, '') : new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${settings.tallyCompany}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Receipt" ACTION="Create" OBJVIEW="Accounting Voucher View">
            <DATE>${formattedDate}</DATE>
            <VOUCHERTYPENAME>Receipt</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${payment.receiptNumber}</VOUCHERNUMBER>
            <REFERENCE>${payment.transactionReference || payment.receiptNumber}</REFERENCE>
            <NARRATION>Solar EPC Payment received for ${payment.customerName} - Milestone: ${payment.milestone}</NARRATION>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${payment.customerName}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${payment.amount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${payment.paymentMode || 'HDFC Bank Ltd'}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${payment.amount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`.trim();
}

export function generateTallyExpenseXML(expense: ExpenseRecord, settings: SystemSettings): string {
  const formattedDate = expense.date.replace(/-/g, '');
  return `
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${settings.tallyCompany}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Payment" ACTION="Create" OBJVIEW="Accounting Voucher View">
            <DATE>${formattedDate}</DATE>
            <VOUCHERTYPENAME>Payment</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${expense.expenseNumber}</VOUCHERNUMBER>
            <REFERENCE>${expense.referenceNo}</REFERENCE>
            <NARRATION>Solar EPC Project Expense: ${expense.category} - ${expense.notes}</NARRATION>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${expense.vendorName}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${expense.amount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${expense.paymentMode || 'Bank Payment'}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${expense.amount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`.trim();
}

export interface TallySyncResult {
  success: boolean;
  message: string;
  queueItem?: TallyQueueItem;
}

export function attemptTallySync(
  erpTransactionId: string,
  type: 'PAYMENT' | 'EXPENSE',
  record: PaymentRecord | ExpenseRecord,
  settings: SystemSettings
): TallySyncResult {
  // Check if Tally connector endpoint is active
  if (settings.tallyStatus !== 'CONNECTED') {
    return {
      success: false,
      message: 'Tally integration not configured. Connect your local or cloud Tally Prime XML server (ODBC / Port 9000) under Settings > Tally Integration.'
    };
  }

  // Future-ready placeholder for direct XML POST over proxy / LAN
  return {
    success: false,
    message: `Ready for Tally transmission to ${settings.tallyServerUrl} (Company: ${settings.tallyCompany}), but local Tally Prime Gateway connection is in standby.`
  };
}
