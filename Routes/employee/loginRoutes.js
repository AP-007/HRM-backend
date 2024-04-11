import express from "express";
import con from "../../utils/db.js";
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/", (req, res) => {
    const sql = "SELECT * from employees Where email = ?";
    con.query(sql, [req.body.email], (err, result) => {
        if (err) return res.json({ loginStatus: false, Error: "Query error" });
        if (result.length > 0) {
        bcrypt.compare(req.body.password, result[0].password, (err, response) => {
            if (err) return res.json({ loginStatus: false, Error: "Wrong Password" });
            if(response) {
                const email = result[0].email;
                const token = jwt.sign(
                    { role: "employee", email: email, id: result[0].id },
                    "jwt_secret_key",
                    { expiresIn: "1d" }
                );
                res.cookie('token', token)
                return res.json({ loginStatus: true, id: result[0].id });
            }
        })
        } else {
            return res.json({ loginStatus: false, Error:"wrong email or password" });
        }
    });
});

export default router;