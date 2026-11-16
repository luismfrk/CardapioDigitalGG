import bcrypt from "bcryptjs";
import pg from "pg";

const [emailInput, password] = process.argv.slice(2);
const email = String(emailInput || "")
  .trim()
  .toLowerCase();
const connectionString =
  process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (
  !connectionString ||
  !email ||
  !email.includes("@") ||
  password?.length < 8
) {
  console.error(
    "Uso: npm run create-admin:postgres -- email@exemplo.com senha-com-8-ou-mais-caracteres",
  );
  process.exit(1);
}

const client = new pg.Client({ connectionString });
try {
  await client.connect();
  const passwordHash = await bcrypt.hash(password, 12);
  await client.query(
    `INSERT INTO admins (email, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET password_hash=excluded.password_hash`,
    [email, passwordHash],
  );
  console.log(`Administrador ${email} criado/atualizado com segurança.`);
} finally {
  await client.end();
}
