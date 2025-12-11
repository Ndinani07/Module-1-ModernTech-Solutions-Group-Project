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
  const [employeeInfo, payrollData, attendanceData] = await Promise.all([
    safeFetchJson('M1 Project Module - Employee Dummy JSON Data/employee_info.json'),
    safeFetchJson('M1 Project Module - Employee Dummy JSON Data/payroll_data.json'),
    safeFetchJson('M1 Project Module - Employee Dummy JSON Data/attendance.json'),
  ]);
  return { employeeInfo, payrollData, attendanceData };
}

// Function to aggregate attendance data for the chart
function aggregateAttendanceData(attendanceArray) {
  // Define the last 5 dates we are interested in (based on your JSON data, seems like July 2025)
  // In a real scenario, this might be dynamic based on current date
  const targetDates = ["2025-07-25", "2025-07-26", "2025-07-27", "2025-07-28", "2025-07-29"];
  const aggregatedData = { present: [], absent: [] };

  targetDates.forEach(date => {
    let presentCount = 0;
    let absentCount = 0;

    attendanceArray.forEach(emp => {
      const dayRecord = emp.attendance.find(day => day.date === date);
      if (dayRecord) {
        if (dayRecord.status.toLowerCase() === 'present') {
          presentCount++;
        } else if (dayRecord.status.toLowerCase() === 'absent') {
          absentCount++;
        }
        // Ignore other statuses if they exist (e.g., 'Late')
      }
    });

    aggregatedData.present.push(presentCount);
    aggregatedData.absent.push(absentCount);
  });

  return {
    labels: targetDates,
    datasets: [
      {
        label: 'Present',
        data: aggregatedData.present,
        backgroundColor: 'rgba(40, 167, 69, 0.6)', // Green
        borderColor: 'rgba(40, 167, 69, 1)',
        borderWidth: 1
      },
      {
        label: 'Absent',
        data: aggregatedData.absent,
        backgroundColor: 'rgba(220, 53, 69, 0.6)', // Red
        borderColor: 'rgba(220, 53, 69, 1)',
        borderWidth: 1
      }
    ]
  };
}


// Function to render dashboard statistics and chart
async function renderDashboard() {
  let employeeInfo, payrollData, attendanceData;
  try {
    ({ employeeInfo, payrollData, attendanceData } = await loadData());
  } catch (err) {
    console.error("Error loading data:", err);
    document.getElementById('statEmployees').textContent = '—';
    document.getElementById('statPayroll').textContent = '—';
    document.getElementById('statTimeOff').textContent = '—';
    // Optionally, show an error message in the chart area too
    document.querySelector('.chart-container').innerHTML = '<div class="alert alert-danger">Failed to load data for chart.</div>';
    return;
  }

  const empArray = (employeeInfo && employeeInfo.employeeInformation) || [];
  const payrollArray = (payrollData && payrollData.payrollData) || [];
  const attendanceArray = (attendanceData && attendanceData.attendanceAndLeave) || [];

  // Calculate and populate summary stats (unchanged)
  document.getElementById("statEmployees").textContent = empArray.length;

  const totalPayroll = empArray.reduce((sum, emp) => {
    const val = Number(emp.salary ?? 0);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
  document.getElementById("statPayroll").textContent = "R" + numberWithCommas(totalPayroll);

  const pendingLeaves = attendanceArray.reduce((sum, emp) => {
    const requests = Array.isArray(emp.leaveRequests) ? emp.leaveRequests : [];
    const pending = requests.filter(l => String(l.status).toLowerCase() === "pending");
    return sum + pending.length;
  }, 0);
  document.getElementById("statTimeOff").textContent = pendingLeaves;

  // Aggregate data for the chart
  const chartData = aggregateAttendanceData(attendanceArray);

  // Get the canvas context and create the chart
  const ctx = document.getElementById('attendanceChart').getContext('2d');
  // Destroy any existing chart instance on this canvas first
  if (window.myAttendanceChart instanceof Chart) {
     window.myAttendanceChart.destroy();
  }
  window.myAttendanceChart = new Chart(ctx, {
    type: 'bar', // Bar chart is good for comparing categories over time
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false, // Allows controlling size via parent container
      scales: {
        y: {
          beginAtZero: true,
          title: {
             display: true,
             text: 'Number of Employees'
          }
        },
         x: {
            title: {
               display: true,
               text: 'Date'
            }
         }
      },
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: false, // We have the heading above the card
          text: 'Attendance Overview (Last 5 Days)'
        }
      }
    }
  });
}

// Initialize sidebar toggle and render dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Removed modal initialization as it's gone
  document.getElementById("toggleSidebar")?.addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("show");
  });
  renderDashboard(); // Call the updated render function
});