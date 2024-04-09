import express from "express";
import con from "../../utils/db.js";

const router = express.Router();

router.get('/', (req, res) => {
    const sql = "SELECT * FROM leaves WHERE status = ?";
    con.query(sql, ["pending"] , (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" });
        return res.json({ Status: true, Result: result });
    });
});

router.put('/approve/:id', (req, res) => {
    const leave_id = req.params.id;
    if (!leave_id) {
        return res.status(422).json({ Status: false, Error: "Leave ID is missing" });
    }
    const status = "approved";
    const sql = `UPDATE leaves
        SET status = ?
        WHERE id = ?`;
    const values = [
        status,
        leave_id
    ];
    con.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ Status: false, Error: "Query Error: " + err });
        if (result.affectedRows === 0) {
            return res.status(422).json({ Status: false, Error: "Leave ID not found" });
        }
        return res.status(200).json({ Status: true, Result: "Leave approved successfully." });
    });
});

router.put('/reject/:id', (req, res) => {
    const leave_id = req.params.id;
    if (!leave_id) {
        return res.status(422).json({ Status: false, Error: "Leave ID is missing" });
    }
    const status = "rejected";
    const sql = `UPDATE leaves
        SET status = ?
        WHERE id = ?`;
    const values = [
        status,
        leave_id
    ];
    con.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ Status: false, Error: "Query Error: " + err });
        if (result.affectedRows === 0) {
            return res.status(422).json({ Status: false, Error: "Leave ID not found" });
        }
        return res.status(200).json({ Status: true, Result: "Leave rejected successfully." });
    });
});

export default router;