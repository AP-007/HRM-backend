import express from "express";
import con from "../../utils/db.js";

const router = express.Router();

// Route for Employees
router.get('/', (req, res) => {
    const sql = "SELECT * FROM employees";
    con.query(sql, (err, result) => {
        if (err) return res.status(500).json({ Status: false, Error: "Query Error" });
        return res.status(200).json({ Status: true, Result: result });
    });
});

router.post('/create', (req, res) => {
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

router.get('/:id', (req, res) => {
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

router.put('/update/:id', (req, res) => {
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