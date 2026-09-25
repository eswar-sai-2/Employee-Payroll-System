#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <iomanip>
#include <sstream>
#include <stdexcept>

using namespace std;

// ============================================================
// EMPLOYEE CLASS
// ============================================================

class Employee
{
private:
    int employeeID;
    string name;
    string department;
    double basicSalary;
    double allowances;
    double deductions;

public:

    // Default Constructor
    Employee()
    {
        employeeID = 0;
        basicSalary = 0;
        allowances = 0;
        deductions = 0;
    }

    // Parameterized Constructor
    Employee(int id, string n, string d,
             double basic, double allow, double deduct)
    {
        employeeID = id;
        name = n;
        department = d;
        basicSalary = basic;
        allowances = allow;
        deductions = deduct;
    }

    // ========================================================
    // GETTERS
    // ========================================================

    int getID() const
    {
        return employeeID;
    }

    string getName() const
    {
        return name;
    }

    string getDepartment() const
    {
        return department;
    }

    double getBasicSalary() const
    {
        return basicSalary;
    }

    double getAllowances() const
    {
        return allowances;
    }

    double getDeductions() const
    {
        return deductions;
    }

    // ========================================================
    // SETTERS
    // ========================================================

    void setName(string n)
    {
        if (n.empty())
        {
            throw invalid_argument("Employee name cannot be empty.");
        }

        name = n;
    }

    void setDepartment(string d)
    {
        if (d.empty())
        {
            throw invalid_argument("Department cannot be empty.");
        }

        department = d;
    }

    void setBasicSalary(double salary)
    {
        if (salary < 0)
        {
            throw invalid_argument(
                "Basic salary cannot be negative."
            );
        }

        basicSalary = salary;
    }

    void setAllowances(double amount)
    {
        if (amount < 0)
        {
            throw invalid_argument(
                "Allowances cannot be negative."
            );
        }

        allowances = amount;
    }

    void setDeductions(double amount)
    {
        if (amount < 0)
        {
            throw invalid_argument(
                "Deductions cannot be negative."
            );
        }

        deductions = amount;
    }

    // ========================================================
    // INPUT EMPLOYEE
    // ========================================================

    void inputEmployee()
    {
        cout << "\nEnter Employee ID: ";
        cin >> employeeID;

        if (cin.fail())
        {
            cin.clear();
            cin.ignore(10000, '\n');

            throw invalid_argument(
                "Employee ID must be a number."
            );
        }

        if (employeeID <= 0)
        {
            throw invalid_argument(
                "Employee ID must be positive."
            );
        }

        cout << "Enter Employee Name: ";
        cin >> name;

        if (name.empty())
        {
            throw invalid_argument(
                "Employee name cannot be empty."
            );
        }

        cout << "Enter Department: ";
        cin >> department;

        if (department.empty())
        {
            throw invalid_argument(
                "Department cannot be empty."
            );
        }

        cout << "Enter Basic Salary: ";
        cin >> basicSalary;

        if (cin.fail())
        {
            cin.clear();
            cin.ignore(10000, '\n');

            throw invalid_argument(
                "Basic salary must be a number."
            );
        }

        if (basicSalary < 0)
        {
            throw invalid_argument(
                "Basic salary cannot be negative."
            );
        }

        cout << "Enter Allowances: ";
        cin >> allowances;

        if (cin.fail())
        {
            cin.clear();
            cin.ignore(10000, '\n');

            throw invalid_argument(
                "Allowances must be a number."
            );
        }

        if (allowances < 0)
        {
            throw invalid_argument(
                "Allowances cannot be negative."
            );
        }

        cout << "Enter Deductions: ";
        cin >> deductions;

        if (cin.fail())
        {
            cin.clear();
            cin.ignore(10000, '\n');

            throw invalid_argument(
                "Deductions must be a number."
            );
        }

        if (deductions < 0)
        {
            throw invalid_argument(
                "Deductions cannot be negative."
            );
        }
    }

    // ========================================================
    // SALARY CALCULATION
    // ========================================================

    double calculateGrossSalary() const
    {
        return basicSalary + allowances;
    }

    double calculateNetSalary() const
    {
        return calculateGrossSalary() - deductions;
    }

    // ========================================================
    // DISPLAY EMPLOYEE
    // ========================================================

    void displayEmployee() const
    {
        cout << "\n----------------------------------------\n";

        cout << "Employee ID    : " << employeeID << endl;
        cout << "Name           : " << name << endl;
        cout << "Department     : " << department << endl;
        cout << "Basic Salary   : " << basicSalary << endl;
        cout << "Allowances     : " << allowances << endl;
        cout << "Deductions     : " << deductions << endl;

        cout << "Gross Salary   : "
             << calculateGrossSalary() << endl;

        cout << "Net Salary     : "
             << calculateNetSalary() << endl;

        cout << "----------------------------------------\n";
    }

    // ========================================================
    // SAVE EMPLOYEE TO FILE
    // ========================================================

    void saveToFile(ofstream &file) const
    {
        file << employeeID << "|"
             << name << "|"
             << department << "|"
             << basicSalary << "|"
             << allowances << "|"
             << deductions << endl;
    }

    // ========================================================
    // CREATE PAYROLL SLIP
    // ========================================================

    void generatePayrollSlip() const
    {
        string filename =
            "Payroll_Slip_" + to_string(employeeID) + ".txt";

        ofstream file(filename);

        if (!file)
        {
            throw runtime_error(
                "Unable to create payroll slip."
            );
        }

        file << "========================================\n";
        file << "          EMPLOYEE PAYROLL SLIP\n";
        file << "========================================\n\n";

        file << "Employee ID       : "
             << employeeID << endl;

        file << "Employee Name     : "
             << name << endl;

        file << "Department        : "
             << department << endl;

        file << "\n----------------------------------------\n";
        file << "             SALARY DETAILS\n";
        file << "----------------------------------------\n";

        file << fixed << setprecision(2);

        file << "Basic Salary      : Rs. "
             << basicSalary << endl;

        file << "Allowances        : Rs. "
             << allowances << endl;

        file << "Gross Salary      : Rs. "
             << calculateGrossSalary() << endl;

        file << "Deductions        : Rs. "
             << deductions << endl;

        file << "----------------------------------------\n";

        file << "Net Salary        : Rs. "
             << calculateNetSalary() << endl;

        file << "----------------------------------------\n";

        file << "\n        PAYROLL GENERATED SUCCESSFULLY\n";

        file << "========================================\n";

        file.close();

        cout << "\nPayroll slip generated successfully!\n";
        cout << "File: " << filename << endl;
    }
};


// ============================================================
// INPUT INTEGER FUNCTION
// ============================================================

int getInteger(string message)
{
    int value;

    cout << message;
    cin >> value;

    if (cin.fail())
    {
        cin.clear();
        cin.ignore(10000, '\n');

        throw invalid_argument(
            "Please enter a valid number."
        );
    }

    return value;
}


// ============================================================
// INPUT DOUBLE FUNCTION
// ============================================================

double getAmount(string message)
{
    double value;

    cout << message;
    cin >> value;

    if (cin.fail())
    {
        cin.clear();
        cin.ignore(10000, '\n');

        throw invalid_argument(
            "Please enter a valid amount."
        );
    }

    if (value < 0)
    {
        throw invalid_argument(
            "Amount cannot be negative."
        );
    }

    return value;
}


// ============================================================
// CHECK DUPLICATE EMPLOYEE ID
// ============================================================

bool isDuplicateID(
    const vector<Employee> &employees,
    int id)
{
    for (const Employee &employee : employees)
    {
        if (employee.getID() == id)
        {
            return true;
        }
    }

    return false;
}


// ============================================================
// SEARCH EMPLOYEE
// ============================================================

int findEmployee(
    const vector<Employee> &employees,
    int id)
{
    for (int i = 0; i < employees.size(); i++)
    {
        if (employees[i].getID() == id)
        {
            return i;
        }
    }

    return -1;
}


// ============================================================
// ADD EMPLOYEE
// ============================================================

void addEmployee(vector<Employee> &employees)
{
    try
    {
        cout << "\n========== ADD EMPLOYEE ==========\n";

        int id = getInteger("Enter Employee ID: ");

        if (id <= 0)
        {
            throw invalid_argument(
                "Employee ID must be positive."
            );
        }

        if (isDuplicateID(employees, id))
        {
            throw invalid_argument(
                "Employee ID already exists."
            );
        }

        string name;
        string department;

        cout << "Enter Employee Name: ";
        cin >> name;

        cout << "Enter Department: ";
        cin >> department;

        double basic =
            getAmount("Enter Basic Salary: ");

        double allowance =
            getAmount("Enter Allowances: ");

        double deduction =
            getAmount("Enter Deductions: ");

        Employee employee(
            id,
            name,
            department,
            basic,
            allowance,
            deduction
        );

        employees.push_back(employee);

        cout << "\nEmployee added successfully!\n";
    }
    catch (const exception &e)
    {
        cout << "\nError: "
             << e.what() << endl;
    }
}


// ============================================================
// VIEW EMPLOYEES
// ============================================================

void viewEmployees(
    const vector<Employee> &employees)
{
    if (employees.empty())
    {
        cout << "\nNo employee records available.\n";
        return;
    }

    cout << "\n========== ALL EMPLOYEES ==========\n";

    for (const Employee &employee : employees)
    {
        employee.displayEmployee();
    }
}


// ============================================================
// SEARCH EMPLOYEE MENU
// ============================================================

void searchEmployeeMenu(
    const vector<Employee> &employees)
{
    try
    {
        int id =
            getInteger("\nEnter Employee ID to search: ");

        int index =
            findEmployee(employees, id);

        if (index == -1)
        {
            throw runtime_error(
                "Employee not found."
            );
        }

        cout << "\nEmployee Found!\n";

        employees[index].displayEmployee();
    }
    catch (const exception &e)
    {
        cout << "\nError: "
             << e.what() << endl;
    }
}


// ============================================================
// UPDATE EMPLOYEE
// ============================================================

void updateEmployee(
    vector<Employee> &employees)
{
    try
    {
        int id =
            getInteger(
                "\nEnter Employee ID to update: "
            );

        int index =
            findEmployee(employees, id);

        if (index == -1)
        {
            throw runtime_error(
                "Employee not found."
            );
        }

        string name;
        string department;

        cout << "Enter New Employee Name: ";
        cin >> name;

        cout << "Enter New Department: ";
        cin >> department;

        double basic =
            getAmount("Enter New Basic Salary: ");

        double allowance =
            getAmount("Enter New Allowances: ");

        double deduction =
            getAmount("Enter New Deductions: ");

        employees[index].setName(name);
        employees[index].setDepartment(department);
        employees[index].setBasicSalary(basic);
        employees[index].setAllowances(allowance);
        employees[index].setDeductions(deduction);

        cout << "\nEmployee updated successfully!\n";
    }
    catch (const exception &e)
    {
        cout << "\nError: "
             << e.what() << endl;
    }
}


// ============================================================
// PAYROLL CALCULATION
// ============================================================

void calculatePayroll(
    const vector<Employee> &employees)
{
    try
    {
        int id =
            getInteger(
                "\nEnter Employee ID: "
            );

        int index =
            findEmployee(employees, id);

        if (index == -1)
        {
            throw runtime_error(
                "Employee not found."
            );
        }

        const Employee &employee =
            employees[index];

        cout << fixed << setprecision(2);

        cout << "\n========== PAYROLL DETAILS ==========\n";

        cout << "Employee ID   : "
             << employee.getID() << endl;

        cout << "Name          : "
             << employee.getName() << endl;

        cout << "Basic Salary  : Rs. "
             << employee.getBasicSalary() << endl;

        cout << "Allowances    : Rs. "
             << employee.getAllowances() << endl;

        cout << "Gross Salary  : Rs. "
             << employee.calculateGrossSalary()
             << endl;

        cout << "Deductions    : Rs. "
             << employee.getDeductions()
             << endl;

        cout << "Net Salary    : Rs. "
             << employee.calculateNetSalary()
             << endl;
    }
    catch (const exception &e)
    {
        cout << "\nError: "
             << e.what() << endl;
    }
}


// ============================================================
// GENERATE PAYROLL SLIP
// ============================================================

void generateSlip(
    const vector<Employee> &employees)
{
    try
    {
        int id =
            getInteger(
                "\nEnter Employee ID: "
            );

        int index =
            findEmployee(employees, id);

        if (index == -1)
        {
            throw runtime_error(
                "Employee not found."
            );
        }

        employees[index].generatePayrollSlip();
    }
    catch (const exception &e)
    {
        cout << "\nError: "
             << e.what() << endl;
    }
}


// ============================================================
// SAVE ALL EMPLOYEES
// ============================================================

void saveEmployees(
    const vector<Employee> &employees)
{
    try
    {
        ofstream file("employees.txt");

        if (!file)
        {
            throw runtime_error(
                "Unable to open employees.txt."
            );
        }

        for (const Employee &employee : employees)
        {
            employee.saveToFile(file);
        }

        file.close();

        cout << "\nEmployee data saved successfully!\n";
    }
    catch (const exception &e)
    {
        cout << "\nError: "
             << e.what() << endl;
    }
}


// ============================================================
// LOGIN SECURITY
// ============================================================

bool login()
{
    string username;
    string password;

    // Simple project-level authentication
    const string correctUsername = "admin";
    const string correctPassword = "admin123";

    cout << "\n========================================\n";
    cout << "       EMPLOYEE PAYROLL SYSTEM\n";
    cout << "              LOGIN\n";
    cout << "========================================\n";

    for (int attempt = 1; attempt <= 3; attempt++)
    {
        cout << "\nUsername: ";
        cin >> username;

        cout << "Password: ";
        cin >> password;

        if (username == correctUsername &&
            password == correctPassword)
        {
            cout << "\nLogin successful!\n";
            return true;
        }

        cout << "\nInvalid username or password.\n";

        cout << "Attempts remaining: "
             << 3 - attempt << endl;
    }

    cout << "\nAccess denied.\n";

    return false;
}


// ============================================================
// MAIN FUNCTION
// ============================================================

int main()
{
    vector<Employee> employees;

    // --------------------------------------------------------
    // SECURITY LOGIN
    // --------------------------------------------------------

    if (!login())
    {
        return 0;
    }

    int choice;

    do
    {
        cout << "\n\n========================================\n";
        cout << "   EMPLOYEE PAYROLL MANAGEMENT SYSTEM\n";
        cout << "========================================\n";

        cout << "1. Add Employee\n";
        cout << "2. View Employees\n";
        cout << "3. Search Employee\n";
        cout << "4. Calculate Payroll\n";
        cout << "5. Update Employee\n";
        cout << "6. Generate Payroll Slip\n";
        cout << "7. Save Employee Data\n";
        cout << "8. Exit\n";

        try
        {
            choice =
                getInteger(
                    "\nEnter your choice: "
                );

            switch (choice)
            {
                case 1:
                    addEmployee(employees);
                    break;

                case 2:
                    viewEmployees(employees);
                    break;

                case 3:
                    searchEmployeeMenu(employees);
                    break;

                case 4:
                    calculatePayroll(employees);
                    break;

                case 5:
                    updateEmployee(employees);
                    break;

                case 6:
                    generateSlip(employees);
                    break;

                case 7:
                    saveEmployees(employees);
                    break;

                case 8:
                    saveEmployees(employees);

                    cout << "\nThank you for using "
                         << "Employee Payroll Management System!\n";
                    break;

                default:
                    throw invalid_argument(
                        "Invalid menu choice. "
                        "Please select 1 to 8."
                    );
            }
        }
        catch (const exception &e)
        {
            cout << "\nError: "
                 << e.what() << endl;
        }

    } while (choice != 8);

    return 0;
}