#define _WIN32_WINNT 0x0601
#include <crow.h>
#include <crow/middlewares/cors.h>

#ifdef DELETE
#undef DELETE
#endif

#include <fstream>
#include <sstream>
#include <string>
#include <vector>
#include <algorithm>
#include <iomanip>
#include <mutex>
#include <exception>
#include <cstdlib>

using namespace std;

struct Employee {
    int id{};
    string name;
    string department;
    double basic{};
    double allowance{};
    double deduction{};

    double gross() const {
        return basic + allowance;
    }

    double net() const {
        return gross() - deduction;
    }
};

struct PayrollRecord {
    int employeeId{};
    string employeeName;
    string department;
    double basicSalary{};
    double allowances{};
    double grossSalary{};
    double deductions{};
    double netSalary{};
    string status;
};

vector<Employee> employees;
vector<PayrollRecord> payrollRecords;
mutex payrollRecordsMutex;

string jsonError(const string& message) {
    crow::json::wvalue x;
    x["success"] = false;
    x["message"] = message;
    return x.dump();
}

void loadEmployees() {
    employees.clear();

    ifstream file("employees.txt");
    if (!file.is_open())
        return;

    string line;

    while (getline(file, line)) {
        if (line.empty())
            continue;

        stringstream ss(line);
        string id, name, department, basic, allowance, deduction;

        if (!getline(ss, id, '|')) continue;
        if (!getline(ss, name, '|')) continue;
        if (!getline(ss, department, '|')) continue;
        if (!getline(ss, basic, '|')) continue;
        if (!getline(ss, allowance, '|')) continue;
        if (!getline(ss, deduction, '|')) continue;

        try {
            Employee e;
            e.id = stoi(id);
            e.name = name;
            e.department = department;
            e.basic = stod(basic);
            e.allowance = stod(allowance);
            e.deduction = stod(deduction);

            employees.push_back(e);
        }
        catch (...) {
            // Ignore invalid lines.
        }
    }
}

void saveEmployees() {
    ofstream file("employees.txt");

    for (const auto& e : employees) {
        file << e.id << "|"
             << e.name << "|"
             << e.department << "|"
             << fixed << setprecision(2)
             << e.basic << "|"
             << e.allowance << "|"
             << e.deduction << "\n";
    }
}

void loadPayrollRecords() {
    payrollRecords.clear();

    ifstream file("payroll_records.txt");
    if (!file.is_open())
        return;

    string line;
    while (getline(file, line)) {
        if (line.empty())
            continue;

        stringstream ss(line);
        string id, name, department, basic, allowances, gross, deductions, net, status;

        if (!getline(ss, id, '|') ||
            !getline(ss, name, '|') ||
            !getline(ss, department, '|') ||
            !getline(ss, basic, '|') ||
            !getline(ss, allowances, '|') ||
            !getline(ss, gross, '|') ||
            !getline(ss, deductions, '|') ||
            !getline(ss, net, '|') ||
            !getline(ss, status)) {
            cerr << "Skipping malformed payroll record: " << line << "\n";
            continue;
        }

        try {
            PayrollRecord record;
            record.employeeId = stoi(id);
            record.employeeName = name;
            record.department = department;
            record.basicSalary = stod(basic);
            record.allowances = stod(allowances);
            record.grossSalary = stod(gross);
            record.deductions = stod(deductions);
            record.netSalary = stod(net);
            record.status = status;
            payrollRecords.push_back(record);
        }
        catch (const exception&) {
            cerr << "Skipping invalid payroll record: " << line << "\n";
        }
    }
}

bool savePayrollRecords(const vector<PayrollRecord>& records) {
    ofstream file("payroll_records.txt", ios::trunc);
    if (!file.is_open())
        return false;

    for (const auto& record : records) {
        file << record.employeeId << "|"
             << record.employeeName << "|"
             << record.department << "|"
             << fixed << setprecision(2)
             << record.basicSalary << "|"
             << record.allowances << "|"
             << record.grossSalary << "|"
             << record.deductions << "|"
             << record.netSalary << "|"
             << record.status << "\n";
    }

    file.flush();
    return file.good();
}

crow::json::wvalue payrollRecordJson(const PayrollRecord& record) {
    crow::json::wvalue result;
    result["employeeId"] = record.employeeId;
    result["employeeName"] = record.employeeName;
    result["department"] = record.department;
    result["basicSalary"] = record.basicSalary;
    result["allowances"] = record.allowances;
    result["grossSalary"] = record.grossSalary;
    result["deductions"] = record.deductions;
    result["netSalary"] = record.netSalary;
    result["status"] = record.status;
    return result;
}

Employee* findEmployee(int id) {
    for (auto& e : employees) {
        if (e.id == id)
            return &e;
    }
    return nullptr;
}

crow::json::wvalue employeeJson(const Employee& e) {
    crow::json::wvalue x;

    x["id"] = e.id;
    x["name"] = e.name;
    x["department"] = e.department;
    x["basicSalary"] = e.basic;
    x["allowances"] = e.allowance;
    x["deductions"] = e.deduction;
    x["grossSalary"] = e.gross();
    x["netSalary"] = e.net();

    return x;
}

int main() {
    loadEmployees();
    loadPayrollRecords();

    crow::App<crow::CORSHandler> app;

    auto& cors = app.get_middleware<crow::CORSHandler>();

    cors.global()
        .origin("*")
        .methods(
            crow::HTTPMethod::GET,
            crow::HTTPMethod::POST,
            crow::HTTPMethod::PUT,
            crow::HTTPMethod::DELETE,
            crow::HTTPMethod::OPTIONS
        )
        .headers("*").max_age(86400);

    // Home / API status
    CROW_ROUTE(app, "/")
    ([] {
        crow::json::wvalue x;
        x["success"] = true;
        x["message"] = "Employee Payroll Management System API is running.";
        return x;
    });

    // Enable browser frontend requests.
    CROW_ROUTE(app, "/api/employees")
    .methods(crow::HTTPMethod::OPTIONS)
    ([] {
        crow::response res;
        res.add_header("Access-Control-Allow-Origin", "*");
        res.add_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.add_header("Access-Control-Allow-Headers", "Content-Type");
        return res;
    });

    // GET all employees
    CROW_ROUTE(app, "/api/employees")
    ([] {
        crow::json::wvalue result;
        result["success"] = true;

        crow::json::wvalue::list list;

        for (const auto& e : employees) {
            list.push_back(employeeJson(e));
        }

        result["employees"] = std::move(list);

        crow::response res(result);
        res.add_header("Access-Control-Allow-Origin", "*");
        return res;
    });

    // GET one employee
    CROW_ROUTE(app, "/api/employees/<int>")
    ([](int id) {
        Employee* e = findEmployee(id);

        if (!e) {
            crow::response res(404, jsonError("Employee not found."));
            res.add_header("Access-Control-Allow-Origin", "*");
            return res;
        }

        crow::response res(employeeJson(*e));
        res.add_header("Access-Control-Allow-Origin", "*");
        return res;
    });

    // GET payroll
    CROW_ROUTE(app, "/api/payroll/<int>")
    ([](int id) {
        Employee* e = findEmployee(id);

        if (!e) {
            crow::response res(404, jsonError("Employee not found."));
            res.add_header("Access-Control-Allow-Origin", "*");
            return res;
        }

        crow::json::wvalue result;
        result["success"] = true;
        result["employeeId"] = e->id;
        result["employeeName"] = e->name;
        result["basicSalary"] = e->basic;
        result["allowances"] = e->allowance;
        result["grossSalary"] = e->gross();
        result["deductions"] = e->deduction;
        result["netSalary"] = e->net();

        crow::response res(result);
        res.add_header("Access-Control-Allow-Origin", "*");
        return res;
    });

    // Get saved payroll records
    CROW_ROUTE(app, "/api/payroll-records")
    ([] {
        crow::json::wvalue result;
        result["success"] = true;

        crow::json::wvalue::list list;
        {
            lock_guard<mutex> lock(payrollRecordsMutex);
            for (const auto& record : payrollRecords) {
                list.push_back(payrollRecordJson(record));
            }
        }
        result["records"] = std::move(list);

        crow::response res(result);
        res.add_header("Access-Control-Allow-Origin", "*");
        return res;
    });

    // Save or replace the current payroll record for an employee
    CROW_ROUTE(app, "/api/payroll-records")
    .methods(crow::HTTPMethod::POST)
    ([](const crow::request& req) {
        auto body = crow::json::load(req.body);
        if (!body) {
            crow::response res(400, jsonError("Invalid JSON."));
            res.add_header("Access-Control-Allow-Origin", "*");
            return res;
        }

        if (!body.has("employeeId") ||
            body["employeeId"].t() != crow::json::type::Number) {
            crow::response res(400, jsonError("A valid employeeId is required."));
            res.add_header("Access-Control-Allow-Origin", "*");
            return res;
        }

        const int id = body["employeeId"].i();
        Employee* employee = findEmployee(id);
        if (!employee) {
            crow::response res(404, jsonError("Employee not found."));
            res.add_header("Access-Control-Allow-Origin", "*");
            return res;
        }

        PayrollRecord record;
        record.employeeId = employee->id;
        record.employeeName = employee->name;
        record.department = employee->department;
        record.basicSalary = employee->basic;
        record.allowances = employee->allowance;
        record.grossSalary = employee->gross();
        record.deductions = employee->deduction;
        record.netSalary = employee->net();
        record.status = "Calculated";

        {
            lock_guard<mutex> lock(payrollRecordsMutex);
            vector<PayrollRecord> updatedRecords = payrollRecords;
            auto existing = find_if(
                updatedRecords.begin(),
                updatedRecords.end(),
                [id](const PayrollRecord& saved) {
                    return saved.employeeId == id;
                }
            );

            if (existing == updatedRecords.end())
                updatedRecords.push_back(record);
            else
                *existing = record;

            if (!savePayrollRecords(updatedRecords)) {
                crow::response res(500, jsonError("Unable to save payroll records to payroll_records.txt."));
                res.add_header("Access-Control-Allow-Origin", "*");
                return res;
            }

            payrollRecords = std::move(updatedRecords);
        }

        crow::json::wvalue result;
        result["success"] = true;
        result["record"] = payrollRecordJson(record);

        crow::response res(result);
        res.add_header("Access-Control-Allow-Origin", "*");
        return res;
    });

    // Admin login
    CROW_ROUTE(app, "/api/login")
    .methods(crow::HTTPMethod::POST)
    ([](const crow::request& req) {
        auto body = crow::json::load(req.body);

        if (!body) {
            crow::response res(400, jsonError("Invalid JSON."));
            res.add_header("Access-Control-Allow-Origin", "*");
            return res;
        }

        string username = body["username"].s();
        string password = body["password"].s();

        crow::json::wvalue result;

        if (username == "admin" && password == "admin123") {
            result["success"] = true;
            result["message"] = "Admin login successful.";
        } else {
            result["success"] = false;
            result["message"] = "Invalid username or password.";
        }

        crow::response res(result);
        res.add_header("Access-Control-Allow-Origin", "*");
        return res;
    });

    // Employee login
    // Default project password: <employee_id>@123
    CROW_ROUTE(app, "/api/employee-login")
    .methods(crow::HTTPMethod::POST)
    ([](const crow::request& req) {
        auto body = crow::json::load(req.body);

        if (!body) {
            crow::response res(400, jsonError("Invalid JSON."));
            res.add_header("Access-Control-Allow-Origin", "*");
            return res;
        }

        int id = body["id"].i();
        string password = body["password"].s();

        Employee* e = findEmployee(id);

        if (!e) {
            crow::response res(404, jsonError("Employee not found."));
            res.add_header("Access-Control-Allow-Origin", "*");
            return res;
        }

        string expectedPassword = to_string(id) + "@123";

        crow::json::wvalue result;

        if (password == expectedPassword) {
            result["success"] = true;
            result["message"] = "Employee login successful.";
            result["employee"] = employeeJson(*e);
        } else {
            result["success"] = false;
            result["message"] = "Invalid employee password.";
        }

        crow::response res(result);
        res.add_header("Access-Control-Allow-Origin", "*");
        return res;
    });

    // Add employee
    CROW_ROUTE(app, "/api/employees")
    .methods(crow::HTTPMethod::POST)
    ([](const crow::request& req) {
        auto body = crow::json::load(req.body);

        if (!body) {
            crow::response res(400, jsonError("Invalid JSON."));
            res.add_header("Access-Control-Allow-Origin", "*");
            return res;
        }

        int id = body["id"].i();

        if (findEmployee(id)) {
            crow::response res(409, jsonError("Employee ID already exists."));
            res.add_header("Access-Control-Allow-Origin", "*");
            return res;
        }

        Employee e;
        e.id = id;
        e.name = body["name"].s();
        e.department = body["department"].s();
        e.basic = body["basicSalary"].d();
        e.allowance = body["allowances"].d();
        e.deduction = body["deductions"].d();

        if (e.basic < 0 || e.allowance < 0 || e.deduction < 0) {
            crow::response res(400, jsonError("Salary amounts cannot be negative."));
            res.add_header("Access-Control-Allow-Origin", "*");
            return res;
        }

        employees.push_back(e);
        saveEmployees();

        crow::json::wvalue result;
        result["success"] = true;
        result["message"] = "Employee added successfully.";
        result["employee"] = employeeJson(e);

        crow::response res(result);
        res.add_header("Access-Control-Allow-Origin", "*");
        return res;
    });

    // Update employee
    CROW_ROUTE(app, "/api/employees/<int>")
    .methods(crow::HTTPMethod::PUT)
    ([](const crow::request& req, int id) {
        Employee* e = findEmployee(id);

        if (!e) {
            crow::response res(404, jsonError("Employee not found."));
            res.add_header("Access-Control-Allow-Origin", "*");
            return res;
        }

        auto body = crow::json::load(req.body);

        if (!body) {
            crow::response res(400, jsonError("Invalid JSON."));
            res.add_header("Access-Control-Allow-Origin", "*");
            return res;
        }

        e->name = body["name"].s();
        e->department = body["department"].s();
        e->basic = body["basicSalary"].d();
        e->allowance = body["allowances"].d();
        e->deduction = body["deductions"].d();

        if (e->basic < 0 || e->allowance < 0 || e->deduction < 0) {
            crow::response res(400, jsonError("Salary amounts cannot be negative."));
            res.add_header("Access-Control-Allow-Origin", "*");
            return res;
        }

        saveEmployees();

        crow::json::wvalue result;
        result["success"] = true;
        result["message"] = "Employee updated successfully.";
        result["employee"] = employeeJson(*e);

        crow::response res(result);
        res.add_header("Access-Control-Allow-Origin", "*");
        return res;
    });

    // Delete employee
    CROW_ROUTE(app, "/api/employees/<int>")
    .methods(crow::HTTPMethod::DELETE)
    ([](int id) {
        auto it = remove_if(
            employees.begin(),
            employees.end(),
            [id](const Employee& e) {
                return e.id == id;
            }
        );

        if (it == employees.end()) {
            crow::response res(404, jsonError("Employee not found."));
            res.add_header("Access-Control-Allow-Origin", "*");
            return res;
        }

        employees.erase(it, employees.end());
        saveEmployees();

        crow::json::wvalue result;
        result["success"] = true;
        result["message"] = "Employee deleted successfully.";

        crow::response res(result);
        res.add_header("Access-Control-Allow-Origin", "*");
        return res;
    });

    // Sort employees by ID
    CROW_ROUTE(app, "/api/employees/sort")
    ([] {
        vector<Employee> sorted = employees;

        sort(sorted.begin(), sorted.end(),
             [](const Employee& a, const Employee& b) {
                 return a.id < b.id;
             });

        crow::json::wvalue::list list;

        for (const auto& e : sorted) {
            list.push_back(employeeJson(e));
        }

        crow::json::wvalue result;
        result["success"] = true;
        result["employees"] = std::move(list);

        crow::response res(result);
        res.add_header("Access-Control-Allow-Origin", "*");
        return res;
    });

cout << "========================================\n";
cout << " EMPLOYEE PAYROLL MANAGEMENT API\n";
cout << "========================================\n";

const char* port_env = std::getenv("PORT");
int port = port_env ? std::stoi(port_env) : 10000;

cout << "Server running on port: " << port << "\n";
cout << "Press Ctrl+C to stop.\n";

app.port(port).multithreaded().run();

return 0;
}
