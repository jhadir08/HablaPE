import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const manifest = JSON.parse(
  await readFile(resolve(root, "corpus", "manifest.json"), "utf8"),
);
const chunks = JSON.parse(
  await readFile(resolve(root, "corpus", "chunks.json"), "utf8"),
);

let failures = 0;

for (const document of manifest.documents) {
  try {
    const bytes = await readFile(resolve(root, document.local_path));
    const actual = createHash("sha256").update(bytes).digest("hex");
    if (actual !== document.sha256) {
      console.error(`HASH_MISMATCH ${document.id}`);
      failures += 1;
    } else {
      console.log(`OK ${document.id} ${bytes.length} bytes`);
    }
  } catch (error) {
    console.error(`MISSING ${document.id}: ${error.message}`);
    failures += 1;
  }
}

const documentIds = new Set(manifest.documents.map((document) => document.id));
for (const chunk of chunks.chunks) {
  if (!documentIds.has(chunk.document_id)) {
    console.error(`ORPHAN_CHUNK ${chunk.id}`);
    failures += 1;
  }
  if (chunk.is_synthetic !== false) {
    console.error(`INVALID_SOURCE_FLAG ${chunk.id}`);
    failures += 1;
  }
}

console.log(
  `Validated ${manifest.documents.length} documents and ${chunks.chunks.length} chunks.`,
);
process.exitCode = failures ? 1 : 0;

