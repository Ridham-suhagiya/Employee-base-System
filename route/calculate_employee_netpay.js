const fs = require('fs');
const path = require('path');

// Load tax rules
const RULES_PATH = path.join(__dirname, '..', 'config', 'tax_rules.json');
let TAX_RULES = {};

try {
  const rulesData = fs.readFileSync(RULES_PATH, 'utf-8');
  TAX_RULES = JSON.parse(rulesData);
} catch (error) {
  console.error("CRITICAL: Failed to load tax_rules.json.", error);
  // In a real app, this should probably crash the server
  // or prevent it from starting, as calculations would be impossible.
}

/**
 * Calculates tax based on progressive slabs.
 * @param {number} grossPay - The gross pay amount.
 * @param {Array} slabs - An array of tax slab objects.
 * @returns {number} The calculated tax.
 */
function calculateIncomeTax(grossPay, slabs) {
  let tax = 0;
  // This is a simplified calculation. A real one would be more complex,
  // calculating tax *within* each slab.
  // For this exercise, we find the single applicable slab.
  const applicableSlab = slabs.find(slab => grossPay >= slab.min && grossPay <= slab.max);

  if (applicableSlab) {
    tax = grossPay * applicableSlab.rate;
  }
  return tax;
}

/**
 * Calculates tax based on fixed amount slabs (like Professional Tax).
 * @param {number} grossPay - The gross pay amount.
 * @param {Array} slabs - An array of tax slab objects.
 * @returns {number} The fixed tax amount.
 */
function calculateSlabTax(grossPay, slabs) {
  const applicableSlab = slabs.find(slab => grossPay >= slab.min && grossPay <= slab.max);
  return applicableSlab ? applicableSlab.tax : 0;
}

/**
 * Calculates the net pay for a given employee.
 * @param {object} employee - The employee record.
 * @returns {object} An object containing gross pay, net pay, and a breakdown.
 */
function calculateNetPay(employee) {
  if (!employee) {
    throw new Error("Employee data is required.");
  }
  if (!TAX_RULES.professional_tax) {
      throw new Error("Tax rules are not loaded.");
  }

  const grossPay = employee.salary + employee.bonus;

  // 1. Company Level - Income Tax
  const companyTax = calculateIncomeTax(grossPay, TAX_RULES.income_tax_slabs);

  // 2. Company Level - Social Security
  const socialSecurity = grossPay * TAX_RULES.social_security_percent;

  // 3. Location Level - Professional Tax
  const locationRules = TAX_RULES.professional_tax[employee.location] || TAX_RULES.professional_tax.default;
  const professionalTax = calculateSlabTax(grossPay, locationRules);

  // 4. Employee-specific deductions from record
  const personalDeductions = employee.deductions;

  // 5. Final Calculation
  const totalDeductions = companyTax + socialSecurity + professionalTax + personalDeductions;
  const netPay = grossPay - totalDeductions;

  return {
    employee_id: employee.employee_id,
    gross_pay: grossPay,
    net_pay: netPay,
    breakdown: {
      company_tax: companyTax,
      social_security: socialSecurity,
      professional_tax: professionalTax,
      personal_deductions: personalDeductions,
      total_deductions: totalDeductions
    }
  };
}

app.post("/payroll/calculate-net", (req, res) => {
  const {employee} = req.body;
  const netPayDetails = calculateNetPay(employee);
  return res.status(200).send(netPayDetails);
});


// Export the main function
// module.exports = {
//   calculateNetPay
// };