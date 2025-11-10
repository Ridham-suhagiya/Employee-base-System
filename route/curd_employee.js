// Import required modules
const express = require('express');
const fs = require('fs');
const path = require('path');

// --- Server Setup ---
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// --- Database Helper Functions ---
const DB_PATH = path.join(__dirname, 'db', 'payroll.json');

/**
 * Reads the contents of the mock database file.
 * @returns {Array} An array of payroll records.
 */
function readDB() {
  try {
    const fileContents = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error("Error reading database:", error);
    // If the file doesn't exist or is empty, return an empty array
    return [];
  }
}

/**
 * Writes data to the mock database file.
 * @param {Array} data - The array of payroll records to write.
 */
function writeDB(data) {
  try {
    const fileContents = JSON.stringify(data, null, 2); // Pretty-print JSON
    fs.writeFileSync(DB_PATH, fileContents, 'utf-8');
  } catch (error) {
    console.error("Error writing to database:", error);
  }
}


/**
 * Validates the request body for creating/updating a payroll record.
 * @param {object} requestBody - The request body.
 * @returns {boolean} - True if valid.
 * @throws {ValidationError} - If validation fails.
 */
function validatePayroll(requestBody) {
  const { employee_id, name, department, salary, bonus, deductions } = requestBody;

  if (!employee_id || typeof employee_id !== 'string' || employee_id.trim() === '') {
    throw new ValidationError("employee_id is required and must be a non-empty string.");
  }
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new ValidationError("name is required and must be a non-empty string.");
  }
  if (!department || typeof department !== 'string' || department.trim() === '') {
    throw new ValidationError("department is required and must be a non-empty string.");
  }
  if (salary === undefined || typeof salary !== 'number' || salary < 0) {
    throw new ValidationError("salary is required and must be a non-negative number.");
  }
  if (bonus === undefined || typeof bonus !== 'number' || bonus < 0) {
    throw new ValidationError("bonus is required and must be a non-negative number.");
  }
  if (deductions === undefined || typeof deductions !== 'number' || deductions < 0) {
    throw new ValidationError("deductions is required and must be a non-negative number.");
  }

  return true;
}

// --- API Endpoints (Routes) ---

/**
 * [POST] /payroll
 * Creates a new employee payroll record.
 */
app.post("/payroll", (req, res, next) => {
  try {
    // 1. Validate incoming data
    validatePayroll(req.body);
    
    // 2. Read current database
    const db = readDB();
    
    // 3. Check for duplicates
    if (db.find(emp => emp.employee_id === req.body.employee_id)) {
      return res.status(409).send({ error: "Employee with this ID already exists." });
    }
    
    // 4. Create new record (ensure no extra fields are added)
    const newEmployee = {
      employee_id: req.body.employee_id,
      name: req.body.name,
      department: req.body.department,
      salary: req.body.salary,
      bonus: req.body.bonus,
      deductions: req.body.deductions
      // As per Task 2, we can add location here
      // location: req.body.location || "default" 
    };

    // 5. Add to DB and write
    db.push(newEmployee);
    writeDB(db);
    
    // 6. Send response
    return res.status(201).send(newEmployee);

  } catch (error) {
    next(error); // Pass to global error handler
  }
});

/**
 * [GET] /payroll
 * Retrieves all payroll records.
 */
app.get("/payroll", (req, res) => {
  const db = readDB();
  return res.status(200).send(db);
});

/**
 * [GET] /payroll/:id
 * Retrieves a single payroll record by employee_id.
 */
app.get("/payroll/:id", (req, res) => {
  const db = readDB();
  const employee = db.find(emp => emp.employee_id === req.params.id);
  
  if (!employee) {
    return res.status(404).send({ error: "Employee not found." });
  }
  
  return res.status(200).send(employee);
});

/**
 * [PUT] /payroll/:id
 * Updates an existing payroll record.
 */
app.put("/payroll/:id", (req, res, next) => {
  try {
    // 1. Validate incoming data
    validatePayroll(req.body);

    // 2. Ensure ID in URL matches ID in body (best practice)
    if (req.params.id !== req.body.employee_id) {
       throw new ValidationError("Employee ID in URL does not match body.");
    }

    const db = readDB();
    
    // 3. Find the index of the employee to update
    const employeeIndex = db.findIndex(emp => emp.employee_id === req.params.id);
    
    if (employeeIndex === -1) {
      return res.status(404).send({ error: "Employee not found." });
    }
    
    // 4. Create the updated record
    const updatedEmployee = {
      employee_id: req.body.employee_id,
      name: req.body.name,
      department: req.body.department,
      salary: req.body.salary,
      bonus: req.body.bonus,
      deductions: req.body.deductions
      // location: req.body.location
    };
    
    // 5. Replace in DB and write
    db[employeeIndex] = updatedEmployee;
    writeDB(db);
    
    // 6. Send response
    return res.status(200).send(updatedEmployee);

  } catch (error) {
    next(error); // Pass to global error handler
  }
});

/**
 * [DELETE] /payroll/:id
 * Deletes a payroll record by employee_id.
 */
app.delete("/payroll/:id", (req, res) => {
  const db = readDB();
  
  // 1. Find the employee
  const employeeIndex = db.findIndex(emp => emp.employee_id === req.params.id);
  
  if (employeeIndex === -1) {
    return res.status(404).send({ error: "Employee not found." });
  }
  
  // 2. Remove from array
  db.splice(employeeIndex, 1);
  
  // 3. Write updated DB
  writeDB(db);
  
  // 4. Send response
  return res.status(204).send(); // 204 No Content
});

// --- Global Error Handler ---
// This will catch all errors, including ValidationErrors
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error

  // If it's a known validation error, send 400
  if (err instanceof ValidationError) {
    return res.status(err.status).send({ error: err.message });
  }

  // For all other errors, send a generic 500
  return res.status(500).send({ error: "Internal Server Error" });
});


// --- Start Server ---
app.listen(PORT, () => {
  // Ensure the db directory and file exist
  const dbDir = path.join(__dirname, 'db');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir);
  }
  if (!fs.existsSync(DB_PATH)) {
    writeDB([]); // Create an empty file
  }
  
  console.log(`Payroll API server running on http://localhost:${PORT}`);
});