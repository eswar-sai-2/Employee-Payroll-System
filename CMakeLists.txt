cmake_minimum_required(VERSION 3.20)
project(EmployeePayrollApi LANGUAGES CXX)

find_package(Crow CONFIG REQUIRED)

add_executable(payroll_api backend/payroll_api.cpp)
target_compile_features(payroll_api PRIVATE cxx_std_17)
target_link_libraries(payroll_api PRIVATE Crow::Crow)
