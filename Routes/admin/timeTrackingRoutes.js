import express from "express";
import con from "../../utils/db.js";

const router = express.Router();

// Route for Time Trackings
router.get('/', (req, res) => {
    const sql = "SELECT * FROM time_trackings";
    con.query(sql, (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" });
        return res.json({ Status: true, Result: result });
    });
});

// Today employee attandance
router.get('/today_attendance', (req, res) => {
    const today_date = new Date().toISOString().slice(0, 10);
    const sql = `
        SELECT employees.name AS employee_name, time_trackings.*
        FROM time_trackings
        INNER JOIN employees ON time_trackings.employee_id = employees.id
        WHERE DATE(time_trackings.date) = ?
    `;

    con.query(sql, [today_date], (err, results) => {
        if (err) {
            console.error("Error fetching today's attendance:", err);
            return res.status(500).json({ status: false, error: "Internal Server Error" });
        }
        res.json({ status: true, data: results });
    });
});

router.put('/checkout/:id', (req, res) => {
    const id = req.params.id;
    if (!id) {
        return res.status(422).json({ Status: false, Error: "Please send time tracking id." });
    }
    const checkInQuery = "SELECT * FROM time_trackings WHERE id = ?";
    con.query(checkInQuery, [id], (checkInErr, checkInResult) => {

    });
});

router.post('/create', (req, res) => {
    const { date, time_in, time_out, employee_id } = req.body;
    if (!date) {
        return res.status(422).json({ status: false, error: "Date field is required" });
    }
    if (!time_in) {
        return res.status(422).json({ status: false, error: "CheckIn field is required" });
    }
    if (!time_out) {
        return res.status(422).json({ status: false, error: "CheckOut field is required" });
    }
    if (!employee_id) {
        return res.status(422).json({ status: false, error: "Employee Field is required." });
    }
    const checkInQuery = "SELECT * FROM time_trackings WHERE employee_id = ? AND date = ?";
    con.query(checkInQuery, [employee_id, date], (checkInErr, checkInResult) => {
        if (checkInErr) {
            console.error("Error checking check-in status:", checkInErr);
            return res.status(500).json({ status: false, error: "Query Error" });
        }
        if (checkInResult.length > 0) {
            return res.status(422).json({ status: false, error: "This employee has already checked in for this specific day." });
        }
        const timeIn = new Date('1970-01-01 ' + time_in);
        const timeOut = new Date('1970-01-01 ' + time_out);
        const diffMs = timeOut - timeIn;
        const work_hour = diffMs / (1000 * 60 * 60);

        const insertQuery = "INSERT INTO time_trackings (date, time_in, time_out, work_hour, employee_id) VALUES (?, ?, ?, ?, ?)";
        const values = [date, time_in, time_out, work_hour, employee_id];
        con.query(insertQuery, values, (err, result) => {
            if (err) {
                console.error("Error inserting data:", err);
                return res.status(500).json({ status: false, error: "Query Error" });
            }
            return res.status(201).json({ status: true, result: { id: result.insertId, date, time_in, work_hour, employee_id } });
        });
    });
});

router.get('/:id', (req, res) => {
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

router.put('/update/:id', (req, res) => {
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

router.delete('/delete/:id', (req, res) => {
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

export default router;