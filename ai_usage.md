AI Usage Report
===============

This document outlines how AI coding assistants (e.g., GitHub Copilot, general LLMs) were leveraged during the development of the CompIQ Payroll API, as per the assessment instructions.

### Task 1: Build Payroll CRUD API

*   **AI Usage:**
    
    *   **Boilerplate:** Generated the initial express server setup, including middleware for JSON parsing and the global error handler.
        
        *   _Prompt:_ "Generate a simple Node.js Express server boilerplate with a global error handler."
            
    *   **File I/O:** Generated the synchronous readDB and writeDB helper functions for interacting with the mock .json files.
        
        *   _Prompt:_ "Create Node.js functions to synchronously read and write a JSON file at a given path."
            
    *   **Endpoint Structure:** Autocompleted the route structure for all 5 CRUD endpoints (app.get, app.post, etc.), which I then filled with specific logic.
        
*   **AI-Influenced Decisions:**
    
    *   The AI's generated error handler included a instanceof check for custom errors, which led me to create the ValidationError class to standardize 400 Bad Request responses.
        

### Task 2: Gross-to-Net Pay Calculation

*   **AI Usage:**
    
    *   **Domain Research:** Used to understand the components of a payroll calculation in the Indian context.
        
        *   _Prompt:_ "What are the standard payroll deductions in India? Specifically, Professional Tax in Mumbai vs. Delhi."
            
    *   **Logic & Edge Cases:** Brainstormed edge cases for the tax slab calculation.
        
        *   _Prompt:_ "Given this function for calculating tax from progressive slabs, what edge cases am I missing?"
            
    *   **AI Suggestion:** The AI noted I was missing cases where pay falls exactly on a slab boundary. I adjusted my < and > logic to >= and <= to ensure correctness.
        
*   **AI-Influenced Decisions:**
    
    *   The AI's research confirmed the variability of Professional Tax, reinforcing the decision to create a config/tax\_rules.json file to keep this logic separate from the code.
        

### Task 3: Payroll Anomaly Detection

*   **AI Usage:**
    
    *   **Strategy Brainstorming:** This was the most AI-intensive part for ideation.
        
        *   _Prompt:_ \`"What are common data-driven rules for detecting payroll anomalies? I have historical pay data and peer data (department/location)."\*
            
    *   **Statistical Methods:** The AI suggested using standard deviation (Z-scores) for peer comparison instead of a simple multiplier.
        
        *   _Prompt:_ "How would I use Z-score to find salary anomalies in a group?"
            
    *   **Code Generation:** Generated the helper function to group employees by department and location and calculate average salaries.
        
*   **AI-Influenced Decisions:**
    
    *   While the AI suggested Z-scores (a more robust statistical method), I opted for a simpler multiplier (avg \* 3) for the mock, as implementing a full statistics library was out of scope. However, the AI's idea to compare against _peer averages_ (Strategy 2) was a direct result of this interaction.
        

### Task 4: Implement Secure Authentication

*   **AI Usage:**
    
    *   **Security Best Practices:** This was the primary use case.
        
        *   _Prompt:_ "What are common security pitfalls when implementing JWT authentication in Node.js?"
            
    *   **AI Response & Action:**
        
        1.  **AI Pitfall:** Storing plain-text passwords. **My Action:** Implemented bcrypt for hashing and comparison.
            
        2.  **AI Pitfall:** Hardcoding secrets. **My Action:** Moved the JWT\_SECRET to a .env file.
            
        3.  **AI Pitfall:** Leaking password hashes. **My Action:** Ensured the /auth/register and /auth/login endpoints never return the user object with the hash.
            
    *   **Boilerplate:** Generated the authenticateToken middleware structure.
        
        *   _Prompt:_ "Write an Express middleware to verify a JWT from the Authorization header."
            
*   **AI-Influenced Decisions:**
    
    *   The AI's strong emphasis on bcrypt and environment variables confirmed their non-negotiable status for this task. The AI also provided the correct try...catch structure for jwt.verify to handle TokenExpiredError or JsonWebTokenError.