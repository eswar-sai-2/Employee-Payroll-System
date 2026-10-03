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

vector<Employee> employees;

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
    cout << "Server running at: http://localhost:18080\n";
    cout << "Press Ctrl+C to stop.\n";

    app.port(18080).multithreaded().run();

    return 0;
}