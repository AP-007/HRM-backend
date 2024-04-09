import express from "express";
import con from "../../utils/db.js";

const router = express.Router();

// Route for Leaves
router.get('/', (req, res) => {
    const sql = "SELECT * FROM leaves";
    con.query(sql, (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" });
        return res.json({ Status: true, Result: result });
    });
});

router.post('/create', (req, res) => {
    const { employee_id, is_monthly_leave, is_annual_leave, reason } = req.body;
    if (!(is_monthly_leave === 1 && is_annual_leave === 0) && !(is_monthly_leave === 0 && is_annual_leave === 1)) {
        return res.status(400).json({ Status: false, Error: "Either monthly or annual leave should be enabled." });
    }
    if (!reason) {
        return res.status(400).json({ Status: false, Error: "Reason is required." });
    }
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const date = `${year}-${month}-${day}`;

    const checkExistingQuery = "SELECT * FROM leaves WHERE employee_id = ? AND date = ?";
    const checkExistingValues = [employee_id, date];
    con.query(checkExistingQuery, checkExistingValues, (checkErr, checkResult) => {
        if (checkErr) {
            console.error("Error checking existing data:", checkErr);
            return res.status(500).json({ Status: false, Error: "Query Error" });
        }
        if (checkResult.length > 0) {
            return res.status(400).json({ Status: false, Error: "You already have applied for leave today." });
        }
        const status = "pending";
        const insertQuery = "INSERT INTO leaves (employee_id, is_monthly_leave, is_annual_leave, reason, status, date) VALUES (?, ?, ?, ?, ?, ?)";
        const insertValues = [
            employee_id,
            is_monthly_leave,
            is_annual_leave,
            reason,
            status,
            date
        ];
        con.query(insertQuery, insertValues, (insertErr, result) => {
            if (insertErr) {
                console.error("Error inserting data:", insertErr);
                return res.status(500).json({ Status: false, Error: "Query Error" });
            }
            return res.status(201).json({ Status: true, Result: { id: result.insertId, employee_id, is_monthly_leave, is_annual_leave, reason, status, date } });
        });
    });
});

router.get('/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM leaves WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" });
        if (result.length === 0) {
            return res.status(422).json({ Status: false, Error: "Leave ID not found" });
        }
        return res.json({ Status: true, Result: result });
    });
});

router.put('/update/:id', (req, res) => {
    const id = req.params.id;
    const { is_monthly_leave, is_annual_leave, reason } = req.body;
    const status = "pending";
    if (!(is_monthly_leave === 1 && is_annual_leave === 0) && !(is_monthly_leave === 0 && is_annual_leave === 1)) {
        return res.status(400).json({ Status: false, Error: "Either monthly or annual leave should enabled." });
    }
    if (!reason) {
        return res.status(400).json({ Status: false, Error: "Reason is required" });
    }
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ Status: false, Error: "Invalid status" });
    }

    const sql = `UPDATE leaves
        SET is_monthly_leave = ?, is_annual_leave = ?, reason = ?, status = ?
        WHERE id = ?`;
    const values = [
        is_monthly_leave,
        is_annual_leave,
        reason,
        status,
        id
    ];
    con.query(sql, values, (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" + err });
        if (result.affectedRows === 0) {
            return res.status(422).json({ Status: false, Error: "Leave ID not found" });
        }
        return res.json({ Status: true, Result: "Leave updated successfully." });
    });
});

router.delete('/delete/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM leaves WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" + err });
        if (result.affectedRows === 0) {
            return res.status(422).json({ Status: false, Error: "Leave ID not found" });
        }
        return res.json({ Status: true, Result: "Leave deleted successfully." });
    });
});

export default router;