import express from "express";
import con from "../../utils/db.js";

const router = express.Router();

router.get('/', (req, res) => {
    con.query("SELECT COUNT(*) AS employeeCount FROM employees", (err, results) => {
        if (err) throw err;
        const employeeCount = results[0].employeeCount;
        con.query("SELECT COUNT(*) AS programCount FROM training_program", (err, results) => {
            if (err) throw err;
            const programCount = results[0].programCount;
            con.query("SELECT COUNT(*) AS departmentCount FROM department", (err, results) => {
                if (err) throw err;
                const departmentCount = results[0].departmentCount;
                const today = new Date().toISOString().slice(0, 10);
                con.query("SELECT emp.name, emp.email, lv.reason FROM employees emp JOIN leaves lv ON emp.id = lv.employee_id WHERE lv.date = ? AND lv.status = ?", [today, 'approved'], (err, results) => {
                    if (err) throw err;
                    const employeesOnLeave = results;
                    const adminDashboardData = {
                        employeeCount,
                        programCount,
                        departmentCount,
                        employeesOnLeave
                    };
                    res.json(adminDashboardData);
                });
                
            });
        });
    });
});

export default router;
