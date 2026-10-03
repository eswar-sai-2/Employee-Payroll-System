// ============================================================
// EMPLOYEE PAYROLL MANAGEMENT SYSTEM
// FRONTEND JAVASCRIPT
// C++ CROW BACKEND
// Backend: http://localhost:18080
// ============================================================

const API_BASE = "http://localhost:18080";

let employees = [];
let currentPayroll = null;

let temporarySlipExpiry = null;
let temporarySlipTimer = null;


// ============================================================
// API HELPER
// ============================================================

async function apiRequest(endpoint, options = {}) {

    const response = await fetch(
        API_BASE + endpoint,
        {
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            },
            ...options
        }
    );

    let data;

    try {
        data = await response.json();
    }
    catch (error) {
        throw new Error(
            "Invalid response received from C++ backend."
        );
    }

    if (!response.ok) {
        throw new Error(
            data.message || "Backend request failed."
        );
    }

    return data;
}


// ============================================================
// NAVIGATION
// ============================================================

function goTo(page) {
    window.location.href = page;
}


// ============================================================
// ADMIN LOGOUT
// ============================================================

function logout() {

    localStorage.removeItem("adminLoggedIn");

    localStorage.removeItem("employeeLoggedIn");

    localStorage.removeItem("employeeId");

    window.location.href = "index.html";
}


// ============================================================
// ADMIN LOGIN
// ============================================================

async function adminLogin(event) {

    event.preventDefault();

    const usernameElement =
        document.getElementById("username");

    const passwordElement =
        document.getElementById("password");

    const messageElement =
        document.getElementById("loginMessage");

    if (!usernameElement || !passwordElement) {
        return;
    }

    const username =
        usernameElement.value.trim();

    const password =
        passwordElement.value;

    if (messageElement) {
        messageElement.textContent =
            "Checking login...";
    }

    try {

        const result =
            await apiRequest(
                "/api/login",
                {
                    method: "POST",

                    body: JSON.stringify({
                        username: username,
                        password: password
                    })
                }
            );

        console.log(
            "Admin login response:",
            result
        );

        if (result.success) {

            localStorage.setItem(
                "adminLoggedIn",
                "true"
            );

            if (messageElement) {
                messageElement.textContent =
                    "Login successful!";
            }

            setTimeout(() => {

                window.location.href =
                    "dashboard.html";

            }, 300);

        }
        else {

            if (messageElement) {
                messageElement.textContent =
                    result.message ||
                    "Invalid username or password.";
            }
        }

    }
    catch (error) {

        console.error(
            "Admin login error:",
            error
        );

        if (messageElement) {
            messageElement.textContent =
                "Cannot connect to C++ backend.";
        }
    }
}


// ============================================================
// LOAD ALL EMPLOYEES
// ============================================================

async function loadEmployees() {

    try {

        const result =
            await apiRequest(
                "/api/employees"
            );

        employees =
            result.employees || [];

        console.log(
            "Employees loaded:",
            employees
        );

        return employees;

    }
    catch (error) {

        console.error(
            "Load employees error:",
            error
        );

        employees = [];

        return [];
    }
}


// ============================================================
// DASHBOARD
// ============================================================

async function loadDashboard() {

    await loadEmployees();

    const totalEmployees =
        document.getElementById(
            "totalEmployees"
        );

    const totalPayroll =
        document.getElementById(
            "totalPayroll"
        );

    const totalDepartments =
        document.getElementById(
            "totalDepartments"
        );


    if (totalEmployees) {

        totalEmployees.textContent =
            employees.length;
    }


    if (totalDepartments) {

        const departments =
            new Set(
                employees.map(
                    employee =>
                        employee.department
                )
            );

        totalDepartments.textContent =
            departments.size;
    }


    if (totalPayroll) {

        let total = 0;

        employees.forEach(
            employee => {

                total += Number(
                    employee.netSalary || 0
                );
            }
        );

        totalPayroll.textContent =
            "₹" + total.toFixed(2);
    }


    displayRecentEmployees();
}


// ============================================================
// RECENT EMPLOYEES
// ============================================================

function displayRecentEmployees() {

    const tableBody =
        document.getElementById(
            "recentEmployeesBody"
        );

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    employees
        .slice(-5)
        .reverse()
        .forEach(employee => {

            const row =
                document.createElement("tr");

            row.innerHTML = `
                <td>${employee.id}</td>

                <td>
                    ${escapeHTML(employee.name)}
                </td>

                <td>
                    ${escapeHTML(employee.department)}
                </td>

                <td>
                    ₹${Number(
                        employee.basicSalary || 0
                    ).toFixed(2)}
                </td>

                <td>
                    ₹${Number(
                        employee.netSalary || 0
                    ).toFixed(2)}
                </td>
            `;

            tableBody.appendChild(row);
        });
}


// ============================================================
// EMPLOYEE TABLE
// ============================================================

async function loadEmployeeTable() {

    await loadEmployees();

    displayEmployeeTable(
        employees
    );
}


function displayEmployeeTable(list) {

    const tableBody =
        document.getElementById(
            "employeeTableBody"
        );

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    if (list.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    No employees found.
                </td>
            </tr>
        `;

        return;
    }


    list.forEach(employee => {

        const row =
            document.createElement("tr");

        row.innerHTML = `

            <td>
                ${employee.id}
            </td>

            <td>
                ${escapeHTML(employee.name)}
            </td>

            <td>
                ${escapeHTML(employee.department)}
            </td>

            <td>
                ₹${Number(
                    employee.basicSalary || 0
                ).toFixed(2)}
            </td>

            <td>
                ₹${Number(
                    employee.allowances || 0
                ).toFixed(2)}
            </td>

            <td>
                ₹${Number(
                    employee.deductions || 0
                ).toFixed(2)}
            </td>

            <td>

                <button
                    onclick="editEmployee(${employee.id})"
                >
                    Edit
                </button>

                <button
                    onclick="deleteEmployee(${employee.id})"
                >
                    Delete
                </button>

            </td>
        `;

        tableBody.appendChild(row);
    });
}


// ============================================================
// SEARCH EMPLOYEES
// ============================================================

function searchEmployees() {

    const searchElement =
        document.getElementById(
            "employeeSearch"
        );

    if (!searchElement) {
        return;
    }

    const search =
        searchElement.value
            .trim()
            .toLowerCase();


    const filtered =
        employees.filter(employee => {

            return (

                String(employee.id)
                    .includes(search)

                ||

                String(employee.name)
                    .toLowerCase()
                    .includes(search)

                ||

                String(employee.department)
                    .toLowerCase()
                    .includes(search)
            );
        });


    displayEmployeeTable(
        filtered
    );
}


// ============================================================
// ADD EMPLOYEE
// ============================================================

async function addEmployee(event) {

    event.preventDefault();

    const id =
        Number(
            document.getElementById(
                "employeeId"
            ).value
        );

    const name =
        document.getElementById(
            "employeeName"
        ).value.trim();

    const department =
        document.getElementById(
            "employeeDepartment"
        ).value.trim();

    const basicSalary =
        Number(
            document.getElementById(
                "basicSalary"
            ).value
        );

    const allowances =
        Number(
            document.getElementById(
                "allowances"
            ).value
        );

    const deductions =
        Number(
            document.getElementById(
                "deductions"
            ).value
        );


    if (
        !id ||
        !name ||
        !department
    ) {

        alert(
            "Please enter all employee details."
        );

        return;
    }


    if (
        basicSalary < 0 ||
        allowances < 0 ||
        deductions < 0
    ) {

        alert(
            "Salary amounts cannot be negative."
        );

        return;
    }


    try {

        const result =
            await apiRequest(
                "/api/employees",
                {
                    method: "POST",

                    body: JSON.stringify({

                        id: id,

                        name: name,

                        department: department,

                        basicSalary: basicSalary,

                        allowances: allowances,

                        deductions: deductions
                    })
                }
            );


        if (result.success) {

            alert(
                "Employee added successfully."
            );


            const form =
                document.getElementById(
                    "employeeForm"
                );

            if (form) {
                form.reset();
            }


            await loadEmployeeTable();

        }
        else {

            alert(
                result.message ||
                "Unable to add employee."
            );
        }

    }
    catch (error) {

        console.error(error);

        alert(error.message);
    }
}


// ============================================================
// EDIT EMPLOYEE
// ============================================================

async function editEmployee(id) {

    const employee =
        employees.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!employee) {

        alert(
            "Employee not found."
        );

        return;
    }


    const name =
        prompt(
            "Enter employee name:",
            employee.name
        );

    if (name === null) {
        return;
    }


    const department =
        prompt(
            "Enter department:",
            employee.department
        );

    if (department === null) {
        return;
    }


    const basic =
        prompt(
            "Enter basic salary:",
            employee.basicSalary
        );

    if (basic === null) {
        return;
    }


    const allowance =
        prompt(
            "Enter allowances:",
            employee.allowances
        );

    if (allowance === null) {
        return;
    }


    const deduction =
        prompt(
            "Enter deductions:",
            employee.deductions
        );

    if (deduction === null) {
        return;
    }


    try {

        const result =
            await apiRequest(
                `/api/employees/${id}`,
                {
                    method: "PUT",

                    body: JSON.stringify({

                        name:
                            name.trim(),

                        department:
                            department.trim(),

                        basicSalary:
                            Number(basic),

                        allowances:
                            Number(allowance),

                        deductions:
                            Number(deduction)
                    })
                }
            );


        if (result.success) {

            alert(
                "Employee updated successfully."
            );

            await loadEmployeeTable();

        }
        else {

            alert(
                result.message ||
                "Unable to update employee."
            );
        }

    }
    catch (error) {

        console.error(error);

        alert(error.message);
    }
}


// ============================================================
// DELETE EMPLOYEE
// ============================================================

async function deleteEmployee(id) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete Employee ID " +
            id +
            "?"
        );


    if (!confirmDelete) {
        return;
    }


    try {

        const result =
            await apiRequest(
                `/api/employees/${id}`,
                {
                    method: "DELETE"
                }
            );


        if (result.success) {

            alert(
                "Employee deleted successfully."
            );

            await loadEmployeeTable();

        }
        else {

            alert(
                result.message ||
                "Unable to delete employee."
            );
        }

    }
    catch (error) {

        console.error(error);

        alert(error.message);
    }
}


// ============================================================
// PAYROLL - LOAD EMPLOYEE
// ============================================================

async function loadEmployeePayroll() {

    const idInput =
        document.getElementById("payrollEmployeeId");

    const employeeId =
        idInput ? idInput.value.trim() : "";

    if (!employeeId) {
        return;
    }

    try {

        const employee =
            await apiRequest(
                `/api/employees/${employeeId}`
            );

        console.log(
            "Payroll employee details:",
            employee
        );

        if (!employee || !employee.id) {

            alert("Employee not found.");

            return;
        }

        // Employee Name
        const nameInput =
            document.getElementById(
                "payrollEmployeeName"
            );

        if (nameInput) {
            nameInput.value =
                employee.name || "";
        }


        // Department
        const departmentInput =
            document.getElementById(
                "payrollDepartment"
            );

        if (departmentInput) {
            departmentInput.value =
                employee.department || "";
        }


        // Basic Salary
        const basicInput =
            document.getElementById(
                "payrollBasic"
            );

        if (basicInput) {
            basicInput.value =
                employee.basicSalary ?? "";
        }


        // Allowances
        const allowanceInput =
            document.getElementById(
                "payrollAllowance"
            );

        if (allowanceInput) {
            allowanceInput.value =
                employee.allowances ?? "";
        }


        // Deductions
        const deductionInput =
            document.getElementById(
                "payrollDeduction"
            );

        if (deductionInput) {
            deductionInput.value =
                employee.deductions ?? "";
        }


        // Store currently selected employee
        window.currentPayrollEmployee =
            employee;

        console.log(
            "Current payroll employee:",
            window.currentPayrollEmployee
        );

    }
    catch (error) {

        console.error(
            "Load payroll employee error:",
            error
        );

        alert(
            "Unable to load employee details."
        );
    }
}


// ============================================================
// CLEAR PAYROLL FORM
// ============================================================

function clearPayrollForm() {

    const fields = [

        "payrollEmployeeName",

        "payrollDepartment",

        "payrollBasic",

        "payrollAllowance",

        "payrollDeduction"
    ];


    fields.forEach(id => {

        const element =
            document.getElementById(id);

        if (element) {
            element.value = "";
        }
    });


    currentPayroll = null;
}


// ============================================================
// CALCULATE PAYROLL
// ============================================================

async function calculatePayroll(event) {

    if (event) {
        event.preventDefault();
    }

    const employeeId =
        document.getElementById(
            "payrollEmployeeId"
        ).value.trim();

    if (!employeeId) {

        alert(
            "Please enter Employee ID."
        );

        return;
    }


    try {

        const result =
            await apiRequest(
                `/api/payroll/${employeeId}`
            );

        console.log(
            "Payroll calculation response:",
            result
        );


        if (!result.success) {

            alert(
                result.message ||
                "Unable to calculate payroll."
            );

            return;
        }


        // ==========================================
        // GET VALUES FROM API
        // ==========================================

        const basic =
            Number(
                result.basicSalary || 0
            );

        const allowance =
            Number(
                result.allowances || 0
            );

        const gross =
            Number(
                result.grossSalary || 0
            );

        const deduction =
            Number(
                result.deductions || 0
            );

        const net =
            Number(
                result.netSalary || 0
            );


        // ==========================================
        // DISPLAY SALARY RESULT
        // ==========================================

        document.getElementById(
            "resultBasic"
        ).textContent =
            "₹" + basic.toFixed(2);


        document.getElementById(
            "resultAllowance"
        ).textContent =
            "₹" + allowance.toFixed(2);


        document.getElementById(
            "resultGross"
        ).textContent =
            "₹" + gross.toFixed(2);


        document.getElementById(
            "resultDeduction"
        ).textContent =
            "₹" + deduction.toFixed(2);


        document.getElementById(
            "resultNet"
        ).textContent =
            "₹" + net.toFixed(2);


        // ==========================================
        // SAVE CURRENT PAYROLL
        // ==========================================

        window.currentPayroll = {

            employeeId:
                result.employeeId ||
                Number(employeeId),

            employeeName:
                result.employeeName ||
                document.getElementById(
                    "payrollEmployeeName"
                ).value,

            department:
                document.getElementById(
                    "payrollDepartment"
                ).value,

            basicSalary: basic,

            allowances: allowance,

            grossSalary: gross,

            deductions: deduction,

            netSalary: net
        };


        console.log(
            "Current payroll:",
            window.currentPayroll
        );


        // ==========================================
        // DISPLAY RESULT SECTION
        // ==========================================

        const salaryResult =
            document.getElementById(
                "salaryResult"
            );

        if (salaryResult) {

            salaryResult.style.display =
                "block";
        }


        // ==========================================
        // UPDATE PAYROLL TABLE
        // ==========================================

        if (
            typeof displayPayrollRecords ===
            "function"
        ) {

            displayPayrollRecords();
        }

    }
    catch (error) {

        console.error(
            "Calculate payroll error:",
            error
        );

        alert(
            "Unable to calculate payroll."
        );
    }
}


// ============================================================
// DISPLAY PAYROLL RESULT
// ============================================================

function displayPayrollResult(
    payroll
) {

    const resultBasic =
        document.getElementById(
            "resultBasic"
        );

    const resultAllowance =
        document.getElementById(
            "resultAllowance"
        );

    const resultGross =
        document.getElementById(
            "resultGross"
        );

    const resultDeduction =
        document.getElementById(
            "resultDeduction"
        );

    const resultNet =
        document.getElementById(
            "resultNet"
        );


    if (resultBasic) {

        resultBasic.textContent =
            "₹" +
            payroll.basicSalary
                .toFixed(2);
    }


    if (resultAllowance) {

        resultAllowance.textContent =
            "₹" +
            payroll.allowances
                .toFixed(2);
    }


    if (resultGross) {

        resultGross.textContent =
            "₹" +
            payroll.grossSalary
                .toFixed(2);
    }


    if (resultDeduction) {

        resultDeduction.textContent =
            "₹" +
            payroll.deductions
                .toFixed(2);
    }


    if (resultNet) {

        resultNet.textContent =
            "₹" +
            payroll.netSalary
                .toFixed(2);
    }


    const resultSection =
        document.getElementById(
            "salaryResult"
        );


    if (resultSection) {

        resultSection.style.display =
            "block";

        resultSection.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }
}


// ============================================================
// PAYROLL TABLE
// ============================================================

function displayPayrollRecord(
    payroll
) {

    const tableBody =
        document.getElementById(
            "payrollTableBody"
        );


    if (!tableBody) {
        return;
    }


    let row =
        document.getElementById(
            `payroll-row-${payroll.id}`
        );


    if (!row) {

        row =
            document.createElement(
                "tr"
            );

        row.id =
            `payroll-row-${payroll.id}`;

        tableBody.appendChild(
            row
        );
    }


    row.innerHTML = `

        <td>
            ${payroll.id}
        </td>

        <td>
            ${escapeHTML(
                payroll.name
            )}
        </td>

        <td>
            ${escapeHTML(
                payroll.department
            )}
        </td>

        <td>
            ₹${payroll.grossSalary
                .toFixed(2)}
        </td>

        <td>
            ₹${payroll.netSalary
                .toFixed(2)}
        </td>

        <td>
            <span class="status-success">
                Calculated
            </span>
        </td>
    `;
}


// ============================================================
// GENERATE PAYROLL SLIP
// ============================================================

function generatePayrollSlip() {

    const payroll =
        window.currentPayroll;

    if (!payroll) {

        alert(
            "Please calculate payroll first."
        );

        return;
    }


    const slip = `
========================================
        EMPLOYEE PAYROLL SLIP
========================================

Employee ID       : ${payroll.employeeId}
Employee Name     : ${payroll.employeeName || "-"}
Department        : ${payroll.department || "-"}

----------------------------------------
             SALARY DETAILS
----------------------------------------

Basic Salary      : ₹${payroll.basicSalary.toFixed(2)}
Allowances        : ₹${payroll.allowances.toFixed(2)}
Gross Salary      : ₹${payroll.grossSalary.toFixed(2)}
Deductions        : ₹${payroll.deductions.toFixed(2)}

----------------------------------------
Net Salary        : ₹${payroll.netSalary.toFixed(2)}
----------------------------------------

       PAYROLL GENERATED SUCCESSFULLY

========================================
`;


    // Create downloadable file
    const blob =
        new Blob(
            [slip],
            {
                type: "text/plain"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;

    link.download =
        `Payroll_Slip_${payroll.employeeId}.txt`;


    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);


    alert(
        "Payroll slip generated successfully!"
    );
}

// ============================================================
// DOWNLOAD PAYROLL SLIP
// ============================================================

function downloadPayrollSlip(
    id,
    content
) {

    const blob =
        new Blob(
            [content],
            {
                type:
                    "text/plain;charset=utf-8"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        `Payroll_Slip_${id}.txt`;


    document.body.appendChild(
        link
    );


    link.click();


    document.body.removeChild(
        link
    );


    setTimeout(() => {

        URL.revokeObjectURL(
            url
        );

    }, 100);


    alert(
        "Payroll slip generated successfully."
    );
}


// ============================================================
// SORT EMPLOYEES
// ============================================================

async function sortEmployees(
    type = "id"
) {

    try {

        const result =
            await apiRequest(
                `/api/employees/sort?by=${encodeURIComponent(type)}`
            );


        if (result.success) {

            employees =
                result.employees || [];

            displayEmployeeTable(
                employees
            );

        }
        else {

            alert(
                result.message ||
                "Unable to sort employees."
            );
        }

    }
    catch (error) {

        console.error(error);

        alert(
            error.message
        );
    }
}


// ============================================================
// EMPLOYEE PORTAL LOGIN
// IMPORTANT: MATCHES portal.html
// ============================================================

async function employeeWebLogin(
    event
) {

    event.preventDefault();


    const idElement =
        document.getElementById(
            "portalEmployeeId"
        );


    const passwordElement =
        document.getElementById(
            "portalPassword"
        );


    const messageElement =
        document.getElementById(
            "portalMessage"
        );


    if (
        !idElement ||
        !passwordElement
    ) {

        console.error(
            "Employee portal login fields not found."
        );

        return;
    }


    const id =
        Number(
            idElement.value
        );


    const password =
        passwordElement.value;


    if (!id || !password) {

        if (messageElement) {

            messageElement.textContent =
                "Please enter Employee ID and password.";
        }

        return;
    }


    if (messageElement) {

        messageElement.textContent =
            "Checking login...";
    }


    try {

        const result =
            await apiRequest(
                "/api/employee-login",
                {
                    method: "POST",

                    body: JSON.stringify({

                        id: id,

                        password: password
                    })
                }
            );


        console.log(
            "Employee login response:",
            result
        );


        if (result.success) {

            localStorage.setItem(
                "employeeLoggedIn",
                "true"
            );


            localStorage.setItem(
                "employeeId",
                String(id)
            );


            if (messageElement) {

                messageElement.textContent =
                    "Login successful!";
            }


            showEmployeeDashboard();

        }
        else {

            if (messageElement) {

                messageElement.textContent =
                    result.message ||
                    "Invalid Employee ID or password.";
            }
        }

    }
    catch (error) {

        console.error(
            "Employee login error:",
            error
        );


        if (messageElement) {

            messageElement.textContent =
                "Cannot connect to C++ backend.";
        }
    }
}


// ============================================================
// SHOW EMPLOYEE DASHBOARD
// IMPORTANT: MATCHES portal.html
// ============================================================

function showEmployeeDashboard() {

    const loginSection =
        document.getElementById("portalLogin");

    const dashboardSection =
        document.getElementById("employeeDashboard");


    // Hide login page
    if (loginSection) {
        loginSection.style.display = "none";
    }


    // Show employee dashboard
    if (dashboardSection) {
        dashboardSection.style.display = "block";
    }


    // Load employee information
    loadEmployeePortalData();
}

async function loadEmployeePortalData() {

    const employeeId =
        localStorage.getItem("employeeId");


    if (!employeeId) {

        console.error(
            "Employee ID not found."
        );

        return;
    }


    try {

        // ==========================================
        // GET EMPLOYEE DETAILS
        // ==========================================

        const employee =
            await apiRequest(
                `/api/employees/${employeeId}`
            );


        console.log(
            "Employee details:",
            employee
        );


        // Your C++ API returns the employee
        // object directly.
        if (!employee || !employee.id) {

            console.error(
                "Invalid employee data."
            );

            return;
        }


        // ==========================================
        // DISPLAY EMPLOYEE DETAILS
        // ==========================================

        const myId =
            document.getElementById("myId");

        const myName =
            document.getElementById("myName");

        const myDepartment =
            document.getElementById(
                "myDepartment"
            );


        if (myId) {

            myId.textContent =
                employee.id;
        }


        if (myName) {

            myName.textContent =
                employee.name || "-";
        }


        if (myDepartment) {

            myDepartment.textContent =
                employee.department || "-";
        }


        // ==========================================
        // WELCOME MESSAGE
        // ==========================================

        const welcome =
            document.getElementById(
                "portalWelcome"
            );


        if (welcome) {

            welcome.textContent =
                "Welcome, " +
                (
                    employee.name ||
                    "Employee"
                );
        }


        // ==========================================
        // LOAD PAYROLL
        // ==========================================

        await loadEmployeePortalPayroll(
            employeeId
        );

    }
    catch (error) {

        console.error(
            "Employee portal data error:",
            error
        );
    }
}

// ============================================================
// LOAD EMPLOYEE PORTAL DATA
// ============================================================

async function loadEmployeePortalPayroll(id) {

    try {

        const result =
            await apiRequest(
                `/api/payroll/${id}`
            );


        console.log(
            "Employee portal payroll:",
            result
        );


        if (!result.success) {

            console.error(
                result.message ||
                "Payroll not found."
            );

            return;
        }


        const basic =
            Number(
                result.basicSalary || 0
            );

        const allowance =
            Number(
                result.allowances || 0
            );

        const gross =
            Number(
                result.grossSalary || 0
            );

        const deduction =
            Number(
                result.deductions || 0
            );

        const net =
            Number(
                result.netSalary || 0
            );


        // ==========================================
        // DISPLAY SALARY
        // ==========================================

        const myBasic =
            document.getElementById("myBasic");

        const myAllowance =
            document.getElementById(
                "myAllowance"
            );

        const myGross =
            document.getElementById("myGross");

        const myDeduction =
            document.getElementById(
                "myDeduction"
            );

        const myNet =
            document.getElementById("myNet");


        if (myBasic) {

            myBasic.textContent =
                "₹" + basic.toFixed(2);
        }


        if (myAllowance) {

            myAllowance.textContent =
                "₹" + allowance.toFixed(2);
        }


        if (myGross) {

            myGross.textContent =
                "₹" + gross.toFixed(2);
        }


        if (myDeduction) {

            myDeduction.textContent =
                "₹" + deduction.toFixed(2);
        }


        if (myNet) {

            myNet.textContent =
                "₹" + net.toFixed(2);
        }

    }
    catch (error) {

        console.error(
            "Payroll loading error:",
            error
        );
    }
}


// ============================================================
// EMPLOYEE PORTAL - GENERATE PAYROLL SLIP
// ============================================================

async function employeeGeneratePayrollSlip() {

    const employeeId =
        localStorage.getItem(
            "employeeId"
        );


    if (!employeeId) {

        alert(
            "Please login as an employee first."
        );

        return;
    }


    try {

        const result =
            await apiRequest(
                `/api/payroll/${employeeId}`
            );


        if (!result.success) {

            alert(
                result.message ||
                "Unable to generate payroll slip."
            );

            return;
        }


        const basic =
            Number(
                result.basicSalary || 0
            );


        const allowance =
            Number(
                result.allowances || 0
            );


        const gross =
            Number(
                result.grossSalary ??
                (
                    basic +
                    allowance
                )
            );


        const deduction =
            Number(
                result.deductions || 0
            );


        const net =
            Number(
                result.netSalary ??
                (
                    gross -
                    deduction
                )
            );


        const slip = `

========================================
          EMPLOYEE PAYROLL SLIP
========================================

Employee ID       : ${result.id || employeeId}
Employee Name     : ${result.name || ""}
Department        : ${result.department || ""}

----------------------------------------
             SALARY DETAILS
----------------------------------------

Basic Salary      : ₹${basic.toFixed(2)}
Allowances        : ₹${allowance.toFixed(2)}
Gross Salary      : ₹${gross.toFixed(2)}
Deductions        : ₹${deduction.toFixed(2)}

----------------------------------------
Net Salary        : ₹${net.toFixed(2)}
----------------------------------------

        PAYROLL GENERATED SUCCESSFULLY

========================================
        EMPLOYEE PAYROLL SYSTEM
========================================
`;


        downloadPayrollSlip(
            employeeId,
            slip
        );

    }
    catch (error) {

        console.error(
            error
        );

        alert(
            error.message
        );
    }
}


// ============================================================
// TEMPORARY PAYROLL SLIP
// IMPORTANT: MATCHES portal.html
// ============================================================

async function temporarySlip() {

    const employeeId =
        localStorage.getItem("employeeId");

    if (!employeeId) {

        alert(
            "Please login as an employee first."
        );

        return;
    }

    try {

        // ==========================================
        // GET EMPLOYEE DETAILS
        // ==========================================

        const employee =
            await apiRequest(
                `/api/employees/${employeeId}`
            );

        console.log(
            "Employee for temporary slip:",
            employee
        );


        // ==========================================
        // GET PAYROLL DETAILS
        // ==========================================

        const payroll =
            await apiRequest(
                `/api/payroll/${employeeId}`
            );

        console.log(
            "Payroll for temporary slip:",
            payroll
        );


        if (!payroll.success) {

            alert(
                payroll.message ||
                "Payroll not available."
            );

            return;
        }


        // ==========================================
        // SALARY VALUES
        // ==========================================

        const basic =
            Number(
                payroll.basicSalary || 0
            );

        const allowance =
            Number(
                payroll.allowances || 0
            );

        const gross =
            Number(
                payroll.grossSalary || 0
            );

        const deduction =
            Number(
                payroll.deductions || 0
            );

        const net =
            Number(
                payroll.netSalary || 0
            );


        // ==========================================
        // EMPLOYEE DETAILS
        // ==========================================

        const name =
            employee.name ||
            payroll.employeeName ||
            "";

        const department =
            employee.department ||
            "";


        // ==========================================
        // START 5-MINUTE TIMER
        // ==========================================

        temporarySlipExpiry =
            Date.now() +
            (5 * 60 * 1000);


        // ==========================================
        // FIND SLIP CONTAINER
        // ==========================================

        const container =
            document.getElementById(
                "temporarySlip"
            );


        if (!container) {

            alert(
                "Temporary slip area not found."
            );

            return;
        }


        // ==========================================
        // DISPLAY PAYROLL SLIP
        // ==========================================

        container.innerHTML = `

            <div class="payroll-slip">

                <h2>
                    EMPLOYEE PAYROLL SLIP
                </h2>

                <hr>

                <p>
                    <strong>
                        Employee ID:
                    </strong>

                    ${employee.id || employeeId}
                </p>

                <p>
                    <strong>
                        Name:
                    </strong>

                    ${escapeHTML(name)}
                </p>

                <p>
                    <strong>
                        Department:
                    </strong>

                    ${escapeHTML(department)}
                </p>

                <hr>

                <p>
                    Basic Salary:
                    ₹${basic.toFixed(2)}
                </p>

                <p>
                    Allowances:
                    ₹${allowance.toFixed(2)}
                </p>

                <p>
                    Gross Salary:
                    ₹${gross.toFixed(2)}
                </p>

                <p>
                    Deductions:
                    ₹${deduction.toFixed(2)}
                </p>

                <p>
                    <strong>
                        Net Salary:
                        ₹${net.toFixed(2)}
                    </strong>
                </p>

                <hr>

                <p id="temporaryTimer">
                    Access valid for 5:00
                </p>

            </div>
        `;


        // Show slip
        container.style.display =
            "block";


        // Message
        const slipMessage =
            document.getElementById(
                "slipMessage"
            );


        if (slipMessage) {

            slipMessage.textContent =
                "Payroll slip activated for 5 minutes.";
        }


        // Start timer
        startTemporaryTimer();

    }
    catch (error) {

        console.error(
            "Temporary slip error:",
            error
        );

        alert(
            "Unable to access payroll slip."
        );
    }
}


// ============================================================
// TEMPORARY SLIP TIMER
// ============================================================

function startTemporaryTimer() {

    if (temporarySlipTimer) {

        clearInterval(
            temporarySlipTimer
        );
    }


    temporarySlipTimer =
        setInterval(() => {

            if (!temporarySlipExpiry) {
                return;
            }


            const remaining =
                temporarySlipExpiry -
                Date.now();


            if (remaining <= 0) {

                clearInterval(
                    temporarySlipTimer
                );

                temporarySlipTimer =
                    null;


                const container =
                    document.getElementById(
                        "temporarySlip"
                    );


                if (container) {

                    container.innerHTML = `

                        <h2>
                            Access Expired
                        </h2>

                        <p>
                            Your temporary payroll
                            slip access has expired.
                        </p>
                    `;
                }


                const slipMessage =
                    document.getElementById(
                        "slipMessage"
                    );


                if (slipMessage) {

                    slipMessage.textContent =
                        "Payroll slip access expired.";
                }


                temporarySlipExpiry =
                    null;


                return;
            }


            const minutes =
                Math.floor(
                    remaining / 60000
                );


            const seconds =
                Math.floor(
                    (remaining % 60000) / 1000
                );


            const timer =
                document.getElementById(
                    "temporaryTimer"
                );


            if (timer) {

                timer.textContent =
                    "Access valid for " +
                    minutes +
                    ":" +
                    String(seconds)
                        .padStart(2, "0");
            }

        }, 1000);
}


// ============================================================
// EMPLOYEE LOGOUT
// ============================================================

function employeeLogout() {

    localStorage.removeItem(
        "employeeLoggedIn"
    );


    localStorage.removeItem(
        "employeeId"
    );


    if (temporarySlipTimer) {

        clearInterval(
            temporarySlipTimer
        );

        temporarySlipTimer =
            null;
    }


    temporarySlipExpiry =
        null;


    window.location.href =
        "portal.html";
}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


// ============================================================
// PAGE INITIALIZATION
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        const page =
            window.location.pathname
                .split("/")
                .pop()
                .toLowerCase();


        console.log(
            "Current page:",
            page
        );


        // ====================================================
        // DASHBOARD
        // ====================================================

        if (
            page === "dashboard.html"
        ) {

            if (
                localStorage.getItem(
                    "adminLoggedIn"
                ) !== "true"
            ) {

                window.location.href =
                    "index.html";

                return;
            }


            await loadDashboard();
        }


        // ====================================================
        // EMPLOYEES
        // ====================================================

        if (
            page === "employees.html"
        ) {

            if (
                localStorage.getItem(
                    "adminLoggedIn"
                ) !== "true"
            ) {

                window.location.href =
                    "index.html";

                return;
            }


            await loadEmployeeTable();
        }


        // ====================================================
        // PAYROLL
        // ====================================================

        if (
            page === "payroll.html"
        ) {

            if (
                localStorage.getItem(
                    "adminLoggedIn"
                ) !== "true"
            ) {

                window.location.href =
                    "index.html";

                return;
            }


            await loadEmployees();
        }


        // ====================================================
        // EMPLOYEE PORTAL
        // ====================================================

        if (
            page === "portal.html"
        ) {

            const loggedIn =
                localStorage.getItem(
                    "employeeLoggedIn"
                );


            if (
                loggedIn === "true"
            ) {

                showEmployeeDashboard();
            }
        }

    }
);