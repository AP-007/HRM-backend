import express from "express";
import con from "../../utils/db.js";

const router = express.Router();

// Route for Payroll
router.get('/', (req, res) => {
    const sql = "SELECT p.id, p.deduction, p.salary, p.employee_id, e.monthly_leave_days FROM payrolls p JOIN employees e ON p.employee_id = e.id";
    con.query(sql, (err, result) => {
        if (err) {
            console.error("Error fetching payrolls:", err);
            return res.status(500).json({ Status: false, Error: "Query Error" });
        }
        const payrollsWithDetails = result.map(payroll => {
            const deduction = payroll.deduction;
            const salary = payroll.salary;
            const allocated_leave_days = payroll.monthly_leave_days;
            const monthly_leave_days = (deduction / (salary / 25)) + allocated_leave_days;
            const net_pay = salary - deduction;
            return {
                id: payroll.id,
                salary: salary,
                deduction: deduction,
                net_pay: net_pay,
                employee_id: payroll.employee_id,
                monthly_leave_days: monthly_leave_days
            };
        });
        return res.json({ Status: true, Result: payrollsWithDetails });
    });
});

router.post('/pay_now', (req, res) => {
    const { employee_id } = req.body;
    const currentDate = new Date().toISOString().slice(0, 10);
    const checkExistingPayrollQuery = "SELECT * FROM payrolls WHERE employee_id = ? AND pay_date = ?";
    con.query(checkExistingPayrollQuery, [employee_id, currentDate], (err, existingPayrollResult) => {
        if (err) {
            console.error("Error checking existing payroll:", err);
            return res.status(500).json({ Status: false, Error: "Query Error" });
        }
        if (existingPayrollResult.length > 0) {
            return res.status(422).json({ Status: false, Error: "Employee has already been paid today." });
        }
        const approvedLeaveCountQuery = "SELECT COUNT(*) AS approved_count FROM leaves WHERE status = 'approved' AND employee_id = ?";
        con.query(approvedLeaveCountQuery, [employee_id], (err, leaveResult) => {
            if (err) {
                console.error("Error fetching approved leave count:", err);
                return res.status(500).json({ Status: false, Error: "Query Error" });
            }
            const approvedLeaveCount = leaveResult[0].approved_count;
            const monthlyLeaveDaysQuery = "SELECT monthly_leave_days, salary FROM employees WHERE id = ?";
            con.query(monthlyLeaveDaysQuery, [employee_id], (err, employeeResult) => {
                if (err) {
                    console.error("Error fetching monthly leave days:", err);
                    return res.status(500).json({ Status: false, Error: "Query Error" });
                }

                const monthlyLeaveDays = employeeResult[0].monthly_leave_days;
                const salary = employeeResult[0].salary;
                let deductionAmount = 0;
                if (monthlyLeaveDays < approvedLeaveCount) {
                    const deductedDays = approvedLeaveCount - monthlyLeaveDays;
                    deductionAmount = (salary / 25) * deductedDays;
                }
                const updatePayrollQuery = "INSERT INTO payrolls (salary, deduction, net_pay, pay_date, employee_id) VALUES (?, ?, ?, ?, ?)";
                const values = [salary, deductionAmount, salary - deductionAmount, currentDate, employee_id];
                con.query(updatePayrollQuery, values, (err, payrollResult) => {
                    if (err) {
                        console.error("Error updating payroll data:", err);
                        return res.status(500).json({ Status: false, Error: "Query Error" });
                    }
                    const updateEmployeeQuery = "UPDATE employees SET last_pay_date = ? WHERE id = ?";
                    con.query(updateEmployeeQuery, [currentDate, employee_id], (err, updateEmployeeResult) => {
                        if (err) {
                            console.error("Error updating employee record:", err);
                            return res.status(500).json({ Status: false, Error: "Query Error" });
                        }
                        return res.status(200).json({ Status: true, Result: "Payment processed successfully." });
                    });
                });
            });
        });
    });
});


router.post('/create', (req, res) => {
    const { salary, monthly_used_leave, employee_id } = req.body;
    let deduction = 0;
    if (!salary) {
        return res.status(422).json({ Status: false, Error: "Salary is required" });
    }
    if (!employee_id) {
        return res.status(422).json({ Status: false, Error: "Associate employee is required" });
    }
    const currentDate = new Date().toISOString().split('T')[0];
    const sqlCheckPayments = "SELECT * FROM payrolls WHERE employee_id = ? AND DATE(pay_date) = ?";
    con.query(sqlCheckPayments, [employee_id, currentDate], (err, rows) => {
        if (err) {
            console.error("Error checking payments:", err);
            return res.status(500).json({ Status: false, Error: "Query Error" });
        } else {
            if (rows.length > 0) {
                return res.status(422).json({ Status: false, Error: "This employee already received payment today." });
            } else {
                if (monthly_used_leave) {
                    fetchMonthlyLeaveAllocation(employee_id)
                        .then(monthlyLeaveAllocation => {
                            console.log(monthlyLeaveAllocation)
                            if (monthlyLeaveAllocation === null) {
                                return res.status(500).json({ Status: false, Error: "Failed to fetch monthly leave allocation" });
                            }
                            if (monthly_used_leave > monthlyLeaveAllocation) {
                                const extra_leave = monthly_used_leave - monthlyLeaveAllocation;
                                deduction = extra_leave * (salary / 25);
                            }
                            if (deduction > salary) {
                                return res.status(422).json({ Status: false, Error: "Deduction cannot be greater than salary." });
                            }
                            const net_pay = salary - deduction;
                            createPayroll(res, salary, deduction, net_pay, employee_id);
                        })
                        .catch(err => {
                            console.error("Error fetching monthly leave allocation:", err);
                            return res.status(500).json({ Status: false, Error: "Failed to fetch monthly leave allocation" });
                        });
                } else {
                    createPayroll(res, salary, deduction, 0, employee_id);
                }
            }
        }
    });
});

function fetchMonthlyLeaveAllocation(employee_id) {
    return new Promise((resolve, reject) => {
        const sql = "SELECT monthly_leave_days FROM employees WHERE id = ?";
        con.query(sql, [employee_id], (err, rows) => {
            if (err) {
                console.error("Error fetching monthly leave allocation:", err);
                reject(err);
            } else {
                if (rows.length > 0) {
                    const monthlyLeaveAllocation = rows[0].monthly_leave_days;
                    resolve(monthlyLeaveAllocation);
                } else {
                    resolve(null);
                }
            }
        });
    });
}

function createPayroll(res, salary, deduction, net_pay, employee_id) {
    const sql = "INSERT INTO payrolls (salary, deduction, net_pay, employee_id, pay_date) VALUES (?, ?, ?, ?, NOW())";
    const values = [
        salary,
        deduction,
        net_pay,
        employee_id
    ];
    con.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error inserting data:", err);
            return res.status(500).json({ Status: false, Error: "Query Error" });
        }
        return res.status(201).json({ Status: true, Result: { id: result.insertId, salary, deduction, net_pay, employee_id } });
    });
}

router.get('/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM payrolls WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" });
        if (result.length === 0) {
            return res.status(422).json({ Status: false, Error: "Payroll ID not found" });
        }
        return res.json({ Status: true, Result: result });
    });
});

router.put('/update/:payroll_id', (req, res) => {
    const { salary, monthly_used_leave, employee_id } = req.body;
    const { payroll_id } = req.params;

    let deduction = 0;
    if (!salary) {
        return res.status(422).json({ Status: false, Error: "Salary is required" });
    }
    if (!employee_id) {
        return res.status(422).json({ Status: false, Error: "Associate employee is required" });
    }

    const currentDate = new Date().toISOString().split('T')[0];
    const sqlCheckPayments = "SELECT * FROM payrolls WHERE id = ? AND DATE(pay_date) = ?";
    con.query(sqlCheckPayments, [payroll_id, currentDate], (err, rows) => {
        if (err) {
            console.error("Error checking payments:", err);
            return res.status(500).json({ Status: false, Error: "Query Error" });
        } else {
            if (monthly_used_leave) {
                fetchMonthlyLeaveAllocation(employee_id)
                    .then(monthlyLeaveAllocation => {
                        if (monthlyLeaveAllocation === null) {
                            return res.status(500).json({ Status: false, Error: "Failed to fetch monthly leave allocation" });
                        }
                        if (monthly_used_leave > monthlyLeaveAllocation) {
                            const extra_leave = monthly_used_leave - monthlyLeaveAllocation;
                            deduction = extra_leave * (salary / 25);
                        }
                        if (deduction > salary) {
                            return res.status(422).json({ Status: false, Error: "Deduction cannot be greater than salary." });
                        }
                        const net_pay = salary - deduction;
                        updatePayroll(res, salary, deduction, net_pay, employee_id, payroll_id);
                    })
                    .catch(err => {
                        console.error("Error fetching monthly leave allocation:", err);
                        return res.status(500).json({ Status: false, Error: "Failed to fetch monthly leave allocation" });
                    });
            } else {
                updatePayroll(res, salary, deduction, 0, employee_id, payroll_id);
            }
        }
    });
});

function updatePayroll(res, salary, deduction, net_pay, employee_id, payroll_id) {
    const sql = "UPDATE payrolls SET salary = ?, deduction = ?, net_pay = ?, employee_id = ? WHERE id = ?";
    const values = [
        salary,
        deduction,
        net_pay,
        employee_id,
        payroll_id
    ];
    con.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error updating payroll:", err);
            return res.status(500).json({ Status: false, Error: "Query Error" });
        }
        return res.status(200).json({ Status: true, Message: "Payroll updated successfully" });
    });
}

router.get('/get_salary', (req, res) => {
    const { employee_id } = req.body;
    if (!employee_id) {
        return res.status(422).json({ Status: false, Error: "Employee ID is required" });
    }
    const sqlGetPositionId = "SELECT position_id FROM employees WHERE id = ?";
    con.query(sqlGetPositionId, [employee_id], (err, rows) => {
        if (err) {
            console.error("Error fetching position ID:", err);
            return res.status(500).json({ Status: false, Error: "Query Error" });
        } else {
            if (rows.length === 0) {
                return res.status(404).json({ Status: false, Error: "Employee not found" });
            }
            const position_id = rows[0].position_id;
            const sqlGetSalary = "SELECT salary FROM position WHERE id = ?";
            con.query(sqlGetSalary, [position_id], (err, rows) => {
                if (err) {
                    console.error("Error fetching salary:", err);
                    return res.status(500).json({ Status: false, Error: "Query Error" });
                } else {
                    if (rows.length === 0) {
                        return res.status(404).json({ Status: false, Error: "Salary not found for the given position" });
                    }
                    const salary = rows[0].salary;
                    return res.status(200).json({ Status: true, Salary: salary });
                }
            });
        }
    });
});

router.delete('/delete/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM payrolls WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" + err });
        if (result.affectedRows === 0) {
            return res.status(422).json({ Status: false, Error: "Payroll ID not found" });
        }
        return res.json({ Status: true, Result: "Payroll deleted successfully." });
    });
});

export default router;