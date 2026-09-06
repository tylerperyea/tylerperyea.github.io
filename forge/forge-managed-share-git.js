'use strict';

// Git provider I/O. Shared semantics live in managed-share-processor.js.
// Inbox and trusted-publication credentials remain separate capabilities.
(function () {
  let settings = null;
  let trustedSettings = null;
  let credential = null;
  let processorCredential = null;

  const TOKEN_STORAGE_KEY = 'forgeManagedShareGitToken';
  const PROCESSOR_TOKEN_STORAGE_KEY =
    'forgeManagedShareGitProcessorToken';
  const MAX_INBOX_BYTES = 1024 * 1024;
  const DEFAULT_SHARE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

  function clean(value) {
    return typeof value === 'string' && value.trim()
      ? value.trim()
      : null;
  }

  function encodePath(path) {
    return path
      .split('/')
      .filter(Boolean)
      .map(encodeURIComponent)
      .join('/');
  }

  function rememberedCredential() {
    try {
      return clean(localStorage.getItem(TOKEN_STORAGE_KEY));
    } catch (error) {
      return null;
    }
  }

  function setCredential(value, remember = false) {
    const token = clean(value);
    if (!token) throw new Error('GitHub inbox credential is required');

    credential = token;
    try {
      if (remember) localStorage.setItem(TOKEN_STORAGE_KEY, token);
      else localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch (error) {
      if (remember) {
        throw new Error(
          'Unable to remember GitHub credential in this browser'
        );
      }
    }
    return true;
  }

  function clearCredential() {
    credential = null;
    try { localStorage.removeItem(TOKEN_STORAGE_KEY); } catch (error) {}
  }

  function rememberedProcessorCredential() {
    try {
      return clean(localStorage.getItem(PROCESSOR_TOKEN_STORAGE_KEY));
    } catch (error) {
      return null;
    }
  }

  function setProcessorCredential(value, remember = false) {
    const token = clean(value);
    if (!token) throw new Error('GitHub processor credential is required');

    processorCredential = token;
    try {
      if (remember) {
        localStorage.setItem(PROCESSOR_TOKEN_STORAGE_KEY, token);
      } else {
        localStorage.removeItem(PROCESSOR_TOKEN_STORAGE_KEY);
      }
    } catch (error) {
      if (remember) {
        throw new Error('Unable to remember GitHub processor credential');
      }
    }
    return true;
  }

  function clearProcessorCredential() {
    processorCredential = null;
    try {
      localStorage.removeItem(PROCESSOR_TOKEN_STORAGE_KEY);
    } catch (error) {}
  }

  function hasProcessorCredential() {
    return !!processorCredential;
  }

  function base64Utf8(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  }

  function unbase64Utf8(value) {
    const binary = atob(String(value || '').replace(/\s/g, ''));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }

  function githubContentsUrl(target, path, ref = null) {
    if (!target) throw new Error('GitHub repository is not configured');

    let url = 'https://api.github.com/repos/' +
      encodeURIComponent(target.owner) + '/' +
      encodeURIComponent(target.repo) + '/contents/' +
      encodePath(path);

    if (ref) url += '?ref=' + encodeURIComponent(ref);
    return url;
  }

  function githubHeaders(token) {
    return {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
  }

  async function digestHex(algorithm, text) {
    const digest = await crypto.subtle.digest(
      algorithm,
      new TextEncoder().encode(text)
    );
    return Array.from(new Uint8Array(digest))
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  function parseJson(text, label) {
    try { return JSON.parse(text); }
    catch (error) { throw new Error(`Invalid ${label} JSON`); }
  }

  function requireInboxPath(path) {
    const value = clean(path);
    const prefix = settings && settings.path
      ? settings.path + '/'
      : null;

    if (
      !value || !prefix ||
      !value.startsWith(prefix) ||
      value.includes('..')
    ) throw new Error('Invalid GitHub inbox path');

    return value;
  }

  async function inboxFetch(url, options = {}) {
    if (!credential) credential = rememberedCredential();
    if (!credential) {
      throw new Error('GitHub inbox credential is unavailable');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...githubHeaders(credential),
        ...(options.headers || {})
      }
    });

    if (response.status === 401 || response.status === 403) {
      clearCredential();
    }
    return response;
  }

  async function processorFetch(url, options = {}) {
    if (!processorCredential) {
      processorCredential = rememberedProcessorCredential();
    }
    if (!processorCredential) {
      throw new Error('GitHub processor credential is unavailable');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...githubHeaders(processorCredential),
        ...(options.headers || {})
      }
    });

    if (response.status === 401 || response.status === 403) {
      clearProcessorCredential();
    }
    return response;
  }

  function jsonResponse(status, body) {
    return new Response(JSON.stringify(body), {
      status,
      headers: {'Content-Type': 'application/json'}
    });
  }

  async function providerError(response) {
    try {
      const body = await response.json();
      if (body && typeof body.message === 'string') return body.message;
    } catch (error) {}
    return `GitHub responded with ${response.status}`;
  }

  function configure(config) {
    settings = null;
    trustedSettings = null;

    const managed = config && config.managedSharing;
    if (
      !managed ||
      typeof managed !== 'object' ||
      managed.transport !== 'git' ||
      managed.provider !== 'github'
    ) return false;

    const inbox = managed.inbox;
    if (!inbox || typeof inbox !== 'object') return false;

    const trusted =
      managed.trusted && typeof managed.trusted === 'object'
        ? managed.trusted
        : null;

    if (trusted && clean(trusted.processorToken)) {
      console.error(
        'FORGE managed sharing refused a processor token from config. ' +
        'Enter the trusted write credential in the processor session instead.'
      );
      return false;
    }

    const owner = clean(inbox.owner);
    const repo = clean(inbox.repo);
    const branch = clean(inbox.branch) || 'main';
    const path = (clean(inbox.path) || 'inbox')
      .replace(/^\/+|\/+$/g, '');

    if (!owner || !repo || !path) return false;
    settings = { owner, repo, branch, path };

    const inboxToken = clean(inbox.token.split("").reverse().join(""));
    if (inboxToken) credential = inboxToken;

    if (trusted) {
      const trustedOwner = clean(trusted.owner);
      const trustedRepo = clean(trusted.repo);
      const trustedBranch = clean(trusted.branch) || 'main';

      if (!trustedOwner || !trustedRepo) return false;
      if (
        trustedOwner.toLowerCase() === owner.toLowerCase() &&
        trustedRepo.toLowerCase() === repo.toLowerCase()
      ) {
        console.error(
          'FORGE managed sharing requires separate inbox and trusted repositories.'
        );
        return false;
      }

      trustedSettings = {
        owner: trustedOwner,
        repo: trustedRepo,
        branch: trustedBranch,
        public: trusted.public === true,
        token: clean(trusted.token.split("").reverse().join(""))
      };
    }

    if (!credential) credential = rememberedCredential();
    if (!processorCredential) {
      processorCredential = rememberedProcessorCredential();
    }
    return true;
  }

  function isConfigured() {
    return !!settings;
  }

  function hasCredential() {
    return !!credential;
  }

  function canSubmit(type) {
    return !!settings &&
      !!credential &&
      ['share.make', 'share.update'].includes(type);
  }

  async function listInbox(limit = 100) {
    if (!settings) {
      throw new Error('GitHub managed sharing is not configured');
    }

    const response = await inboxFetch(
      githubContentsUrl(settings, settings.path, settings.branch),
      {method: 'GET', cache: 'no-store'}
    );

    if (response.status === 404) return [];
    if (!response.ok) throw new Error(await providerError(response));

    const body = await response.json();
    if (!Array.isArray(body)) {
      throw new Error('GitHub inbox listing is not a directory');
    }

    const bounded = Math.max(1, Math.min(500, Number(limit) || 100));
    return body
      .filter(item =>
        item &&
        item.type === 'file' &&
        typeof item.path === 'string' &&
        item.path.startsWith(settings.path + '/') &&
        item.path.endsWith('.json')
      )
      .map(({path, sha, size}) => ({path, sha, size}))
      .sort((a, b) => a.path.localeCompare(b.path))
      .slice(0, bounded);
  }

  async function readInbox(path) {
    const inboxPath = requireInboxPath(path);
    const response = await inboxFetch(
      githubContentsUrl(settings, inboxPath, settings.branch),
      {method: 'GET', cache: 'no-store'}
    );

    if (!response.ok) throw new Error(await providerError(response));
    const body = await response.json();

    if (
      !body || body.type !== 'file' ||
      typeof body.sha !== 'string' ||
      typeof body.content !== 'string'
    ) throw new Error('Invalid GitHub inbox file response');

    return {
      path: inboxPath,
      sha: body.sha,
      size: body.size,
      text: unbase64Utf8(body.content)
    };
  }

  async function removeInbox(path, sha) {
    const inboxPath = requireInboxPath(path);
    const version = clean(sha);
    if (!version || !/^[a-f0-9]{40}$/i.test(version)) {
      throw new Error('Invalid GitHub inbox file SHA');
    }

    const response = await inboxFetch(
      githubContentsUrl(settings, inboxPath),
      {
        method: 'DELETE',
        body: JSON.stringify({
          message: `FORGE processed ${inboxPath}`,
          branch: settings.branch,
          sha: version
        })
      }
    );

    if (response.status === 404) return true;
    if (!response.ok) throw new Error(await providerError(response));
    return true;
  }

  function isProcessorConfigured() {
    return !!settings && !!trustedSettings;
  }

  function requireTrustedPath(path) {
    const value = clean(path);
    const parts = value ? value.split('/') : [];
    const roots = new Set(['payloads', 'shares', 'events', 'requests']);

    if (
      parts.length !== 2 ||
      !roots.has(parts[0]) ||
      !parts[1] ||
      parts[1].includes('..')
    ) throw new Error('Invalid trusted GitHub path');

    return value;
  }

  async function readTrusted(path) {
    if (!trustedSettings) {
      throw new Error('Trusted GitHub repository is not configured');
    }

    const trustedPath = requireTrustedPath(path);
    const response = await processorFetch(
      githubContentsUrl(
        trustedSettings,
        trustedPath,
        trustedSettings.branch
      ),
      {method: 'GET', cache: 'no-store'}
    );

    if (response.status === 404) return null;
    if (!response.ok) throw new Error(await providerError(response));

    const body = await response.json();
    if (
      !body || body.type !== 'file' ||
      typeof body.sha !== 'string' ||
      typeof body.content !== 'string'
    ) throw new Error('Invalid trusted GitHub file response');

    return {
      path: trustedPath,
      sha: body.sha,
      size: body.size,
      text: unbase64Utf8(body.content)
    };
  }

  async function readPublicTrusted(path) {
    if (!trustedSettings || trustedSettings.public !== true) {
      throw new Error('Public trusted GitHub repository is not configured');
    }

    const trustedPath = requireTrustedPath(path);
    const response = await fetch(
      githubContentsUrl(
        trustedSettings,
        trustedPath,
        trustedSettings.branch
      ),
      {
        method: 'GET',
        cache: 'no-store',
        headers: trustedSettings.token
          ? githubHeaders(trustedSettings.token)
          : {
              Accept: 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28'
            }
      }
    );

    if (response.status === 404) return null;
    if (!response.ok) throw new Error(await providerError(response));

    const body = await response.json();
    if (
      !body || body.type !== 'file' ||
      typeof body.sha !== 'string' ||
      typeof body.content !== 'string'
    ) throw new Error('Invalid trusted GitHub file response');

    return {
      path: trustedPath,
      sha: body.sha,
      size: body.size,
      text: unbase64Utf8(body.content)
    };
  }

  async function writeTrusted(path, text, sha = null) {
    if (!trustedSettings) {
      throw new Error('Trusted GitHub repository is not configured');
    }
    if (typeof text !== 'string') {
      throw new Error('Trusted GitHub content must be text');
    }

    const trustedPath = requireTrustedPath(path);
    const body = {
      message: `FORGE publish ${trustedPath}`,
      branch: trustedSettings.branch,
      content: base64Utf8(text)
    };
    if (sha) body.sha = sha;

    const response = await processorFetch(
      githubContentsUrl(trustedSettings, trustedPath),
      {method: 'PUT', body: JSON.stringify(body)}
    );

    if (response.status === 409 || response.status === 422) {
      return {path: trustedPath, conflict: true, sha: null};
    }
    if (!response.ok) throw new Error(await providerError(response));

    const result = await response.json();
    return {
      path: trustedPath,
      conflict: false,
      sha:
        result && result.content &&
        typeof result.content.sha === 'string'
          ? result.content.sha
          : null
    };
  }

  function createTrusted(path, text) {
    return writeTrusted(path, text);
  }

  function updateTrusted(path, text, sha) {
    const version = clean(sha);
    if (!version || !/^[a-f0-9]{40}$/i.test(version)) {
      throw new Error('Invalid trusted GitHub file SHA');
    }
    return writeTrusted(path, text, version);
  }

  function gitManagedShareEvent(base, status, details = {}) {
    return {
      schemaVersion: 1,
      eventId: status === 'requested'
        ? base.requestEventId
        : base.outcomeEventId,
      requestEventId: base.requestEventId,
      date: details.date || new Date().toISOString(),
      requestId: base.requestId,
      requestHash: base.requestHash,
      requestHashVersion: 2,
      type: base.type,
      status,
      payloadHash: base.payloadHash,
      admission: base.admission,
      actor: {email: null, source: 'anonymous', verified: false},
      ip: null,
      reason: base.reason,
      requestedChanges: base.requestedChanges,
      appliedChanges: Array.isArray(details.appliedChanges)
        ? details.appliedChanges
        : null,
      error: clean(details.error),
      recordVersion: Number.isInteger(details.recordVersion)
        ? details.recordVersion
        : null
    };
  }

  async function publishGitEvent(event) {
    const path = `events/${event.eventId}.json`;
    const text = JSON.stringify(event);
    const result = await createTrusted(path, text);

    if (result.conflict) {
      const existing = await readTrusted(path);
      if (!existing || existing.text !== text) {
        throw new Error('Trusted lifecycle event identity conflict');
      }
    }
    return event;
  }

  function findRequestHistory(record, requestId) {
    return record && Array.isArray(record.$history)
      ? record.$history.find(
          entry => entry && entry.requestId === requestId
        ) || null
      : null;
  }

  async function finishInboxProjection(
    item,
    inboxFile,
    requestPath,
    projectionFile,
    projection,
    event,
    conflictError = 'Request outcome changed during finalization'
  ) {
    if (projection.outcomeEvent) {
      event = projection.outcomeEvent;
    } else {
      if (projection.outcomeAt) {
        event.date = projection.outcomeAt;
        delete projection.outcomeAt;
      }

      projection.outcomeEvent = event;
      const checkpointText = JSON.stringify(projection);
      const checkpoint = await updateTrusted(
        requestPath,
        checkpointText,
        projectionFile.sha
      );

      if (checkpoint.conflict) {
        throw new Error(conflictError);
      }

      projectionFile.sha = checkpoint.sha;
      projectionFile.text = checkpointText;
    }

    await publishGitEvent(event);
    projection.status = event.status;
    projection.updatedAt = event.date;
    if (event.error) projection.error = event.error;
    if (Number.isInteger(event.recordVersion)) {
      projection.recordVersion = event.recordVersion;
    }

    const updated = await updateTrusted(
      requestPath,
      JSON.stringify(projection),
      projectionFile.sha
    );

    if (updated.conflict) {
      throw new Error(conflictError);
    }

    await removeInbox(item.path, inboxFile.sha);
    return projection;
  }

  async function processInboxRequest(item) {
    if (!isProcessorConfigured()) {
      throw new Error('GitHub managed-share processor is not configured');
    }
    if (
      !item ||
      typeof item.path !== 'string' ||
      typeof item.sha !== 'string' ||
      (Number.isFinite(item.size) && item.size > MAX_INBOX_BYTES)
    ) {
      throw new Error('Invalid or oversized inbox item');
    }

    const inboxFile = await readInbox(item.path);
    if (
      Number.isFinite(inboxFile.size) &&
      inboxFile.size > MAX_INBOX_BYTES
    ) {
      throw new Error('Managed-share inbox item is too large');
    }

    const core = window.ForgeManagedShareProcessor;
    const packet = core.normalizeManagedShareRequestPacket(
      parseJson(inboxFile.text, 'managed-share request')
    );
    if (item.path !== `${settings.path}/${packet.id}.json`) {
      throw new Error('Inbox filename does not match request id');
    }

    let payloadHash = packet.payloadHash;
    if (packet.data !== null) {
      const calculatedHash = await digestHex('SHA-1', packet.data);
      if (payloadHash && payloadHash !== calculatedHash) {
        throw new Error('payloadHash does not match data');
      }
      payloadHash = calculatedHash;
    }

    const requestPath = `requests/${packet.id}.json`;
    const payloadPath = `payloads/${payloadHash}`;
    const sharePath = `shares/${payloadHash}.json`;
    let projectionFile = await readTrusted(requestPath);
    let projection = projectionFile
      ? parseJson(projectionFile.text, 'request outcome')
      : null;

    const requestedChanges = core.managedShareRequestedChanges(packet);
    const requestHash = await digestHex(
      'SHA-256',
      core.canonicalManagedShareRequestIntent({
        type: packet.type,
        payloadHash,
        reason: packet.reason,
        requestedChanges
      })
    );

    const sameRequest = candidate =>
      candidate &&
      candidate.requestId === packet.id &&
      candidate.requestHash === requestHash &&
      candidate.payloadHash === payloadHash;

    const isTerminal = candidate =>
      ['applied', 'noop', 'rejected', 'denied']
        .includes(candidate.status);

    if (projection) {
      if (!sameRequest(projection)) {
        throw new Error('requestId was already used for different intent');
      }
      if (isTerminal(projection)) {
        await removeInbox(item.path, inboxFile.sha);
        return projection;
      }
    }

    let payloadFile = null;
    let admission = null;

    if (packet.type === 'share.make') {
      payloadFile = await readTrusted(payloadPath);

      if (
        projection &&
        projection.admission &&
        typeof projection.admission.payloadExisted === 'boolean'
      ) {
        admission = projection.admission;
      } else {
        admission = {payloadExisted: !!payloadFile};
      }
    }

    if (!projection) {
      const requestedAt = new Date().toISOString();
      projection = {
        schemaVersion: 1,
        requestId: packet.id,
        requestEventId: crypto.randomUUID().toLowerCase(),
        outcomeEventId: crypto.randomUUID().toLowerCase(),
        requestHashVersion: 2,
        requestHash,
        type: packet.type,
        payloadHash,
        status: 'requested',
        admission,
        requestedAt,
        updatedAt: requestedAt
      };

      const created = await createTrusted(
        requestPath,
        JSON.stringify(projection)
      );

      if (created.conflict) {
        projectionFile = await readTrusted(requestPath);
        projection = projectionFile
          ? parseJson(projectionFile.text, 'request outcome')
          : null;

        if (!sameRequest(projection)) {
          throw new Error('Trusted request projection conflict');
        }
        if (isTerminal(projection)) {
          await removeInbox(item.path, inboxFile.sha);
          return projection;
        }
      } else {
        projectionFile = {
          sha: created.sha,
          text: JSON.stringify(projection)
        };
      }
    }

    if (!projectionFile) {
      projectionFile = await readTrusted(requestPath);
    }

    if (!projection.requestEventId || !projection.outcomeEventId) {
      if (!projection.requestEventId) {
        projection.requestEventId = crypto.randomUUID().toLowerCase();
      }
      if (!projection.outcomeEventId) {
        projection.outcomeEventId = crypto.randomUUID().toLowerCase();
      }

      const projectionText = JSON.stringify(projection);
      const updated = await updateTrusted(
        requestPath,
        projectionText,
        projectionFile.sha
      );

      if (updated.conflict) {
        throw new Error('Request event identity changed during recovery');
      }

      projectionFile.sha = updated.sha;
      projectionFile.text = projectionText;
    }

    const eventBase = {
      type: packet.type,
      requestId: packet.id,
      requestEventId: projection.requestEventId,
      outcomeEventId: projection.outcomeEventId,
      requestHash,
      payloadHash,
      admission: projection.admission || admission,
      reason: packet.reason,
      requestedChanges
    };

    await publishGitEvent(
      gitManagedShareEvent(eventBase, 'requested', {
        date: projection.requestedAt
      })
    );

    const finalize = (event, conflictError) =>
      finishInboxProjection(
        item,
        inboxFile,
        requestPath,
        projectionFile,
        projection,
        event,
        conflictError
      );

    const outcome = (status, details, conflictError) =>
      finalize(
        gitManagedShareEvent(eventBase, status, details),
        conflictError
      );

    if (projection.outcomeEvent) {
      return finalize(projection.outcomeEvent);
    }

    const existingShareFile = await readTrusted(sharePath);

    if (packet.type === 'share.update') {
      if (!existingShareFile) {
        return outcome(
          'rejected',
          {error: 'Managed share metadata not found'}
        );
      }

      const record = parseJson(
        existingShareFile.text,
        'managed-share record'
      );
      const previous = findRequestHistory(record, packet.id);

      if (previous) {
        return outcome(
          'applied',
          {
            date: previous.date,
            appliedChanges: previous.changes,
            recordVersion: previous.version
          },
          'Request outcome changed during update recovery'
        );
      }

      let updatePlan;

      try {
        updatePlan = core.buildManagedShareUpdatePlan({
          record,
          changes: packet.changes
        });
      } catch (error) {
        return outcome(
          'rejected',
          {error: error.message, recordVersion: record.version}
        );
      }

      if (updatePlan.changes.length === 0) {
        return outcome('noop', {
          recordVersion: record.version
        });
      }

      const nowIso = new Date().toISOString();

      for (const change of updatePlan.changes) {
        record[change.field] = change.newValue;
      }

      record.schemaVersion = record.schemaVersion || 1;
      record.version = updatePlan.nextVersion;
      if (!Array.isArray(record.$history)) record.$history = [];

      record.$history.push({
        version: updatePlan.nextVersion,
        date: nowIso,
        user: null,
        userSource: 'anonymous',
        userVerified: false,
        ip: null,
        ipSource: 'unavailable',
        requestId: packet.id,
        action: updatePlan.historyAction,
        reason: packet.reason,
        changes: updatePlan.changes
      });

      const updatedShare = await updateTrusted(
        sharePath,
        JSON.stringify(record),
        existingShareFile.sha
      );
      if (updatedShare.conflict) {
        throw new Error('Managed-share record changed during update');
      }

      return outcome(
        'applied',
        {
          date: nowIso,
          appliedChanges: updatePlan.changes,
          recordVersion: updatePlan.nextVersion
        },
        'Request outcome changed during update'
      );
    }

    if (existingShareFile) {
      const existingRecord = parseJson(
        existingShareFile.text,
        'managed-share record'
      );

      const previous = findRequestHistory(existingRecord, packet.id);

      if (!previous) {
        const error = 'Share metadata already exists';
        return outcome(
          'rejected',
          {error, recordVersion: existingRecord.version}
        );
      }

      let recoveredExpiresAt = new Date(
        Date.parse(previous.date) + DEFAULT_SHARE_TTL_MS
      ).toISOString();

      if (
        Object.prototype.hasOwnProperty.call(
          packet.changes,
          'expiresAt'
        )
      ) {
        recoveredExpiresAt = new Date(
          Date.parse(packet.changes.expiresAt)
        ).toISOString();
      }

      const recoveredPlan = core.buildManagedShareMakePlan({
        payloadHash,
        title: packet.changes.title || null,
        payloadExistedWhenAdmitted:
          eventBase.admission.payloadExisted === true,
        nowIso: previous.date,
        expiresAt: recoveredExpiresAt
      });
      return outcome(
        'applied',
        {
          date: previous.date,
          appliedChanges: recoveredPlan.appliedChanges,
          recordVersion: previous.version
        },
        'Request outcome changed during recovery'
      );
    }

    const now = new Date();
    let expiresAtMs = now.getTime() + DEFAULT_SHARE_TTL_MS;

    if (
      Object.prototype.hasOwnProperty.call(packet.changes, 'expiresAt')
    ) {
      expiresAtMs = Date.parse(packet.changes.expiresAt);
      if (
        !Number.isFinite(expiresAtMs) ||
        expiresAtMs <= now.getTime()
      ) {
        const error = !Number.isFinite(expiresAtMs)
          ? 'Invalid expiresAt'
          : 'expiresAt must be in the future';
        return outcome('rejected', {error});
      }
    }

    if (!payloadFile && packet.data === null) {
      return outcome('rejected', {error: 'Payload not found'});
    }

    if (!payloadFile) {
      const createdPayload = await createTrusted(
        payloadPath,
        packet.data
      );
      if (createdPayload.conflict) {
        payloadFile = await readTrusted(payloadPath);
        if (!payloadFile || payloadFile.text !== packet.data) {
          throw new Error('Trusted payload hash path conflict');
        }
      }
    }

    const nowIso = now.toISOString();
    const expiresAt = new Date(expiresAtMs).toISOString();
    const makePlan = core.buildManagedShareMakePlan({
      payloadHash,
      title: packet.changes.title || null,
      payloadExistedWhenAdmitted:
        eventBase.admission.payloadExisted === true,
      nowIso,
      expiresAt
    });

    const record = {
      ...makePlan.recordBase,
      createdByEmail: null,
      createdBySource: 'anonymous',
      createdByVerified: false,
      createdIp: null,
      createdIpSource: 'unavailable',
      $history: [{
        version: 1,
        date: nowIso,
        user: null,
        userSource: 'anonymous',
        userVerified: false,
        ip: null,
        ipSource: 'unavailable',
        requestId: packet.id,
        action: makePlan.historyAction,
        reason: packet.reason,
        changes: null
      }]
    };

    const createdShare = await createTrusted(
      sharePath,
      JSON.stringify(record)
    );
    if (createdShare.conflict) {
      throw new Error('Managed-share record changed during publication');
    }

    return outcome(
      'applied',
      {
        appliedChanges: makePlan.appliedChanges,
        recordVersion: 1
      },
      'Request outcome changed during publication'
    );
  }

  async function submit(packet) {
    if (!canSubmit(packet && packet.type)) {
      throw new Error('Git-backed managed-share request type is unavailable');
    }

    const core = window.ForgeManagedShareProcessor;
    if (
      !core ||
      typeof core.normalizeManagedShareRequestPacket !== 'function'
    ) {
      throw new Error('Managed-share semantic core is unavailable');
    }

    const normalized = core.normalizeManagedShareRequestPacket(packet);
    const inboxPath = `${settings.path}/${normalized.id}.json`;
    const response = await fetch(
      githubContentsUrl(settings, inboxPath),
      {
        method: 'PUT',
        headers: githubHeaders(credential),
        body: JSON.stringify({
          message: `FORGE share request ${normalized.id}`,
          branch: settings.branch,
          content: base64Utf8(JSON.stringify(normalized))
        })
      }
    );

    if (response.status === 200 || response.status === 201) {
      return jsonResponse(202, {
        status: 'submitted',
        requestId: normalized.id,
        transport: 'git',
        provider: 'github'
      });
    }

    if (response.status === 409 || response.status === 422) {
      return jsonResponse(409, {
        status: 'conflict',
        requestId: normalized.id,
        error: 'Request inbox path already exists or cannot be created'
      });
    }

    if (response.status === 401 || response.status === 403) {
      clearCredential();
      return jsonResponse(response.status, {
        status: 'credential-rejected',
        requestId: normalized.id,
        error:
          'GitHub rejected the inbox credential. ' +
          'FORGE forgot it from this browser.'
      });
    }

    return jsonResponse(response.status, {
      status: 'error',
      requestId: normalized.id,
      error: await providerError(response)
    });
  }

  window.ForgeManagedShareGit = {
    configure,
    isConfigured,
    hasCredential,
    setCredential,
    clearCredential,
    hasProcessorCredential,
    setProcessorCredential,
    clearProcessorCredential,
    isProcessorConfigured,
    listInbox,
    readInbox,
    removeInbox,
    readTrusted,
    readPublicTrusted,
    createTrusted,
    updateTrusted,
    processInboxRequest,
    processInboxMake: processInboxRequest,
    canSubmit,
    submit
  };
})();