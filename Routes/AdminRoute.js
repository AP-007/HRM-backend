import express from "express";
import con from "../utils/db.js";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt'
import multer from "multer";
import path from "path";
import departmentRoutes from "./admin/departmentRoutes.js";
import positionRoutes from "./admin/positionRoutes.js";
import employeeRoutes from "./admin/employeeRoutes.js";
import benefitRoutes from "./admin/benefitRoutes.js";
import payrollRoutes from "./admin/payrollRoutes.js";
import timeTrackingRoutes from "./admin/timeTrackingRoutes.js";
import trainingProgramRoutes from "./admin/trainingProgramRoutes.js";
import loginRoutes from "./admin/loginRoutes.js";

const router = express.Router();

router.use('/login', loginRoutes);
router.use('/departments', departmentRoutes);
router.use('/positions', positionRoutes);
router.use('/employees', employeeRoutes);
router.use('/benefits', benefitRoutes);
router.use('/payrolls', payrollRoutes);
router.use('/time_trackings', timeTrackingRoutes);
router.use('/training_programs', trainingProgramRoutes);

// route for admin count
router.get('/admin_count', (req, res) => {
    const sql = "select count(id) as admin from admin";
    con.query(sql, (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" + err })
        return res.json({ Status: true, Result: result })
    })
})

router.get('/employee_count', (req, res) => {
    const sql = "select count(id) as employee from employee";
    con.query(sql, (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" + err })
        return res.json({ Status: true, Result: result })
    })
})

router.get('/salary_count', (req, res) => {
    const sql = "SELECT SUM(position.salary) AS totalSalary FROM employee JOIN position ON employee.position_id = position.id";
    con.query(sql, (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" + err });
        return res.json({ Status: true, Result: result });
    });
});

router.get('/admin_records', (req, res) => {
    const sql = "select * from admin"
    con.query(sql, (err, result) => {
        if (err) return res.json({ Status: false, Error: "Query Error" + err })
        return res.json({ Status: true, Result: result })
    })
})

router.get('/logout', (req, res) => {
    res.clearCookie('token')
    return res.json({ Status: true })
})

export { router as adminRouter };