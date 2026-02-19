type Descriptor = {
  defaults?: Record<string, any>;
  enums?: Record<string, string[]>;
  numbers?: string[];
  allowed?: string[];
};

export function validateParams(
  raw: Record<string, any>,
  descriptor: Descriptor,
) {
  const out: Record<string, any> = {};

  // Start with defaults
  if (descriptor.defaults) {
    Object.assign(out, descriptor.defaults);
  }

  // Iterate raw keys and apply allowed/coercion rules
  for (const [k, v] of Object.entries(raw || {})) {
    if (descriptor.allowed && !descriptor.allowed.includes(k)) continue;
    if (v === undefined || v === null || v === "") continue;

    // Enums: only accept if value is in allowed set
    if (descriptor.enums && descriptor.enums[k]) {
      const allowedVals = descriptor.enums[k];
      if (allowedVals.includes(String(v))) {
        out[k] = String(v);
      }
      continue;
    }

    // Numbers: coerce
    if (descriptor.numbers && descriptor.numbers.includes(k)) {
      const n = Number(v);
      if (!Number.isNaN(n)) out[k] = n;
      continue;
    }

    // Fallback: set as string
    out[k] = v;
  }

  return out;
}
