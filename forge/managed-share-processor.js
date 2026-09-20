'use strict';


let ForgeValueHelpers = null;

if (typeof module !== 'undefined' && module.exports) {
  ForgeValueHelpers = require('./forge-value-utils');
} else if (typeof window !== 'undefined') {
  ForgeValueHelpers = window.ForgeValueHelpers;
}

if (!ForgeValueHelpers) {
  throw new Error('FORGE value helpers are unavailable');
}

const { $if, $switch } = ForgeValueHelpers;

const hasOwn = (object, field) =>
  Object.prototype.hasOwnProperty.call(object, field);

function classifyManagedShareRequestLifecycle(lifecycle, requestHash) {
  if (!lifecycle) return { disposition: 'new', lifecycle: null };
  if (!lifecycle.requested) {
    throw new Error(
      'Managed-share lifecycle is missing its requested event'
    );
  }
  if (lifecycle.requested.requestHash !== requestHash) {
    return { disposition: 'conflict', lifecycle };
  }

  const status = (lifecycle.latest || lifecycle.requested).status;
  const disposition = $switch(status)
    .case(['applied', 'noop'], 'completed')
    .case(['rejected', 'denied'], 'rejected')
    .case('review-required', 'review')
    .case('approved', 'approved')
    .default('incomplete');

  return { disposition, lifecycle };
}


function normalizeManagedShareRequestPacket(packet) {
  if (!packet || typeof packet !== 'object' || Array.isArray(packet)) {
    throw new Error('Invalid managed-share request packet');
  }

  const allowedFields = new Set([
    'id', 'type', 'payloadHash', 'data', 'changes', 'reason'
  ]);
  const unsupported = Object.keys(packet)
    .filter(field => !allowedFields.has(field));
  if (unsupported.length) {
    throw new Error(`Unsupported request field: ${unsupported.join(', ')}`);
  }

  const id = typeof packet.id === 'string'
    ? packet.id.trim().toLowerCase()
    : '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)) {
    throw new Error('Invalid request id');
  }

  const type = typeof packet.type === 'string'
    ? packet.type.trim().toLowerCase()
    : '';
  if (type !== 'share.make' && type !== 'share.update') {
    throw new Error('Invalid request type');
  }

  const payloadHash = typeof packet.payloadHash === 'string'
    ? packet.payloadHash.trim().toLowerCase()
    : null;
  if (payloadHash && !/^[0-9a-f]{40}$/.test(payloadHash)) {
    throw new Error('Invalid payload hash');
  }

  const hasData = hasOwn(packet, 'data') && packet.data !== null;
  if (
    hasData &&
    (
      type !== 'share.make' ||
      typeof packet.data !== 'string' ||
      packet.data.length === 0
    )
  ) throw new Error('Invalid request data');

  if (type === 'share.update' && !payloadHash) {
    throw new Error('share.update requires payloadHash');
  }
  if (type === 'share.make' && !payloadHash && !hasData) {
    throw new Error('share.make requires data or payloadHash');
  }

  const changes = packet.changes == null ? {} : packet.changes;
  if (typeof changes !== 'object' || Array.isArray(changes)) {
    throw new Error('Invalid request changes');
  }

  const allowedChanges = type === 'share.make'
    ? new Set(['title', 'expiresAt'])
    : new Set(['title', 'expiresAt', 'state']);
  const unsupportedChanges = Object.keys(changes)
    .filter(field => !allowedChanges.has(field));
  if (unsupportedChanges.length) {
    throw new Error(
      `Unsupported request change: ${unsupportedChanges.join(', ')}`
    );
  }

  const normalizedChanges = {};

  if (hasOwn(changes, 'title')) {
    const title = changes.title;
    if (title !== null && typeof title !== 'string') {
      throw new Error('Invalid title');
    }

    const normalizedTitle = typeof title === 'string'
      ? title.trim() || null
      : null;
    if (normalizedTitle && normalizedTitle.length > 200) {
      throw new Error('Title must be 200 characters or fewer');
    }
    normalizedChanges.title = normalizedTitle;
  }

  if (hasOwn(changes, 'expiresAt')) {
    const expiresAt = changes.expiresAt;
    if (expiresAt !== null && typeof expiresAt !== 'string') {
      throw new Error('Invalid expiresAt');
    }
    normalizedChanges.expiresAt =
      expiresAt === null ? null : expiresAt.trim();
  }

  if (hasOwn(changes, 'state')) {
    if (
      changes.state !== 'active' &&
      changes.state !== 'tombstoned'
    ) throw new Error('state must be active or tombstoned');

    normalizedChanges.state = changes.state;
  }

  let reason = null;
  if (packet.reason != null) {
    if (typeof packet.reason !== 'string') {
      throw new Error('Invalid request reason');
    }
    reason = packet.reason.trim() || null;
    if (reason && reason.length > 2000) {
      throw new Error('Request reason must be 2000 characters or fewer');
    }
  }

  return {
    id,
    type,
    payloadHash,
    data: hasData ? packet.data : null,
    changes: normalizedChanges,
    reason
  };
}

const MANAGED_SHARE_CHANGE_FIELDS = [
  'title',
  'expiresAt',
  'state'
];

function normalizeManagedShareAliasRequestPacket(packet) {
  if (!packet || typeof packet !== 'object' || Array.isArray(packet)) {
    throw new Error('Invalid alias request');
  }

  const allowed = [
    'id', 'type', 'payloadHash', 'alias', 'projectId',
    'controllerKey', 'signature', 'expectedVersion', 'reason'
  ];
  const extra = Object.keys(packet).filter(field => !allowed.includes(field));
  if (extra.length) throw new Error(`Unsupported alias field: ${extra.join(', ')}`);

  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  const id = typeof packet.id === 'string' ? packet.id.trim().toLowerCase() : '';
  const type = typeof packet.type === 'string'
    ? packet.type.trim().toLowerCase()
    : '';
  const payloadHash = typeof packet.payloadHash === 'string'
    ? packet.payloadHash.trim().toLowerCase()
    : '';
  const alias = typeof packet.alias === 'string'
    ? packet.alias.trim().toLowerCase()
    : '';

  if (!uuid.test(id)) throw new Error('Invalid request id');
  if (!['share.alias.make', 'share.alias.update'].includes(type)) {
    throw new Error('Invalid alias request type');
  }
  if (!/^[0-9a-f]{40}$/.test(payloadHash)) throw new Error('Invalid payload hash');
  if (!/^[a-z0-9][a-z0-9_-]{2,63}$/.test(alias)) throw new Error('Invalid alias');

  const projectId = packet.projectId == null
    ? null
    : String(packet.projectId).trim().toLowerCase();
  const controllerKey = packet.controllerKey == null
    ? null
    : String(packet.controllerKey).trim();
  const signature = packet.signature == null
    ? null
    : String(packet.signature).trim();
  const expectedVersion = packet.expectedVersion == null
    ? null
    : packet.expectedVersion;

  if (projectId !== null && !uuid.test(projectId)) {
    throw new Error('Invalid project id');
  }
  if (controllerKey !== null && !/^[A-Za-z0-9_-]{40,1024}$/.test(controllerKey)) {
    throw new Error('Invalid controller key');
  }
  if (signature !== null && !/^[A-Za-z0-9_-]{40,512}$/.test(signature)) {
    throw new Error('Invalid signature');
  }
  if (
    type === 'share.alias.make'
      ? expectedVersion !== null
      : !Number.isInteger(expectedVersion) || expectedVersion < 1
  ) throw new Error('Invalid expected alias version');

  let reason = null;
  if (packet.reason != null) {
    if (typeof packet.reason !== 'string') throw new Error('Invalid request reason');
    reason = packet.reason.trim() || null;
    if (reason && reason.length > 2000) {
      throw new Error('Request reason must be 2000 characters or fewer');
    }
  }

  return {
    id, type, payloadHash, alias, projectId, controllerKey,
    signature, expectedVersion, reason
  };
}

function buildManagedShareAliasPlan({
  packet,
  record = null,
  targetExists = false,
  proofValid = false,
  nowIso
}) {
  const p = normalizeManagedShareAliasRequestPacket(packet);
  const reject = error => ({
    status: 'rejected',
    error,
    recordVersion: record?.version
  });

  if (['admin', 'api', 'forge'].includes(p.alias)) {
    return reject('Reserved alias');
  }
  if (!targetExists) {
    return reject('Managed share metadata not found');
  }
  if (record?.requestId === p.id) {
    return {
      status: 'applied',
      operation: 'noop',
      record,
      recordVersion: record.version
    };
  }

  const make = p.type === 'share.alias.make';

  if (make && record) return reject('Alias already claimed');
  if (!make && !record) return reject('Alias not found');
  if (!make && record.version !== p.expectedVersion) {
    return reject('Alias version conflict');
  }
  if (
    (make && !p.controllerKey) ||
    (!make && p.controllerKey && p.controllerKey !== record.controllerKey) ||
    !p.signature ||
    !proofValid
  ) return reject('Invalid alias controller proof');

  if (typeof nowIso !== 'string' || !nowIso) {
    throw new Error('Invalid alias-plan timestamp');
  }

  const next = make
    ? {
        schemaVersion: 1,
        version: 1,
        alias: p.alias,
        payloadHash: p.payloadHash,
        projectId: p.projectId,
        controllerKey: p.controllerKey,
        requestId: p.id,
        createdAt: nowIso,
        updatedAt: nowIso
      }
    : {
        ...record,
        version: record.version + 1,
        payloadHash: p.payloadHash,
        projectId: p.projectId,
        requestId: p.id,
        updatedAt: nowIso
      };

  return {
    status: 'applied',
    operation: make ? 'create' : 'update',
    record: next,
    recordVersion: next.version
  };
}

function managedShareRequestedChanges(packet) {
  const result = [];

  for (const field of MANAGED_SHARE_CHANGE_FIELDS) {
    if (!hasOwn(packet.changes, field)) continue;
    result.push({
      op: 'replace',
      path: `/${field}`,
      field,
      value: packet.changes[field]
    });
  }

  return result.length ? result : null;
}

function buildManagedShareMakePlan({
  payloadHash,
  title = null,
  payloadExistedWhenAdmitted = false,
  nowIso,
  expiresAt
}) {
  if (
    typeof payloadHash !== 'string' ||
    !/^[0-9a-f]{40}$/i.test(payloadHash)
  ) throw new Error('Invalid make-plan payload hash');

  if (title !== null && typeof title !== 'string') {
    throw new Error('Invalid make-plan title');
  }
  if (
    typeof nowIso !== 'string' || !nowIso ||
    (expiresAt !== null && (typeof expiresAt !== 'string' || !expiresAt))
  ) throw new Error('Invalid make-plan timestamps');

  const origin = $if(payloadExistedWhenAdmitted)
    .use('legacy')
    .otherwise('managed');

  return {
    recordBase: {
      schemaVersion: 1,
      version: 1,
      payloadHash: payloadHash.toLowerCase(),
      title,
      origin,
      createdAt: nowIso,
      expiresAt,
      access: 'link',
      state: 'active'
    },
    historyAction: origin === 'legacy'
      ? 'Legacy share claimed'
      : 'Share created',
    appliedChanges: [
      {op: 'add', path: '/title', field: 'title', value: title},
      {op: 'add', path: '/expiresAt', field: 'expiresAt', value: expiresAt},
      {op: 'add', path: '/state', field: 'state', value: 'active'},
      {op: 'add', path: '/origin', field: 'origin', value: origin}
    ]
  };
}

function buildManagedShareUpdatePlan({record, changes}) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new Error('Invalid update-plan record');
  }
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
    throw new Error('Invalid update-plan changes');
  }

  const appliedChanges = [];

  function replace(field, oldValue, newValue) {
    if (newValue === oldValue) return;

    appliedChanges.push({
      op: 'replace',
      path: `/${field}`,
      field,
      oldValue,
      newValue,
      value: newValue
    });
  }

  if (hasOwn(changes, 'title')) {
    let title = changes.title;

    if (title !== null) {
      if (typeof title !== 'string') throw new Error('Invalid title');
      title = title.trim() || null;

      if (title && title.length > 200) {
        throw new Error('Title must be 200 characters or fewer');
      }
    }

    replace(
      'title',
      record.title == null ? null : record.title,
      title
    );
  }

  if (hasOwn(changes, 'expiresAt')) {
    const expiresAt = changes.expiresAt;
    if (expiresAt !== null && typeof expiresAt !== 'string') {
      throw new Error('Invalid expiresAt');
    }

    const expiresAtMs = expiresAt === null ? null : Date.parse(expiresAt);
    if (expiresAtMs !== null && !Number.isFinite(expiresAtMs)) {
      throw new Error('Invalid expiresAt');
    }

    replace(
      'expiresAt',
      record.expiresAt || null,
      expiresAtMs === null ? null : new Date(expiresAtMs).toISOString()
    );
  }

  if (hasOwn(changes, 'state')) {
    if (changes.state !== 'active' && changes.state !== 'tombstoned') {
      throw new Error('state must be active or tombstoned');
    }

    replace('state', record.state || 'active', changes.state);
  }

  let currentVersion = 1;
  if (Number.isInteger(record.version) && record.version >= 1) {
    currentVersion = record.version;
  }

  let historyAction = 'Share updated';

  if (appliedChanges.length === 1) {
    const change = appliedChanges[0];

    if (change.field === 'state') {
      historyAction = $switch(change.newValue)
        .case('tombstoned', 'Share tombstoned')
        .case('active', 'Share restored')
        .default(historyAction);
    } else {
      historyAction = $switch(change.field)
        .case('title', 'Title updated')
        .case('expiresAt', 'Expiration updated')
        .default(historyAction);
    }
  }

  return {
    changes: appliedChanges,
    nextVersion: currentVersion + 1,
    historyAction
  };
}

function managedShareBase64Url(value) {
  let encoded;

  if (
    typeof Buffer !== 'undefined' &&
    typeof Buffer.from === 'function'
  ) {
    encoded = Buffer.from(value, 'utf8').toString('base64');
  } else {
    let binary = '';
    for (const byte of new TextEncoder().encode(value)) {
      binary += String.fromCharCode(byte);
    }
    encoded = btoa(binary);
  }

  return encoded
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function managedShareIntentValue(present, value) {
  if (!present) return 'absent';
  if (value === null) return 'null';
  if (typeof value !== 'string') {
    throw new Error(
      'Managed-share canonical intent values must be strings or null'
    );
  }
  return `string:${managedShareBase64Url(value)}`;
}

function canonicalManagedShareAliasIntent(packet) {
  const p = normalizeManagedShareAliasRequestPacket(packet);
  const value = v => managedShareIntentValue(true, v);
  return [
    'forge-share-alias-intent-v1',
    `id=${p.id}`,
    `type=${p.type}`,
    `alias=${p.alias}`,
    `payloadHash=${p.payloadHash}`,
    `projectId=${value(p.projectId)}`,
    `expectedVersion=${p.expectedVersion === null ? 'null' : p.expectedVersion}`,
    `controllerKey=${value(p.controllerKey)}`,
    `reason=${value(p.reason)}`
  ].join('\n');
}

function canonicalManagedShareRequestIntent({
  type,
  payloadHash = null,
  reason = null,
  requestedChanges = null
}) {
  if (type !== 'share.make' && type !== 'share.update') {
    throw new Error('Invalid canonical request type');
  }
  if (
    payloadHash !== null &&
    (
      typeof payloadHash !== 'string' ||
      !/^[0-9a-f]{40}$/i.test(payloadHash)
    )
  ) throw new Error('Invalid canonical payload hash');

  if (reason !== null && typeof reason !== 'string') {
    throw new Error('Invalid canonical request reason');
  }

  const values = Object.create(null);

  if (requestedChanges !== null) {
    if (!Array.isArray(requestedChanges)) {
      throw new Error('Invalid canonical requested changes');
    }

    for (const change of requestedChanges) {
      if (
        !change ||
        typeof change !== 'object' ||
        Array.isArray(change) ||
        !MANAGED_SHARE_CHANGE_FIELDS.includes(change.field)
      ) throw new Error('Invalid canonical requested change');

      if (hasOwn(values, change.field)) {
        throw new Error(
          `Duplicate canonical requested change: ${change.field}`
        );
      }
      values[change.field] = change.value;
    }
  }

  const lineFor = field =>
    `${field}=${managedShareIntentValue(
      hasOwn(values, field),
      values[field]
    )}`;

  return [
    'forge-managed-share-intent-v2',
    `type=${type}`,
    `payloadHash=${payloadHash === null ? 'null' : payloadHash.toLowerCase()}`,
    `reason=${managedShareIntentValue(true, reason)}`,
    lineFor('title'),
    lineFor('expiresAt'),
    lineFor('state')
  ].join('\n');
}

const ForgeManagedShareProcessor = {
  classifyManagedShareRequestLifecycle,
  normalizeManagedShareRequestPacket,
  normalizeManagedShareAliasRequestPacket,
  buildManagedShareAliasPlan,
  managedShareRequestedChanges,
  buildManagedShareMakePlan,
  buildManagedShareUpdatePlan,
  canonicalManagedShareRequestIntent,
  canonicalManagedShareAliasIntent
};


if (typeof module !== 'undefined' && module.exports) {
  module.exports = ForgeManagedShareProcessor;
}

if (typeof window !== 'undefined') {
  window.ForgeManagedShareProcessor = ForgeManagedShareProcessor;
}