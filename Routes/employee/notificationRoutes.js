import express from "express";
import con from "../../utils/db.js";

const router = express.Router();

// Route for Notification
router.get('/:id', (req, res) => {
    const employee_id = req.params.id;
    const sql = `
        SELECT *
        FROM notifications
        WHERE employee_id = ?
        ORDER BY date DESC`;
    con.query(sql, [employee_id], (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" });
        return res.json({ Status: true, Result: result });
    });
});

export default router;
