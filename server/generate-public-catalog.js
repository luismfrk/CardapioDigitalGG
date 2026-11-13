import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db, publicCatalog } from "./db.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(root, "public", "catalog.json");

fs.writeFileSync(target, JSON.stringify(publicCatalog()));
db.close();
console.log(`Catálogo público gerado em ${target}`);
