// Function to safely fetch JSON with error handling
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

// Function to format numbers with commas
function numberWithCommas(x) {
  const n = Number(x) || 0;
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Function to load all required data
async function loadData() {
  // Adjust the path if your JSON files are in a different subfolder relative to js/
  // e.g., if they are in 'mydata/', the path would be '../mydata/employee_info.json'
  const [employeeInfo, payrollData] = await Promise.all([
    safeFetchJson('../M1 Project Module - Employee Dummy JSON Data/employee_info.json'), // Update path as needed
    safeFetchJson('../M1 Project Module - Employee Dummy JSON Data/payroll_data.json')  // Update path as needed
  ]);
  return { employeeInfo, payrollData };
}

// Function to render the payroll overview table
async function renderPayrollOverview() {
  let employeeInfo, payrollData;
  try {
    ({ employeeInfo, payrollData } = await loadData());
  } catch (err) {
    console.error("Error loading ", err);
    document.getElementById('statTotalPaid').textContent = '—';
    document.getElementById('statTotalCost').textContent = '—';
    document.querySelector('#payrollTable tbody').innerHTML =
      `<tr><td colspan="7" class="text-center text-muted">Failed to load payroll data. Check console/network.</td></tr>`;
    return;
  }

  const empArray = (employeeInfo && employeeInfo.employeeInformation) || [];
  const payrollArray = (payrollData && payrollData.payrollData) || [];

  // Combine data based on employeeId
  const combinedData = empArray.map(emp => {
    const payroll = payrollArray.find(p => p.employeeId === emp.employeeId) || {};
    return { ...emp, ...payroll }; // Merge employee and payroll info
  });

  // Calculate summary stats
  document.getElementById("statTotalPaid").textContent = combinedData.length;

  const totalPayrollCost = combinedData.reduce((sum, emp) => {
    const finalSalary = Number(emp.finalSalary ?? emp.salary ?? 0);
    return sum + (isNaN(finalSalary) ? 0 : finalSalary);
  }, 0);
  document.getElementById("statTotalCost").textContent = "R" + numberWithCommas(totalPayrollCost);

  // Populate the table
  const tbody = document.querySelector("#payrollTable tbody");
  tbody.innerHTML = ""; // Clear existing rows

  combinedData.forEach(emp => {
    const tr = document.createElement("tr");

    // Format numbers for display
    const hoursWorked = emp.hoursWorked ?? '—';
    const leaveDeductions = emp.leaveDeductions ?? '—';
    const finalSalary = emp.finalSalary ?? emp.salary ?? 0;
    const formattedSalary = "R" + numberWithCommas(finalSalary);

    tr.innerHTML = `
      <td>${emp.employeeId}</td>
      <td>${emp.name ?? '—'}</td>
      <td>${emp.department ?? '—'}</td>
      <td>${hoursWorked}</td>
      <td>${leaveDeductions}</td>
      <td>${formattedSalary}</td>
      <td><button class="btn btn-sm btn-outline-primary btn-view-payslip" data-employee-id="${emp.employeeId}">View Payslip</button></td>
    `;
    tbody.appendChild(tr);
  });

  // Attach event listeners to the "View Payslip" buttons
  document.querySelectorAll(".btn-view-payslip").forEach(btn => {
    btn.addEventListener("click", (event) => {
      const empId = parseInt(event.target.getAttribute('data-employee-id'));
      const empDetails = combinedData.find(emp => emp.employeeId === empId);
      if (empDetails) {
        openPayslipModal(empDetails);
      }
    });
  });
}

// Function to open the payslip modal with employee details
function openPayslipModal(employee) {
  const modalBody = document.getElementById("payslipModalBody");

  // Example payslip structure - adjust fields as needed based on your requirements
  modalBody.innerHTML = `
    <div class="container-fluid">
      <div class="row mb-3">
        <div class="col-12">
          <h4 class="text-center">MODERNTech Solutions - Digital Payslip</h4>
          <hr />
        </div>
      </div>
      <div class="row mb-2">
        <div class="col-md-6">
          <p><strong>Employee Name:</strong> ${employee.name ?? '—'}</p>
          <p><strong>Employee ID:</strong> ${employee.employeeId}</p>
          <p><strong>Department:</strong> ${employee.department ?? '—'}</p>
          <p><strong>Position:</strong> ${employee.position ?? '—'}</p>
        </div>
        <div class="col-md-6">
          <p><strong>Period:</strong> July 2025 (Example)</p> <!-- Or fetch from data if available -->
          <p><strong>Join Date:</strong> ${employee.employmentHistory?.split(',')[0]?.replace('Joined in ', '') ?? '—'}</p>
        </div>
      </div>
      <div class="row">
        <div class="col-md-6">
          <h6>Earnings</h6>
          <table class="table table-sm table-borderless">
            <tr><td>Gross Salary:</td><td class="text-end">R${numberWithCommas(employee.salary ?? 0)}</td></tr>
            <!-- Add other earning components if available -->
          </table>
        </div>
        <div class="col-md-6">
          <h6>Deductions</h6>
          <table class="table table-sm table-borderless">
            <tr><td>Leave Deductions (R/hr):</td><td class="text-end">R${numberWithCommas(employee.leaveDeductions ?? 0)} (if applicable)</td></tr>
            <!-- Add other deduction components if available -->
          </table>
        </div>
      </div>
      <div class="row mt-3">
        <div class="col-12">
          <h6>Net Pay: <span class="float-end">R${numberWithCommas(employee.finalSalary ?? employee.salary ?? 0)}</span></h6>
          <hr />
          <p class="text-muted small">This is a computer-generated payslip. No signature required.</p>
        </div>
      </div>
    </div>
  `;

  // Assuming you have initialized the modal instance somewhere during DOMContentLoaded
  const payslipModalInstance = bootstrap.Modal.getInstance(document.getElementById("payslipModal"));
  if (payslipModalInstance) {
     payslipModalInstance.show();
  } else {
     // Fallback if modal instance wasn't pre-initialized globally
     new bootstrap.Modal(document.getElementById("payslipModal")).show();
  }
}


// Initialize modal instance and attach event listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Note: Removed sidebar toggle listener as it's no longer relevant
  // Render the payroll overview initially
  renderPayrollOverview();
});
