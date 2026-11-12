import jwt from "jsonwebtoken";
export function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Authentication required." });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "development-secret-change-me");
    next();
  } catch {
    return res.status(401).json({ message: "Session expired. Please sign in again." });
  }
}
export function allowRoles(...roles) {
  return (req, res, next) => roles.includes(req.user.role)
    ? next()
    : res.status(403).json({ message: "You do not have permission to do that." });
}
