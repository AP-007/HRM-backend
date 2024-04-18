import express from "express";
import con from "../../utils/db.js";
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/", (req, res) => {
    const sql = "SELECT * FROM employees WHERE email = ?";
    con.query(sql, [req.body.email], (err, result) => {
        if (err) return res.status(500).json({ loginStatus: false, Error: "Query error" });
        if (result.length > 0) {
            bcrypt.compare(req.body.password, result[0].password, (err, response) => {
                if (err) return res.status(500).json({ loginStatus: false, Error: "Error comparing passwords" });
                if (response) {
                    const email = result[0].email;
                    const token = jwt.sign(
                        { role: "employee", email: email, id: result[0].id },
                        "jwt_secret_key",
                        { expiresIn: "1d" }
                    );
                    const employeeData = {
                        id: result[0].id,
                        name: result[0].name,
                        email: result[0].email
                    };
                    res.cookie('token', token, { httpOnly: true });
                    return res.json({ loginStatus: true, token: token, employee: employeeData });
                } else {
                    return res.status(401).json({ loginStatus: false, Error: "Wrong password" });
                }
            });
        } else {
            return res.status(404).json({ loginStatus: false, Error: "Wrong email or password" });
        }
    });
});

export default router;