import express from "express";
import con from "../../utils/db.js";

const router = express.Router();

// Route for Payroll
router.get('/', (req, res) => {
    const sql = "SELECT * FROM payrolls";
    con.query(sql, (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" });
        return res.json({ Status: true, Result: result });
    });
});

router.post('/create', (req, res) => {
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

router.put('/update/:id', (req, res) => {
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