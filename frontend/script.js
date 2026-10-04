// ============================================================
// EMPLOYEE PAYROLL MANAGEMENT SYSTEM
// FRONTEND JAVASCRIPT
// C++ CROW BACKEND
// Backend: http://localhost:18080
// ============================================================

const API_BASE = "http://localhost:18080";
function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

let employees = [];
let currentPayroll = null;
let currentEmployeePayroll = null;
let payrollRecords = [];
let payrollRecordsLoadError = "";

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
    localStorage.removeItem("adminUser");
    localStorage.removeItem("employeeLoggedIn");
    localStorage.removeItem("employeeId");

    window.location.href = "index.html";
}


// ============================================================
// LOGIN ROLE TAB SWITCHER
// ============================================================

function switchLoginTab(role) {

    const adminBtn =
        document.getElementById("adminTabBtn");

    const employeeBtn =
        document.getElementById("employeeTabBtn");

    const adminPane =
        document.getElementById("adminPane");

    const employeePane =
        document.getElementById("employeePane");

    if (
        !adminBtn ||
        !employeeBtn ||
        !adminPane ||
        !employeePane
    ) {
        return;
    }

    if (role === "admin") {

        adminBtn.classList.add("active");
        employeeBtn.classList.remove("active");

        adminPane.classList.add("active");
        employeePane.classList.remove("active");

    }
    else {

        employeeBtn.classList.add("active");
        adminBtn.classList.remove("active");

        employeePane.classList.add("active");
        adminPane.classList.remove("active");
    }
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

    const submitBtn =
        document.getElementById("adminSubmitBtn");

    if (
        !usernameElement ||
        !passwordElement
    ) {
        return;
    }

    const username =
        usernameElement.value.trim();

    const password =
        passwordElement.value;

    if (messageElement) {

        messageElement.textContent =
            "Authenticating admin...";

        messageElement.className =
            "msg-info";
    }

    if (submitBtn) {

        submitBtn.disabled = true;

        submitBtn.textContent =
            "Checking...";
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

            localStorage.setItem(
                "adminUser",
                username
            );

            if (messageElement) {

                messageElement.textContent =
                    "Login successful! Redirecting to Dashboard...";

                messageElement.className =
                    "msg-success";
            }

            setTimeout(() => {

                window.location.href =
                    "dashboard.html";

            }, 350);

        }
        else {

            if (messageElement) {

                messageElement.textContent =
                    result.message ||
                    "Invalid username or password.";

                messageElement.className =
                    "msg-error";
            }

            if (submitBtn) {

                submitBtn.disabled = false;

                submitBtn.textContent =
                    "Login as Admin";
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
                error.message ||
                "Cannot connect to C++ backend.";

            messageElement.className =
                "msg-error";
        }

        if (submitBtn) {

            submitBtn.disabled = false;

            submitBtn.textContent =
                "Login as Admin";
        }
    }
}

// ============================================================
// EMPLOYEE PORTAL LOGIN
// ============================================================

async function employeeWebLogin(event) {

    event.preventDefault();

    const employeeIdInput =
        document.getElementById("portalEmployeeId");

    const passwordInput =
        document.getElementById("portalPassword");

    const message =
        document.getElementById("portalMessage");

    const submitButton =
        event.currentTarget
            ? event.currentTarget.querySelector('button[type="submit"]')
            : null;

    if (!employeeIdInput || !passwordInput) {
        if (message) {
            message.textContent = "Employee login fields are missing. Reload the page and try again.";
            message.className = "msg-error";
        }
        return;
    }

    const employeeId =
        Number(employeeIdInput.value);

    const password =
        passwordInput.value;

    if (!Number.isInteger(employeeId) || employeeId <= 0 || !password) {
        if (message) {
            message.textContent = "Enter a valid employee ID and password.";
            message.className = "msg-error";
        }
        return;
    }

    if (message) {
        message.textContent = "Signing in...";
        message.className = "msg-info";
    }

    if (submitButton) {
        submitButton.disabled = true;
    }

    try {
        const result =
            await apiRequest(
                "/api/employee-login",
                {
                    method: "POST",
                    body: JSON.stringify({
                        id: employeeId,
                        password: password
                    })
                }
            );

        if (
            !result.success ||
            !result.employee ||
            Number(result.employee.id) !== employeeId
        ) {
            throw new Error(
                result.message || "Employee login failed."
            );
        }

        localStorage.setItem("employeeLoggedIn", "true");
        localStorage.setItem("employeeId", String(employeeId));
        window.location.href = "portal.html";
    }
    catch (error) {
        console.error("Employee login error:", error);

        if (message) {
            message.textContent =
                error.message || "Unable to sign in. Check your employee ID and password.";
            message.className = "msg-error";
        }
    }
    finally {
        if (submitButton) {
            submitButton.disabled = false;
        }
    }
}

function employeeLogout() {

    localStorage.removeItem("employeeLoggedIn");
    localStorage.removeItem("employeeId");
    currentEmployeePayroll = null;

    if (temporarySlipTimer !== null) {
        clearInterval(temporarySlipTimer);
        temporarySlipTimer = null;
    }

    temporarySlipExpiry = null;
    window.location.href = "index.html";
}

async function loadEmployeePortalData() {

    const loginPanel =
        document.getElementById("portalLogin");

    const dashboard =
        document.getElementById("employeeDashboard");

    const message =
        document.getElementById("portalMessage");

    const isLoggedIn =
        localStorage.getItem("employeeLoggedIn") === "true";

    const employeeId =
        Number(localStorage.getItem("employeeId"));

    if (!isLoggedIn || !Number.isInteger(employeeId) || employeeId <= 0) {
        currentEmployeePayroll = null;
        if (loginPanel) loginPanel.style.display = "block";
        if (dashboard) dashboard.style.display = "none";
        return;
    }

    if (loginPanel) loginPanel.style.display = "block";
    if (dashboard) dashboard.style.display = "none";
    if (message) {
        message.textContent = "Loading your payroll information...";
        message.className = "msg-info";
    }

    try {
        const [employee, payroll] =
            await Promise.all([
                apiRequest(`/api/employees/${employeeId}`),
                apiRequest(`/api/payroll/${employeeId}`)
            ]);

        if (
            Number(employee.id) !== employeeId ||
            Number(payroll.employeeId) !== employeeId
        ) {
            throw new Error("The payroll API returned information for a different employee.");
        }

        currentEmployeePayroll = {
            employeeId: employeeId,
            employeeName: employee.name,
            department: employee.department,
            basicSalary: Number(payroll.basicSalary),
            allowances: Number(payroll.allowances),
            grossSalary: Number(payroll.grossSalary),
            deductions: Number(payroll.deductions),
            netSalary: Number(payroll.netSalary)
        };

        const setText = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };

        setText("portalWelcome", `Welcome, ${employee.name || "Employee"}`);
        setText("myId", employee.id);
        setText("myName", employee.name || "-");
        setText("myDepartment", employee.department || "-");
        setText("myBasic", `₹${currentEmployeePayroll.basicSalary.toFixed(2)}`);
        setText("myAllowance", `₹${currentEmployeePayroll.allowances.toFixed(2)}`);
        setText("myGross", `₹${currentEmployeePayroll.grossSalary.toFixed(2)}`);
        setText("myDeduction", `₹${currentEmployeePayroll.deductions.toFixed(2)}`);
        setText("myNet", `₹${currentEmployeePayroll.netSalary.toFixed(2)}`);

        const slipContent =
            document.getElementById("temporarySlip");

        if (slipContent) {
            slipContent.textContent = "";
            slipContent.style.display = "none";
        }

        const slipMessage =
            document.getElementById("slipMessage");

        if (slipMessage) {
            slipMessage.textContent = "";
        }

        if (loginPanel) loginPanel.style.display = "none";
        if (dashboard) dashboard.style.display = "block";
    }
    catch (error) {
        console.error("Load employee portal data error:", error);
        currentEmployeePayroll = null;

        if (message) {
            message.textContent =
                `Unable to load your payroll information. Please try again. ${error.message || ""}`.trim();
            message.className = "msg-error";
        }
    }
}

function temporarySlip() {

    const message =
        document.getElementById("slipMessage");

    const slipContent =
        document.getElementById("temporarySlip");

    if (!currentEmployeePayroll || !slipContent) {
        if (message) {
            message.textContent = "Your payroll details are not loaded. Refresh the portal and try again.";
            message.className = "msg-error";
        }
        return;
    }

    if (
        temporarySlipExpiry !== null &&
        Date.now() < temporarySlipExpiry
    ) {
        if (message) {
            message.textContent = "Your temporary payroll slip is already active.";
        }
        return;
    }

    const payroll = currentEmployeePayroll;

    const employeeRows = [
        ["Employee ID", escapeHTML(payroll.employeeId)],
        ["Employee Name", escapeHTML(payroll.employeeName || "-")],
        ["Department", escapeHTML(payroll.department || "-")]
    ];
    const salaryRows = [
        ["Basic Salary", formatBreakdownCurrency(payroll.basicSalary)],
        ["Allowances", formatBreakdownCurrency(payroll.allowances)],
        ["Gross Salary", formatBreakdownCurrency(payroll.grossSalary)],
        ["Deductions", formatBreakdownCurrency(payroll.deductions)]
    ];
    const renderRows = rows => rows.map(([label, value]) => `
        <div class="temporary-slip-row">
            <dt>${label}</dt>
            <dd>${value}</dd>
        </div>
    `).join("");

    slipContent.innerHTML = `
        <header class="temporary-slip-header">
            <h3>EMPLOYEE PAYROLL SLIP</h3>
        </header>
        <section class="temporary-slip-section" aria-labelledby="temporarySlipEmployeeHeading">
            <h4 id="temporarySlipEmployeeHeading">Employee Information</h4>
            <dl class="temporary-slip-rows">${renderRows(employeeRows)}</dl>
        </section>
        <section class="temporary-slip-section" aria-labelledby="temporarySlipSalaryHeading">
            <h4 id="temporarySlipSalaryHeading">Salary Details</h4>
            <dl class="temporary-slip-rows">${renderRows(salaryRows)}</dl>
        </section>
        <div class="temporary-slip-total">
            <span>Net Salary</span>
            <strong>${formatBreakdownCurrency(payroll.netSalary)}</strong>
        </div>
    `;
    slipContent.style.display = "block";

    temporarySlipExpiry = Date.now() + 5 * 60 * 1000;

    const updateExpiryMessage = () => {
        const remainingSeconds =
            Math.max(0, Math.ceil((temporarySlipExpiry - Date.now()) / 1000));

        if (remainingSeconds === 0) {
            clearInterval(temporarySlipTimer);
            temporarySlipTimer = null;
            temporarySlipExpiry = null;
            slipContent.textContent = "";
            slipContent.style.display = "none";
            if (message) {
                message.textContent = "Temporary payroll slip access has expired.";
            }
            return;
        }

        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = String(remainingSeconds % 60).padStart(2, "0");
        if (message) {
            message.textContent =
                `Temporary payroll slip is available for ${minutes}:${seconds}.`;
        }
    };

    if (temporarySlipTimer !== null) {
        clearInterval(temporarySlipTimer);
    }

    updateExpiryMessage();
    temporarySlipTimer = setInterval(updateExpiryMessage, 1000);
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

        populatePayrollEmployeeDropdown();

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

        throw error;
    }
}


// ============================================================
// DASHBOARD
// ============================================================

async function loadDashboard() {

    await loadEmployees();

    const payrollResult =
        await apiRequest("/api/payroll-records");

    if (
        !payrollResult.success ||
        !Array.isArray(payrollResult.records)
    ) {
        throw new Error(
            payrollResult.message ||
            "The payroll records response was invalid."
        );
    }

    const totalEmployees =
        document.getElementById(
            "totalEmployees"
        );

    const totalPayrollRecords =
        document.getElementById(
            "totalPayrollRecords"
        );

    if (totalEmployees) {

        totalEmployees.textContent =
            employees.length;
    }

    if (totalPayrollRecords) {
        totalPayrollRecords.textContent =
            payrollResult.records.length;
    }

}


// ============================================================
// PAYROLL EMPLOYEE DROPDOWN
// ============================================================

function populatePayrollEmployeeDropdown() {

    const select =
        document.getElementById(
            "payrollEmployeeSelect"
        );

    if (!select) {
        return;
    }

    select.innerHTML = `
        <option value="">
            -- Choose an Employee --
        </option>
    `;

    employees.forEach(employee => {

        const option =
            document.createElement("option");

        option.value =
            employee.id;

        option.textContent =
            `${employee.id} - ${employee.name} (${employee.department})`;

        select.appendChild(option);
    });

    console.log(
        "Payroll dropdown populated:",
        employees.length,
        "employees"
    );
}


// ============================================================
// EMPLOYEE MANAGEMENT
// ADD / EDIT / DELETE / SEARCH / SORT
// ============================================================

let currentEditingId = null;

let sortColumn = null;

let sortDirection = "asc";


// ============================================================
// OPEN ADD EMPLOYEE MODAL
// ============================================================

function openAddEmployeeModal() {

    const form =
        document.getElementById(
            "employeeForm"
        );

    const backdrop =
        document.getElementById(
            "employeeModalBackdrop"
        );

    if (!form || !backdrop) {
        console.error("Employee form modal elements are missing.");
        alert("Unable to open the employee form.");

        return;
    }

    currentEditingId = null;

    form.reset();

    const employeeId =
        document.getElementById("employeeId");

    if (employeeId) {
        employeeId.readOnly = false;
    }

    const title =
        document.getElementById(
            "formTitle"
        );

    if (title) {
        title.textContent = "Add New Employee";
    }

    const saveBtn =
        document.getElementById(
            "saveEmployeeBtn"
        );

    if (saveBtn) {
        saveBtn.textContent = "Save Employee";
    }

    const employeeIdHelp =
        document.getElementById("employeeIdHelp");

    if (employeeIdHelp) {
        employeeIdHelp.textContent = "Unique numeric ID";
    }

    setEmployeeFormMessage("");
    backdrop.classList.add("active");

    updateSalaryPreview();

    if (employeeId) {
        employeeId.focus();
    }
}


// ============================================================
// CLOSE ADD/EDIT EMPLOYEE MODAL
// ============================================================

function closeEmployeeModal() {

    const form =
        document.getElementById(
            "employeeForm"
        );

    const backdrop =
        document.getElementById(
            "employeeModalBackdrop"
        );

    if (backdrop) {
        backdrop.classList.remove("active");
    }

    if (form) {
        form.reset();
    }

    currentEditingId = null;

    const employeeId =
        document.getElementById("employeeId");

    if (employeeId) {
        employeeId.readOnly = false;
    }

    const title =
        document.getElementById(
            "formTitle"
        );

    if (title) {
        title.textContent = "Add New Employee";
    }

    const saveBtn =
        document.getElementById(
            "saveEmployeeBtn"
        );

    if (saveBtn) {
        saveBtn.textContent = "Save Employee";
    }

    const employeeIdHelp =
        document.getElementById("employeeIdHelp");

    if (employeeIdHelp) {
        employeeIdHelp.textContent = "Unique numeric ID";
    }

    setEmployeeFormMessage("");
    updateSalaryPreview();
}

function handleBackdropClick(event) {

    if (event.target === event.currentTarget) {
        closeEmployeeModal();
    }
}

function setEmployeeFormMessage(message, isError = false) {

    const feedback =
        document.getElementById("formFeedback");

    if (feedback) {
        feedback.textContent = message;
        feedback.style.color = isError ? "#b91c1c" : "#15803d";
    }
}

function updateSalaryPreview() {

    const basicInput =
        document.getElementById("basicSalary");

    const allowanceInput =
        document.getElementById("allowances");

    const deductionInput =
        document.getElementById("deductions");

    const grossPreview =
        document.getElementById("previewGross");

    const netPreview =
        document.getElementById("previewNet");

    if (
        !basicInput ||
        !allowanceInput ||
        !deductionInput ||
        !grossPreview ||
        !netPreview
    ) {
        return;
    }

    const basicSalary = Number(basicInput.value);
    const allowances = Number(allowanceInput.value);
    const deductions = Number(deductionInput.value);

    const grossSalary =
        (Number.isFinite(basicSalary) ? basicSalary : 0) +
        (Number.isFinite(allowances) ? allowances : 0);

    const netSalary =
        grossSalary -
        (Number.isFinite(deductions) ? deductions : 0);

    grossPreview.textContent =
        `₹${grossSalary.toFixed(2)}`;

    netPreview.textContent =
        `₹${netSalary.toFixed(2)}`;
}


// ============================================================
// SAVE / ADD EMPLOYEE
// ============================================================

async function saveEmployee(event) {

    if (event) {
        event.preventDefault();
    }

    const form =
        document.getElementById("employeeForm");

    if (!form || !form.reportValidity()) {
        return;
    }

    const employeeIdInput =
        document.getElementById("employeeId");

    const nameInput =
        document.getElementById(
            "employeeName"
        );

    const departmentInput =
        document.getElementById(
            "department"
        );

    const basicInput =
        document.getElementById(
            "basicSalary"
        );

    const allowanceInput =
        document.getElementById(
            "allowances"
        );

    const deductionInput =
        document.getElementById(
            "deductions"
        );

    if (
        !employeeIdInput ||
        !nameInput ||
        !departmentInput ||
        !basicInput ||
        !allowanceInput ||
        !deductionInput
    ) {

        setEmployeeFormMessage(
            "Employee form fields are missing. Reload the page and try again.",
            true
        );

        return;
    }

    const employeeId =
        Number(employeeIdInput.value);

    const name =
        nameInput.value.trim();

    const department =
        departmentInput.value.trim();

    const basicSalary =
        Number(basicInput.value);

    const allowances =
        Number(allowanceInput.value);

    const deductions =
        Number(deductionInput.value);

    if (
        currentEditingId === null &&
        (!Number.isInteger(employeeId) || employeeId <= 0)
    ) {
        setEmployeeFormMessage(
            "Enter a valid positive whole-number employee ID.",
            true
        );
        employeeIdInput.focus();
        return;
    }

    if (!name) {

        setEmployeeFormMessage("Please enter an employee name.", true);
        nameInput.focus();

        return;
    }

    if (!department) {

        setEmployeeFormMessage("Please enter a department.", true);
        departmentInput.focus();

        return;
    }

    if (
        !Number.isFinite(basicSalary) ||
        basicSalary < 0
    ) {

        setEmployeeFormMessage(
            "Enter a valid non-negative basic salary.",
            true
        );
        basicInput.focus();

        return;
    }

    if (
        !Number.isFinite(allowances) ||
        allowances < 0
    ) {

        setEmployeeFormMessage(
            "Enter valid non-negative allowances.",
            true
        );
        allowanceInput.focus();

        return;
    }

    if (
        !Number.isFinite(deductions) ||
        deductions < 0
    ) {

        setEmployeeFormMessage(
            "Enter valid non-negative deductions.",
            true
        );
        deductionInput.focus();

        return;
    }

    const grossSalary =
        basicSalary + allowances;

    if (
        deductions > grossSalary
    ) {

        setEmployeeFormMessage(
            "Deductions cannot be greater than gross salary.",
            true
        );
        deductionInput.focus();

        return;
    }

    const isEditing =
        currentEditingId !== null;

    const payload = {
        name: name,
        department: department,
        basicSalary: basicSalary,
        allowances: allowances,
        deductions: deductions
    };

    if (!isEditing) {
        payload.id = employeeId;
    }

    try {
        const result =
            await apiRequest(
                isEditing
                    ? `/api/employees/${currentEditingId}`
                    : "/api/employees",
                {
                    method: isEditing ? "PUT" : "POST",
                    body: JSON.stringify(payload)
                }
            );

        if (!result.success) {
            throw new Error(
                result.message ||
                `Unable to ${isEditing ? "update" : "add"} employee.`
            );
        }
    }
    catch (error) {
        console.error("Save employee error:", error);
        setEmployeeFormMessage(
            error.message ||
            `Unable to ${isEditing ? "update" : "add"} employee.`,
            true
        );
        return;
    }

    closeEmployeeModal();

    try {
        await loadEmployeeTable();
    }
    catch (error) {
        console.error("Refresh employee table error:", error);
        showApiConnectionError(error);
    }

    alert(
        isEditing
            ? "Employee updated successfully!"
            : "Employee added successfully!"
    );
}


// ============================================================
// SORT EMPLOYEE TABLE
// ============================================================

function sortTable(column) {

    if (sortColumn === column) {

        sortDirection =
            sortDirection === "asc"
                ? "desc"
                : "asc";
    }

    else {

        sortColumn =
            column;

        sortDirection =
            "asc";
    }

    const sortColumns = [
        "id",
        "name",
        "dept",
        "net"
    ];

    sortColumns.forEach(
        col => {

            const th =
                document.getElementById(
                    `th-${col}`
                );

            const icon =
                document.getElementById(
                    `sort-${col}`
                );

            if (th) {

                th.classList.remove(
                    "active"
                );
            }

            if (icon) {

                icon.textContent =
                    "↕";
            }
        }
    );

    const activeTh =
        document.getElementById(
            `th-${column}`
        );

    const activeIcon =
        document.getElementById(
            `sort-${column}`
        );

    if (activeTh) {

        activeTh.classList.add(
            "active"
        );
    }

    if (activeIcon) {

        activeIcon.textContent =
            sortDirection === "asc"
                ? "↑"
                : "↓";
    }

    const sorted =
        [...employees].sort(
            (a, b) => {

                let valueA;
                let valueB;

                if (column === "id") {

                    valueA =
                        Number(a.id);

                    valueB =
                        Number(b.id);
                }

                else if (
                    column === "name"
                ) {

                    valueA =
                        String(
                            a.name || ""
                        ).toLowerCase();

                    valueB =
                        String(
                            b.name || ""
                        ).toLowerCase();
                }

                else if (
                    column === "dept"
                ) {

                    valueA =
                        String(
                            a.department || ""
                        ).toLowerCase();

                    valueB =
                        String(
                            b.department || ""
                        ).toLowerCase();
                }

                else if (
                    column === "net"
                ) {

                    valueA =
                        Number(
                            a.netSalary ??
                            (
                                Number(
                                    a.basicSalary || 0
                                ) +
                                Number(
                                    a.allowances || 0
                                ) -
                                Number(
                                    a.deductions || 0
                                )
                            )
                        );

                    valueB =
                        Number(
                            b.netSalary ??
                            (
                                Number(
                                    b.basicSalary || 0
                                ) +
                                Number(
                                    b.allowances || 0
                                ) -
                                Number(
                                    b.deductions || 0
                                )
                            )
                        );
                }

                if (
                    valueA < valueB
                ) {

                    return sortDirection === "asc"
                        ? -1
                        : 1;
                }

                if (
                    valueA > valueB
                ) {

                    return sortDirection === "asc"
                        ? 1
                        : -1;
                }

                return 0;
            }
        );

    const searchInput =
        document.getElementById(
            "searchEmployee"
        );

    const query =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";

    if (query) {

        const filtered =
            sorted.filter(
                employee => {

                    return (
                        String(
                            employee.id
                        )
                            .toLowerCase()
                            .includes(query)

                        ||

                        String(
                            employee.name || ""
                        )
                            .toLowerCase()
                            .includes(query)

                        ||

                        String(
                            employee.department || ""
                        )
                            .toLowerCase()
                            .includes(query)
                    );
                }
            );

        displayEmployeeTable(
            filtered,
            query
        );

    }

    else {

        displayEmployeeTable(
            sorted
        );
    }
}


// ============================================================
// CLEAR SEARCH
// ============================================================

function clearSearch() {

    const searchInput =
        document.getElementById(
            "searchEmployee"
        );

    const clearBtn =
        document.getElementById(
            "clearSearchBtn"
        );

    if (searchInput) {

        searchInput.value =
            "";
    }

    if (clearBtn) {

        clearBtn.style.display =
            "none";
    }

    sortColumn =
        null;

    sortDirection =
        "asc";

    [
        "id",
        "name",
        "dept",
        "net"
    ].forEach(
        col => {

            const th =
                document.getElementById(
                    `th-${col}`
                );

            const icon =
                document.getElementById(
                    `sort-${col}`
                );

            if (th) {

                th.classList.remove(
                    "active"
                );
            }

            if (icon) {

                icon.textContent =
                    "↕";
            }
        }
    );

    displayEmployeeTable(
        employees
    );
}
// ============================================================
// LOAD EMPLOYEE TABLE
// ============================================================

async function loadEmployeeTable() {
    await loadEmployees();
    displayEmployeeTable(employees);
}


// ============================================================
// DISPLAY EMPLOYEE TABLE
// ============================================================

function displayEmployeeTable(list, searchQuery) {

    const tableBody =
        document.getElementById("employeeTableBody");

    const countBadge =
        document.getElementById("employeeCountBadge");

    if (!list) {
        list = [];
    }

    if (countBadge) {
        countBadge.textContent =
            `${list.length} Employee${list.length === 1 ? "" : "s"}`;
    }

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    if (list.length === 0) {

        if (searchQuery) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="9">
                        <div class="no-results-box">
                            <span class="no-results-icon">🔍</span>

                            <p>
                                No employees match
                                <strong>
                                    "${escapeHTML(searchQuery)}"
                                </strong>
                            </p>

                            <p style="
                                font-size:13px;
                                color:#9ca3af;
                                margin-bottom:12px;
                            ">
                                Try searching by ID,
                                name, or department
                            </p>

                            <button
                                class="clear-filter-btn"
                                onclick="clearSearch()"
                            >
                                ✕ Clear filter
                            </button>
                        </div>
                    </td>
                </tr>
            `;

        } else {

            tableBody.innerHTML = `
                <tr>
                    <td
                        colspan="9"
                        style="
                            text-align:center;
                            color:#6b7280;
                            padding:35px;
                        "
                    >
                        No employee records found.

                        Click
                        <strong>
                            + Add Employee
                        </strong>
                        to get started.
                    </td>
                </tr>
            `;
        }

        return;
    }

    list.forEach(employee => {

        const basic =
            Number(employee.basicSalary || 0);

        const allowance =
            Number(employee.allowances || 0);

        const deduction =
            Number(employee.deductions || 0);

        const gross =
            Number(
                employee.grossSalary ??
                (basic + allowance)
            );

        const net =
            Number(
                employee.netSalary ??
                (gross - deduction)
            );

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>
                <strong>
                    #${employee.id}
                </strong>
            </td>

            <td>
                ${escapeHTML(employee.name)}
            </td>

            <td>
                <span class="badge badge-dept">
                    ${escapeHTML(employee.department)}
                </span>
            </td>

            <td>
                ₹${basic.toFixed(2)}
            </td>

            <td>
                ₹${allowance.toFixed(2)}
            </td>

            <td>
                ₹${deduction.toFixed(2)}
            </td>

            <td>
                <span class="badge-gross">
                    ₹${gross.toFixed(2)}
                </span>
            </td>

            <td>
                <span class="badge-net">
                    ₹${net.toFixed(2)}
                </span>
            </td>

            <td
                style="
                    text-align:center;
                    white-space:nowrap;
                "
            >

                <button
                    class="action-btn"
                    onclick="openEditEmployeeModal(${employee.id})"
                    title="Edit Employee"
                >
                    ✏️ Edit
                </button>

                <button
                    class="delete-btn"
                    onclick="deleteEmployee(${employee.id})"
                    title="Delete Employee"
                >
                    🗑️ Delete
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
        document.getElementById("searchEmployee");

    const clearBtn =
        document.getElementById("clearSearchBtn");

    if (!searchElement) {
        return;
    }

    const query =
        searchElement.value
            .trim()
            .toLowerCase();

    if (clearBtn) {
        clearBtn.style.display =
            query ? "flex" : "none";
    }

    if (!query) {
        displayEmployeeTable(employees);
        return;
    }

    const filtered =
        employees.filter(employee => {

            const idMatch =
                String(employee.id)
                    .toLowerCase()
                    .includes(query);

            const nameMatch =
                String(employee.name || "")
                    .toLowerCase()
                    .includes(query);

            const departmentMatch =
                String(employee.department || "")
                    .toLowerCase()
                    .includes(query);

            return (
                idMatch ||
                nameMatch ||
                departmentMatch
            );
        });

    displayEmployeeTable(
        filtered,
        query
    );
}


// ============================================================
// EDIT EMPLOYEE
// ============================================================

async function openEditEmployeeModal(id) {

    const employee =
        employees.find(
            e => Number(e.id) === Number(id)
        );

    if (!employee) {
        alert("Employee not found.");
        return;
    }

    const form =
        document.getElementById("employeeForm");

    const backdrop =
        document.getElementById("employeeModalBackdrop");

    const employeeId =
        document.getElementById("employeeId");

    const nameInput =
        document.getElementById("employeeName");

    const departmentInput =
        document.getElementById("department");

    const basicInput =
        document.getElementById("basicSalary");

    const allowanceInput =
        document.getElementById("allowances");

    const deductionInput =
        document.getElementById("deductions");

    if (
        !form ||
        !backdrop ||
        !employeeId ||
        !nameInput ||
        !departmentInput ||
        !basicInput ||
        !allowanceInput ||
        !deductionInput
    ) {
        alert("Employee form fields are missing. Reload the page and try again.");
        return;
    }

    currentEditingId = Number(employee.id);
    employeeId.value = employee.id;
    employeeId.readOnly = true;
    nameInput.value = employee.name || "";
    departmentInput.value = employee.department || "";
    basicInput.value = Number(employee.basicSalary || 0);
    allowanceInput.value = Number(employee.allowances || 0);
    deductionInput.value = Number(employee.deductions || 0);

    const title =
        document.getElementById("formTitle");

    if (title) {
        title.textContent = "Edit Employee";
    }

    const saveBtn =
        document.getElementById("saveEmployeeBtn");

    if (saveBtn) {
        saveBtn.textContent = "Save Changes";
    }

    const employeeIdHelp =
        document.getElementById("employeeIdHelp");

    if (employeeIdHelp) {
        employeeIdHelp.textContent = "Employee ID cannot be changed";
    }

    setEmployeeFormMessage("");
    updateSalaryPreview();
    backdrop.classList.add("active");
    nameInput.focus();
}


// ============================================================
// DELETE EMPLOYEE
// ============================================================

async function deleteEmployee(id) {

    const employee =
        employees.find(
            e => Number(e.id) === Number(id)
        );

    const employeeName =
        employee
            ? employee.name
            : `Employee ${id}`;

    const confirmed =
        confirm(
            `Are you sure you want to delete ${employeeName} (ID: ${id})?`
        );

    if (!confirmed) {
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

        console.log(
            "Delete employee response:",
            result
        );

        if (!result.success) {
            throw new Error(
                result.message || "Unable to delete employee."
            );
        }
    }
    catch (error) {

        console.error("Delete employee error:", error);
        alert(error.message || "Unable to delete employee.");
        return;
    }

    try {
        await loadEmployeeTable();
    }
    catch (error) {
        console.error("Refresh employee table error:", error);
        showApiConnectionError(error);
    }

    alert("Employee deleted successfully!");
}
// ============================================================
// PAYROLL EMPLOYEE SELECTION
// ============================================================

function onPayrollEmployeeSelect() {

    const select =
        document.getElementById("payrollEmployeeSelect");

    if (!select) {
        showPayrollStatus("Employee selector is unavailable. Reload the page and try again.", true);
        return;
    }

    const employeeId =
        Number(select.value);

    const keepCurrentPayroll =
        currentPayroll &&
        Number(currentPayroll.employeeId) === employeeId;

    if (!keepCurrentPayroll) {
        closePayrollSlipModal();

        const salaryResultCard =
            document.getElementById("salaryResultCard");

        if (salaryResultCard) {
            salaryResultCard.classList.add("is-hidden");
        }
    }

    if (!employeeId) {

        const card =
            document.getElementById(
                "employeeInfoCard"
            );

        if (card) {
            card.style.display = "none";
        }

        showPayrollStatus("");
        return;
    }

    const employee =
        employees.find(
            e => Number(e.id) === employeeId
        );

    if (!employee) {
        const card =
            document.getElementById("employeeInfoCard");

        if (card) {
            card.style.display = "none";
        }

        showPayrollStatus("Selected employee was not found. Reload employees and try again.", true);
        return;
    }

    showPayrollStatus("");

    const infoCard =
        document.getElementById(
            "employeeInfoCard"
        );

    if (infoCard) {
        infoCard.style.display = "block";
    }

    const infoEmpId =
        document.getElementById("infoEmpId");

    const infoEmpName =
        document.getElementById("infoEmpName");

    const infoEmpDept =
        document.getElementById("infoEmpDept");

    const infoEmpBasic =
        document.getElementById("infoEmpBasic");

    const infoEmpAllowance =
        document.getElementById("infoEmpAllowance");

    const infoEmpDeduction =
        document.getElementById("infoEmpDeduction");

    if (infoEmpId) {
        infoEmpId.textContent =
            employee.id;
    }

    if (infoEmpName) {
        infoEmpName.textContent =
            employee.name;
    }

    if (infoEmpDept) {
        infoEmpDept.textContent =
            employee.department;
    }

    if (infoEmpBasic) {
        infoEmpBasic.textContent =
            "₹" +
            Number(
                employee.basicSalary || 0
            ).toFixed(2);
    }

    if (infoEmpAllowance) {
        infoEmpAllowance.textContent =
            "₹" +
            Number(
                employee.allowances || 0
            ).toFixed(2);
    }

    if (infoEmpDeduction) {
        infoEmpDeduction.textContent =
            "₹" +
            Number(
                employee.deductions || 0
            ).toFixed(2);
    }
}


// ============================================================
// CALCULATE PAYROLL
// ============================================================

function showPayrollStatus(message, isError = false) {

    const status =
        document.getElementById("payrollStatusMsg");

    if (!status) {
        if (message) {
            alert(message);
        }
        return;
    }

    status.textContent = message;
    status.style.display = message ? "block" : "none";
    status.style.color = isError ? "#991b1b" : "#166534";
    status.style.background = isError ? "#fef2f2" : "#f0fdf4";
}

function formatBreakdownCurrency(amount) {
    return `₹${Number(amount).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function displayPayrollRecords() {

    const tableBody =
        document.getElementById("payrollTableBody");

    const count =
        document.getElementById("payrollRecordCount");

    if (count) {
        count.textContent = payrollRecordsLoadError
            ? "Unavailable"
            : `${payrollRecords.length} Record${payrollRecords.length === 1 ? "" : "s"}`;
    }

    if (!tableBody) {
        return;
    }

    if (payrollRecordsLoadError) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align:center; color:#991b1b; padding:30px;">
                    Unable to load saved payroll records:
                    ${escapeHTML(payrollRecordsLoadError)}
                </td>
            </tr>
        `;
        return;
    }

    if (payrollRecords.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align:center; color:#6b7280; padding:30px;">
                    No payroll records yet. Select an employee and click
                    <strong>Calculate Payroll</strong>.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = payrollRecords.map(payroll => `
        <tr>
            <td>${escapeHTML(payroll.employeeId)}</td>
            <td>${escapeHTML(payroll.employeeName)}</td>
            <td>${escapeHTML(payroll.department)}</td>
            <td>${formatBreakdownCurrency(payroll.basicSalary)}</td>
            <td>${formatBreakdownCurrency(payroll.allowances)}</td>
            <td>${formatBreakdownCurrency(payroll.grossSalary)}</td>
            <td>${formatBreakdownCurrency(payroll.deductions)}</td>
            <td>${formatBreakdownCurrency(payroll.netSalary)}</td>
            <td class="status-success">${escapeHTML(payroll.status || "Calculated")}</td>
        </tr>
    `).join("");
}

async function loadPayrollRecords() {
    payrollRecordsLoadError = "";
    try {
        const result = await apiRequest("/api/payroll-records");
        if (!result.success || !Array.isArray(result.records)) {
            throw new Error(result.message || "The payroll records response was invalid.");
        }
        payrollRecords = result.records;
    }
    catch (error) {
        payrollRecordsLoadError = error.message || "The payroll records could not be loaded.";
        displayPayrollRecords();
        throw error;
    }
    displayPayrollRecords();
}

async function calculatePayroll(event) {

    if (event) {
        event.preventDefault();
    }

    const calculateButton =
        document.getElementById("calculateBtn");

    if (calculateButton && calculateButton.disabled) {
        return;
    }

    const select =
        document.getElementById(
            "payrollEmployeeSelect"
        );

    if (!select || !select.value) {
        showPayrollStatus("Please select an employee before calculating payroll.", true);
        return;
    }

    const employeeId =
        Number(select.value);

    const employee =
        employees.find(
            e => Number(e.id) === employeeId
        );

    if (!employee) {
        showPayrollStatus("Selected employee was not found. Reload employees and try again.", true);
        return;
    }

    showPayrollStatus("");
    currentPayroll = null;

    const salaryResultCard =
        document.getElementById("salaryResultCard");

    if (salaryResultCard) {
        salaryResultCard.classList.add("is-hidden");
    }

    const calculateButtonLabel =
        document.getElementById("calculateBtnLabel");

    if (calculateButton) {
        calculateButton.disabled = true;
        calculateButton.setAttribute("aria-busy", "true");
        calculateButton.classList.add("is-loading");
    }

    if (calculateButtonLabel) {
        calculateButtonLabel.textContent = "Calculating...";
    }

    showPayrollStatus("Calculating payroll...");

    let salaryResultRendered = false;

    try {
        const result =
            await apiRequest(
                `/api/payroll/${employeeId}`
            );
        if (Number(select.value) !== employeeId) {
            return;
        }

        if (
            !result.success ||
            Number(result.employeeId) !== employeeId
        ) {
            throw new Error(
                result.message ||
                "Payroll data did not match the selected employee."
            );
        }

        const basicSalary = Number(result.basicSalary);
        const allowances = Number(result.allowances);
        const deductions = Number(result.deductions);

        if (
            !Number.isFinite(basicSalary) ||
            !Number.isFinite(allowances) ||
            !Number.isFinite(deductions) ||
            basicSalary < 0 ||
            allowances < 0 ||
            deductions < 0
        ) {
            throw new Error("Payroll API returned invalid salary values.");
        }

        const grossSalary =
            basicSalary + allowances;

        const netSalary =
            grossSalary - deductions;

        const calculatedPayroll = {
            employeeId: employeeId,
            employeeName: result.employeeName || employee.name,
            department: employee.department || "",
            basicSalary: basicSalary,
            allowances: allowances,
            grossSalary: grossSalary,
            deductions: deductions,
            netSalary: netSalary
        };

        const savedResult =
            await apiRequest(
                "/api/payroll-records",
                {
                    method: "POST",
                    body: JSON.stringify({ employeeId: employeeId })
                }
            );

        if (
            !savedResult.success ||
            !savedResult.record ||
            Number(savedResult.record.employeeId) !== employeeId
        ) {
            throw new Error(
                savedResult.message ||
                "The payroll record could not be saved."
            );
        }

        currentPayroll = {
            ...calculatedPayroll,
            ...savedResult.record
        };

        // RESULT EMPLOYEE

        const resultEmployeeLabel =
            document.getElementById(
                "resultEmployeeLabel"
            );

        if (resultEmployeeLabel) {

            resultEmployeeLabel.textContent =
                `${employee.id} - ${employee.name} (${employee.department})`;
        }


        // BASIC

        const resultBasic =
            document.getElementById(
                "resultBasic"
            );

        if (resultBasic) {

            resultBasic.textContent =
                formatBreakdownCurrency(basicSalary);
        }


        // ALLOWANCES

        const resultAllowance =
            document.getElementById(
                "resultAllowance"
            );

        if (resultAllowance) {

            resultAllowance.textContent =
                formatBreakdownCurrency(allowances);
        }


        // GROSS

        const resultGross =
            document.getElementById(
                "resultGross"
            );

        if (resultGross) {

            resultGross.textContent =
                formatBreakdownCurrency(grossSalary);
        }


        // DEDUCTIONS

        const resultDeduction =
            document.getElementById(
                "resultDeduction"
            );

        if (resultDeduction) {

            resultDeduction.textContent =
                formatBreakdownCurrency(deductions);
        }


        // NET

        const resultNet =
            document.getElementById(
                "resultNet"
            );

        if (resultNet) {

            resultNet.textContent =
                formatBreakdownCurrency(netSalary);
        }

        salaryResultRendered = true;

        showPayrollStatus("");
        payrollRecordsLoadError = "";

        const existingIndex =
            payrollRecords.findIndex(
                record => Number(record.employeeId) === employeeId
            );
        if (existingIndex === -1) {
            payrollRecords.push(savedResult.record);
        }
        else {
            payrollRecords[existingIndex] = savedResult.record;
        }
        displayPayrollRecords();

    } catch (error) {

        console.error(
            "Calculate payroll error:",
            error
        );

        showPayrollStatus(
            `Unable to calculate payroll: ${error.message || "Check the API connection and try again."}`,
            true
        );
    }
    finally {
        if (calculateButton) {
            calculateButton.disabled = false;
            calculateButton.setAttribute("aria-busy", "false");
            calculateButton.classList.remove("is-loading");
        }

        if (calculateButtonLabel) {
            calculateButtonLabel.textContent = "Calculate Payroll";
        }

        if (salaryResultRendered && salaryResultCard) {
            salaryResultCard.classList.remove("is-hidden");
            salaryResultCard.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    }
}


// ============================================================
// GENERATE PAYROLL SLIP
// ============================================================

function generatePayrollSlip() {

    openPayrollSlipModal();
}


// ============================================================
// PREVIEW PAYROLL SLIP
// ============================================================

function openPayrollSlipModal() {

    if (!currentPayroll) {
        showPayrollStatus("Select an employee and calculate payroll before previewing a slip.", true);
        return;
    }

    const modal =
        document.getElementById("payrollSlipModal");

    const content =
        document.getElementById("slipPreviewContent");

    if (!modal || !content) {
        showPayrollStatus("Payroll slip preview is unavailable. Reload the page and try again.", true);
        return;
    }

    renderPayrollSlip(content, currentPayroll);
    modal.classList.add("active");
    document.addEventListener("keydown", handlePayrollSlipEscape);
    showPayrollStatus("");
}

function renderPayrollSlip(container, payroll) {

    const employeeRows = [
        ["Employee ID", payroll.employeeId],
        ["Employee Name", payroll.employeeName || "-"],
        ["Department", payroll.department || "-"]
    ];
    const salaryRows = [
        ["Basic Salary", formatPayrollAmount(payroll.basicSalary)],
        ["Allowances", formatPayrollAmount(payroll.allowances)],
        ["Gross Salary", formatPayrollAmount(payroll.grossSalary)],
        ["Deductions", formatPayrollAmount(payroll.deductions)]
    ];

    container.replaceChildren();

    const heading = document.createElement("h3");
    heading.textContent = "Employee Payroll Slip";
    heading.className = "payroll-slip-title";
    container.appendChild(heading);

    const appendSection = (title, rows) => {
        const section = document.createElement("section");
        section.className = "payroll-slip-section";

        const sectionHeading = document.createElement("h4");
        sectionHeading.textContent = title;
        section.appendChild(sectionHeading);

        const table = document.createElement("table");
        table.className = "payroll-slip-details";
        const body = document.createElement("tbody");

        rows.forEach(([label, value]) => {
            const row = document.createElement("tr");
            const header = document.createElement("th");
            const cell = document.createElement("td");
            header.textContent = label;
            cell.textContent = value;
            row.appendChild(header);
            row.appendChild(cell);
            body.appendChild(row);
        });

        table.appendChild(body);
        section.appendChild(table);
        container.appendChild(section);
    };

    appendSection("Employee Information", employeeRows);
    appendSection("Salary Details", salaryRows);

    const netSalary = document.createElement("div");
    netSalary.className = "payroll-slip-net";

    const netLabel = document.createElement("span");
    netLabel.textContent = "Net Salary";

    const netValue = document.createElement("strong");
    netValue.textContent = formatPayrollAmount(payroll.netSalary);

    netSalary.append(netLabel, netValue);
    container.appendChild(netSalary);
}

function formatPayrollAmount(amount) {
    return `₹${Number(amount).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function handleSlipBackdropClick(event) {

    if (event.target === event.currentTarget) {
        closePayrollSlipModal();
    }
}

function handlePayrollSlipEscape(event) {

    if (event.key === "Escape") {
        closePayrollSlipModal();
    }
}

function closePayrollSlipModal() {

    const modal =
        document.getElementById("payrollSlipModal");

    if (modal) {
        modal.classList.remove("active");
    }

    document.removeEventListener("keydown", handlePayrollSlipEscape);
}

function printPayrollSlip() {

    if (!currentPayroll) {
        showPayrollStatus("Calculate payroll before printing a slip.", true);
        return;
    }

    const printWindow =
        window.open("", "_blank", "width=800,height=700");

    if (!printWindow) {
        showPayrollStatus("Allow pop-ups to print the payroll slip.", true);
        return;
    }

    const payroll = currentPayroll;

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Payroll Slip - ${Number(payroll.employeeId)}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 32px; color: #111827; }
                h1 { text-align: center; margin-bottom: 24px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 10px 12px; border: 1px solid #d1d5db; text-align: left; }
                th { width: 40%; background: #f3f4f6; }
                @media print { body { padding: 0; } }
            </style>
        </head>
        <body>
            <main id="payroll-slip">
                <h1>Employee Payroll Slip</h1>
                <table>
                    <tbody>
                        <tr><th>Employee ID</th><td>${escapeHTML(payroll.employeeId)}</td></tr>
                        <tr><th>Employee Name</th><td>${escapeHTML(payroll.employeeName || "-")}</td></tr>
                        <tr><th>Department</th><td>${escapeHTML(payroll.department || "-")}</td></tr>
                        <tr><th>Basic Salary</th><td>${formatPayrollAmount(payroll.basicSalary)}</td></tr>
                        <tr><th>Allowances</th><td>${formatPayrollAmount(payroll.allowances)}</td></tr>
                        <tr><th>Gross Salary</th><td>${formatPayrollAmount(payroll.grossSalary)}</td></tr>
                        <tr><th>Deductions</th><td>${formatPayrollAmount(payroll.deductions)}</td></tr>
                        <tr><th>Net Salary</th><td>${formatPayrollAmount(payroll.netSalary)}</td></tr>
                    </tbody>
                </table>
            </main>
        </body>
        </html>
    `);
    printWindow.document.close();

    const print = () => {
        printWindow.focus();
        printWindow.print();
    };

    if (printWindow.document.readyState === "complete") {
        print();
    }
    else {
        printWindow.addEventListener("load", print, { once: true });
    }
}


// ============================================================
// DOWNLOAD PAYROLL SLIP AS TXT
// ============================================================

function downloadPayrollSlipTxt() {

    if (!currentPayroll) {
        showPayrollStatus("Calculate payroll before downloading a slip.", true);
        return;
    }

    const payroll =
        currentPayroll;

    const slip = [
        "EMPLOYEE PAYROLL SLIP",
        `Employee ID       : ${payroll.employeeId}`,
        `Employee Name     : ${payroll.employeeName || "-"}`,
        `Department        : ${payroll.department || "-"}`,
        `Basic Salary      : ${formatPayrollAmount(payroll.basicSalary)}`,
        `Allowances        : ${formatPayrollAmount(payroll.allowances)}`,
        `Gross Salary      : ${formatPayrollAmount(payroll.grossSalary)}`,
        `Deductions        : ${formatPayrollAmount(payroll.deductions)}`,
        `Net Salary        : ${formatPayrollAmount(payroll.netSalary)}`
    ].join("\n");

    try {
        const blob =
            new Blob(
                [slip],
                { type: "text/plain;charset=utf-8" }
            );

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;
        link.download = `Payroll_Slip_${payroll.employeeId}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(url), 100);
        showPayrollStatus("Payroll slip downloaded successfully.");
    }
    catch (error) {
        console.error("Download payroll slip error:", error);
        showPayrollStatus(
            `Unable to download payroll slip: ${error.message || "Please try again."}`,
            true
        );
    }
}


// ============================================================
// PAGE INITIALIZATION
// ============================================================

function showApiConnectionError(error) {

    const pageContent =
        document.querySelector(".main-content") ||
        document.body;

    let message =
        document.getElementById("apiConnectionError");

    if (!message) {
        message = document.createElement("div");
        message.id = "apiConnectionError";
        message.setAttribute("role", "alert");
        message.style.cssText =
            "margin:16px;padding:14px 18px;border-radius:8px;" +
            "background:#fef2f2;color:#991b1b;font-weight:600;";
        pageContent.insertBefore(
            message,
            pageContent.firstChild
        );
    }

    message.textContent =
        `Unable to load page data. Make sure the payroll API is running at ${API_BASE} and refresh the page.` +
        (error && error.message ? ` Details: ${error.message}` : "");
}

async function initializePage() {

    const page =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();

    try {
        if (page === "dashboard.html") {
            await loadDashboard();
        }
        else if (page === "employees.html") {
            await loadEmployeeTable();
        }
        else if (page === "payroll.html") {
            await loadEmployees();
            await loadPayrollRecords();
        }
        else if (page === "portal.html") {
            await loadEmployeePortalData();
        }
    }
    catch (error) {
        showApiConnectionError(error);
    }
}

document.addEventListener(
    "DOMContentLoaded",
    initializePage
);