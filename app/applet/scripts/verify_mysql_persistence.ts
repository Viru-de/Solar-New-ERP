import mysql from 'mysql2/promise';

async function main() {
  console.log('--- STARTING MYSQL PERSISTENCE VERIFICATION SUITE ---');
  
  const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'solarpulse_erp'
  });

  const baseUrl = 'http://localhost:3000/api';

  async function apiCall(endpoint: string, method: string = 'GET', body?: any) {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    return res.json();
  }

  const results: Record<string, boolean> = {};

  // 1. CUSTOMERS
  console.log('\n[1/10] Testing Customer CRUD...');
  const testCustId = `cust-test-${Date.now()}`;
  const custCreateRes = await apiCall('/customers', 'POST', {
    id: testCustId,
    name: 'Controlled Test Customer Ltd',
    phone: '+91 99999 88888',
    email: 'test.customer@controlledtest.com',
    companyName: 'Controlled Test Corp',
    customerType: 'Commercial',
    siteAddress: 'Tech Zone 1',
    city: 'Ahmedabad'
  });
  console.log('POST /customers response:', custCreateRes.success);
  
  const [custRows]: any = await pool.query('SELECT * FROM solar_customers WHERE id = ?', [testCustId]);
  console.log('MySQL SELECT solar_customers found:', custRows.length);

  await apiCall(`/customers/${testCustId}`, 'PUT', {
    name: 'Controlled Test Customer Ltd (Updated)'
  });
  const [custUpdatedRows]: any = await pool.query('SELECT name FROM solar_customers WHERE id = ?', [testCustId]);
  console.log('MySQL UPDATE verified:', custUpdatedRows[0]?.name === 'Controlled Test Customer Ltd (Updated)');

  await apiCall(`/customers/${testCustId}`, 'DELETE');
  const [custDeletedRows]: any = await pool.query('SELECT * FROM solar_customers WHERE id = ?', [testCustId]);
  console.log('MySQL DELETE verified:', custDeletedRows.length === 0);
  results['Customer'] = custRows.length === 1 && custUpdatedRows[0]?.name === 'Controlled Test Customer Ltd (Updated)' && custDeletedRows.length === 0;

  // 2. EMPLOYEES
  console.log('\n[2/10] Testing Employee CRUD...');
  const testEmpId = `emp-test-${Date.now()}`;
  const empCreateRes = await apiCall('/employees', 'POST', {
    id: testEmpId,
    name: 'Controlled Test Engineer',
    email: `engineer-${Date.now()}@controlledtest.com`,
    phone: '+91 98888 77777',
    role: 'Site Survey Engineer',
    assignedRole: 'Site Survey Engineer',
    department: 'Engineering',
    designation: 'Field Surveyor',
    status: 'ACTIVE'
  });
  console.log('POST /employees response:', empCreateRes.success);

  const [empRows]: any = await pool.query('SELECT * FROM solar_employees WHERE id = ?', [testEmpId]);
  console.log('MySQL SELECT solar_employees found:', empRows.length);

  await apiCall(`/employees/${testEmpId}`, 'PUT', {
    name: 'Controlled Test Engineer (Senior)'
  });
  const [empUpdatedRows]: any = await pool.query('SELECT name FROM solar_employees WHERE id = ?', [testEmpId]);
  console.log('MySQL UPDATE verified:', empUpdatedRows[0]?.name === 'Controlled Test Engineer (Senior)');

  await apiCall(`/employees/${testEmpId}`, 'DELETE');
  const [empDeletedRows]: any = await pool.query('SELECT * FROM solar_employees WHERE id = ?', [testEmpId]);
  console.log('MySQL DELETE verified:', empDeletedRows.length === 0);
  results['Employee'] = empRows.length === 1 && empUpdatedRows[0]?.name === 'Controlled Test Engineer (Senior)' && empDeletedRows.length === 0;

  // 3. PROJECTS
  console.log('\n[3/10] Testing Project CRUD...');
  const testProjId = `proj-test-${Date.now()}`;
  const projCreateRes = await apiCall('/projects', 'POST', {
    id: testProjId,
    projectCode: `SOL-TEST-${Date.now().toString().slice(-4)}`,
    title: 'Controlled Test 10kW Solar Project',
    customerName: 'Controlled Test Customer',
    capacityKw: 10,
    totalValue: 500000,
    status: 'SURVEY',
    stages: []
  });
  console.log('POST /projects response:', projCreateRes.success);

  const [projRows]: any = await pool.query('SELECT * FROM solar_projects WHERE id = ?', [testProjId]);
  console.log('MySQL SELECT solar_projects found:', projRows.length);

  await apiCall(`/projects/${testProjId}`, 'PUT', {
    title: 'Controlled Test 15kW Solar Project (Updated)'
  });
  const [projUpdatedRows]: any = await pool.query('SELECT title FROM solar_projects WHERE id = ?', [testProjId]);
  console.log('MySQL UPDATE verified:', projUpdatedRows[0]?.title === 'Controlled Test 15kW Solar Project (Updated)');

  await apiCall(`/projects/${testProjId}`, 'DELETE');
  const [projDeletedRows]: any = await pool.query('SELECT * FROM solar_projects WHERE id = ?', [testProjId]);
  console.log('MySQL DELETE verified:', projDeletedRows.length === 0);
  results['Project'] = projRows.length === 1 && projUpdatedRows[0]?.title === 'Controlled Test 15kW Solar Project (Updated)' && projDeletedRows.length === 0;

  // 4. LEADS
  console.log('\n[4/10] Testing Lead CRUD...');
  const testLeadId = `lead-test-${Date.now()}`;
  const leadCreateRes = await apiCall('/leads', 'POST', {
    id: testLeadId,
    name: 'Controlled Test Lead',
    phone: '+91 97777 66666',
    email: 'lead@controlledtest.com',
    city: 'Surat',
    status: 'NEW',
    proposedCapacityKw: 5
  });
  console.log('POST /leads response:', leadCreateRes.success);

  const [leadRows]: any = await pool.query('SELECT * FROM solar_leads WHERE id = ?', [testLeadId]);
  console.log('MySQL SELECT solar_leads found:', leadRows.length);

  await apiCall(`/leads/${testLeadId}`, 'PUT', {
    status: 'CONTACTED'
  });
  const [leadUpdatedRows]: any = await pool.query('SELECT status FROM solar_leads WHERE id = ?', [testLeadId]);
  console.log('MySQL UPDATE verified:', leadUpdatedRows[0]?.status === 'CONTACTED');

  await apiCall(`/leads/${testLeadId}`, 'DELETE');
  const [leadDeletedRows]: any = await pool.query('SELECT * FROM solar_leads WHERE id = ?', [testLeadId]);
  console.log('MySQL DELETE verified:', leadDeletedRows.length === 0);
  results['Lead'] = leadRows.length === 1 && leadUpdatedRows[0]?.status === 'CONTACTED' && leadDeletedRows.length === 0;

  // 5. PRODUCTS
  console.log('\n[5/10] Testing Product CRUD...');
  const testProdId = `prod-test-${Date.now()}`;
  const prodCreateRes = await apiCall('/products', 'POST', {
    id: testProdId,
    name: 'Mono PERC 550W Test Module',
    sku: `SKU-TEST-${Date.now().toString().slice(-4)}`,
    category: 'Solar Panels',
    unit: 'NOS',
    currentStock: 100,
    unitCost: 12000
  });
  console.log('POST /products response:', prodCreateRes.success);

  const [prodRows]: any = await pool.query('SELECT * FROM solar_products WHERE id = ?', [testProdId]);
  console.log('MySQL SELECT solar_products found:', prodRows.length);

  await apiCall(`/products/${testProdId}`, 'PUT', {
    name: 'Bi-Facial 580W Test Module'
  });
  const [prodUpdatedRows]: any = await pool.query('SELECT name FROM solar_products WHERE id = ?', [testProdId]);
  console.log('MySQL UPDATE verified:', prodUpdatedRows[0]?.name === 'Bi-Facial 580W Test Module');

  await apiCall(`/products/${testProdId}`, 'DELETE');
  const [prodDeletedRows]: any = await pool.query('SELECT * FROM solar_products WHERE id = ?', [testProdId]);
  console.log('MySQL DELETE verified:', prodDeletedRows.length === 0);
  results['Product'] = prodRows.length === 1 && prodUpdatedRows[0]?.name === 'Bi-Facial 580W Test Module' && prodDeletedRows.length === 0;

  // 6. PURCHASE ORDERS
  console.log('\n[6/10] Testing Purchase Order CRUD...');
  const testPoId = `po-test-${Date.now()}`;
  const poCreateRes = await apiCall('/purchase-orders', 'POST', {
    id: testPoId,
    poNumber: `PO-TEST-${Date.now().toString().slice(-4)}`,
    vendorName: 'Top Solar Supply Corp',
    orderDate: '2026-10-15',
    totalAmount: 150000,
    status: 'DRAFT',
    items: []
  });
  console.log('POST /purchase-orders response:', poCreateRes.success);

  const [poRows]: any = await pool.query('SELECT * FROM solar_purchase_orders WHERE id = ?', [testPoId]);
  console.log('MySQL SELECT solar_purchase_orders found:', poRows.length);

  await apiCall(`/purchase-orders/${testPoId}`, 'PUT', {
    status: 'ISSUED'
  });
  const [poUpdatedRows]: any = await pool.query('SELECT status FROM solar_purchase_orders WHERE id = ?', [testPoId]);
  console.log('MySQL UPDATE verified:', poUpdatedRows[0]?.status === 'ISSUED');

  await apiCall(`/purchase-orders/${testPoId}`, 'DELETE');
  const [poDeletedRows]: any = await pool.query('SELECT * FROM solar_purchase_orders WHERE id = ?', [testPoId]);
  console.log('MySQL DELETE verified:', poDeletedRows.length === 0);
  results['PurchaseOrder'] = poRows.length === 1 && poUpdatedRows[0]?.status === 'ISSUED' && poDeletedRows.length === 0;

  // 7. SALES INVOICES
  console.log('\n[7/10] Testing Sales Invoice CRUD...');
  const testInvId = `inv-test-${Date.now()}`;
  const invCreateRes = await apiCall('/sales-invoices', 'POST', {
    id: testInvId,
    invoiceNumber: `INV-TEST-${Date.now().toString().slice(-4)}`,
    customerName: 'Solar Client Ltd',
    invoiceDate: '2026-10-15',
    subtotal: 100000,
    taxAmount: 18000,
    totalAmount: 118000,
    status: 'DRAFT',
    items: []
  });
  console.log('POST /sales-invoices response:', invCreateRes.success);

  const [invRows]: any = await pool.query('SELECT * FROM solar_sales_invoices WHERE id = ?', [testInvId]);
  console.log('MySQL SELECT solar_sales_invoices found:', invRows.length);

  await apiCall(`/sales-invoices/${testInvId}`, 'PUT', {
    status: 'ISSUED'
  });
  const [invUpdatedRows]: any = await pool.query('SELECT status FROM solar_sales_invoices WHERE id = ?', [testInvId]);
  console.log('MySQL UPDATE verified:', invUpdatedRows[0]?.status === 'ISSUED');

  await apiCall(`/sales-invoices/${testInvId}`, 'DELETE');
  const [invDeletedRows]: any = await pool.query('SELECT * FROM solar_sales_invoices WHERE id = ?', [testInvId]);
  console.log('MySQL DELETE verified:', invDeletedRows.length === 0);
  results['SalesInvoice'] = invRows.length === 1 && invUpdatedRows[0]?.status === 'ISSUED' && invDeletedRows.length === 0;

  // 8. BILL OF MATERIALS (BOM)
  console.log('\n[8/10] Testing BOM CRUD...');
  const testBomId = `bom-test-${Date.now()}`;
  const bomCreateRes = await apiCall('/boms', 'POST', {
    id: testBomId,
    bomNumber: `BOM-TEST-${Date.now().toString().slice(-4)}`,
    projectId: 'proj-1',
    projectTitle: 'Factory Solar Array',
    capacityKw: 25,
    version: '1.0',
    status: 'APPROVED',
    totalCost: 350000,
    items: [{ id: '1', productName: 'Inverter 25kW', requiredQty: 1, allocatedQty: 1 }]
  });
  console.log('POST /boms response:', bomCreateRes.success);

  const [bomRows]: any = await pool.query('SELECT * FROM solar_boms WHERE id = ?', [testBomId]);
  console.log('MySQL SELECT solar_boms found:', bomRows.length);

  await apiCall(`/boms/${testBomId}`, 'DELETE');
  const [bomDeletedRows]: any = await pool.query('SELECT * FROM solar_boms WHERE id = ?', [testBomId]);
  console.log('MySQL DELETE verified:', bomDeletedRows.length === 0);
  results['BOM'] = bomRows.length === 1 && bomDeletedRows.length === 0;

  // 9. WAREHOUSES
  console.log('\n[9/10] Testing Warehouse CRUD...');
  const testWhId = `wh-test-${Date.now()}`;
  const whCreateRes = await apiCall('/warehouses', 'POST', {
    id: testWhId,
    name: 'Sanand Industrial Depot',
    code: `WH-TEST-${Date.now().toString().slice(-4)}`,
    address: 'Plot 88 GIDC',
    city: 'Sanand',
    state: 'Gujarat',
    contactPerson: 'Depot Officer',
    contactPhone: '+91 91111 22222',
    status: 'ACTIVE'
  });
  console.log('POST /warehouses response:', whCreateRes.success);

  const [whRows]: any = await pool.query('SELECT * FROM solar_warehouses WHERE id = ?', [testWhId]);
  console.log('MySQL SELECT solar_warehouses found:', whRows.length);

  await apiCall(`/warehouses/${testWhId}`, 'DELETE');
  const [whDeletedRows]: any = await pool.query('SELECT * FROM solar_warehouses WHERE id = ?', [testWhId]);
  console.log('MySQL DELETE verified:', whDeletedRows.length === 0);
  results['Warehouse'] = whRows.length === 1 && whDeletedRows.length === 0;

  // 10. SYSTEM SETTINGS
  console.log('\n[10/10] Testing System Settings...');
  const settingsRes = await apiCall('/settings', 'POST', {
    companyName: 'Rejoy Solar Power Pvt. Ltd.',
    companyAddress: 'Ahmedabad, Gujarat',
    companyPhone: '+91 98250 00000',
    currencySymbol: '₹',
    taxRatePercent: 18
  });
  console.log('POST /settings response:', settingsRes.success);
  const [settingRows]: any = await pool.query('SELECT * FROM solar_system_settings WHERE setting_key = "general"');
  console.log('MySQL SELECT solar_system_settings found:', settingRows.length);
  results['Settings'] = settingRows.length === 1;

  await pool.end();

  console.log('\n=== FINAL VERIFICATION SUMMARY ===');
  let allPassed = true;
  for (const [entity, passed] of Object.entries(results)) {
    console.log(`${entity}: ${passed ? 'PASSED (Verified in MySQL)' : 'FAILED'}`);
    if (!passed) allPassed = false;
  }
  console.log(`\nOVERALL RESULT: ${allPassed ? 'ALL TESTS PASSED SUCCESSFULLY' : 'SOME TESTS FAILED'}`);
}

main().catch(console.error);
