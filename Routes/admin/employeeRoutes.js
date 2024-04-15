import express from "express";
import con from "../../utils/db.js";
import bcrypt from 'bcrypt'

const router = express.Router();

// Route for Employees
router.get('/', (req, res) => {
    const sql = "SELECT id, name, email, address, department_id, position_id, monthly_leave_days, annual_leave_days FROM employees";
    con.query(sql, (err, result) => {
        if (err) return res.status(500).json({ Status: false, Error: "Query Error" });
        return res.status(200).json({ Status: true, Result: result });
    });
});

router.post('/create', (req, res) => {
    const { name, email, password, address, department_id, position_id, annual_leave_days, monthly_leave_days, bank_name, bank_account_number } = req.body;
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
    if (!annual_leave_days) {
        errors.push("Annual leave day is required");
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

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            return res.status(500).json({ Status: false, Error: "Hashing Error: " + err });
        }

        const sql = `INSERT INTO employees
            (name, email, password, address, department_id, position_id, annual_leave_days, monthly_leave_days, bank_name, bank_account_number) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [
            name,
            email,
            hash,
            address,
            department_id,
            position_id,
            annual_leave_days,
            monthly_leave_days,
            bank_name, 
            bank_account_number
        ];
        con.query(sql, values, (err, result) => {
            if (err) {
                return res.status(500).json({ Status: false, Error: "Query Error: " + err });
            }
            return res.status(201).json({ Status: true, Result: { id: result.insertId, name, email, address, department_id, position_id, annual_leave_days, monthly_leave_days } });
        });
    });
});

router.get('/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT id, name, email, address, department_id, position_id, monthly_leave_days, annual_leave_days FROM employees WHERE id = ?";
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
    const { name, email, password, address, department_id, position_id, annual_leave_days, monthly_leave_days, bank_name, bank_account_number } = req.body;
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
    if (!annual_leave_days) {
        errors.push("Annual leave day is required");
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
                SET name = ?, email = ?, password = ?, address = ?, department_id = ?, position_id = ?, annual_leave_days = ?, monthly_leave_days = ?, bank_name = ?, bank_account_number = ?
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