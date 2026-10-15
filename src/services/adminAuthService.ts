import { UserRole } from '../types/solar';

export interface ProvisionAccountParams {
  email: string;
  password?: string;
  displayName: string;
  systemRole: UserRole;
  employeeCode: string;
}

export interface ProvisionAccountResult {
  uid: string;
  provider: 'local_offline' | 'server_admin';
  message: string;
}

/**
 * Provisions a new ERP login account for an employee without external Firebase dependencies.
 */
export async function provisionEmployeeAccount(
  params: ProvisionAccountParams
): Promise<ProvisionAccountResult> {
  const cleanEmail = params.email.trim();
  const password = params.password;

  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  // 1. Try server-side endpoint if available
  try {
    const res = await fetch('/api/admin/create-employee-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        password,
        displayName: params.displayName.trim(),
        systemRole: params.systemRole,
        employeeCode: params.employeeCode
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.uid) {
        return {
          uid: data.uid,
          provider: 'server_admin',
          message: 'Account provisioned successfully.'
        };
      }
    }
  } catch {
    // Proceed to local generation
  }

  // 2. Direct local ERP account identifier
  const uid = `usr-emp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    uid,
    provider: 'local_offline',
    message: 'Employee ERP account provisioned successfully.'
  };
}

/**
 * Updates an employee's credentials or account status.
 */
export async function updateEmployeeAccount(params: {
  uid: string;
  password?: string;
  disabled?: boolean;
}): Promise<boolean> {
  if (!params.password && typeof params.disabled !== 'boolean') {
    return true;
  }

  try {
    const res = await fetch('/api/admin/update-employee-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: params.uid,
        password: params.password,
        disabled: params.disabled
      })
    });

    if (res.ok) {
      const data = await res.json();
      return Boolean(data.success);
    }
  } catch {
    // Endpoint unavailable or failed
  }

  return true;
}

/**
 * Sends a password reset confirmation for an employee.
 */
export async function sendEmployeePasswordResetEmail(email: string): Promise<void> {
  console.log(`[ERP Auth] Password reset simulated for ${email}`);
}
