import employeeData from './M1 Project Module - Employee Dummy JSON Data/employee_info.json' with { type: 'json' };

const employees = employeeData.employeeInformation

employees.forEach(employee => {
    const tableBody = document.getElementById("myTable");
    const row = document.createElement("tr");
            row.innerHTML = `
                <td>${employee.employeeId}</td>
                <td>${employee.name}</td>
                <td>${employee.position}</td>   
                <td>${employee.department}</td>
                <td>${employee.contact}</td>
            `;
            const table = document.getElementById("myTable");
            tableBody.appendChild(row);
        });
        

       