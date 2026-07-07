import fs from "fs";
import path from "path";

export function getFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...getFiles(fullPath));
    } else if (entry.name.endsWith(".js") || entry.name.endsWith(".ts")) {
      if (entry.name.endsWith(".d.ts")) continue;
      files.push(fullPath);
    }
  }

  return files;
}
