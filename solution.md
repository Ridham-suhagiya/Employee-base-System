Technical Approach: CompIQ Full Stack Engineer Assessment
---------------------------------------------------------

This document details the proposed technical approach for the Full Stack Engineer coding assessment. The focus is on demonstrating the design, logic, and "thought process" behind each task, as requested.

It also outlines where and how AI-powered coding assistants would be strategically employed to enhance productivity, discover edge cases, and improve code quality, adhering to the assessment's objective.

### Task 1: Build Payroll CRUD API

This task involves creating the foundational data service for managing employee payroll records.

#### Assumptions and Pre-constraints

1.  **Architecture:** We will design a **RESTful API**, as this is the standard for service-oriented architectures.
    
2.  **Data Store:** As per the guidelines, we will use a **mock file** (e.g., db/payroll.json) as a simple database. All file I/O operations will be synchronous for this exercise, but in a real-world app, they would be asynchronous.
    
3.  **Tech Stack:** The approach is language-agnostic, but the pseudocode will resemble a common framework like **Express.js (Node.js)** or **FastAPI (Python)**.
    
4.  **Schema:** The payroll object will adhere to the specified fields: employee\_id (unique key), name (string), department (string), salary (number), bonus (number), deductions (number).
    
5.  **Data Model Extension:** For Tasks 2 & 3, this model will need to be extended. I am assuming we can add a location (e.g., "Mumbai", "Delhi") field to each record to support location-based rules.

#### Proposed Approach

1.  **Data Helper:** Create a data helper module (e.g., db.js) with functions to:
    
    *   readDB(): Reads and parses the payroll.json file.
        
    *   writeDB(data): Stringifies and writes data back to the payroll.json file.
        
2.  **API Endpoints (Routing):**
    
    *   **POST /payroll (Create):**
        
        *   Validates the incoming request body.
            
        *   Checks if employee\_id already exists. If so, return a 409 (Conflict) error.
            
        *   Appends the new record to the list and saves using writeDB().
            
        *   Returns the newly created record with a 201 (Created) status.
            
    *   **GET /payroll (Read All):**
        
        *   Reads all records using readDB().
            
        *   Returns the full list with a 200 (OK) status.
            
    *   **GET /payroll/:id (Read One):**
        
        *   Reads all records, then finds the record where employee\_id == :id.
            
        *   If not found, return a 404 (Not Found) error.
            
        *   If found, return the record with a 200 (OK) status.
            
    *   **PUT /payroll/:id (Update):**
        
        *   Validates the incoming request body.
            
        *   Finds the index of the record with employee\_id == :id.
            
        *   If not found, return a 404 (Not Found) error.
            
        *   Replaces the entire record at that index with the new data.
            
        *   Saves the updated list using writeDB().
            
        *   Returns the updated record with a 200 (OK) status.
            
    *   **DELETE /payroll/:id (Delete):**
        
        *   Finds the index of the record with employee\_id == :id.
            
        *   If not found, return a 404 (Not Found) error.
            
        *   Removes the record from the list.
            
        *   Saves the updated list using writeDB().
            
        *   Returns a 204 (No Content) status.
            
3.  **Validation:** Implement a validation middleware or function.
    
    *   employee\_id and name are required strings.
        
    *   salary, bonus, deductions must be non-negative numbers.
        
    *   department and location (new field) should be non-empty strings.
        
4.  **Error Handling:** Implement a global error handler to catch errors and return structured JSON responses (e.g., { "error": "Message" }) with the correct HTTP status codes.
    
5.  **Testing:**
    
    *   **Unit Tests:** Test the validation logic (e.g., "rejects salary < 0").
        
    *   **Integration Tests:** Test the API endpoints themselves (e.g., "a POST request to /payroll successfully adds a record").


#### Pseudocode: 

```js 
// File: db.js
FUNCTION readDB():
    fileContents = READ_FILE("db/payroll.json")
    RETURN JSON.parse(fileContents)

FUNCTION writeDB(data):
    fileContents = JSON.stringify(data, null, 2)
    WRITE_FILE("db/payroll.json", fileContents)

// File: server.js
// Define server (e.g., Express)
APP = setupServer()

// Validation Middleware
FUNCTION validatePayroll(requestBody):
    IF NOT requestBody.employee_id OR requestBody.salary < 0:
        THROW newValidationError("Invalid data")
    RETURN TRUE

// Create
APP.post("/payroll", (req, res) -> {
    validatePayroll(req.body)
    db = readDB()
    
    IF db.find(emp -> emp.employee_id == req.body.employee_id):
        RETURN res.status(409).send({ error: "Employee already exists" })
        
    newEmployee = req.body
    db.push(newEmployee)
    writeDB(db)
    
    RETURN res.status(201).send(newEmployee)
})

// Read One
APP.get("/payroll/:id", (req, res) -> {
    db = readDB()
    employee = db.find(emp -> emp.employee_id == req.params.id)
    
    IF NOT employee:
        RETURN res.status(404).send({ error: "Employee not found" })
        
    RETURN res.status(200).send(employee)
})

// (Other endpoints PUT, DELETE, GET_ALL would follow a similar pattern)
```

#### AI Assistant Integration

*   **How:** I would use an AI assistant (like GitHub Copilot) for boilerplate generation.
    
*   **Where:**
    
    1.  **Boilerplate:** Prompt: "Generate a simple Node.js Express server boilerplate"
        
    2.  **Helper Functions:** Prompt: "Create Node.js functions to read and write a JSON file named db.json"
        
    3.  **Unit Tests:** After writing the validatePayroll function, I would prompt: "Write jest unit tests for this validation function, including edge cases for negative numbers and missing fields." This quickly builds a robust test suite.


### Task 2: Gross-to-Net Pay Calculation

This task extends the service to perform a core business logic: calculating net pay.

#### Assumptions and Pre-constraints

1.  **Multi-Factor Model:** As per the prompt's direction, the calculation is not a single formula. It's a multi-layered system.
    
2.  **Data Model:** The employee record (from Task 1) **must** now include a location field (e.g., "Mumbai", "Delhi", "Pune").
    
3.  **Calculation Logic:** Net Pay is determined by two main factors:
    
    *   **Company/Organization Level:** Standard deductions applied to all employees, such as **Social Security** (e.g., a fixed percentage) and **Income Tax** (e.g., a progressive percentage based on salary brackets).
        
    *   **Corporate/Location Level:** Variable deductions that change based on the employee's work location. This is a critical assumption. For example, **Professional Tax (PT)** is mandated by state governments in India and varies (e.g., Mumbai/Maharashtra has a different slab from Delhi).
        
4.  **Configuration-Driven:** **This is the most important assumption.** All rules (tax percentages, PT slabs) will **not** be hardcoded. They will be stored in a separate configuration file (e.g., config/tax\_rules.json) to make the system maintainable and scalable.
    
5.  **Formula:**
    
    *   GrossPay = employee.salary + employee.bonus
        
    *   TotalDeductions = (CompanyDeductions) + (LocationDeductions) + (EmployeeSpecificDeductions)
        
    *   NetPay = GrossPay - TotalDeductions
        

#### Proposed Approach

1.  **Configuration File (config/tax\_rules.json):**
    
    *   This JSON file will define the rules. It will be structured to be easily extensible.
        
2.  **New Endpoint:** Create a new endpoint: POST /payroll/calculate-net.
    
    *   **Request Body:** { "employee\_id": "e123" }
        
    *   **Response Body:** A detailed breakdown: { "employee\_id", "gross\_pay", "net\_pay", "breakdown": { "company\_tax", "social\_security", "professional\_tax", "personal\_deductions" } }
        
3.  **Calculation Service:** Create a new module (e.g., NetPayCalculator.js).
    
4.  **Logic Flow:**
    
    1.  The endpoint receives the employee\_id.
        
    2.  It fetches the employee's full record from the mock DB (using the Task 1 service).
        
    3.  It loads the tax\_rules.json configuration.
        
    4.  It calculates GrossPay = employee.salary + employee.bonus.
        
    5.  It passes the employee object and rules to the NetPayCalculator.
        
    6.  **Inside the Calculator:**
        
        *   calculateCompanyTax(GrossPay, rules.income\_tax\_slabs)
            
        *   calculateSocialSecurity(GrossPay, rules.social\_security\_percent)
            
        *   calculateLocationTax(GrossPay, employee.location, rules.professional\_tax)
            
        *   TotalDeductions = (tax) + (ss) + (location\_tax) + (employee.deductions)
            
        *   NetPay = GrossPay - TotalDeductions
            
    7.  The service formats this data and sends the response.

#### Pseudocode: 

```js
// File: config/tax_rules.json
{
  "social_security_percent": 0.12,
  "income_tax_slabs": [
    { "min": 0, "max": 300000, "rate": 0 },
    { "min": 300001, "max": 600000, "rate": 0.05 },
    { "min": 600001, "max": 900000, "rate": 0.10 }
    // ...etc
  ],
  "professional_tax": {
    "Mumbai": [
      { "min": 0, "max": 7500, "tax": 0 },
      { "min": 7501, "max": 10000, "tax": 175 },
      { "min": 10001, "max": 9999999, "tax": 200 }
    ],
    "Delhi": [
      { "min": 0, "max": 9999999, "tax": 0 } // PT not applicable in Delhi
    ],
    "default": [
       { "min": 0, "max": 9999999, "tax": 0 } // Fallback
    ]
  }
}

// File: NetPayCalculator.js
FUNCTION calculateNetPay(employee, rules):
    grossPay = employee.salary + employee.bonus
    
    // 1. Company Level Tax
    companyTax = calculateIncomeTax(grossPay, rules.income_tax_slabs)
    socialSecurity = grossPay * rules.social_security_percent
    
    // 2. Location Level Tax
    locationRules = rules.professional_tax[employee.location] || rules.professional_tax.default
    professionalTax = calculateSlabTax(grossPay, locationRules) // helper func
    
    // 3. Employee-specific deductions
    personalDeductions = employee.deductions
    
    // 4. Final Calculation
    totalDeductions = companyTax + socialSecurity + professionalTax + personalDeductions
    netPay = grossPay - totalDeductions
    
    RETURN {
        gross_pay: grossPay,
        net_pay: netPay,
        breakdown: {
            company_tax: companyTax,
            social_security: socialSecurity,
            professional_tax: professionalTax,
            personal_deductions: personalDeductions
        }
    }
```

#### Sample Requests & Responses

**Sample 1: Employee in Mumbai**

*   **Request:** POST /payroll/calculate-net
    
*   **Body:** { "employee\_id": "e101" } (Assuming e101 has salary: 80000, bonus: 10000, deductions: 5000, location: "Mumbai")
    
*   **Response:**
*   ```json
    {
    "employee_id": "e101",
    "gross_pay": 90000,
    "net_pay": 71000, // (Example calculation)
    "breakdown": {
        "company_tax": 9000, // (From income_tax_slabs)
        "social_security": 10800, // (12% of 90000)
        "professional_tax": 200, // (From Mumbai PT slab)
        "personal_deductions": 5000 
    }
    }
    ```

**Sample 2: Employee in Delhi**

*   **Request:** POST /payroll/calculate-net
    
*   **Body:** { "employee\_id": "e102" } (Assuming e102 has same pay: salary: 80000, bonus: 10000, deductions: 5000, location: "Delhi")
    
*   **Response:**
*   ```json
    {
    "employee_id": "e102",
    "gross_pay": 90000,
    "net_pay": 71200, // (Note: 200 higher than Mumbai employee)
    "breakdown": {
        "company_tax": 9000, 
        "social_security": 10800,
        "professional_tax": 0, // (From Delhi PT slab)
        "personal_deductions": 5000
    }
    }
    ```

#### AI Assistant Integration

*   **How:** Use AI for domain research and edge case analysis.
    
*   **Where:**
    
    1.  **Research:** Prompt: "What are the standard payroll deductions in India for 2025? Specifically, professional tax rules for Mumbai vs. Delhi." This helps build a realistic tax\_rules.json.
        
    2.  **Edge Cases:** Prompt: "Given this pseudocode for net pay calculation, what edge cases am I missing?"
        
    3.  **AI Response:** It would likely suggest:
        
        *   What if grossPay is 0?
            
        *   What if grossPay falls exactly on a tax slab boundary?
            
        *   What if totalDeductions > grossPay (net pay is negative)?
            
        *   What if employee.location is not in the professional\_tax config? (Handled by my "default" key).
            
    4.  **Formula Refinement:** Prompt: "Help me write a robust JavaScript function to calculate tax based on progressive tax slabs."

### Task 3: Payroll Anomaly Detection

This task involves building a system to flag potentially erroneous or fraudulent payroll entries.

#### Assumptions and Pre-constraints

1.  **Historical Data:** Anomaly detection is impossible without history. I am assuming a **new data store** (e.g., db/payroll\_history.json) exists. This file logs all _finalized_ pay runs, e.g., { employee\_id, pay\_period, net\_pay, gross\_pay }.
    
2.  **Two-Tiered Flagging:** As per the prompt's direction, we will implement a two-tiered system:
    
    *   **ANOMALY (High Priority):** A hard flag for highly improbable values. Stops the process.
        
    *   **REVIEW (Medium Priority):** A soft flag for unusual values that an Ops team should investigate, but may be legitimate (e.g., a large bonus).
        
3.  **Analysis Context:** The detection runs against a _proposed_ payroll batch for a new pay period, comparing it against historical data and peer data.
    
4.  **Rule-Based:** The detection will be rule-based, not ML-based, for this exercise.
    

#### Proposed Approach

1.  **New Endpoint:** POST /payroll/detect-anomalies.
    
2.  **Request Body:** This endpoint would take the _entire_ proposed payroll batch for the upcoming pay period.
*   ```json
    {
    "pay_period": "2025-11",
    "proposed_payroll": [
        { "employee_id": "e101", "salary": 80000, ... },
        { "employee_id": "e102", "salary": 82000, ... }
        // ... all other employees
    ]
    }
    ```
3.  **Response Body:** A summary report of all flags.
*   ```json
    {
    "pay_period": "2025-11",
    "status": "REVIEW_REQUIRED", // or "CLEAN" or "ANOMALY_DETECTED"
    "flags": [
        {
        "employee_id": "e101",
        "level": "ANOMALY",
        "reason": "Net pay jumped 60% from 6-month average."
        },
        {
        "employee_id": "e102",
        "level": "REVIEW",
        "reason": "Salary is 2.5x the 'Engineering - Mumbai' average."
        }
    ]
    }
    ```
4.  **Detection Strategies:** The service will loop through each employee in the proposed\_payroll and apply several detection strategies:
    
    *   **Strategy 1: Historical Variance (Intra-Employee)**
        
        *   This implements the user's "netpay history" idea.
            
        *   For each employee, fetch their last 6 records from payroll\_history.json.
            
        *   Calculate their avg\_6\_month\_net\_pay.
            
        *   Calculate the current\_net\_pay (using the Task 2 service).
            
        *   percent\_change = (current\_net\_pay - avg\_6\_month\_net\_pay) / avg\_6\_month\_net\_pay
            
        *   **Rule:**
            
            *   IF percent\_change > 0.50 (50% jump) -> Flag ANOMALY.
                
            *   IF 0.20 < percent\_change <= 0.50 (20-50% jump) -> Flag REVIEW.
                
    *   **Strategy 2: Peer Variance (Inter-Employee)**
        
        *   This extends the "org and location" idea.
            
        *   First, pre-calculate the average salary for each department + location combination (e.g., avg\_eng\_mumbai, avg\_sales\_delhi).
            
        *   For each employee, compare their salary to their group's average.
            
        *   **Rule:**
            
            *   IF salary > (avg\_group\_salary \* 3) -> Flag ANOMALY (e.g., intern paid like a VP).
                
            *   IF salary < (avg\_group\_salary \* 0.5) -> Flag REVIEW (potential data entry error).
                
    *   **Strategy 3: Absolute Rule Checks**
        
        *   Simple sanity checks.
            
        *   **Rule:**
            
            *   IF total\_deductions > gross\_pay (negative net pay) -> Flag ANOMALY.
                
            *   IF bonus > (salary \* 2) (bonus is 200% of salary) -> Flag REVIEW (might be a special annual bonus, but needs checking).
                
5.  **Output:** The service gathers all flags into the report and returns it. The Ops team can then use this report to investigate and approve/reject individual records before the payroll is finalized.

#### Pseudocode: 

```js
    // File: payroll_history.json
[
  { "employee_id": "e101", "pay_period": "2025-10", "net_pay": 50000 },
  { "employee_id": "e101", "pay_period": "2025-09", "net_pay": 49500 },
  // ... 6+ months of data
]

// File: AnomalyDetector.js
FUNCTION detectAnomalies(currentPayrollBatch, historyDB):
    flags = []
    
    // Pre-calculate peer averages
    peerAverages = calculatePeerAverages(currentPayrollBatch)
    
    FOR employee IN currentPayrollBatch.proposed_payroll:
        
        // --- Strategy 1: Historical Check ---
        employeeHistory = historyDB.filter(e -> e.employee_id == employee.employee_id)
        avgHistoryNetPay = calculateAverage(employeeHistory.map(h -> h.net_pay))
        
        // Use Task 2 service to get proposed net pay
        currentNetPay = NetPayCalculator.calculateNetPay(employee, rules).net_pay 
        
        percentChange = (currentNetPay - avgHistoryNetPay) / avgHistoryNetPay
        
        IF percentChange > 0.5:
            flags.push({ 
                employee_id: employee.employee_id, 
                level: "ANOMALY", 
                reason: "Net pay jump > 50% from 6-month average." 
            })
        ELSE IF percentChange > 0.2:
            flags.push({ 
                employee_id: employee.employee_id, 
                level: "REVIEW", 
                reason: "Net pay jump > 20% from 6-month average." 
            })

        // --- Strategy 2: Peer Check ---
        group_key = employee.department + "_" + employee.location
        avgPeerSalary = peerAverages[group_key]
        
        IF employee.salary > (avgPeerSalary * 3):
            flags.push({ 
                employee_id: employee.employee_id, 
                level: "ANOMALY", 
                reason: "Salary is 3x+ average for " + group_key 
            })
            
        // --- Strategy 3: Absolute Checks (omitted for brevity) ---

    RETURN {
        status: flags.length > 0 ? "REVIEW_REQUIRED" : "CLEAN",
        flags: flags
    }
```

#### AI Assistant Integration
    

 * **How:** Use AI for brainstorming strategies and generating complex logic.
    
 * **Where:**
    
    1.  **Strategy Brainstorming:** Prompt: "What are common data-driven rules for detecting payroll anomalies? I have historical pay data and peer (department/location) data."
        
    2.  **AI Response:** This would likely suggest the two strategies I outlined (historical variance, peer variance) and might also suggest **Standard Deviation (Z-score)** as a more statistically sound method than my simple "3x" rule. I would then refine my approach to use Z-scores for peer comparison.
        
    3.  **Complex Logic:** Prompt: "Given a list of employee payroll objects, write a JavaScript function to calculate the average salary for each unique 'department' and 'location' combination." This generates the calculatePeerAverages helper function quickly.
        
    4.  **Query Generation:** "If my payroll\_history was in a SQL table, write a query to get the 6-month average net\_pay for 'e101', handling cases where they have less than 6 months of history." This is invaluable for thinking about scaling from a .json file to a real database.