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
    const { is_monthly_leave, is_annual_leave, reason, status } = req.body;
    if (!(is_monthly_leave === 1 && is_annual_leave === 0) && !(is_monthly_leave === 0 && is_annual_leave === 1)) {
        return res.status(400).json({ Status: false, Error: "Invalid combination of monthly and annual leaves" });
    }
    if (!reason) {
        return res.status(400).json({ Status: false, Error: "Reason is required" });
    }
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ Status: false, Error: "Invalid status" });
    }

    const sql = "INSERT INTO leaves (is_monthly_leave, is_annual_leave, reason, status) VALUES (?, ?, ?, ?)";
    const values = [
        is_monthly_leave,
        is_annual_leave,
        reason,
        status
    ];
    con.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error inserting data:", err);
            return res.status(500).json({ Status: false, Error: "Query Error" });
        }
        return res.status(201).json({ Status: true, Result: { id: result.insertId, is_monthly_leave, is_annual_leave, reason, status } });
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
    const { is_monthly_leave, is_annual_leave, reason, status } = req.body;
    if (!(is_monthly_leave === 1 && is_annual_leave === 0) && !(is_monthly_leave === 0 && is_annual_leave === 1)) {
        return res.status(400).json({ Status: false, Error: "Invalid combination of monthly and annual leaves" });
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