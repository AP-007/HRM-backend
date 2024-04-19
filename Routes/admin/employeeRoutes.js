import express from "express";
import con from "../../utils/db.js";
import bcrypt from 'bcrypt'

const router = express.Router();

// Route for Employees
router.get('/', (req, res) => {
    const sql = "SELECT * FROM employees";
    con.query(sql, (err, result) => {
        if (err) return res.status(500).json({ Status: false, Error: "Query Error" });
        return res.status(200).json({ Status: true, Result: result });
    });
});

router.get('/data/:id', (req, res) => {
    const employeeId = req.params.id;
    const employeeQuery = "SELECT * FROM employees WHERE id = ?";
    con.query(employeeQuery, [employeeId], (employeeErr, employeeResult) => {
        if (employeeErr) {
            console.error('Error fetching employee data:', employeeErr);
            return res.status(500).json({ Status: false, Error: "Query Error: " + employeeErr });
        }
        if (employeeResult.length === 0) {
            return res.status(404).json({ Status: false, Error: "Employee not found" });
        }
        const benefitsQuery = "SELECT * FROM benefits WHERE employee_id = ?";
        con.query(benefitsQuery, [employeeId], (benefitsErr, benefitsResult) => {
            if (benefitsErr) {
                console.error('Error fetching benefits data:', benefitsErr);
                return res.status(500).json({ Status: false, Error: "Query Error: " + benefitsErr });
            }
            const leavesQuery = "SELECT * FROM leaves WHERE employee_id = ?";
            con.query(leavesQuery, [employeeId], (leavesErr, leavesResult) => {
                if (leavesErr) {
                    console.error('Error fetching leaves data:', leavesErr);
                    return res.status(500).json({ Status: false, Error: "Query Error: " + leavesErr });
                }
                const notificationsQuery = "SELECT * FROM notifications WHERE employee_id = ?";
                con.query(notificationsQuery, [employeeId], (notificationsErr, notificationsResult) => {
                    if (notificationsErr) {
                        console.error('Error fetching notifications data:', notificationsErr);
                        return res.status(500).json({ Status: false, Error: "Query Error: " + notificationsErr });
                    }
                    const payrollsQuery = "SELECT * FROM payrolls WHERE employee_id = ?";
                    con.query(payrollsQuery, [employeeId], (payrollsErr, payrollsResult) => {
                        if (payrollsErr) {
                            console.error('Error fetching payrolls data:', payrollsErr);
                            return res.status(500).json({ Status: false, Error: "Query Error: " + payrollsErr });
                        }
                        const timeTrackingsQuery = "SELECT * FROM time_trackings WHERE employee_id = ?";
                        con.query(timeTrackingsQuery, [employeeId], (timeTrackingsErr, timeTrackingsResult) => {
                            if (timeTrackingsErr) {
                                console.error('Error fetching time trackings data:', timeTrackingsErr);
                                return res.status(500).json({ Status: false, Error: "Query Error: " + timeTrackingsErr });
                            }
                            const data = {
                                employee: employeeResult[0],
                                benefits: benefitsResult,
                                leaves: leavesResult,
                                notifications: notificationsResult,
                                payrolls: payrollsResult,
                                time_trackings: timeTrackingsResult
                            };
                            return res.status(200).json({ Status: true, Result: data });
                        });
                    });
                });
            });
        });
    });
});

// for search functionality
router.post('/search', (req, res) => {
    const { query } = req.body;
    if (!query) {
        return res.status(422).json({ Status: false, Error: "No result found" });
    }
    const sql = "SELECT * FROM employees WHERE (name) LIKE ? OR (email) LIKE ?";
    const searchTerm = `%${query}%`;
    console.log(searchTerm)
    con.query(sql, [searchTerm, searchTerm], (err, result) => {
        if (err) {
            return res.status(500).json({ Status: false, Error: "Query Error: " + err });
        }
        if (result.length == 0) {
            return res.status(200).json({ Status: true, Error: "No result found" });
        }
        return res.status(200).json({ Status: true, Result: result });
    });
});

router.post('/create', (req, res) => {
    const { name, email, password, address, department_id, position_id, monthly_leave_days, bank_name, bank_account_number, salary } = req.body;
    const errors = [];
    if (!name) {
        errors.push("Name field is required");
    }
    if (!email) {
        errors.push("Email field is required");
    }
    if (!address) {
        errors.push("Address field is required");
    }
    if (!department_id) {
        errors.push("Department field is required");
    }
    if (!position_id) {
        errors.push("Position field is required");
    }
    if (!monthly_leave_days) {
        errors.push("Monthly leave day is required");
    }
    if (!bank_name) {
        errors.push("Bank name is required");
    }
    if (!bank_account_number) {
        errors.push("Bank account number is required");
    }
    if (!salary) {
        errors.push("Salary field is required");
    }

    if (errors.length > 0) {
        return res.status(422).json({ Status: false, Errors: errors });
    }

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            return res.status(500).json({ Status: false, Error: "Hashing Error: " + err });
        }

        const sql = `INSERT INTO employees
            (name, email, password, address, department_id, position_id, salary,  monthly_leave_days, bank_name, bank_account_number) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [
            name,
            email,
            hash,
            address,
            department_id,
            position_id,
            salary,
            monthly_leave_days,
            bank_name, 
            bank_account_number
        ];
        con.query(sql, values, (err, result) => {
            if (err) {
                return res.status(500).json({ Status: false, Error: "Query Error: " + err });
            }
            return res.status(201).json({ Status: true, Result: { id: result.insertId, name, email, address, department_id, position_id, salary, monthly_leave_days } });
        });
    });
});

router.get('/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT id, name, email, address, department_id, position_id, monthly_leave_days, salary, bank_name, bank_account_number FROM employees WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ Status: false, Error: "Query Error" });
        if (result.length === 0) {
            return res.status(422).json({ Status: false, Error: "Employee not found" });
        } else {
            return res.status(200).json({ Status: true, Result: result });
        }
    });
});

router.put('/update/:id', (req, res) => {
    const id = req.params.id;
    const { name, email, password, address, department_id, position_id, salary, monthly_leave_days, bank_name, bank_account_number } = req.body;
    const errors = [];
    if (!name) {
        errors.push("Name field is required");
    }
    if (!email) {
        errors.push("Email field is required");
    }
    if (!address) {
        errors.push("Address field is required");
    }
    if (!department_id) {
        errors.push("Department field is required");
    }
    if (!position_id) {
        errors.push("Position field is required");
    }
    if (!salary) {
        errors.push("Salary field is required");
    }
    if (!monthly_leave_days) {
        errors.push("Monthly leave day is required");
    }
    if (!bank_name) {
        errors.push("Bank name is required");
    }
    if (!bank_account_number) {
        errors.push("Bank account number is required");
    }
    if (errors.length > 0) {
        return res.status(422).json({ Status: false, Errors: errors });
    }

    let sql;
    let values;
    if (password) {
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) return res.status(500).json({ Status: false, Error: "Hashing Error: " + err });
            sql = `UPDATE employees
                SET name = ?, email = ?, password = ?, address = ?, department_id = ?, position_id = ?, salary = ?, monthly_leave_days = ?, bank_name = ?, bank_account_number = ?
                WHERE id = ?`;
            values = [
                name,
                email,
                hash,
                address,
                department_id,
                position_id,
                salary,
                monthly_leave_days,
                bank_name,
                bank_account_number,
                id
            ];
            con.query(sql, values, (err, result) => {
                if (err) return res.status(500).json({ Status: false, Error: "Query Error: " + err });
                if (result.affectedRows === 0) {
                    return res.status(422).json({ Status: false, Error: "Employee not found" });
                }
                return res.status(200).json({ Status: true, Result: "Employee updated successfully." });
            });
        });
    } else {
        sql = `UPDATE employees
            SET name = ?, email = ?, address = ?, department_id = ?, position_id = ?, salary = ?, monthly_leave_days = ?
            WHERE id = ?`;
        values = [
            name,
            email,
            address,
            department_id,
            position_id,
            salary,
            monthly_leave_days,
            id
        ];
        con.query(sql, values, (err, result) => {
            if (err) return res.status(500).json({ Status: false, Error: "Query Error: " + err });
            if (result.affectedRows === 0) {
                return res.status(422).json({ Status: false, Error: "Employee not found" });
            }
            return res.status(200).json({ Status: true, Result: result });
        });
    }
});

router.delete('/delete/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM employees WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ Status: false, Error: "Query Error" });
        if (result.affectedRows === 0) {
            return res.status(422).json({ Status: false, Error: "Employee not found" });
        } else {
            return res.status(200).json({ Status: true, Result: "Employee deleted successfully" });
        }
    });
});

export default router;