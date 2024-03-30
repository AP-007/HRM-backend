import express from 'express'
import con from "../utils/db.js";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt'

const router = express.Router()

router.post("/employee_login", (req, res) => {
    const sql = "SELECT * from employee Where email = ?";
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

  router.get('/detail/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM employee where id = ?"
    con.query(sql, [id], (err, result) => {
        if(err) return res.json({Status: false});
        return res.json(result)
    })
  })

  // Function to check in an employee
  router.post('/check_in', (req, res) => {
    const { employee_id } = req.body;
    const currentDate = new Date().toISOString().split('T')[0];

    const checkInQuery = "SELECT * FROM time_trackings WHERE employee_id = ? AND date = ?";
    con.query(checkInQuery, [employee_id, currentDate], (checkInErr, checkInResult) => {
        if (checkInErr) {
            console.error("Error checking check-in status:", checkInErr);
            return res.status(500).json({ Status: false, Error: "Query Error" });
        }

        if (checkInResult.length > 0) {
            return res.status(400).json({ Status: false, Error: "Employee has already checked in for today." });
        }

        const checkInSql = "INSERT INTO time_trackings (date, time_in, employee_id) VALUES (?, ?, ?)";
        const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });
        const values = [currentDate, currentTime, employee_id];
        con.query(checkInSql, values, (insertErr, insertResult) => {
            if (insertErr) {
                console.error("Error inserting check-in data:", insertErr);
                return res.status(500).json({ Status: false, Error: "Query Error" });
            }
            return res.status(201).json({ Status: true, Message: "Checked in successfully." });
        });
    });
  });

  // Function to get total work hours of an employee for the current month
  router.get('/work_hours_monthly/:id', (req, res) => {
    const id = req.params.id;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;

    const sql = "SELECT SUM(work_hour) AS total_work_hours FROM time_trackings WHERE employee_id = ? AND MONTH(date) = ?";
    con.query(sql, [id, currentMonth], (err, result) => {
        if (err) {
            console.error("Error fetching total work hours:", err);
            return res.status(500).json({ Status: false, Error: "Query Error" });
        }
        const totalWorkHours = result[0].total_work_hours || 0;
        return res.status(200).json({ Status: true, Total_Work_Hours_Monthly: totalWorkHours });
    });
  });

  // Function to get total work hours of an employee overall
  router.get('/work_hours_overall/:id', (req, res) => {
    const id = req.params.id;

    const sql = "SELECT SUM(work_hour) AS total_work_hours FROM time_trackings WHERE employee_id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error fetching total work hours:", err);
            return res.status(500).json({ Status: false, Error: "Query Error" });
        }
        const totalWorkHours = result[0].total_work_hours || 0;
        return res.status(200).json({ Status: true, Total_Work_Hours_Overall: totalWorkHours });
    });
  });

  router.get('/logout', (req, res) => {
    res.clearCookie('token')
    return res.json({Status: true})
  })

  export {router as EmployeeRouter}