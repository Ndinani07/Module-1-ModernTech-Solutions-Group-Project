document.addEventListener("DOMContentLoaded", () => {
    // =====================
    // Employee Leave Data
    // =====================
    const employees = [
        {
            id: 1,
            name: "Sibongile Nkosi",
            department: "Development",
            totalLeave: 20,
            leaveRequests: [
                {id: 101, status: "Approved", days: 2, reason: "Sick Leave", date: "2025-07-22"},
                {id: 102, status: "Pending", days: 3, reason: "Personal", date: "2024-12-01"}
            ]
        },
        {
            id: 2,
            name: "Lungile Moyo",
            department: "HR",
            totalLeave: 20,
            leaveRequests: [
                {id: 201, status: "Approved", days: 1, reason: "Vacation", date: "2024-12-02"},
                {id: 202, status: "Pending", days: 1, reason: "Personal", date: "2025-07-15"}
            ]
        },
        {
            id: 3,
            name: "Thabo Molefe",
            department: "Sales",
            totalLeave: 18,
            leaveRequests: [
                {id: 301, status: "Approved", days: 3, reason: "Medical", date: "2024-11-20"},
                {id: 302, status: "Pending", days: 2, reason: "Personal", date: "2025-01-05"}
            ]
        },
        {
            id: 4,
            name: "Keshav Naidoo",
            department: "IT",
            totalLeave: 25,
            leaveRequests: [
                {id: 401, status: "Approved", days: 1, reason: "Bereavement", date: "2024-10-12"}
            ]
        },
        // Add more employees here...
    ];

    // =====================
    // Utility Functions
    // =====================
    function calculateUsedLeave(emp) {
        return emp.leaveRequests
                  .filter(r => r.status === "Approved")
                  .reduce((sum, r) => sum + r.days, 0);
    }

    function calculateRemainingLeave(emp) {
        return emp.totalLeave - calculateUsedLeave(emp);
    }

    function countPending(emp) {
        return emp.leaveRequests.filter(r => r.status === "Pending").length;
    }

    // =====================
    // Populate Dashboard Stats
    // =====================
    function updateStats() {
        document.getElementById("statEmployees").textContent = employees.length;
        document.getElementById("statTotalLeave").textContent = employees.reduce((sum, e) => sum + e.totalLeave, 0);
        document.getElementById("statPendingLeave").textContent = employees.reduce((sum, e) => sum + countPending(e), 0);
    }

    // =====================
    // Populate Leave Table
    // =====================
    function populateLeaveTable(empList = employees) {
        const tbody = document.querySelector("#leaveTable tbody");
        tbody.innerHTML = "";

        empList.forEach(emp => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${emp.name}</td>
                <td>${emp.department}</td>
                <td>${emp.totalLeave}</td>
                <td>${calculateUsedLeave(emp)}</td>
                <td>${calculateRemainingLeave(emp)}</td>
                <td>${countPending(emp)}</td>
                <td>
                    ${emp.leaveRequests.filter(r => r.status === "Pending").map(r => `
                        <button class="btn btn-sm btn-success approveBtn" data-id="${r.id}">Approve</button>
                        <button class="btn btn-sm btn-danger denyBtn" data-id="${r.id}">Deny</button>
                    `).join(' ')}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // =====================
    // Approve/Deny Leave Requests
    // =====================
    document.querySelector("#leaveTable tbody").addEventListener("click", (e) => {
        if (e.target.classList.contains("approveBtn") || e.target.classList.contains("denyBtn")) {
            const requestId = parseInt(e.target.dataset.id);
            const emp = employees.find(emp => emp.leaveRequests.some(r => r.id === requestId));
            if (!emp) return;

            const req = emp.leaveRequests.find(r => r.id === requestId);
            req.status = e.target.classList.contains("approveBtn") ? "Approved" : "Denied";

            alert(`Leave request ${req.status} for ${emp.name}`);
            updateStats();
            populateLeaveTable();
        }
    });

    // =====================
    // Search Filter
    // =====================
    const searchInput = document.getElementById("searchInput");
    searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase();
        const filtered = employees.filter(emp => emp.name.toLowerCase().includes(query));
        populateLeaveTable(filtered);
    });

    // =====================
    // Initialize
    // =====================
    updateStats();
    populateLeaveTable();
});
