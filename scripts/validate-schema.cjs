#!/usr/bin/env node
/* Validate front matter against JSON Schema + (optional) body step formatting */
const fs = require("fs");
const path = require("path");
const fg = require("fast-glob");
const matter = require("gray-matter");
const Ajv = require("ajv/dist/2020");
const addFormats = require("ajv-formats");

const ROOT = process.cwd();
const SCHEMA_PATH = path.join(ROOT, "schema", "testcase.schema.json");

// --- Helpers ---
function fail(msg) {
    console.error(msg);
    process.exitCode = 1;
}

function printAjvErrors(file, errors) {
    console.error(`${file} - Front matter schema errors:`);
    for (const err of errors) {
        const where = err.instancePath || "(root)";
        const extra =
            err.params && err.params.additionalProperty
                ? ` [additionalProperty=${err.params.additionalProperty}]`
                : "";
        console.error(`  ${where} ${err.message}${extra}`);
    }
}

// Body step rules (optional):
// - Steps may appear in markdown body as numbered items: `1. ...`
// - Each such step must be immediately followed by `**Expected:** ...`
function validateBodySteps(filePath, body, { requireSteps = false } = {}) {
    const lines = body.split(/\r?\n/);
    let stepCount = 0;
    let errorCount = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Match lines like "1. Do thing" or "12. Do thing"
        const stepMatch = line.match(/^\s*\d+\.\s+\S/);
        if (stepMatch) {
            stepCount++;
            const next = lines[i + 1] || "";
            const expectedMatch = next.match(/^\s*\*\*Expected:\*\*\s+\S/);
            if (!expectedMatch) {
                console.error(
                    `${filePath}:${i + 1} - Step is not followed by "**Expected:** ..." on the next line`
                );
                errorCount++;
            }
        }
    }

    if (requireSteps && stepCount === 0) {
        console.error(`${filePath} - No numbered steps found (e.g., "1. ...")`);
        errorCount++;
    }

    return errorCount === 0;
}

// Filename should equal id or start with it
function validateFilenameMatchesId(filePath, id) {
    const base = path.basename(filePath, path.extname(filePath));
    if (base !== id && !base.startsWith(id + "-")) {
        console.error(
            `${filePath} - Filename should equal the id or start with it (expected starts with "${id}")`
        );
        return false;
    }
    return true;
}

// Validate numbered YAML steps in front matter: [{ "1": "Action", (expected?: string) }, ...]
function checkSequentialYamlSteps(filePath, steps) {
    if (!Array.isArray(steps)) return true; // nothing to check

    const nums = [];
    for (const s of steps) {
        if (typeof s !== "object" || !s) {
            console.error(`${filePath} - Each entry in "steps" must be an object`);
            return false;
        }
        const keys = Object.keys(s).filter((k) => /^\d+$/.test(k));
        if (keys.length !== 1) {
            console.error(`${filePath} - Each step must have exactly one numeric key (e.g., "1")`);
            return false;
        }
        const n = Number(keys[0]);
        nums.push(n);

        const action = s[keys[0]];
        if (typeof action !== "string" || !action.trim()) {
            console.error(`${filePath} - Each step's numeric key must map to a non-empty action`);
            return false;
        }

        // expected is OPTIONAL; if present, it must be a non-empty string
        if (Object.prototype.hasOwnProperty.call(s, "expected")) {
            if (typeof s.expected !== "string" || !s.expected.trim()) {
                console.error(`${filePath} - If present, "expected" must be a non-empty string`);
                return false;
            }
        }
    }

    // Check 1..n sequence (no gaps/dupes)
    nums.sort((a, b) => a - b);
    for (let i = 0; i < nums.length; i++) {
        if (nums[i] !== i + 1) {
            console.error(
                `${filePath} - Step numbers must be sequential starting at 1 (found ${nums.join(", ")})`
            );
            return false;
        }
    }
    return true;
}

(async function main() {
    // Load schema
    const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);
    const validate = ajv.compile(schema);

    // Find all Markdown test cases
    const files = await fg(["test-cases/**/*.md"], { dot: false });

    for (const file of files) {
        const raw = fs.readFileSync(file, "utf8");
        const fm = matter(raw);
        const data = fm.data;

        // Front matter schema validation
        const ok = validate(data);
        if (!ok) {
            printAjvErrors(file, validate.errors || []);
            process.exitCode = 1;
            continue;
        }

        // 1) id vs filename
        if (typeof data.id === "string") {
            if (!validateFilenameMatchesId(file, data.id)) {
                process.exitCode = 1;
            }
        }

        // 2) numbered YAML steps (front matter) sequential & well-formed (if present)
        if (data.steps) {
            if (!checkSequentialYamlSteps(file, data.steps)) {
                process.exitCode = 1;
            }
        }

        // 3) OPTIONAL body formatting (only enforced if you actually put numbered steps in the body)
        const bodyOk = validateBodySteps(file, fm.content, { requireSteps: false });
        if (!bodyOk) {
            process.exitCode = 1;
        }
    }

    if (process.exitCode && process.exitCode !== 0) {
        process.exit(process.exitCode);
    } else {
        console.log("All test cases passed validation.");
    }
})();
