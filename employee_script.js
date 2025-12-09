/*function buildTable(data) {   /* function that creates everything  
    const table = document.getElementById("myTable")
    /* loop that creates all rows 
    for (let i = 0; i <data.length; i++) {
        let row = `<tr>
            <td>${data[i].id}</td>
            <td>${data[i].name}</td>
            <td>${data[i].position}</td>
            <td>${data[i].department}</td>
            <td>${data[i].contact}</td>
        </tr>`
        table.innerHTML += row 
    }
}*/

// fetch('M1 Project Module - Employee Dummy JSON Data')
//     .then(response => response.json())
//     .then(data => {
        
//         data.employees.forEach(employee => {
    //         const row = document.createElement("tr");
    //         row.innerHTML = `
    //             <td>${employee.id}</td>
    //             <td>${employee.name}</td>
    //             <td>${employee.position}</td>   
    //             <td>${employee.department}</td>
    //             <td>${employee.contact}</td>
    //         `;
    //         const table = document.getElementById("myTable");
    //         table.appendChild(row);
    //     });
    // })
//     .catch(error => console.error('Error fetching employee data:', error));

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
        