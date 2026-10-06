import ActivityLog from '@/models/ActivityLog';

export async function recordActivity({ actor, actorType = 'System', action, entityType, entityId, description }) {
  return ActivityLog.create({
    actorType,
    actorId: actor?._id || null,
    actorName: actor?.name || actor?.email || 'System',
    actorEmail: actor?.email || '',
    action,
    entityType,
    entityId: entityId ? String(entityId) : '',
    description
  });
}