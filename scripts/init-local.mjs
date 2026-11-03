import { randomBytes } from "node:crypto";
import { writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const path = fileURLToPath(new URL("../.env", import.meta.url));
if (existsSync(path)) {
  console.log("Local .env already exists; preserved without changes.");
} else {
  const admin = randomBytes(32).toString("hex");
  const runtime = randomBytes(32).toString("hex");
  const migrator = randomBytes(32).toString("hex");
  const runtimeUrl = `postgresql+psycopg://avitopulse_runtime:${runtime}@127.0.0.1:55432/avitopulse`;
  const lines = [
    "# Generated locally; never commit or share this file.",
    `POSTGRES_PASSWORD=${admin}`,
    `AVITOPULSE_RUNTIME_PASSWORD=${runtime}`,
    `AVITOPULSE_MIGRATOR_PASSWORD=${migrator}`,
    "AVITOPULSE_ENVIRONMENT=development",
    `AVITOPULSE_DATABASE_URL=${runtimeUrl}`,
    `AVITOPULSE_MIGRATION_DATABASE_URL=postgresql+psycopg://avitopulse_migrator:${migrator}@127.0.0.1:55432/avitopulse`,
    `AVITOPULSE_TEST_DATABASE_URL=${runtimeUrl}`,
    "",
  ];
  writeFileSync(path, lines.join("\n"), { encoding: "utf8", flag: "wx", mode: 0o600 });
  console.log("Local .env created. Credentials are not printed. Keep it private.");
}
