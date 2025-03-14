import express from "express";
import con from "../../utils/db.js";
const router = express.Router();

// Route for Training Programs
router.get('/', (req, res) => {
    const sql = "SELECT * FROM training_program";
    con.query(sql, (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" });
        return res.json({ Status: true, Result: result });
    });
});

router.post('/create', (req, res) => {
    const { name, trainer, start_time, end_time } = req.body;
    if (!name) {
        return res.status(422).json({ Status: false, Error: "Name field is required" });
    }
    if (!trainer) {
        return res.status(422).json({ Status: false, Error: "Trainer field is required" });
    }
    if (!start_time) {
        return res.status(422).json({ Status: false, Error: "Start time field is required" });
    }
    if (!end_time) {
        return res.status(422).json({ Status: false, Error: "End time is required." });
    }
    const formattedStartTime = new Date(start_time).toISOString().slice(0, 19).replace('T', ' ');
    const formattedEndTime = new Date(end_time).toISOString().slice(0, 19).replace('T', ' ');
    const insertQuery = "INSERT INTO training_program (name, trainer, start_time, end_time) VALUES (?, ?, ?, ?)";
    const values = [
        name,
        trainer,
        formattedStartTime,
        formattedEndTime
    ];
    con.query(insertQuery, values, (err, result) => {
        if (err) {
            console.error("Error creating training program:", err);
            return res.status(500).json({ Status: false, Error: "Query Error" });
        }
        return res.status(201).json({ Status: true, Result: { id: result.insertId, name, trainer, start_time: formattedStartTime, end_time: formattedEndTime } });
    });
});


router.get('/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM training_program WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" });
        if (result.length === 0) {
            return res.status(422).json({ Status: false, Error: "Training Program ID not found" });
        }
        return res.json({ Status: true, Result: result });
    });
});

router.put('/update/:id', (req, res) => {
    const id = req.params.id;
    const { name, trainer, start_time, end_time } = req.body;
    if (!name) {
        return res.status(422).json({ Status: false, Error: "Name field is required" });
    }
    if (!trainer) {
        return res.status(422).json({ Status: false, Error: "Trainer field is required" });
    }
    if (!start_time) {
        return res.status(422).json({ Status: false, Error: "Start time field is required" });
    }
    if (!end_time) {
        return res.status(422).json({ Status: false, Error: "End time is required." });
    }
    const formattedStartTime = new Date(start_time).toISOString().slice(0, 19).replace('T', ' ');
    const formattedEndTime = new Date(end_time).toISOString().slice(0, 19).replace('T', ' ');
    const updateQuery = `UPDATE training_program
        SET name = ?, trainer = ?, start_time = ?, end_time = ?
        WHERE id = ?`;
    const values = [
        name,
        trainer,
        formattedStartTime,
        formattedEndTime,
        id
    ];
    con.query(updateQuery, values, (err, result) => {
        if (err) {
            console.error("Error updating training program:", err);
            return res.status(500).json({ Status: false, Error: "Query Error" });
        }
        if (result.affectedRows === 0) {
            return res.status(422).json({ Status: false, Error: "Training Program ID not found" });
        }
        return res.status(200).json({ Status: true, Result: "Training Program updated successfully." });
    });
});

router.delete('/delete/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM training_program WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" + err });
        if (result.affectedRows === 0) {
            return res.status(422).json({ Status: false, Error: "Training Program ID not found" });
        }
        return res.json({ Status: true, Result: "Training Program deleted successfully." });
    });
});

// add employee(s) to training program
router.post('/add_employees', (req, res) => {
    const { employee_ids = [], training_program_id } = req.body;
    if (employee_ids.length === 0) {
        const deleteQuery = "DELETE FROM employee_training_program WHERE training_program_id = ?";
        con.query(deleteQuery, [training_program_id], (deleteErr, deleteResult) => {
            if (deleteErr) {
                console.error("Error removing existing employees from training program:", deleteErr);
                return res.status(500).json({ Status: false, Error: "Query Error" });
            }
            return res.status(201).json({ Status: true, Result: { message: "Employee removed successfully." } });
        });
    } else {
        const deleteQuery = "DELETE FROM employee_training_program WHERE training_program_id = ?";
        con.query(deleteQuery, [training_program_id], (deleteErr, deleteResult) => {
            if (deleteErr) {
                console.error("Error removing existing employees from training program:", deleteErr);
                return res.status(500).json({ Status: false, Error: "Query Error" });
            }
            const insertQuery = "INSERT INTO employee_training_program (employee_id, training_program_id) VALUES ?";
            const values = employee_ids.map(id => [id, training_program_id]);
            con.query(insertQuery, [values], (insertErr, insertResult) => {
                if (insertErr) {
                    console.error("Error adding employees to training program:", insertErr);
                    return res.status(500).json({ Status: false, Error: "Query Error" });
                }
                const selectQuery = "SELECT name FROM training_program WHERE id = ?";
                con.query(selectQuery, [training_program_id], (selectErr, selectResult) => {
                    if (selectErr) {
                        console.error("Error retrieving training program name:", selectErr);
                        return res.status(500).json({ Status: false, Error: "Query Error" });
                    }
                    const program_name = selectResult[0].name;
                    const notificationPromises = employee_ids.map(employee_id => {
                        const notificationMessage = `You have been added to training program "${program_name}".`;
                        const notificationInsertQuery = "INSERT INTO notifications (title, message, type, date, employee_id) VALUES (?, ?, 'training', NOW(), ?)";
                        return new Promise((resolve, reject) => {
                            con.query(notificationInsertQuery, ["Training Program Added", notificationMessage, employee_id], (notificationErr, notificationResult) => {
                                if (notificationErr) {
                                    console.error("Error adding notification for employee:", notificationErr);
                                    reject(notificationErr);
                                } else {
                                    resolve();
                                }
                            });
                        });
                    });

                    Promise.all(notificationPromises)
                        .then(() => {
                            return res.status(201).json({ Status: true, Result: { employee_ids, program_name } });
                        })
                        .catch(err => {
                            return res.status(500).json({ Status: false, Error: "Error sending notifications" });
                        });
                });
            });
        });
    }
});


// load employee(s) from training program
router.get('/:id/employees', (req, res) => {
    const training_program_id = req.params.id;
    const sql = "SELECT employee_id FROM employee_training_program WHERE training_program_id = ?";
    con.query(sql, [training_program_id], (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" });
        const employeeIds = result.map(row => row.employee_id);
        return res.json({ Status: true, EmployeeIds: employeeIds });
    });
});

// remove employee(s) from training program
router.delete('/remove_employee/:training_program_id', (req, res) => {
    const { training_program_id } = req.params;
    const { employee_ids } = req.body;
    if (!employee_ids || !Array.isArray(employee_ids) || employee_ids.length === 0) {
        return res.status(422).json({ Status: false, Error: "No employee selected." });
    }
    const deleteQuery = "DELETE FROM employee_training_program WHERE training_program_id = ? AND employee_id IN (?)";
    con.query(deleteQuery, [training_program_id, employee_ids], (err, result) => {
        if (err) return res.status(500).json({ Status: false, Error: "Query Error: " + err });
        if (result.affectedRows === 0) {
            return res.status(422).json({ Status: false, Error: "Employee(s) do not exist in this training program." });
        }
        return res.status(200).json({ Status: true, Result: "Employee(s) removed successfully." });
    });
});

export default router;