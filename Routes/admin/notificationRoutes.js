import express from "express";
import con from "../../utils/db.js";

const router = express.Router();

router.get('/', (req, res) => {
    const sql = "SELECT * FROM notifications WHERE admin_id = ?";
    con.query(sql, ["1"] , (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" });
        return res.json({ Status: true, Result: result });
    });
});

export default router;