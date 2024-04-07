import express from "express";
import con from "../../utils/db.js";

const router = express.Router();

// Route for Benefits
router.get('/', (req, res) => {
    const sql = "SELECT * FROM benefits";
    con.query(sql, (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" });
        return res.json({ Status: true, Result: result });
    });
});

router.post('/create', (req, res) => {
    const { health_insurance, retirement_plan, employee_id } = req.body;
    if (!health_insurance) {
        return res.status(400).json({ Status: false, Error: "Health Insurance is required" });
    }
    if (!employee_id) {
        return res.status(400).json({ Status: false, Error: "Associate employee is required" });
    }

    const sql = "INSERT INTO benefits (health_insurance, retirement_plan, employee_id) VALUES (?, ?, ?)";
    const retirementPlanJson = JSON.stringify(retirement_plan);
    const values = [
        health_insurance,
        retirementPlanJson,
        employee_id
    ];
    con.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error inserting data:", err);
            return res.status(500).json({ Status: false, Error: "Query Error" });
        }
        return res.status(201).json({ Status: true, Result: { id: result.insertId, health_insurance, retirement_plan, employee_id } });
    });
});

router.get('/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM benefits WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" });
        if (result.length === 0) {
            return res.status(422).json({ Status: false, Error: "Benefit ID not found" });
        }
        return res.json({ Status: true, Result: result });
    });
});

router.put('/update/:id', (req, res) => {
    const id = req.params.id;
    const { health_insurance, retirement_plan, employee_id } = req.body;
    if (!health_insurance) {
        return res.status(400).json({ Status: false, Error: "Health Insurance is required" });
    }
    if (!employee_id) {
        return res.status(400).json({ Status: false, Error: "Associate employee is required" });
    }

    const sql = `UPDATE benefits
        SET health_insurance = ?, retirement_plan = ?, employee_id = ?
        WHERE id = ?`;
    const values = [
        health_insurance,
        JSON.stringify(retirement_plan),
        employee_id,
        id
    ];
    con.query(sql, values, (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" + err });
        if (result.affectedRows === 0) {
            return res.status(422).json({ Status: false, Error: "Benefit ID not found" });
        }
        return res.json({ Status: true, Result: "Benefit updated successfully." });
    });
});

router.delete('/delete/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM benefits WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" + err });
        if (result.affectedRows === 0) {
            return res.status(422).json({ Status: false, Error: "Benefit ID not found" });
        }
        return res.json({ Status: true, Result: "Benefit deleted successfully." });
    });
});

export default router;