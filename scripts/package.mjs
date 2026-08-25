import { spawnSync } from "node:child_process";
import {
  copyFile,
  mkdir,
  readFile,
  rm,
  stat,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const releaseRoot = path.join(projectRoot, "release");

const packageJson = JSON.parse(
  await readFile(path.join(projectRoot, "package.json"), "utf8"),
);

const version = packageJson.version;

if (
  typeof version !== "string" ||
  !/^\d+\.\d+\.\d+(?:\.\d+)?$/.test(version)
) {
  throw new Error("package.json contains an invalid Chrome extension version.");
}

const releaseName = `typegremlin-${version}`;
const stagingDirectory = path.join(releaseRoot, releaseName);
const archivePath = path.join(releaseRoot, `${releaseName}.zip`);

function assertSafeReleaseTarget(targetPath) {
  const relativePath = path.relative(releaseRoot, targetPath);

  if (
    relativePath.length === 0 ||
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error(`Unsafe release target: ${targetPath}`);
  }
}

assertSafeReleaseTarget(stagingDirectory);
assertSafeReleaseTarget(archivePath);

const runtimeFiles = [
  "manifest.json",
  "favicon.png",
  "privacy.html",
  "dist/background.js",
  "dist/content.js",
  "dist/options.js",
  "icons/icon16.png",
  "icons/icon32.png",
  "icons/icon48.png",
  "icons/icon128.png",
  "options/options.html",
  "options/options.css",
];

await mkdir(releaseRoot, { recursive: true });
await rm(stagingDirectory, { recursive: true, force: true });
await rm(archivePath, { force: true });
await mkdir(stagingDirectory, { recursive: true });

for (const relativeFilePath of runtimeFiles) {
  const sourcePath = path.join(projectRoot, relativeFilePath);
  const destinationPath = path.join(stagingDirectory, relativeFilePath);
  const sourceStats = await stat(sourcePath).catch(() => null);

  if (!sourceStats?.isFile()) {
    throw new Error(`Required runtime file is missing: ${relativeFilePath}`);
  }

  await mkdir(path.dirname(destinationPath), { recursive: true });
  await copyFile(sourcePath, destinationPath);
}

const stagedManifest = JSON.parse(
  await readFile(path.join(stagingDirectory, "manifest.json"), "utf8"),
);

if (stagedManifest.version !== version) {
  throw new Error(
    `Version mismatch: package.json is ${version}, but manifest.json is ${stagedManifest.version}.`,
  );
}

const manifestRuntimePaths = [
  stagedManifest.options_page,
  stagedManifest.background?.service_worker,
  ...(stagedManifest.content_scripts ?? []).flatMap(
    (contentScript) => contentScript.js ?? [],
  ),
  ...Object.values(stagedManifest.icons ?? {}),
  ...Object.values(stagedManifest.action?.default_icon ?? {}),
];

for (const manifestRuntimePath of manifestRuntimePaths) {
  if (typeof manifestRuntimePath !== "string") {
    throw new Error("manifest.json contains an invalid runtime file path.");
  }

  const referencedPath = path.join(stagingDirectory, manifestRuntimePath);
  const referencedStats = await stat(referencedPath).catch(() => null);

  if (!referencedStats?.isFile()) {
    throw new Error(
      `Manifest runtime file is missing from the package: ${manifestRuntimePath}`,
    );
  }
}

const archiveInputs = [
  "manifest.json",
  "favicon.png",
  "privacy.html",
  "dist",
  "icons",
  "options",
];

const archiveResult = spawnSync(
  "tar",
  [
    "-a",
    "-c",
    "-f",
    archivePath,
    "-C",
    stagingDirectory,
    ...archiveInputs,
  ],
  { encoding: "utf8" },
);

if (archiveResult.status !== 0) {
  throw new Error(
    archiveResult.stderr.trim() || "The release ZIP could not be created.",
  );
}

const archiveListResult = spawnSync("tar", ["-t", "-f", archivePath], {
  encoding: "utf8",
});

if (archiveListResult.status !== 0) {
  throw new Error(
    archiveListResult.stderr.trim() || "The release ZIP could not be inspected.",
  );
}

const archiveEntries = archiveListResult.stdout
  .split(/\r?\n/)
  .filter(Boolean)
  .map((entry) => entry.replaceAll("\\", "/"));

if (!archiveEntries.includes("manifest.json")) {
  throw new Error("The release ZIP does not contain manifest.json at its root.");
}

const disallowedEntry = archiveEntries.find(
  (entry) =>
    entry.endsWith(".ts") ||
    entry.endsWith(".map") ||
    entry.startsWith("node_modules/") ||
    entry.startsWith("scripts/"),
);

if (disallowedEntry) {
  throw new Error(`Development file found in release ZIP: ${disallowedEntry}`);
}

console.log(`Created ${path.relative(projectRoot, archivePath)}`);
console.log(`Staged ${runtimeFiles.length} runtime files in ${releaseName}`);
