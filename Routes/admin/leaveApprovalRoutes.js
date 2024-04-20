import express from "express";
import con from "../../utils/db.js";

const router = express.Router();

router.get('/', (req, res) => {
    const sql = "SELECT leaves.*, employees.name, employees.email, employees.address, employees.salary FROM leaves INNER JOIN employees ON leaves.employee_id = employees.id WHERE leaves.status = ?";
    con.query(sql, ["pending"], (err, result) => {
        if (err) {
            console.error("Error fetching leaves data:", err);
            return res.status(500).json({ Status: false, Error: "Query Error" });
        }
        return res.json({ Status: true, Result: result });
    });
});

router.put('/approve/:id', (req, res) => {
    const leave_id = req.params.id;
    const { employee_id } = req.body;
    if (!leave_id) {
        return res.status(422).json({ Status: false, Error: "Leave ID is missing" });
    }
    if (!employee_id) {
        return res.status(422).json({ Status: false, Error: "Employee ID is missing" });
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
        
        const title = "Leave Approved";
        const message = `Your leave request has been approved.`;
        const notificationInsertQuery = "INSERT INTO notifications (title, message, type, date, employee_id) VALUES (?, ?, ?, ?, ?)";
        const notificationValues = [
            title,
            message,
            'leave_approval',
            new Date(),
            employee_id
        ];
        con.query(notificationInsertQuery, notificationValues, (notificationErr, notificationResult) => {
            if (notificationErr) {
                console.error("Error inserting notification:", notificationErr);
            }
        });
        return res.status(200).json({ Status: true, Result: "Leave approved successfully." });
    });
});

router.put('/reject/:id', (req, res) => {
    const leave_id = req.params.id;
    const { employee_id } = req.body;
    if (!leave_id) {
        return res.status(422).json({ Status: false, Error: "Leave ID is missing" });
    }
    if (!employee_id) {
        return res.status(422).json({ Status: false, Error: "Employee ID is missing" });
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
        const title = "Leave Rejected";
        const message = `Your leave request has been rejected.`;
        const notificationInsertQuery = "INSERT INTO notifications (title, message, type, date, employee_id) VALUES (?, ?, ?, ?, ?)";
        const notificationValues = [
            title,
            message,
            'leave_rejection',
            new Date(),
            employee_id
        ];
        con.query(notificationInsertQuery, notificationValues, (notificationErr, notificationResult) => {
            if (notificationErr) {
                console.error("Error inserting notification:", notificationErr);
            }
        });
        return res.status(200).json({ Status: true, Result: "Leave rejected successfully." });
    });
});

export default router;