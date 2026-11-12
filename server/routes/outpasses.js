import { Router } from "express";
import { all, get, run } from "../db.js";
import { authenticate, allowRoles } from "../middleware/auth.js";
const router = Router();
router.use(authenticate);

async function logActivity(outpassId, action, userId, details = "") {
  await run("INSERT INTO activity_logs(outpass_id,action,performed_by,details) VALUES(?,?,?,?)",
    [outpassId, action, userId, details]);
}
const baseSelect = `SELECT o.*, u.name AS student_name, u.register_number, u.email AS student_email
  FROM outpasses o JOIN users u ON u.id = o.student_id`;

router.get("/", async (req, res) => {
  try {
    const params = [];
    let sql = baseSelect;
    if (req.user.role === "student") { sql += " WHERE o.student_id = ?"; params.push(req.user.id); }
    sql += " ORDER BY o.created_at DESC";
    res.json({ outpasses: await all(sql, params) });
  } catch { res.status(500).json({ message: "Could not load applications." }); }
});
router.post("/", allowRoles("student"), async (req, res) => {
  try {
    const { destination, reason, departure_datetime, expected_return_datetime } = req.body;
    if (![destination, reason, departure_datetime, expected_return_datetime].every(v => String(v || "").trim()))
      return res.status(400).json({ message: "Please complete all fields." });
    if (new Date(expected_return_datetime) <= new Date(departure_datetime))
      return res.status(400).json({ message: "Expected return must be after departure." });
    const result = await run(`INSERT INTO outpasses(student_id,destination,reason,departure_datetime,expected_return_datetime)
      VALUES(?,?,?,?,?)`, [req.user.id, destination.trim(), reason.trim(), departure_datetime, expected_return_datetime]);
    await logActivity(result.id, "Application submitted", req.user.id);
    res.status(201).json({ message: "Outpass application submitted.", id: result.id });
  } catch { res.status(500).json({ message: "Could not submit application." }); }
});
router.patch("/:id/status", allowRoles("warden"), async (req, res) => {
  try {
    const { status, rejection_reason } = req.body;
    const item = await get("SELECT * FROM outpasses WHERE id = ?", [req.params.id]);
    if (!item) return res.status(404).json({ message: "Application not found." });
    const transitions = { Pending: ["Approved", "Rejected"], Approved: ["Outside"], Outside: ["Returned"] };
    if (!transitions[item.status]?.includes(status))
      return res.status(400).json({ message: `Cannot change status from ${item.status} to ${status}.` });
    if (status === "Rejected" && !String(rejection_reason || "").trim())
      return res.status(400).json({ message: "Please provide a reason for rejection." });
    const actual = status === "Returned" ? new Date().toISOString().slice(0,16) : item.actual_return_datetime;
    await run("UPDATE outpasses SET status = ?, rejection_reason = ?, actual_return_datetime = ? WHERE id = ?",
      [status, status === "Rejected" ? rejection_reason.trim() : item.rejection_reason, actual, item.id]);
    await logActivity(item.id, `Status changed to ${status}`, req.user.id, rejection_reason || "");
    res.json({ message: `Application marked ${status.toLowerCase()}.` });
  } catch { res.status(500).json({ message: "Could not update application." }); }
});
router.get("/:id/activity", async (req, res) => {
  try {
    const item = await get("SELECT student_id FROM outpasses WHERE id = ?", [req.params.id]);
    if (!item) return res.status(404).json({ message: "Application not found." });
    if (req.user.role === "student" && item.student_id !== req.user.id)
      return res.status(403).json({ message: "Not allowed." });
    const logs = await all(`SELECT a.*, u.name AS actor_name FROM activity_logs a
      JOIN users u ON u.id = a.performed_by WHERE a.outpass_id = ? ORDER BY a.created_at DESC`, [req.params.id]);
    res.json({ activity: logs });
  } catch { res.status(500).json({ message: "Could not load activity." }); }
});
export default router;
