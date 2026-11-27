import Enquiry from '@/models/Enquiry';
import Settings from '@/models/Settings';
import { DEFAULT_ENQUIRY_STATUSES, getNextCustomStatusColor } from '@/lib/enquiryStatuses';

export function getConfiguredEnquiryStatuses(settings) {
  const savedStatuses = (settings?.enquiryStatuses || [])
    .filter(status => status?.label && status?.color)
    .map(status => ({ label: status.label, color: status.color }));
  if (savedStatuses.length) return savedStatuses;

  const legacyCustomStatuses = (settings?.enquiryCustomStatuses || [])
    .filter(status => status?.label && status?.color)
    .map(status => ({ label: status.label, color: status.color }));
  return [...DEFAULT_ENQUIRY_STATUSES, ...legacyCustomStatuses];
}

export async function getEnquiryStatuses() {
  const settings = await Settings.findOne().select('enquiryStatuses enquiryCustomStatuses').lean();
  const statuses = getConfiguredEnquiryStatuses(settings);
  const configuredLabels = statuses.map(status => status.label);
  const legacyLabels = await Enquiry.distinct('status', {
    status: { $nin: [...configuredLabels, ''] }
  });

  legacyLabels
    .filter(label => typeof label === 'string' && label.trim())
    .filter(label => !configuredLabels.some(existing => existing.toLowerCase() === label.toLowerCase()))
    .sort((left, right) => left.localeCompare(right))
    .forEach(label => {
      const color = getNextCustomStatusColor(statuses);
      statuses.push({ label, color });
    });

  return statuses;
}
