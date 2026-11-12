import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { get } from "../db.js";
const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required." });
    const user = await get("SELECT * FROM users WHERE email = ?", [email.toLowerCase().trim()]);
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: "Incorrect email or password." });
    const payload = { id: user.id, name: user.name, email: user.email, role: user.role, registerNumber: user.register_number };
    const token = jwt.sign(payload, process.env.JWT_SECRET || "development-secret-change-me", { expiresIn: "8h" });
    res.json({ token, user: payload });
  } catch (error) { res.status(500).json({ message: "Unable to sign in." }); }
});
router.get("/me", (req, res) => res.json({ user: req.user }));
export default router;
