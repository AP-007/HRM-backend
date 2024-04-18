import express from "express";
import con from "../utils/db.js";
import departmentRoutes from "./admin/departmentRoutes.js";
import positionRoutes from "./admin/positionRoutes.js";
import employeeRoutes from "./admin/employeeRoutes.js";
import benefitRoutes from "./admin/benefitRoutes.js";
import payrollRoutes from "./admin/payrollRoutes.js";
import timeTrackingRoutes from "./admin/timeTrackingRoutes.js";
import trainingProgramRoutes from "./admin/trainingProgramRoutes.js";
import leaveApprovalRoutes from "./admin/leaveApprovalRoutes.js";
import loginRoutes from "./admin/loginRoutes.js";
import dashboardRoutes from "./admin/dashboardRoutes.js";

const router = express.Router();

router.use('/login', loginRoutes);
router.use('/departments', departmentRoutes);
router.use('/positions', positionRoutes);
router.use('/employees', employeeRoutes);
router.use('/benefits', benefitRoutes);
router.use('/payrolls', payrollRoutes);
router.use('/time_trackings', timeTrackingRoutes);
router.use('/training_programs', trainingProgramRoutes);
router.use('/leave_approval', leaveApprovalRoutes);
router.use('/dashboard', dashboardRoutes);

router.get('/logout', (req, res) => {
    res.clearCookie('token')
    return res.json({ Status: true })
})

export { router as adminRouter };