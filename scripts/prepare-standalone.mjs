import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();
const standaloneDir = join(root, ".next", "standalone");
const staticSource = join(root, ".next", "static");
const staticTarget = join(standaloneDir, ".next", "static");
const publicSource = join(root, "public");
const publicTarget = join(standaloneDir, "public");

function copyDir(source, target) {
  if (!existsSync(source)) return;
  mkdirSync(dirname(target), { recursive: true });
  cpSync(source, target, { recursive: true, force: true });
}

copyDir(staticSource, staticTarget);
copyDir(publicSource, publicTarget);

console.log("Standalone preparado con assets estáticos.");
