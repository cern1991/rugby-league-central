// build-squads-2026.js
// Build Super League 2026 squads from base structure + flat players list.

const fs = require("fs");
const path = require("path");

// 1. Jersey number -> position mapping
const numberToPosition = {
  1: "Fullback",
  2: "Wing",
  3: "Centre",
  4: "Centre",
  5: "Wing",
  6: "Stand-off",
  7: "Scrum-half",
  8: "Prop",
  9: "Hooker",
  10: "Prop",
  11: "Second-row",
  12: "Second-row",
  13: "Loose forward",
  14: "Interchange",
  15: "Interchange",
  16: "Interchange",
  17: "Interchange",
};

function inferPosition(number) {
  if (numberToPosition[number]) return numberToPosition[number];
  return ""; // leave blank for higher squad numbers
}

// 2. Paths
const baseFile = path.join(__dirname, "superleague-2026-squads.base.json");
const inputFile = path.join(__dirname, "input-players.json");
const outputFile = path.join(__dirname, "superleague-2026-squads.json");

function loadJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

const baseData = loadJson(baseFile);
const inputPlayers = loadJson(inputFile);

if (!baseData || !baseData.teams) {
  throw new Error("Base file is missing 'teams' object.");
}
if (!Array.isArray(inputPlayers)) {
  throw new Error("input-players.json must be an array.");
}

// 3. Populate squads
for (const row of inputPlayers) {
  const { teamCode, number, name } = row;

  if (!teamCode || !baseData.teams[teamCode]) {
    console.warn(`Warning: Unknown or missing teamCode '${teamCode}' for player '${name}'. Skipping.`);
    continue;
  }
  if (!number || !name) {
    console.warn(`Warning: Missing number or name in row: ${JSON.stringify(row)}`);
    continue;
  }

  const team = baseData.teams[teamCode];

  const existing = team.players.find((p) => p.number === Number(number));
  if (existing) {
    console.warn(
      `Warning: Duplicate number ${number} in team ${teamCode}. Existing '${existing.name}', new '${name}'. Skipping.`,
    );
    continue;
  }

  team.players.push({
    number: Number(number),
    name,
    position: inferPosition(Number(number)),
  });
}

// 4. Sort players within each team
for (const code of Object.keys(baseData.teams)) {
  baseData.teams[code].players.sort((a, b) => a.number - b.number);
}

// 5. Save result
fs.writeFileSync(outputFile, JSON.stringify(baseData, null, 2), "utf8");
console.log(`Done! Wrote ${outputFile}`);
