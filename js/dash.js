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

async function loadData() {
  const [employeeInfo, payrollData, attendanceData] = await Promise.all([
    safeFetchJson('M1 Project Module - Employee Dummy JSON Data/employee_info.json'),
    safeFetchJson('M1 Project Module - Employee Dummy JSON Data/payroll_data.json'),
    safeFetchJson('M1 Project Module - Employee Dummy JSON Data/attendance.json'),
  ]);
  return { employeeInfo, payrollData, attendanceData };
}

function numberWithCommas(x) {
  const n = Number(x) || 0;
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

async function renderDashboard() {
  let employeeInfo, payrollData, attendanceData;
  try {
    ({ employeeInfo, payrollData, attendanceData } = await loadData());
  } catch (err) {
    document.getElementById('statEmployees').textContent = '—';
    document.getElementById('statPayroll').textContent = '—';
    document.getElementById('statTimeOff').textContent = '—';
    document.querySelector('#employeesTable tbody').innerHTML =
      `<tr><td colspan="6" class="text-center text-muted">Failed to load data. Check console/network.</td></tr>`;
    return;
  }

  const empArray = (employeeInfo && employeeInfo.employeeInformation) || [];
  const payrollArray = (payrollData && payrollData.payrollData) || [];
  const attendanceArray = (attendanceData && attendanceData.attendanceAndLeave) || [];

  const employees = empArray.map(emp => {
    const payroll = payrollArray.find(p => p.employeeId === emp.employeeId) || {};
    const attendance = attendanceArray.find(a => a.employeeId === emp.employeeId) || {};
    return { ...emp, payroll, attendance };
  });

  document.getElementById("statEmployees").textContent = employees.length;

  const totalPayroll = employees.reduce((sum, emp) => {
    const val = Number(emp.payroll.finalSalary ?? emp.salary ?? 0);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
  document.getElementById("statPayroll").textContent = "$" + numberWithCommas(totalPayroll);

  const pendingLeaves = attendanceArray.reduce((sum, emp) => {
    const requests = Array.isArray(emp.leaveRequests) ? emp.leaveRequests : [];
    const pending = requests.filter(l => String(l.status).toLowerCase() === "pending");
    return sum + pending.length;
  }, 0);
  document.getElementById("statTimeOff").textContent = pendingLeaves;

  const tbody = document.querySelector("#employeesTable tbody");
  tbody.innerHTML = "";

  employees.forEach(emp => {
    const displaySalary = Number(emp.salary ?? emp.payroll.finalSalary ?? 0);
    const status = (emp.payroll && emp.payroll.finalSalary) ? "Active" : "Unknown";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${emp.name ?? '—'}</td>
      <td>${emp.position ?? '—'}</td>
      <td>${emp.department ?? '—'}</td>
      <td>$${numberWithCommas(displaySalary)}</td>
      <td>${status}</td>
      <td><button class="btn btn-sm btn-outline-primary btn-view">View</button></td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll(".btn-view").forEach((btn, i) => {
    btn.addEventListener("click", () => openEmployeeModal(employees[i]));
  });
}

let employeeModal;
document.addEventListener('DOMContentLoaded', () => {
  employeeModal = new bootstrap.Modal(document.getElementById("employeeModal"));
  document.getElementById("toggleSidebar")?.addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("show");
  });
  renderDashboard();
});

function openEmployeeModal(emp) {
  const modalBody = document.getElementById("employeeModalBody");
  modalBody.innerHTML = `
    <p><strong>Name:</strong> ${emp.name ?? '—'}</p>
    <p><strong>Position:</strong> ${emp.position ?? '—'}</p>
    <p><strong>Department:</strong> ${emp.department ?? '—'}</p>
    <p><strong>Salary:</strong> $${numberWithCommas(emp.salary ?? emp.payroll.finalSalary ?? 0)}</p>
    <p><strong>Final Salary (Payroll):</strong> $${numberWithCommas(emp.payroll.finalSalary ?? 0)}</p>
    <hr>
    <p><strong>Employment History:</strong> ${emp.employmentHistory ?? '—'}</p>
    <p><strong>Contact:</strong> ${emp.contact ?? '—'}</p>
  `;
  employeeModal.show();
}
