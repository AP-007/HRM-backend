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
    const { title, salary, responsibilities } = req.body;
    if (!title) {
        return res.status(422).json({ Status: false, Error: "Title field is required" });
    }
    if (!salary) {
        return res.status(422).json({ Status: false, Error: "Salary field is required" });
    }
    if (!responsibilities) {
        return res.status(422).json({ Status: false, Error: "Responsibilities field is required" });
    }
    const sql = "INSERT INTO `position` (title, salary, responsibilities) VALUES (?, ?, ?)";
    const responsibilitiesJson = JSON.stringify(responsibilities)
    const values = [
        title,
        salary,
        responsibilitiesJson
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
    const { title, salary, responsibilities } = req.body;
    if (!id) {
        return res.status(422).json({ Status: false, Error: "Position ID is missing" });
    }
    if (!title) {
        return res.status(422).json({ Status: false, Error: "Title field is required" });
    }
    if (!salary) {
        return res.status(422).json({ Status: false, Error: "Salary field is required" });
    }
    if (!responsibilities) {
        return res.status(422).json({ Status: false, Error: "Responsibilities field is required" });
    }
    const sql = `UPDATE position
        SET title = ?, salary = ?, responsibilities = ?
        WHERE id = ?`;
    const values = [
        title,
        salary,
        JSON.stringify(responsibilities),
        id
    ];
    con.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ Status: false, Error: "Query Error: " + err });
        if (result.affectedRows === 0) {
            return res.status(422).json({ Status: false, Error: "Position ID not found" });
        }
        const updatedSql = "SELECT * FROM position WHERE id = ?";
        con.query(updatedSql, [id], (err, updatedResult) => {
            if (err) return res.status(500).json({ Status: false, Error: "Query Error" + err });
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