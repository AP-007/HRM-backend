import express from 'express'
import con from "../utils/db.js";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt'
import leaveRoutes from "./employee/leaveRoutes.js";
import loginRoutes from "./employee/loginRoutes.js";

const router = express.Router()

router.use('/login', loginRoutes);
router.use('/leaves', leaveRoutes);

router.get('/detail/:id', (req, res) => {
  const id = req.params.id;
  const sql = `
    SELECT employees.*, department.name AS department_name
    FROM employees
    INNER JOIN department ON employees.department_id = department.id
    WHERE employees.id = ?
  `;
  con.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error executing SQL query:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    if (result.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }
    return res.json(result[0]);
  });
});



router.get('/time_sheets/:id', (req, res) => {
  const employeeId = req.params.id;
  const sql = `
    SELECT * 
    FROM time_trackings 
    WHERE employee_id = ?
  `;
  con.query(sql, [employeeId], (err, result) => {
    if (err) {
      console.error("Error executing SQL query:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    return res.json(result);
  });
});


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
router.get('/work_hours/monthly/:id', (req, res) => {
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
router.get('/work_hours/overall/:id', (req, res) => {
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