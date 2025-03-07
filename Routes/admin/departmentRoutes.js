import express from "express";
import con from "../../utils/db.js";

const router = express.Router();

// Route for Department
// Route for Department
router.get('/', (req, res) => {
    const sql = `
        SELECT dep.*, COUNT(emp.id) AS employeeCount, GROUP_CONCAT(CONCAT_WS('|', emp.id, emp.name, emp.email, emp.salary, emp.position_id) SEPARATOR ';') AS employees
        FROM department dep
        LEFT JOIN employees emp ON dep.id = emp.department_id
        GROUP BY dep.id`;
    con.query(sql, (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" });
        const departmentData = result.map(department => {
            const { id, name, employeeCount, employees } = department;
            return {
                id,
                name,
                employeeCount,
                employees: employees ? employees.split(';').map(employee => {
                    const [id, name, email, salary, position_id] = employee.split('|');
                    return { id, name, email, position_id, salary: parseFloat(salary) };
                }) : []
            };
        });
        return res.json({ Status: true, Result: departmentData });
    });
});

router.post('/create', (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(422).json({ Status: false, Error: "Department name is required" });
    }
    const sql = "INSERT INTO department (name) VALUES (?)";
    con.query(sql, [name], (err, result) => {
        if (err) {
            console.error("Error inserting data:", err);
            return res.status(500).json({ Status: false, Error: "Query Error" });
        }
        return res.status(201).json({ Status: true, Result: { id: result.insertId, name: name } });
    });
});

router.get('/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM department WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ Status: false, Error: "Query Error" });

        if (result.length === 0) {
            return res.status(422).json({ Status: false, Error: "Department ID not found" });
        } else {
            return res.json({ Status: true, Result: result });
        }
    });
});

router.put('/update/:id', (req, res) => {
    const id = req.params.id;
    if (!id) {
        return res.status(422).json({ Status: false, Error: "Department ID is missing" });
    }
    const sql = `UPDATE department
        SET name = ?
        WHERE id = ?`;
    const values = [
        req.body.name,
        id
    ];
    con.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ Status: false, Error: "Query Error" + err });
        if (result.affectedRows === 0) {
            return res.status(422).json({ Status: false, Error: "Department ID not found" });
        }
        const updatedSql = "SELECT * FROM department WHERE id = ?";
        con.query(updatedSql, [id], (err, updatedResult) => {
            if (err) return res.status(500).json({ Status: false, Error: "Query Error" + err });
            const updatedDepartment = updatedResult[0];
            return res.json({ Status: true, Department: updatedDepartment });
        });
    });
});

router.delete('/delete/:id', (req, res) => {
    const id = req.params.id;
    const sql = "delete from department where id = ?"
    con.query(sql, [id], (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" + err })
        if (result.affectedRows === 0) {
            return res.status(422).json({ Status: false, Error: "Department ID not found" });
        }
        return res.json({ Status: true, Result: "Department deleted successfully." })
    })
})

export default router;