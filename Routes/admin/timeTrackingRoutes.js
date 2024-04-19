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

// Assuming you have initialized 'router' and 'con' properly
router.get('/employees/:id', (req, res) => {
    const employee_id = req.params.id;
    const sql = "SELECT * FROM time_trackings WHERE employee_id = ? ORDER BY date DESC";
    con.query(sql, [employee_id], (err, rows) => {
        if (err) {
            console.error("Error fetching time trackings:", err);
            return res.status(500).json({ Status: false, Error: "Query Error" });
        }
        return res.status(200).json({ Status: true, Result: rows });
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

// CheckIn button
router.post('/checkin', (req, res) => {
    const { employee_id } = req.body;
    if (!employee_id) {
        return res.status(422).json({ Status: false, Error: "Employee is not selected." });
    }
    const currentDate = new Date().toISOString().slice(0, 10);
    const checkExistingQuery = "SELECT * FROM time_trackings WHERE employee_id = ? AND date = ?";
    con.query(checkExistingQuery, [employee_id, currentDate], (checkErr, checkResult) => {
        if (checkErr) {
            console.error("Error checking check-in status:", checkErr);
            return res.status(500).json({ Status: false, Error: "Query Error" });
        }
        if (checkResult.length > 0) {
            return res.status(422).json({ Status: false, Error: "Employee has already checked in for today." });
        }
        const currentTime = new Date().toISOString().slice(11, 19);
        const insertQuery = "INSERT INTO time_trackings (date, time_in, employee_id) VALUES (?, ?, ?)";
        const values = [currentDate, currentTime, employee_id];
        con.query(insertQuery, values, (insertErr, result) => {
            if (insertErr) {
                console.error("Error inserting check-in record:", insertErr);
                return res.status(500).json({ Status: false, Error: "Query Error" });
            }
            return res.status(201).json({ Status: true, Result: "Employee checked in successfully." });
        });
    });
});

// Checkout button
router.put('/checkout/:id', (req, res) => {
    const id = req.params.id;
    const { employee_id } = req.body;
    if (!employee_id) {
        return res.status(422).json({ Status: false, Error: "Employee ID is required in the request body." });
    }
    const currentTime = new Date().toISOString().slice(11, 19);
    const updateQuery = "UPDATE time_trackings SET time_out = ?, work_hour = ? WHERE id = ? AND employee_id = ?";
    const getTimeInQuery = "SELECT time_in FROM time_trackings WHERE id = ? AND employee_id = ?";
    const values = [id, employee_id];

    con.query(getTimeInQuery, values, (getTimeInErr, getTimeInResult) => {
        if (getTimeInErr) {
            console.error("Error fetching check-in time:", getTimeInErr);
            return res.status(500).json({ Status: false, Error: "Query Error" });
        }
        if (getTimeInResult.length === 0) {
            return res.status(422).json({ Status: false, Error: "Time Tracking ID not found for the specified employee." });
        }
        const timeIn = getTimeInResult[0].time_in;
        const diffMs = new Date('1970-01-01 ' + currentTime) - new Date('1970-01-01 ' + timeIn);
        const work_hour = diffMs / (1000 * 60 * 60);
        const updateValues = [currentTime, work_hour, id, employee_id];
        
        con.query(updateQuery, updateValues, (err, result) => {
            if (err) {
                console.error("Error updating checkout time:", err);
                return res.status(500).json({ Status: false, Error: "Query Error" });
            }
            if (result.affectedRows === 0) {
                return res.status(422).json({ Status: false, Error: "Time Tracking ID not found for the specified employee." });
            }
            return res.status(200).json({ Status: true, Result: { work_hour: work_hour.toFixed(2), message: "Employee checked out successfully." } });
        });
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