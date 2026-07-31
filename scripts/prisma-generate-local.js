const { existsSync, readdirSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { spawnSync } = require('node:child_process');

const projectRoot = resolve(__dirname, '..');
const enginesDirectory = join(projectRoot, 'node_modules', '@prisma', 'engines');
const prismaCli = join(projectRoot, 'node_modules', 'prisma', 'build', 'index.js');

function findEngine(files, patterns) {
    return files.find((file) => patterns.some((pattern) => pattern.test(file)));
}

function discoverLocalEngines() {
    if (!existsSync(enginesDirectory)) {
        return {};
    }

    const files = readdirSync(enginesDirectory, { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name)
        .filter((file) => !/\.(?:gz|sha256)$/i.test(file));

    const queryEngine = findEngine(files, [
        /^query_engine.*\.dll\.node$/i,
        /^libquery_engine.*\.(?:so|dylib)\.node$/i,
    ]);
    const schemaEngine = findEngine(files, [
        /^schema-engine.*\.exe$/i,
        /^schema-engine-[^.]+(?:\.[^.]+)*$/i,
    ]);

    return {
        queryEngine: queryEngine ? join(enginesDirectory, queryEngine) : undefined,
        schemaEngine: schemaEngine ? join(enginesDirectory, schemaEngine) : undefined,
    };
}

if (!existsSync(prismaCli)) {
    console.error('[prisma-generate] Local Prisma CLI is missing. Run npm install/npm ci first.');
    process.exit(1);
}

const env = { ...process.env };
const { queryEngine, schemaEngine } = discoverLocalEngines();

if (queryEngine) {
    env.PRISMA_QUERY_ENGINE_LIBRARY = queryEngine;
    console.log(`[prisma-generate] Using local query engine: ${queryEngine}`);
} else {
    delete env.PRISMA_QUERY_ENGINE_LIBRARY;
    console.warn('[prisma-generate] Local query engine not found; Prisma will use its standard engine resolution.');
}

if (schemaEngine) {
    env.PRISMA_SCHEMA_ENGINE_BINARY = schemaEngine;
    console.log(`[prisma-generate] Using local schema engine: ${schemaEngine}`);
} else {
    delete env.PRISMA_SCHEMA_ENGINE_BINARY;
    console.warn('[prisma-generate] Local schema engine not found; Prisma will use its standard engine resolution.');
}

const result = spawnSync(process.execPath, [prismaCli, 'generate'], {
    cwd: projectRoot,
    env,
    stdio: 'inherit',
});

if (result.error) {
    console.error(`[prisma-generate] Could not start Prisma CLI: ${result.error.message}`);
    process.exit(1);
}

if (result.status !== 0) {
    console.error(`[prisma-generate] Prisma generate failed with exit code ${result.status ?? 'unknown'}.`);
    process.exit(result.status || 1);
}

console.log('[prisma-generate] Prisma Client generated successfully.');
