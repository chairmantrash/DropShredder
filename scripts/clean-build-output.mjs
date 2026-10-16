import fs from 'node:fs/promises';
import path from 'node:path';
// WXT can retain obsolete hashed chunks across local production rebuilds.
// Remove only this repository's derived Chrome production directory.
await fs.rm(path.resolve(import.meta.dirname,'../.output/chrome-mv3'),{recursive:true,force:true});
