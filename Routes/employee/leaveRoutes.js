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
    const { employee_id, reason, from, to } = req.body;
    if (!reason) {
        return res.status(400).json({ Status: false, Error: "Reason is required." });
    }
    if (!from) {
        return res.status(400).json({ Status: false, Error: "Initial day is required." });
    }
    if (!to) {
        return res.status(400).json({ Status: false, Error: "Final day is required." });
    }

    const checkExistingQuery = "SELECT * FROM leaves WHERE employee_id = ? AND ((`from` BETWEEN ? AND ?) OR (`to` BETWEEN ? AND ?))";
    const checkExistingValues = [employee_id, from, to, from, to];
    con.query(checkExistingQuery, checkExistingValues, (checkErr, checkResult) => {
        if (checkErr) {
            console.error("Error checking existing data:", checkErr);
            return res.status(500).json({ Status: false, Error: "Query Error" });
        }
        if (checkResult.length > 0) {
            return res.status(400).json({ Status: false, Error: "You already have applied for leave within this period." });
        }
        const status = "pending";
        const insertQuery = "INSERT INTO leaves (employee_id, reason, status, `from`, `to`) VALUES (?, ?, ?, ?, ?)";
        const insertValues = [
            employee_id,
            reason,
            status,
            from,
            to
        ];
        con.query(insertQuery, insertValues, (insertErr, result) => {
            if (insertErr) {
                console.error("Error inserting data:", insertErr);
                return res.status(500).json({ Status: false, Error: "Query Error" });
            }
            const employeeQuery = "SELECT name FROM employees WHERE id = ?";
            con.query(employeeQuery, [employee_id], (nameErr, nameResult) => {
                if (nameErr || nameResult.length === 0) {
                    console.error("Error fetching employee name:", nameErr);
                    return res.status(500).json({ Status: false, Error: "Failed to fetch employee name" });
                }
                const employee_name = nameResult[0].name;
                const title = "Leave Request";
                const message = `${employee_name} requested for leave from ${from} to ${to}.`;
                const adminId = 1;
                const notificationInsertQuery = "INSERT INTO notifications (title, message, type, `date`, admin_id) VALUES (?, ?, ?, ?, ?)";
                const notificationValues = [
                    title,
                    message,
                    'leave_request',
                    new Date(),
                    adminId
                ];
                con.query(notificationInsertQuery, notificationValues, (notificationErr, notificationResult) => {
                    if (notificationErr) {
                        console.error("Error inserting notification:", notificationErr);
                    }
                });
                return res.status(201).json({ Status: true, Result: { id: result.insertId, employee_id, reason, status, from, to } });
            });
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
    const leaveId = req.params.id;
    const { reason, from, to } = req.body;
    if (!reason) {
        return res.status(400).json({ Status: false, Error: "Reason is required." });
    }
    if (!from) {
        return res.status(400).json({ Status: false, Error: "From date is required." });
    }
    if (!to) {
        return res.status(400).json({ Status: false, Error: "To date is required." });
    }
    const updateQuery = "UPDATE leaves SET reason = ?, `from` = ?, `to` = ? WHERE id = ?";
    const updateValues = [reason, from, to, leaveId];

    con.query(updateQuery, updateValues, (updateErr, updateResult) => {
        if (updateErr) {
            console.error("Error updating leave:", updateErr);
            return res.status(500).json({ Status: false, Error: "Failed to update leave." });
        }

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ Status: false, Error: "Leave not found." });
        }

        return res.status(200).json({ Status: true, Message: "Leave updated successfully." });
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