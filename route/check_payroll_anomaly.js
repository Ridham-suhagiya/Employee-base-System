const fs = require('fs'); // FIX: Changed from 'fs' to require('fs')
const path = require('path'); // FIX: Changed from 'path' to require('path')
const { calculateNetPay } = require('./NetPayCalculator');

// --- Database Helper ---
// We need to read the history file from this service
const HISTORY_DB_PATH = path.join(__dirname, '..', 'db', 'payroll_history.json');

function readHistoryDB() {
  try {
    const fileContents = fs.readFileSync(HISTORY_DB_PATH, 'utf-8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error("Error reading history database:", error);
    return [];
  }
}

// --- Detection Strategies ---

/**
 * STRATEGY 1: Historical Variance (Intra-Employee)
 * Compares an employee's proposed net pay to their 6-month average.
 */
function detectHistoricalVariance(employee, proposedPay, historyDB) {
  const flags = [];
  const employeeHistory = historyDB.filter(h => h.employee_id === employee.employee_id);

  if (employeeHistory.length < 3) {
    // Not enough data to run a historical check
    return flags;
  }

  // Calculate 6-month average net pay
  const recentHistory = employeeHistory.slice(0, 6); // Get up to 6 most recent
  const total = recentHistory.reduce((acc, record) => acc + record.net_pay, 0);
  const avgHistoryNetPay = total / recentHistory.length;

  const currentNetPay = proposedPay.net_pay;
  const percentChange = (currentNetPay - avgHistoryNetPay) / avgHistoryNetPay;

  if (Math.abs(percentChange) > 0.5) { // 50% jump or drop
    flags.push({
      level: "ANOMALY",
      reason: `Net pay jump of ${Math.round(percentChange * 100)}% from 6-month average (Avg: ${Math.round(avgHistoryNetPay)}, Proposed: ${Math.round(currentNetPay)}).`
    });
  } else if (Math.abs(percentChange) > 0.2) { // 20% jump or drop
    flags.push({
      level: "REVIEW",
      reason: `Net pay change of ${Math.round(percentChange * 100)}% from 6-month average (Avg: ${Math.round(avgHistoryNetPay)}, Proposed: ${Math.round(currentNetPay)}).`
    });
  }
  return flags;
}

/**
 * STRATEGY 2: Peer Variance (Inter-Employee)
 * Compares an employee's salary to their peer group (Dept + Location).
 */
function detectPeerVariance(employee, proposedPayroll) {
  const flags = [];
  const peerGroup = proposedPayroll.filter(
    p => p.department === employee.department &&
         p.location === employee.location &&
         p.employee_id !== employee.employee_id // Exclude self
  );

  if (peerGroup.length < 1) {
    // No peers to compare against
    return flags;
  }

  const total = peerGroup.reduce((acc, p) => acc + p.salary, 0);
  const avgPeerSalary = total / peerGroup.length;
  const currentSalary = employee.salary;

  // Using Standard Deviation would be better, but for this exercise,
  // a simple multiplier rule is effective.
  if (currentSalary > avgPeerSalary * 3) {
    flags.push({
      level: "ANOMALY",
      reason: `Salary (${currentSalary}) is 3x+ the peer average (${Math.round(avgPeerSalary)}) for ${employee.department} in ${employee.location}.`
    });
  } else if (currentSalary > avgPeerSalary * 1.5) {
    flags.push({
      level: "REVIEW",
      reason: `Salary (${currentSalary}) is 1.5x+ the peer average (${Math.round(avgPeerSalary)}) for ${employee.department} in ${employee.location}.`
    });
  }
  return flags;
}

/**
 * STRATEGY 3: Absolute Rule Checks
 * Sanity checks for impossible values.
 */
function detectAbsoluteRules(employee, proposedPay) {
  const flags = [];
  if (proposedPay.net_pay < 0) {
    flags.push({
      level: "ANOMALY",
      reason: "Net pay is negative. Total deductions exceed gross pay."
    });
  }

  if (employee.bonus > employee.salary * 2) {
    flags.push({
      level: "REVIEW",
      reason: "Bonus is more than 200% of base salary."
    });
  }
  return flags;
}


/**
 * Main function to run all anomaly detection strategies.
 * @param {Array} proposedPayroll - The list of all payroll records for this period.
 * @returns {object} A report of all detected flags.
 */
function detectAnomalies(proposedPayroll) {
  const historyDB = readHistoryDB();
  let allFlags = [];
  let overallStatus = "CLEAN";

  for (const employee of proposedPayroll) {
    // 1. Calculate proposed net pay (using Task 2 service)
    const proposedPay = calculateNetPay(employee);

    // 2. Run all detection strategies
    const flags = [
      ...detectHistoricalVariance(employee, proposedPay, historyDB),
      ...detectPeerVariance(employee, proposedPayroll),
      ...detectAbsoluteRules(employee, proposedPay)
    ];

    if (flags.length > 0) {
      allFlags.push({
        employee_id: employee.employee_id,
        name: employee.name,
        flags: flags
      });
    }
  }

  // Determine overall report status
  if (allFlags.some(f => f.flags.some(fl => fl.level === "ANOMALY"))) {
    overallStatus = "ANOMALY_DETECTED";
  } else if (allFlags.length > 0) {
    overallStatus = "REVIEW_REQUIRED";
  }

  return {
    pay_period: new Date().toISOString().slice(0, 7), // e.g., "2025-11"
    status: overallStatus,
    report: allFlags
  };
}

/**
 * [POST] /payroll/detect-anomalies
 * Runs the anomaly detection service on the current payroll data.
 * This endpoint simulates running detection on a "proposed" payroll batch.
 * Request: (empty)
 */
app.post("/payroll/detect-anomalies", (req, res, next) => {
  try {
    // 1. For this exercise, the "proposed payroll batch" is the
    // entire current database.
    const proposedPayroll = readDB();

    if (proposedPayroll.length === 0) {
      return res.status(404).send({ error: "Employee not found." });
    }

    // 2. Pass the entire batch to the detection service
    const anomalyReport = detectAnomalies(proposedPayroll);

    // 3. Send the final report
    return res.status(200).send(anomalyReport);

  } catch (error) {
    next(error); // Pass to global error handler
  }
});