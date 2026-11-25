const HASH = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i;

function requireReusePermission(decision) {
  if (decision?.status !== 'AUTHORIZED_FOR_RUNTIME'
      || typeof decision.license !== 'string' || !decision.license.trim()
      || typeof decision.permissionEvidence !== 'string' || !decision.permissionEvidence.trim()) {
    throw new Error('Runtime source import requires an owner authorization record.');
  }
}

function requireFieldProvenance(provenance) {
  if (!provenance || !['VERIFIED_LEGACY', 'VERIFIED_MOBILE'].includes(provenance.evidence)
      || !provenance.sourceVersion || !provenance.sourceTable || !provenance.sourceField
      || !HASH.test(provenance.dataHash || '') || !HASH.test(provenance.schemaHash || '')
      || (provenance.evidence === 'VERIFIED_LEGACY' && !/^[a-f0-9]{40}$/i.test(provenance.sourceCommit || ''))
      || !provenance.license || !provenance.permissionEvidence) {
    throw new Error('A sourced runtime field must include version, field, hashes, and permission provenance.');
  }
}

function dataType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

/**
 * Apply only explicitly approved, field-scoped facts to authored catalog rows.
 * `facts` is keyed by target catalog ID and then target field. Empty facts leave
 * the authored catalog unchanged; nonempty facts fail closed without permission.
 */
export function applyApprovedSourceFields(rows, facts, decision) {
  if (!Array.isArray(rows) || !facts || typeof facts !== 'object' || Array.isArray(facts)) {
    throw new TypeError('Invalid source adapter input.');
  }
  if (!Object.keys(facts).length) return rows;

  requireReusePermission(decision);
  const rowById = new Map(rows.map((row, index) => [String(row.id), index]));
  if (rowById.size !== rows.length) throw new Error('Source adapter requires unique target IDs.');
  const result = rows.slice();
  for (const [targetId, fields] of Object.entries(facts)) {
    const index = rowById.get(String(targetId));
    if (index === undefined || !fields || typeof fields !== 'object' || Array.isArray(fields)) {
      throw new Error(`Source adapter target is invalid: ${targetId}`);
    }
    const row = { ...result[index] };
    const fieldProvenance = { ...(row.fieldProvenance || {}) };
    const fieldEvidence = { ...(row.fieldEvidence || {}) };
    for (const [field, fact] of Object.entries(fields)) {
      if (['id', 'evidence', 'fieldProvenance', 'fieldEvidence'].includes(field)) {
        throw new Error(`Source adapter cannot replace field ${field} on ${targetId}.`);
      }
      requireFieldProvenance(fact?.provenance);
      const incomingType = dataType(fact?.value);
      if (!Object.hasOwn(fact, 'value') || fact.targetType !== incomingType
          || (Object.hasOwn(row, field) && row[field] !== null && dataType(row[field]) !== incomingType)
          || (incomingType === 'number' && !Number.isFinite(fact.value))) {
        throw new Error(`Source adapter value type does not match ${targetId}.${field}.`);
      }
      if (fact.provenance.license !== decision.license
          || fact.provenance.permissionEvidence !== decision.permissionEvidence) {
        throw new Error(`Source permission provenance does not match the approved decision for ${targetId}.${field}.`);
      }
      row[field] = fact.value;
      fieldProvenance[field] = { ...fact.provenance };
      fieldEvidence[field] = fact.provenance.evidence;
    }
    row.fieldProvenance = fieldProvenance;
    row.fieldEvidence = fieldEvidence;
    row.evidence = 'MIXED';
    result[index] = row;
  }
  return result;
}
