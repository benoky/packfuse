/**
 * Read public npm download counts for a package.
 * Counts are registry downloads, not distinct users.
 *
 *   node scripts/npm-downloads.mjs
 *   node scripts/npm-downloads.mjs packfuse
 */
const name = process.argv[2] ?? "packfuse";
const point = "https://api.npmjs.org/downloads/point";
const range = "https://api.npmjs.org/downloads/range";

async function getJson(url) {
    const response = await fetch(url, { headers: { accept: "application/json" } });
    if (!response.ok) {
        const body = await response.text();
        throw new Error(`${response.status} ${url}\n${body.slice(0, 400)}`);
    }
    return response.json();
}

function printPoint(label, body) {
    console.log(`${label}: ${body.downloads} (${body.start} .. ${body.end})`);
}

const [week, month, daily, versions] = await Promise.all([
    getJson(`${point}/last-week/${encodeURIComponent(name)}`),
    getJson(`${point}/last-month/${encodeURIComponent(name)}`),
    getJson(`${range}/last-month/${encodeURIComponent(name)}`),
    getJson(`https://api.npmjs.org/versions/${encodeURIComponent(name)}/last-week`),
]);

console.log(`package: ${name}`);
console.log("npm download counts are not unique users. CI, mirrors, and repeated installs are included.");
printPoint("last 7 days", week);
printPoint("last 30 days", month);
console.log("daily (last 30 days):");
for (const row of daily.downloads) {
    console.log(`  ${row.day}  ${row.downloads}`);
}
console.log("last 7 days by version:");
const byVersion = versions.downloads ?? {};
const versionsSorted = Object.entries(byVersion).sort((a, b) => b[1] - a[1]);
if (versionsSorted.length === 0) console.log("  (none)");
for (const [version, count] of versionsSorted) {
    console.log(`  ${version}  ${count}`);
}
