import express from "express";
import con from "../../utils/db.js";

const router = express.Router();

router.post("/", (req, res) => {
    if (!req.body.email || !req.body.password) {
        return res.status(422).json({ loginStatus: false, Error: "Email and password are required" });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(req.body.email)) {
        return res.status(422).json({ loginStatus: false, Error: "Please enter a valid email address" });
    }

    const sql = "SELECT id, name, email from admin Where email = ? and password = ?";
    con.query(sql, [req.body.email, req.body.password], (err, result) => {
        if (err) return res.status(500).json({ loginStatus: false, Error: "Query error" });
        if (result.length > 0) {
            const user = {
                id: result[0].id,
                name: result[0].name,
                email: result[0].email
            };
            const token = jwt.sign({ role: "admin", email: user.email, id: user.id },
                "jwt_secret_key", { expiresIn: "1d" }
            );
            res.cookie('token', token);
            return res.json({ loginStatus: true, token: token, user: user });
        } else {
            return res.status(422).json({ loginStatus: false, Error: "Wrong email or password" });
        }
    });
});

export default router;