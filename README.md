CompIQ Payroll API
==================

This is a sample REST API for the CompIQ Full Stack Engineer assessment. It provides a full set of CRUD endpoints for managing payroll, calculating net pay, and detecting anomalies, all protected by a role-based JWT authentication system.

Project Structure
-----------------

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   PAYOUT_SYSTEM/  ├── config/  │   └── payrole_tax_rules.json  ├── mock_data/  │   ├── payroll_history.json  │   ├── payroll.json  │   └── user.json  ├── route/  │   ├── calculate_employee_netpay.js  │   ├── check_payroll_anomaly.js  │   ├── curd_employee.js  │   └── user_auth.js  ├── .env.example  ├── ai_usage.md  ├── problem_statement.txt  └── solution.md   `

Prerequisites
-------------

*   [Node.js](https://nodejs.org/) (v16 or later)
    
*   npm
    

Codebase Walkthrough
--------------------

Here’s a recommended way to read through this codebase to understand the solution.

1.  **Understand the 'Why' (The Problem & Solution):**
    
    *   Start with problem\_statement.txt to understand the original assessment tasks.
        
    *   Then, read solution.md (if available) to see the high-level technical approach and thought process for solving those tasks.
        
    *   Finally, look at ai\_usage.md to see how AI tools assisted in the process.
        
2.  **Explore the Project Components (The 'How'):**
    
    *   config/payrole\_tax\_rules.json: This file is the "brain" for the net pay calculation. It stores all the business logic, like tax slabs and deduction percentages, in a central, editable file.
        
    *   mock\_data/: This directory acts as our simple database. It contains JSON files for payroll records (the main data), payroll\_history (for anomaly checks), and user accounts (for authentication).
        
    *   route/: This is the core logic of the API. Each file corresponds to a major feature:
        
        *   user\_auth.js: Handles all logic for registering and logging in users (Task 4).
            
        *   curd\_employee.js: Contains the logic for all five CRUD (Create, Read, Update, Delete, Get All) operations for employee payroll data (Task 1).
            
        *   calculate\_employee\_netpay.js: Implements the Gross-to-Net calculation service (Task 2).
            
        *   check\_payroll\_anomaly.js: Implements the anomaly detection service (Task 3).
            
    *   .env.example: This file shows you the environment variables (like the JWT\_SECRET) that you need to set up in your own .env file for the application to run securely.
        

API Endpoints
-------------

**Note:** All endpoints (except /auth/login and /auth/register) require a Bearer in the Authorization header.

### Authentication

#### POST /auth/register

*   **Description:** Creates a new user. (For this mock, it adds to mock\_data/user.json).
    
*   **Role:** Public
    
*   { "employee\_id": "e104", "email": "david@compiq.com", "password": "strongpassword123", "role": "employee"}
    

#### POST /auth/login

*   **Description:** Logs in a user and returns a JSON Web Token (JWT).
    
*   **Role:** Public
    
*   { "email": "admin@compiq.com", "password": "password\_for\_admin\_hash"}
    
*   { "message": "Login successful", "token": "ey..."}
    

### Payroll (CRUD)

#### POST /payroll

*   **Description:** Creates a new employee payroll record.
    
*   **Role:** admin
    
*   **Body:** (See mock\_data/payroll.json for schema)
    

#### GET /payroll

*   **Description:** Retrieves _all_ payroll records.
    
*   **Role:** admin
    

#### GET /payroll/:id

*   **Description:** Retrieves a single payroll record.
    
*   **Role:** admin (can get any ID) OR employee (can _only_ get their own ID).
    
*   **Example (Employee):** An employee with employee\_id: "e102" can call GET /payroll/e102 but will get a 403 Forbidden error if they call GET /payroll/e101.
    

#### PUT /payroll/:id

*   **Description:** Updates an existing payroll record.
    
*   **Role:** admin
    

#### DELETE /payroll/:id

*   **Description:** Deletes a payroll record.
    
*   **Role:** admin
    

### Services

#### POST /payroll/calculate-net

*   **Description:** Calculates the gross-to-net pay for the _currently logged-in user_. It automatically uses the employee\_id from the JWT.
    
*   **Role:** employee or admin
    
*   **Body:** (Empty)
    
*   **Success Response:** (Full calculation breakdown)
    

#### POST /payroll/detect-anomalies

*   **Description:** Runs the anomaly detection service on the entire payroll database.
    
*   **Role:** admin
    
*   **Body:** (Empty)
    
*   **Success Response:** (Full anomaly report)# Employee-base-System
