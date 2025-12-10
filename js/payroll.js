
// ---------------- Helpers ----------------
async function safeFetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch ${url} - ${res.status} ${res.statusText}. Response starts: ${text.slice(0,200)}`);
  }
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (!ct.includes('application/json')) {
    const text = await res.text().catch(() => '');
    throw new Error(`Expected JSON from ${url} but got '${ct}'. Response starts: ${text.slice(0,200)}`);
  }
  return res.json();
}

function numberWithCommas(x) {
  const n = Number(x) || 0;
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function safeQuery(selector) {
  const el = document.querySelector(selector);
  if (!el) console.warn(`Element not found: ${selector}`);
  return el;
}

// ---------------- Data loading ----------------
async function loadData() {
  // Update these paths if your JSON location differs
  const employeeInfoPath = '../M1 Project Module - Employee Dummy JSON Data/employee_info.json';
  const payrollDataPath = '../M1 Project Module - Employee Dummy JSON Data/payroll_data.json';

  const [employeeInfo, payrollData] = await Promise.all([
    safeFetchJson(employeeInfoPath),
    safeFetchJson(payrollDataPath)
  ]);
  return { employeeInfo, payrollData };
}

// ---------------- Render table ----------------
async function renderPayrollOverview() {
  const statTotalPaidEl = safeQuery('#statTotalPaid');
  const statTotalCostEl = safeQuery('#statTotalCost');
  const tbody = safeQuery('#payrollTable tbody');

  if (!tbody) {
    console.error('Cannot find #payrollTable tbody — make sure it exists in the DOM.');
    return;
  }

  let employeeInfo, payrollData;
  try {
    ({ employeeInfo, payrollData } = await loadData());
  } catch (err) {
    console.error("Error loading payroll data:", err);
    if (statTotalPaidEl) statTotalPaidEl.textContent = '—';
    if (statTotalCostEl) statTotalCostEl.textContent = '—';
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">Failed to load payroll data. Check console/network.</td></tr>`;
    return;
  }

  const empArray = (employeeInfo && employeeInfo.employeeInformation) || [];
  const payrollArray = (payrollData && payrollData.payrollData) || [];

  // Map payroll by employeeId for faster lookups
  const payrollMap = new Map();
  payrollArray.forEach(p => payrollMap.set(Number(p.employeeId), p));

  const combinedData = empArray.map(emp => {
    const id = Number(emp.employeeId);
    const payroll = payrollMap.get(id) || {};
    return { ...emp, ...payroll };
  });

  if (statTotalPaidEl) statTotalPaidEl.textContent = combinedData.length;

  const totalPayrollCost = combinedData.reduce((sum, emp) => {
    const finalSalary = Number(emp.finalSalary ?? emp.salary ?? 0);
    return sum + (isNaN(finalSalary) ? 0 : finalSalary);
  }, 0);
  if (statTotalCostEl) statTotalCostEl.textContent = "R" + numberWithCommas(totalPayrollCost);

  // Populate table
  tbody.innerHTML = '';
  if (combinedData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No payroll records found.</td></tr>`;
  } else {
    combinedData.forEach(emp => {
      const hoursWorked = emp.hoursWorked ?? '—';
      const leaveDeductions = emp.leaveDeductions ?? '—';
      const finalSalary = emp.finalSalary ?? emp.salary ?? 0;
      const formattedSalary = "R" + numberWithCommas(finalSalary);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${emp.employeeId}</td>
        <td>${emp.name ?? '—'}</td>
        <td>${emp.department ?? '—'}</td>
        <td>${hoursWorked}</td>
        <td>${leaveDeductions}</td>
        <td>${formattedSalary}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary btn-view-payslip" data-employee-id="${emp.employeeId}">View Payslip</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Attach view listeners
  tbody.querySelectorAll('.btn-view-payslip').forEach(btn => {
    btn.removeEventListener('click', handleViewPayslipClick); // safe remove
    btn.addEventListener('click', handleViewPayslipClick);
  });

  // store combinedData on tbody for quick lookup
  tbody._combinedData = combinedData;
}

function handleViewPayslipClick(evt) {
  const btn = evt.currentTarget;
  const empId = Number(btn.getAttribute('data-employee-id'));
  const tbody = document.querySelector('#payrollTable tbody');
  const combinedData = tbody && tbody._combinedData ? tbody._combinedData : [];
  const empDetails = combinedData.find(e => Number(e.employeeId) === empId);
  if (empDetails) openPayslipModal(empDetails);
  else console.warn('Employee details not found for id', empId);
}

// ---------------- Payslip modal & PDF ----------------
function openPayslipModal(employee) {
  const modalEl = document.getElementById('payslipModal');
  if (!modalEl) {
    console.error('Modal #payslipModal not found in DOM.');
    return;
  }
  const modalBody = modalEl.querySelector('#payslipModalBody');
  if (!modalBody) {
    console.error('Modal body #payslipModalBody not found.');
    return;
  }

  // Build payslip HTML
  const joinDate = (employee.employmentHistory && String(employee.employmentHistory).split(',')[0]) || '—';
  const grossSalary = numberWithCommas(employee.salary ?? 0);
  const netPay = numberWithCommas(employee.finalSalary ?? employee.salary ?? 0);
  const leaveDeductions = numberWithCommas(employee.leaveDeductions ?? 0);

  modalBody.innerHTML = `
    <div id="payslipContent" style="background: white; padding: 12px;">
      <div class="container-fluid">
        <div class="row mb-2">
          <div class="col-12 text-center">
            <h4>MODERNTech Solutions — Digital Payslip</h4>
            <small class="text-muted">This is a computer-generated payslip.</small>
            <hr/>
          </div>
        </div>

        <div class="row mb-2">
          <div class="col-md-6">
            <p><strong>Employee Name:</strong> ${employee.name ?? '—'}</p>
            <p><strong>Employee ID:</strong> ${employee.employeeId ?? '—'}</p>
            <p><strong>Department:</strong> ${employee.department ?? '—'}</p>
            <p><strong>Position:</strong> ${employee.position ?? '—'}</p>
          </div>
          <div class="col-md-6">
            <p><strong>Period:</strong> July 2025</p>
            <p><strong>Join Date:</strong> ${joinDate.replace('Joined in ', '')}</p>
          </div>
        </div>

        <div class="row">
          <div class="col-md-6">
            <h6>Earnings</h6>
            <table class="table table-sm table-borderless">
              <tr><td>Gross Salary:</td><td class="text-end">R${grossSalary}</td></tr>
            </table>
          </div>
          <div class="col-md-6">
            <h6>Deductions</h6>
            <table class="table table-sm table-borderless">
              <tr><td>Leave Deductions (R/hr):</td><td class="text-end">R${leaveDeductions} (if applicable)</td></tr>
            </table>
          </div>
        </div>

        <div class="row mt-3">
          <div class="col-12">
            <h6>Net Pay: <span class="float-end">R${netPay}</span></h6>
            <hr/>
            <p class="text-muted small">No signature required.</p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Ensure the footer has a download button; add if missing
  const footer = modalEl.querySelector('.modal-footer');
  if (footer) {
    let downloadBtn = footer.querySelector('#btnDownloadPayslip');
    if (!downloadBtn) {
      // create button
      downloadBtn = document.createElement('button');
      downloadBtn.id = 'btnDownloadPayslip';
      downloadBtn.type = 'button';
      downloadBtn.className = 'btn btn-primary';
      downloadBtn.textContent = 'Download PDF';
      // insert before the Close button if there is one, otherwise append
      const closeBtn = footer.querySelector('[data-bs-dismiss="modal"]');
      if (closeBtn) footer.insertBefore(downloadBtn, closeBtn);
      else footer.appendChild(downloadBtn);
    } else {
      // ensure text
      downloadBtn.textContent = 'Download PDF';
    }

    // Remove previous handler(s) safely by cloning
    const safeBtn = downloadBtn.cloneNode(true);
    downloadBtn.parentNode.replaceChild(safeBtn, downloadBtn);
    safeBtn.addEventListener('click', () => downloadPayslipPDF(employee));
  } else {
    console.warn('Modal footer not found — download button not added.');
  }

  // Show modal using bootstrap's getOrCreateInstance (prevents undefined/backdrop errors)
  try {
    const instance = bootstrap.Modal.getOrCreateInstance(modalEl);
    instance.show();
  } catch (e) {
    console.error('Failed to show Bootstrap modal. Ensure bootstrap.bundle.min.js is loaded.', e);
  }
}

function downloadPayslipPDF(employee) {
  const contentEl = document.getElementById('payslipContent');
  if (!contentEl) {
    console.error('Payslip content element (#payslipContent) not found.');
    alert('Payslip content not found — cannot create PDF.');
    return;
  }

  // Filename
  const nameSafe = (employee.name || 'employee').replace(/\s+/g, '_').replace(/[^\w\-]/g, '');
  const filename = `payslip_${nameSafe}_${employee.employeeId || '0'}.pdf`;

  if (typeof html2pdf === 'undefined') {
    console.warn('html2pdf not found. Include html2pdf.bundle.min.js in your HTML to enable PDF export.');
    alert('PDF export not available — missing html2pdf library. See console for details.');
    return;
  }

  // Temporarily ensure white background & padding for clean PDF
  const originalStyle = contentEl.getAttribute('style') || '';
  contentEl.style.background = '#ffffff';
  contentEl.style.padding = '18px';

  const opt = {
    margin:       [12, 12, 12, 12],
    filename:     filename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, logging: false },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(contentEl).save()
    .then(() => contentEl.setAttribute('style', originalStyle))
    .catch(err => {
      console.error('Failed to create PDF:', err);
      contentEl.setAttribute('style', originalStyle);
      alert('Failed to generate PDF. See console for details.');
    });
}

// ---------------- Init ----------------
document.addEventListener('DOMContentLoaded', () => {
  // Render payroll overview
  renderPayrollOverview().catch(err => console.error('Error rendering payroll overview:', err));
});