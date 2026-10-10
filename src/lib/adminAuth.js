import dbConnect from '@/lib/dbConnect';
import Admin from '@/models/Admin';
import { getSession } from '@/lib/auth';

/** Resolve an authenticated admin from the single signed store_session cookie. */
export async function getAdmin(request) {
  const session = getSession(request, 'admin');
  if (!session?.id) return null;

  await dbConnect();
  return Admin.findById(session.id)
    .select('name email role isActive')
    .then((admin) => (admin?.isActive ? admin : null));
}
