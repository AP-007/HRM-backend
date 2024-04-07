import express from "express";
import con from "../utils/db.js";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt'
import multer from "multer";
import path from "path";

const router = express.Router();

router.post("/login", (req, res) => {
    if (!req.body.email || !req.body.password) {
        return res.status(422).json({ loginStatus: false, Error: "Email and password are required" });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(req.body.email)) {
        return res.status(422).json({ loginStatus: false, Error: "Please enter a valid email address" });
    }

    const sql = "SELECT id, name, email from admin Where email = ? and password = ?";
    con.query(sql, [req.body.email, req.body.password], (err, result) => {
        if (err) return res.status(500).json({ loginStatus: false, Error: "Query error" });
        if (result.length > 0) {
            const user = {
                id: result[0].id,
                name: result[0].name,
                email: result[0].email
            };
            const token = jwt.sign({ role: "admin", email: user.email, id: user.id },
                "jwt_secret_key", { expiresIn: "1d" }
            );
            res.cookie('token', token);
            return res.json({ loginStatus: true, token: token, user: user });
        } else {
            return res.status(422).json({ loginStatus: false, Error: "Wrong email or password" });
        }
    });
});

// Route for Department
router.get('/departments', (req, res) => {
    const sql = "SELECT * FROM department";
    con.query(sql, (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" })
        return res.json({ Status: true, Result: result })
    })
})

router.post('/departments/create', (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(422).json({ Status: false, Error: "Department name is required" });
    }
    const sql = "INSERT INTO department (name) VALUES (?)";
    con.query(sql, [name], (err, result) => {
        if (err) {
            console.error("Error inserting data:", err);
            return res.status(500).json({ Status: false, Error: "Query Error" });
        }
        return res.status(201).json({ Status: true, Result: { id: result.insertId, name: name } });
    });
});

router.get('/departments/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM department WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ Status: false, Error: "Query Error" });

        if (result.length === 0) {
            return res.status(422).json({ Status: false, Error: "Department ID not found" });
        } else {
            return res.json({ Status: true, Result: result });
        }
    });
});

router.put('/departments/update/:id', (req, res) => {
    const id = req.params.id;
    if (!id) {
        return res.status(422).json({ Status: false, Error: "Department ID is missing" });
    }
    const sql = `UPDATE department
        SET name = ?
        WHERE id = ?`;
    const values = [
        req.body.name,
        id
    ];
    con.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ Status: false, Error: "Query Error" + err });
        if (result.affectedRows === 0) {
            return res.status(422).json({ Status: false, Error: "Department ID not found" });
        }
        const updatedSql = "SELECT * FROM department WHERE id = ?";
        con.query(updatedSql, [id], (err, updatedResult) => {
            if (err) return res.status(500).json({ Status: false, Error: "Query Error" + err });
            const updatedDepartment = updatedResult[0];
            return res.json({ Status: true, Department: updatedDepartment });
        });
    });
});

router.delete('/departments/delete/:id', (req, res) => {
    const id = req.params.id;
    const sql = "delete from department where id = ?"
    con.query(sql, [id], (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" + err })
        if (result.affectedRows === 0) {
            return res.status(422).json({ Status: false, Error: "Department ID not found" });
        }
        return res.json({ Status: true, Result: result })
    })
})


// Route for Position
router.get('/positions', (req, res) => {
    const sql = "SELECT * FROM position";
    con.query(sql, (err, result) => {
        if (err) return res.status(500).json({ Status: false, Error: "Query Error" });
        return res.status(200).json({ Status: true, Result: result });
    });
});

router.post('/positions/create', (req, res) => {
    const { title, salary, responsibilities } = req.body;
    if (!title) {
        return res.status(422).json({ Status: false, Error: "Title field is required" });
    }
    if (!salary) {
        return res.status(422).json({ Status: false, Error: "Salary field is required" });
    }
    if (!responsibilities) {
        return res.status(422).json({ Status: false, Error: "Responsibilities field is required" });
    }
    const sql = "INSERT INTO `position` (title, salary, responsibilities) VALUES (?, ?, ?)";
    const responsibilitiesJson = JSON.stringify(responsibilities)
    const values = [
        title,
        salary,
        responsibilitiesJson
    ];
    con.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error inserting data:", err);
            return res.status(500).json({ Status: false, Error: "Query Error" });
        }
        return res.status(201).json({ Status: true, Result: { id: result.insertId, title, salary, responsibilities } });
    });
});

router.get('/positions/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM position WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ Status: false, Error: "Query Error" });
        if (result.length === 0) {
            return res.status(422).json({ Status: false, Error: "Position ID not found" });
        }
        return res.status(200).json({ Status: true, Result: result });
    });
});

router.put('/positions/update/:id', (req, res) => {
    const id = req.params.id;
    const { title, salary, responsibilities } = req.body;
    if (!id) {
        return res.status(422).json({ Status: false, Error: "Position ID is missing" });
    }
    if (!title) {
        return res.status(422).json({ Status: false, Error: "Title field is required" });
    }
    if (!salary) {
        return res.status(422).json({ Status: false, Error: "Salary field is required" });
    }
    if (!responsibilities) {
        return res.status(422).json({ Status: false, Error: "Responsibilities field is required" });
    }
    const sql = `UPDATE position
        SET title = ?, salary = ?, responsibilities = ?
        WHERE id = ?`;
    const values = [
        title,
        salary,
        JSON.stringify(responsibilities),
        id
    ];
    con.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ Status: false, Error: "Query Error: " + err });
        if (result.affectedRows === 0) {
            return res.status(422).json({ Status: false, Error: "Position ID not found" });
        }
        const updatedSql = "SELECT * FROM position WHERE id = ?";
        con.query(updatedSql, [id], (err, updatedResult) => {
            if (err) return res.status(500).json({ Status: false, Error: "Query Error" + err });
            const updatedPosition = updatedResult[0];
            return res.status(200).json({ Status: true, Position: updatedPosition });
        });
    });
});

router.delete('/positions/delete/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM position WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ Status: false, Error: "Query Error" + err });
        if (result.affectedRows === 0) {
            return res.status(422).json({ Status: false, Error: "Position ID not found" });
        }
        return res.status(200).json({ Status: true, Result: "Position deleted successfully." });
    });
});

// Route for Employees
router.get('/employees', (req, res) => {
    const sql = "SELECT * FROM employees";
    con.query(sql, (err, result) => {
        if (err) return res.status(500).json({ Status: false, Error: "Query Error" });
        return res.status(200).json({ Status: true, Result: result });
    });
});

router.post('/employees/create', (req, res) => {
    const { name, email, password, address, department_id, position_id, annual_leave_days, monthly_leave_days } = req.body;
    if (!name) {
        return res.status(422).json({ Status: false, Error: "Name field is required" });
    }
    if (!email) {
        return res.status(422).json({ Status: false, Error: "Email field is required" });
    }
    if (!address) {
        return res.status(422).json({ Status: false, Error: "Address field is required" });
    }
    if (!department_id) {
        return res.status(422).json({ Status: false, Error: "Department field is required" });
    }
    if (!position_id) {
        return res.status(422).json({ Status: false, Error: "Position field is required" });
    }
    if (!annual_leave_days) {
        return res.status(422).json({ Status: false, Error: "Annual leave day is required" });
    }
    if (!monthly_leave_days) {
        return res.status(422).json({ Status: false, Error: "Monthly leave day is required" });
    }
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.status(500).json({ Status: false, Error: "Hashing Error: " + err });
        const sql = `INSERT INTO employees
            (name, email, password, address, department_id, position_id, annual_leave_days, monthly_leave_days) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [
            name,
            email,
            hash,
            address,
            department_id,
            position_id,
            annual_leave_days,
            monthly_leave_days
        ];
        con.query(sql, values, (err, result) => {
            if (err) return res.status(500).json({ Status: false, Error: "Query Error: " + err });
            return res.status(201).json({ Status: true, Result: { id: result.insertId, name, email, address, department_id, position_id, annual_leave_days, monthly_leave_days } });
        });
    });
});

router.get('/employees/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM employees WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ Status: false, Error: "Query Error" });
        if (result.length === 0) {
            return res.status(422).json({ Status: false, Error: "Employee not found" });
        } else {
            return res.status(200).json({ Status: true, Result: result });
        }
    });
});

router.put('/employees/update/:id', (req, res) => {
    const id = req.params.id;
    const { name, email, password, address, department_id, position_id, annual_leave_days, monthly_leave_days } = req.body;
    if (!name) {
        return res.status(422).json({ Status: false, Error: "Name field is required" });
    }
    if (!email) {
        return res.status(422).json({ Status: false, Error: "Email field is required" });
    }
    if (!address) {
        return res.status(422).json({ Status: false, Error: "Address field is required" });
    }
    if (!department_id) {
        return res.status(422).json({ Status: false, Error: "Department field is required" });
    }
    if (!position_id) {
        return res.status(422).json({ Status: false, Error: "Position field is required" });
    }
    if (!annual_leave_days) {
        return res.status(422).json({ Status: false, Error: "Annual leave day is required" });
    }
    if (!monthly_leave_days) {
        return res.status(422).json({ Status: false, Error: "Monthly leave day is required" });
    }

    let sql;
    let values;
    if (password) {
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) return res.status(500).json({ Status: false, Error: "Hashing Error: " + err });
            sql = `UPDATE employees
                SET name = ?, email = ?, password = ?, address = ?, department_id = ?, position_id = ?, annual_leave_days = ?, monthly_leave_days = ?
                WHERE id = ?`;
            values = [
                name,
                email,
                hash,
                address,
                department_id,
                position_id,
                annual_leave_days,
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
        });
    } else {
        sql = `UPDATE employees
            SET name = ?, email = ?, address = ?, department_id = ?, position_id = ?, annual_leave_days = ?, monthly_leave_days = ?
            WHERE id = ?`;
        values = [
            name,
            email,
            address,
            department_id,
            position_id,
            annual_leave_days,
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

router.delete('/employees/delete/:id', (req, res) => {
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

// Route for Benefits
router.get('/benefits', (req, res) => {
    const sql = "SELECT * FROM benefits";
    con.query(sql, (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" });
        return res.json({ Status: true, Result: result });
    });
});

router.post('/benefits/create', (req, res) => {
    const { health_insurance, retirement_plan, employee_id } = req.body;
    if (!health_insurance) {
        return res.status(400).json({ Status: false, Error: "Health Insurance is required" });
    }
    if (!employee_id) {
        return res.status(400).json({ Status: false, Error: "Associate employee is required" });
    }

    const sql = "INSERT INTO benefits (health_insurance, retirement_plan, employee_id) VALUES (?, ?, ?)";
    const retirementPlanJson = JSON.stringify(retirement_plan);
    const values = [
        health_insurance,
        retirementPlanJson,
        employee_id
    ];
    con.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error inserting data:", err);
            return res.status(500).json({ Status: false, Error: "Query Error" });
        }
        return res.status(201).json({ Status: true, Result: { id: result.insertId, health_insurance, retirement_plan, employee_id } });
    });
});

router.get('/benefits/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM benefits WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" });
        if (result.length === 0) {
            return res.status(422).json({ Status: false, Error: "Benefit ID not found" });
        }
        return res.json({ Status: true, Result: result });
    });
});

router.put('/benefits/update/:id', (req, res) => {
    const id = req.params.id;
    const { health_insurance, retirement_plan, employee_id } = req.body;
    if (!health_insurance) {
        return res.status(400).json({ Status: false, Error: "Health Insurance is required" });
    }
    if (!employee_id) {
        return res.status(400).json({ Status: false, Error: "Associate employee is required" });
    }

    const sql = `UPDATE benefits
        SET health_insurance = ?, retirement_plan = ?, employee_id = ?
        WHERE id = ?`;
    const values = [
        health_insurance,
        JSON.stringify(retirement_plan),
        employee_id,
        id
    ];
    con.query(sql, values, (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" + err });
        if (result.affectedRows === 0) {
            return res.status(422).json({ Status: false, Error: "Benefit ID not found" });
        }
        return res.json({ Status: true, Result: "Benefit updated successfully." });
    });
});

router.delete('/benefits/delete/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM benefits WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" + err });
        if (result.affectedRows === 0) {
            return res.status(422).json({ Status: false, Error: "Benefit ID not found" });
        }
        return res.json({ Status: true, Result: "Benefit deleted successfully." });
    });
});

// Route for Payroll
router.get('/payrolls', (req, res) => {
    const sql = "SELECT * FROM payrolls";
    con.query(sql, (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" });
        return res.json({ Status: true, Result: result });
    });
});

router.post('/payrolls/create', (req, res) => {
    const { salary, deduction, employee_id } = req.body;
    if (!salary) {
        return res.status(422).json({ Status: false, Error: "Salary is required" });
    }
    if (!deduction) {
        return res.status(422).json({ Status: false, Error: "Deduction is required" });
    }
    if (!employee_id) {
        return res.status(422).json({ Status: false, Error: "Associate employee is required" });
    }
    if (deduction > salary) {
        return res.status(422).json({ Status: false, Error: "Deduction cannot be greater than salary." });
    }

    const net_pay = salary - deduction;

    const sql = "INSERT INTO payrolls (salary, deduction, net_pay, employee_id) VALUES (?, ?, ?, ?)";
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
});

router.get('/payrolls/:id', (req, res) => {
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

router.put('/payrolls/update/:id', (req, res) => {
    const id = req.params.id;
    const { salary, deduction, employee_id } = req.body;
    if (!salary) {
        return res.status(422).json({ Status: false, Error: "Salary is required" });
    }
    if (!deduction) {
        return res.status(422).json({ Status: false, Error: "Deduction is required" });
    }
    if (!employee_id) {
        return res.status(422).json({ Status: false, Error: "Associate employee is required" });
    }
    if (deduction > salary) {
        return res.status(422).json({ Status: false, Error: "Deduction cannot be greater than salary." });
    }

    const net_pay = salary - deduction;
    const sql = `UPDATE payrolls
        SET salary = ?, deduction = ?, net_pay = ?, employee_id = ?
        WHERE id = ?`;
    const values = [
        salary,
        deduction,
        net_pay,
        employee_id,
        id
    ];
    con.query(sql, values, (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" + err });
        if (result.affectedRows === 0) {
            return res.status(422).json({ Status: false, Error: "Payroll ID not found" });
        }
        return res.json({ Status: true, Result: "Payroll updated successfully." });
    });
});

router.delete('/payrolls/delete/:id', (req, res) => {
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

// Route for Time Trackings
router.get('/time_trackings', (req, res) => {
    const sql = "SELECT * FROM time_trackings";
    con.query(sql, (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" });
        return res.json({ Status: true, Result: result });
    });
});

router.post('/time_trackings/create', (req, res) => {
    const { date, time_in, time_out, employee_id } = req.body;
    if (!date) {
        return res.status(422).json({ Status: false, Error: "Date field is required" });
    }
    if (!time_in) {
        return res.status(422).json({ Status: false, Error: "CheckIn field is required" });
    }
    if (!time_out) {
        return res.status(422).json({ Status: false, Error: "CheckOut field is required" });
    }
    if (!employee_id) {
        return res.status(422).json({ Status: false, Error: "Employee Field is required." });
    }
    const checkInQuery = "SELECT * FROM time_trackings WHERE employee_id = ? AND date = ?";
    con.query(checkInQuery, [employee_id, date], (checkInErr, checkInResult) => {
        if (checkInErr) {
            console.error("Error checking check-in status:", checkInErr);
            return res.status(500).json({ Status: false, Error: "Query Error" });
        }
        if (checkInResult.length > 0) {
            return res.status(422).json({ Status: false, Error: "Employee has already checked in for this specific day." });
        }
        const timeIn = new Date('1970-01-01 ' + time_in);
        const timeOut = new Date('1970-01-01 ' + time_out);
        const diffMs = timeOut - timeIn;
        const work_hour = diffMs / (1000 * 60 * 60);
        const insertQuery = "INSERT INTO time_trackings (date, time_in, time_out, work_hour, employee_id) VALUES (?, ?, ?, ?, ?)";
        const values = [
            date,
            time_in,
            time_out,
            work_hour,
            employee_id
        ];
        con.query(insertQuery, values, (err, result) => {
            if (err) {
                console.error("Error inserting data:", err);
                return res.status(500).json({ Status: false, Error: "Query Error" });
            }
            return res.status(201).json({ Status: true, Result: { id: result.insertId, date, time_in, time_out, work_hour, employee_id } });
        });
    });
});

router.get('/time_trackings/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM time_trackings WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" });
        if (result.length === 0) {
            return res.status(422).json({ Status: false, Error: "Time Tracking ID not found" });
        }
        return res.json({ Status: true, Result: result });
    });
});

router.put('/time_trackings/update/:id', (req, res) => {
    const id = req.params.id;
    const { date, time_in, time_out, employee_id } = req.body;
    if (!date) {
        return res.status(422).json({ Status: false, Error: "Date field is required" });
    }
    if (!time_in) {
        return res.status(422).json({ Status: false, Error: "CheckIn field is required" });
    }
    if (!time_out) {
        return res.status(422).json({ Status: false, Error: "CheckOut field is required" });
    }
    if (!employee_id) {
        return res.status(422).json({ Status: false, Error: "Employee Field is required." });
    }
    const checkInQuery = "SELECT * FROM time_trackings WHERE employee_id = ? AND date = ?";
    con.query(checkInQuery, [employee_id, date], (checkInErr, checkInResult) => {
        if (checkInErr) {
            console.error("Error checking check-in status:", checkInErr);
            return res.status(500).json({ Status: false, Error: "Query Error" });
        }
        if (checkInResult.length > 0 && checkInResult[0].id != id) {
            return res.status(400).json({ Status: false, Error: "Employee has already checked in for this specific day." });
        }
        console.log("Existing record:", checkInResult);
        const timeIn = new Date('1970-01-01 ' + time_in);
        const timeOut = new Date('1970-01-01 ' + time_out);
        const diffMs = timeOut - timeIn;
        const work_hour = diffMs / (1000 * 60 * 60);
        const updateQuery = `UPDATE time_trackings
            SET date = ?, time_in = ?, time_out = ?, work_hour = ?, employee_id = ?
            WHERE id = ?`;
        const values = [
            date,
            time_in,
            time_out,
            work_hour,
            employee_id,
            id
        ];
        con.query(updateQuery, values, (err, result) => {
            if (err) {
                console.error("Error updating data:", err);
                return res.status(500).json({ Status: false, Error: "Query Error" });
            }
            if (result.affectedRows === 0) {
                return res.status(422).json({ Status: false, Error: "Time Tracking ID not found" });
            }
            return res.status(200).json({ Status: true, Result: "Time Tracking updated successfully." });
        });
    });
});

router.delete('/time_trackings/delete/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM time_trackings WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" + err });
        if (result.affectedRows === 0) {
            return res.status(422).json({ Status: false, Error: "Time Tracking ID not found" });
        }
        return res.json({ Status: true, Result: "Time Tracking deleted successfully." });
    });
});

// Route for Training Programs
router.get('/training_programs', (req, res) => {
    const sql = "SELECT * FROM training_program";
    con.query(sql, (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" });
        return res.json({ Status: true, Result: result });
    });
});

router.post('/training_programs/create', (req, res) => {
    const { name, trainer, start_time, end_time } = req.body;
    if (!name) {
        return res.status(422).json({ Status: false, Error: "Name field is required" });
    }
    if (!trainer) {
        return res.status(422).json({ Status: false, Error: "Trainer field is required" });
    }
    if (!start_time) {
        return res.status(422).json({ Status: false, Error: "Start time field is required" });
    }
    if (!end_time) {
        return res.status(422).json({ Status: false, Error: "End time is required." });
    }
    const insertQuery = "INSERT INTO training_program (name, trainer, start_time, end_time) VALUES (?, ?, ?, ?)";
    const values = [
        name,
        trainer,
        start_time,
        end_time
    ];
    con.query(insertQuery, values, (err, result) => {
        if (err) {
            console.error("Error creating training program:", err);
            return res.status(500).json({ Status: false, Error: "Query Error" });
        }
        return res.status(201).json({ Status: true, Result: { id: result.insertId, name, trainer, start_time, end_time } });
    });
});

router.get('/training_programs/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM training_program WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" });
        if (result.length === 0) {
            return res.status(422).json({ Status: false, Error: "Training Program ID not found" });
        }
        return res.json({ Status: true, Result: result });
    });
});

router.put('/training_programs/update/:id', (req, res) => {
    const id = req.params.id;
    const { name, trainer, start_time, end_time } = req.body;
    if (!name) {
        return res.status(422).json({ Status: false, Error: "Name field is required" });
    }
    if (!trainer) {
        return res.status(422).json({ Status: false, Error: "Trainer field is required" });
    }
    if (!start_time) {
        return res.status(422).json({ Status: false, Error: "Start time field is required" });
    }
    if (!end_time) {
        return res.status(422).json({ Status: false, Error: "End time is required." });
    }
    const updateQuery = `UPDATE training_program
        SET name = ?, trainer = ?, start_time = ?, end_time = ?
        WHERE id = ?`;
    const values = [
        name,
        trainer,
        start_time,
        end_time,
        id
    ];
    con.query(updateQuery, values, (err, result) => {
        if (err) {
            console.error("Error updating training program:", err);
            return res.status(500).json({ Status: false, Error: "Query Error" });
        }
        if (result.affectedRows === 0) {
            return res.status(422).json({ Status: false, Error: "Training Program ID not found" });
        }
        return res.status(200).json({ Status: true, Result: "Training Program updated successfully." });
    });
});

router.delete('/training_programs/delete/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM training_program WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" + err });
        if (result.affectedRows === 0) {
            return res.status(422).json({ Status: false, Error: "Training Program ID not found" });
        }
        return res.json({ Status: true, Result: "Training Program deleted successfully." });
    });
});

// Add employees to training program
router.post('/training_programs/add_employees', (req, res) => {
    const { employee_ids, training_program_id } = req.body;
    if (!Array.isArray(employee_ids) || employee_ids.length === 0) {
        return res.status(422).json({ Status: false, Error: "You haven't selected employee for this training program." });
    }
    const checkQuery = "SELECT * FROM employee_training_program WHERE training_program_id = ?";
    con.query(checkQuery, [training_program_id], (checkErr, checkResult) => {
        if (checkErr) {
            console.error("Error checking employees in training program:", checkErr);
            return res.status(500).json({ Status: false, Error: "Query Error" });
        }
        const existingEmployeeIds = checkResult.map(entry => entry.employee_id);
        const newEmployeeIds = employee_ids.filter(id => !existingEmployeeIds.includes(id));
        if (newEmployeeIds.length === 0) {
            return res.status(400).json({ Status: false, Error: "All employees are already added to this training program" });
        }
        const insertQuery = "INSERT INTO employee_training_program (employee_id, training_program_id) VALUES ?";
        const values = newEmployeeIds.map(id => [id, training_program_id]);
        con.query(insertQuery, [values], (err, result) => {
            if (err) {
                console.error("Error adding employees to training program:", err);
                return res.status(500).json({ Status: false, Error: "Query Error" });
            }
            return res.status(201).json({ Status: true, Result: { employee_ids: newEmployeeIds, training_program_id } });
        });
    });
});

router.get('/training_programs/:id/employees', (req, res) => {
    const training_program_id = req.params.id;
    const sql = "SELECT * FROM employees WHERE id IN (SELECT employee_id FROM employee_training_program WHERE training_program_id = ?)";
    con.query(sql, [training_program_id], (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" });
        return res.json({ Status: true, Result: result });
    });
});

router.delete('/training_programs/remove_employee/:training_program_id', (req, res) => {
    const { training_program_id } = req.params;
    const { employee_ids } = req.body;
    if (!employee_ids || !Array.isArray(employee_ids) || employee_ids.length === 0) {
        return res.status(422).json({ Status: false, Error: "No employee selected." });
    }
    const deleteQuery = "DELETE FROM employee_training_program WHERE training_program_id = ? AND employee_id IN (?)";
    con.query(deleteQuery, [training_program_id, employee_ids], (err, result) => {
        if (err) return res.status(500).json({ Status: false, Error: "Query Error: " + err });
        if (result.affectedRows === 0) {
            return res.status(422).json({ Status: false, Error: "Employee(s) do not exist in this training program." });
        }
        return res.status(200).json({ Status: true, Result: "Employee(s) removed successfully." });
    });
});


// route for admin count
router.get('/admin_count', (req, res) => {
    const sql = "select count(id) as admin from admin";
    con.query(sql, (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" + err })
        return res.json({ Status: true, Result: result })
    })
})

router.get('/employee_count', (req, res) => {
    const sql = "select count(id) as employee from employee";
    con.query(sql, (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" + err })
        return res.json({ Status: true, Result: result })
    })
})

router.get('/salary_count', (req, res) => {
    const sql = "SELECT SUM(position.salary) AS totalSalary FROM employee JOIN position ON employee.position_id = position.id";
    con.query(sql, (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" + err });
        return res.json({ Status: true, Result: result });
    });
});

router.get('/admin_records', (req, res) => {
    const sql = "select * from admin"
    con.query(sql, (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" + err })
        return res.json({ Status: true, Result: result })
    })
})

router.get('/logout', (req, res) => {
    res.clearCookie('token')
    return res.json({ Status: true })
})

export { router as adminRouter };