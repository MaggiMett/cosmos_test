const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;

export interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
}

export function parseVersion(version: string): ParsedVersion | null {
  const match = SEMVER_PATTERN.exec(version);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    ...(match[4] ? { prerelease: match[4] } : {}),
  };
}

export function assertVersion(version: string, label = "version"): void {
  if (!parseVersion(version)) {
    throw new Error(`${label} must be a semantic version, received "${version}".`);
  }
}

export function compareVersions(left: string, right: string): number {
  const parsedLeft = parseVersion(left);
  const parsedRight = parseVersion(right);
  if (!parsedLeft || !parsedRight) {
    throw new Error(`Cannot compare invalid semantic versions "${left}" and "${right}".`);
  }

  for (const key of ["major", "minor", "patch"] as const) {
    const difference = parsedLeft[key] - parsedRight[key];
    if (difference !== 0) return Math.sign(difference);
  }

  if (parsedLeft.prerelease === parsedRight.prerelease) return 0;
  if (!parsedLeft.prerelease) return 1;
  if (!parsedRight.prerelease) return -1;
  return parsedLeft.prerelease.localeCompare(parsedRight.prerelease);
}

export function satisfiesVersionRange(version: string, range: string): boolean {
  const parsed = parseVersion(version);
  if (!parsed) return false;
  const normalized = range.trim();
  if (normalized === "*" || normalized.toLowerCase() === "latest") return true;

  if (normalized.startsWith("^")) {
    const minimum = parseVersion(normalized.slice(1));
    if (!minimum) return false;
    if (compareVersions(version, normalized.slice(1)) < 0) return false;
    if (minimum.major > 0) return parsed.major === minimum.major;
    if (minimum.minor > 0) {
      return parsed.major === 0 && parsed.minor === minimum.minor;
    }
    return parsed.major === 0 && parsed.minor === 0 && parsed.patch === minimum.patch;
  }

  if (normalized.startsWith("~")) {
    const minimum = parseVersion(normalized.slice(1));
    if (!minimum) return false;
    return (
      compareVersions(version, normalized.slice(1)) >= 0 &&
      parsed.major === minimum.major &&
      parsed.minor === minimum.minor
    );
  }

  return compareVersions(version, normalized) === 0;
}
