import bcrypt from "bcryptjs";
import { db } from "./db.js";

const [email, password] = process.argv.slice(2);
if (!email || !password || password.length < 8) {
  console.error(
    "Uso: npm run create-admin -- email@exemplo.com senha-com-8-ou-mais-caracteres",
  );
  process.exit(1);
}
db.prepare(
  "INSERT INTO admins (email,password_hash) VALUES (?,?) ON CONFLICT(email) DO UPDATE SET password_hash=excluded.password_hash",
).run(email.toLowerCase(), await bcrypt.hash(password, 12));
console.log(
  `Administrador ${email.toLowerCase()} criado/atualizado com segurança.`,
);
