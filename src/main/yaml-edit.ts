interface YamlPathHit {
  value: string;
  valueStart: number;
  valueEnd: number;
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripYamlQuotes(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

function findSegmentInBlock(
  content: string,
  startAt: number,
  parentIndent: number,
  segment: string,
): {
  indent: number;
  rawValue: string;
  valueStart: number;
  valueEnd: number;
  afterLine: number;
} | null {
  const escapedSegment = escapeRegex(segment);
  let directChildIndent: number | null = null;
  let cursor = startAt;

  while (cursor < content.length) {
    const lineEnd = content.indexOf("\n", cursor);
    const lineEndExclusive = lineEnd === -1 ? content.length : lineEnd;
    const line = content.slice(cursor, lineEndExclusive);
    const trimmed = line.trim();

    if (trimmed === "" || trimmed.startsWith("#")) {
      cursor =
        lineEndExclusive === content.length
          ? content.length
          : lineEndExclusive + 1;
      continue;
    }

    const indent = line.length - line.trimStart().length;
    if (indent <= parentIndent) return null;
    if (directChildIndent === null) directChildIndent = indent;

    if (indent === directChildIndent) {
      const m = line.match(
        new RegExp(
          `^([ \\t]*)(${escapedSegment}):([ \\t]*)([^\\n#]*?)([ \\t]*)(#.*)?$`,
        ),
      );
      if (m) {
        const indentStr = m[1];
        const gapBeforeValue = m[3];
        const rawValue = m[4];
        const keyEnd = cursor + indentStr.length + segment.length + 1;
        const valueStart = keyEnd + gapBeforeValue.length;
        return {
          indent: indentStr.length,
          rawValue,
          valueStart,
          valueEnd: valueStart + rawValue.length,
          afterLine:
            lineEndExclusive === content.length
              ? content.length
              : lineEndExclusive + 1,
        };
      }
    }

    cursor =
      lineEndExclusive === content.length
        ? content.length
        : lineEndExclusive + 1;
  }

  return null;
}

export function findYamlPath(
  content: string,
  dottedPath: string,
): YamlPathHit | null {
  const segments = dottedPath.split(".").filter(Boolean);
  if (segments.length === 0) return null;

  let cursor = 0;
  let parentIndent = -1;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const found = findSegmentInBlock(content, cursor, parentIndent, segment);
    if (!found) return null;

    if (i === segments.length - 1) {
      return {
        value: stripYamlQuotes(found.rawValue),
        valueStart: found.valueStart,
        valueEnd: found.valueEnd,
      };
    }

    cursor = found.afterLine;
    parentIndent = found.indent;
  }

  return null;
}

export function findTopLevelKey(
  content: string,
  key: string,
): YamlPathHit | null {
  const re = new RegExp(
    `^(${escapeRegex(key)}):([ \\t]*)([^\\n#]*?)([ \\t]*)(#.*)?$`,
    "m",
  );
  const m = content.match(re);
  if (!m || m.index === undefined) return null;
  const valueStart = m.index + key.length + 1 + m[2].length;
  return {
    value: stripYamlQuotes(m[3]),
    valueStart,
    valueEnd: valueStart + m[3].length,
  };
}

export function setYamlScalarValue(
  content: string,
  dottedPath: string,
  value: string,
): { content: string; changed: boolean } {
  const segments = dottedPath.split(".").filter(Boolean);
  if (segments.length === 0) return { content, changed: false };

  const hit =
    segments.length === 1
      ? findTopLevelKey(content, segments[0])
      : findYamlPath(content, dottedPath);

  if (hit) {
    return {
      content:
        content.slice(0, hit.valueStart) +
        `"${value}"` +
        content.slice(hit.valueEnd),
      changed: true,
    };
  }

  if (segments.length === 1) {
    const sep = content.endsWith("\n") || content === "" ? "" : "\n";
    return {
      content: `${content}${sep}${dottedPath}: "${value}"\n`,
      changed: true,
    };
  }

  return { content, changed: false };
}
