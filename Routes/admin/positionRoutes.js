import express from "express";
import con from "../../utils/db.js";

const router = express.Router();

// Route for Position
router.get('/', (req, res) => {
    const sql = "SELECT * FROM position";
    con.query(sql, (err, result) => {
        if (err) return res.status(500).json({ Status: false, Error: "Query Error" });
        return res.status(200).json({ Status: true, Result: result });
    });
});

router.post('/create', (req, res) => {
    const { title, salary, responsibilities, department_id } = req.body;
    const errors = [];

    if (!title) {
        errors.push("Title field is required");
    }
    if (!salary) {
        errors.push("Salary field is required");
    }
    if (!responsibilities) {
        errors.push("Responsibilities field is required");
    }
    if (!department_id) {
        errors.push("Department field is required");
    }
    if (errors.length > 0) {
        return res.status(422).json({ Status: false, Errors: errors });
    }

    const sql = "INSERT INTO `position` (title, salary, responsibilities, department_id) VALUES (?, ?, ?, ?)";
    const responsibilitiesJson = JSON.stringify(responsibilities)
    const values = [
        title,
        salary,
        responsibilitiesJson,
        department_id
    ];
    con.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error inserting data:", err);
            return res.status(500).json({ Status: false, Error: "Query Error" });
        }
        return res.status(201).json({ Status: true, Result: { id: result.insertId, title, salary, responsibilities } });
    });
});

router.get('/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM position WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ Status: false, Error: "Query Error" });
        if (result.length === 0) {
            return res.status(422).json({ Status: false, Error: "Position ID not found" });
        }
        return res.status(200).json({ Status: true, Result: result });
    });
});

router.put('/update/:id', (req, res) => {
    const id = req.params.id;
    const { title, salary, responsibilities, department_id } = req.body;
    const errors = [];
    if (!title) {
        errors.push("Title field is required");
    }
    if (!salary) {
        errors.push("Salary field is required");
    }
    if (!responsibilities) {
        errors.push("Responsibilities field is required");
    }
    if (!department_id) {
        errors.push("Department field is required");
    }
    if (errors.length > 0) {
        return res.status(422).json({ Status: false, Errors: errors });
    }
    const sql = `UPDATE position
        SET title = ?, salary = ?, responsibilities = ?, department_id = ?
        WHERE id = ?`;
    const values = [
        title,
        salary,
        JSON.stringify(responsibilities),
        department_id,
        id
    ];
    con.query(sql, values, (err, result) => {
        if (err) {
            return res.status(500).json({ Status: false, Error: "Query Error: " + err });
        }
        if (result.affectedRows === 0) {
            return res.status(422).json({ Status: false, Error: "Position ID not found" });
        }
        const updatedSql = "SELECT * FROM position WHERE id = ?";
        con.query(updatedSql, [id], (err, updatedResult) => {
            if (err) {
                return res.status(500).json({ Status: false, Error: "Query Error" + err });
            }
            const updatedPosition = updatedResult[0];
            return res.status(200).json({ Status: true, Position: updatedPosition });
        });
    });
});

router.delete('/delete/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM position WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ Status: false, Error: "Query Error" + err });
        if (result.affectedRows === 0) {
            return res.status(422).json({ Status: false, Error: "Position ID not found" });
        }
        return res.status(200).json({ Status: true, Result: "Position deleted successfully." });
    });
});

export default router;