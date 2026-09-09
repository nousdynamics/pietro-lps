// _headers e _redirects so valem na raiz do diretorio de assets, mas o Vite
// copia public/ para dentro do outDir. Move os dois um nivel acima.
import { mkdir, rename } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const distRoot = join(root, "dist");
const built = join(distRoot, "criadores-conscientes");

await mkdir(distRoot, { recursive: true });

for (const file of ["_headers", "_redirects"]) {
  await rename(join(built, file), join(distRoot, file));
  console.log(`postbuild: ${file} -> dist/${file}`);
}
