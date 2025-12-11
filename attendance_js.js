import attendanceData from './M1 Project Module - Employee Dummy JSON Data/attendance.json' with { type: 'json' };

const employeeRecords = attendanceData.attendanceAndLeave;

// Table bodies
const attendanceTableBody = document.getElementById("attendanceTableBody");
const leaveTableBody = document.getElementById("leaveTableBody");

let statusFilter = "All"; // Show All by default

//------------------------------------------------------------
// STATUS FILTER BUTTONS — AFFECT DAILY + SEARCH RESULTS
//------------------------------------------------------------
window.setStatusFilter = function (filterType) {
    statusFilter = filterType;

    const selectedDate = document.getElementById("attendanceDateFilter").value;

    // Update daily attendance if a date is chosen
    if (selectedDate) {
        filterAttendanceByDate(selectedDate);
    }

    // Update employee search results
    searchEmployee();
};

//------------------------------------------------------------
// DATE FILTER FOR DAILY ATTENDANCE TABLE
//------------------------------------------------------------
window.filterAttendanceByDate = function (selectedDate) {
    attendanceTableBody.innerHTML = "";

    employeeRecords.forEach(employee => {

        const recordForDay = employee.attendance.find(day => day.date === selectedDate);
        if (!recordForDay) return;

        // Apply present/absent filter
        if (statusFilter !== "All" && recordForDay.status !== statusFilter) return;

        const row = document.createElement("tr");

        const statusClass =
            recordForDay.status === 'Absent'
                ? "absent-day"
                : "present-day";

        row.innerHTML = `
            <td>${employee.employeeId}</td>
            <td>${employee.name}</td>
            <td class="${statusClass}">${recordForDay.status}</td>
        `;

        attendanceTableBody.appendChild(row);
    });
};

//------------------------------------------------------------
// LEAVE TABLE FILTER (Bootstrap-Friendly)
//------------------------------------------------------------
window.filterLeaveTable = function (filterType) {

    leaveTableBody.innerHTML = "";

    employeeRecords.forEach(employee => {

        employee.leaveRequests
            .filter(request => filterType === "All" || request.status === filterType)
            .forEach(request => {

                const row = document.createElement("tr");

                // bootstrap table classes for status color
                let colorClass = "";
                if (request.status === "Approved") colorClass = "table-success fw-bold";
                if (request.status === "Pending") colorClass = "table-warning fw-bold";
                if (request.status === "Denied") colorClass = "table-danger fw-bold";

                row.innerHTML = `
                    <td>${employee.employeeId}</td>
                    <td>${employee.name}</td>
                    <td>${request.date}</td>
                    <td>${request.reason}</td>
                    <td class="${colorClass}">${request.status}</td>
                `;

                leaveTableBody.appendChild(row);
            });

    });
};

// Initialize leave table
filterLeaveTable("All");

//------------------------------------------------------------
// EMPLOYEE SEARCH LISTENER
//------------------------------------------------------------
document.getElementById("employeeSearch").addEventListener("input", () => {
    searchEmployee();
});

//------------------------------------------------------------
// EMPLOYEE SEARCH FUNCTION
//------------------------------------------------------------
window.searchEmployee = function () {

    const searchValue = document.getElementById("employeeSearch").value.toLowerCase();

    const attendanceResults = document.getElementById("searchAttendanceResults");
    const leaveResults = document.getElementById("searchLeaveResults");
    const profileCard = document.getElementById("employeeProfile");

    attendanceResults.innerHTML = "";
    leaveResults.innerHTML = "";
    profileCard.classList.add("d-none");

    if (!searchValue) return;

    const foundEmployee = employeeRecords.find(emp =>
        emp.name.toLowerCase().includes(searchValue) ||
        String(emp.employeeId).includes(searchValue)
    );

    if (!foundEmployee) {
        attendanceResults.innerHTML = `<tr><td colspan="2">No employee found.</td></tr>`;
        leaveResults.innerHTML = `<tr><td colspan="3">No data.</td></tr>`;
        return;
    }

    //------------------------------------------------------------
    // PROFILE CARD
    //------------------------------------------------------------
    profileCard.classList.remove("d-none");
    document.getElementById("profileId").innerText = foundEmployee.employeeId;
    document.getElementById("profileName").innerText = foundEmployee.name;

    //------------------------------------------------------------
    // ATTENDANCE SEARCH RESULTS (WITH HIGHLIGHT)
    //------------------------------------------------------------
    foundEmployee.attendance
        .filter(entry => statusFilter === "All" || entry.status === statusFilter)
        .forEach(entry => {

            const statusClass =
                entry.status === "Absent"
                    ? "absent-day"
                    : "present-day";

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${entry.date}</td>
                <td class="${statusClass}">${entry.status}</td>
            `;

            attendanceResults.appendChild(row);

        });

    //------------------------------------------------------------
    // LEAVE SEARCH RESULTS (BOOTSTRAP COLORS)
    //------------------------------------------------------------
    foundEmployee.leaveRequests.forEach(request => {

        let colorClass = "";
        if (request.status === "Approved") colorClass = "table-success fw-bold";
        if (request.status === "Pending") colorClass = "table-warning fw-bold";
        if (request.status === "Denied") colorClass = "table-danger fw-bold";

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${request.date}</td>
            <td>${request.reason}</td>
            <td class="${colorClass}">${request.status}</td>
        `;

        leaveResults.appendChild(row);

    });
};

