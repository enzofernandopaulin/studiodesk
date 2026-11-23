import accessHandler from '../_lib/portal/access.js';
import approvalActionHandler from '../_lib/portal/approval-action.js';
import fileHandler from '../_lib/portal/file.js';
import loginHandler from '../_lib/portal/login.js';
import logoutHandler from '../_lib/portal/logout.js';
import sessionHandler from '../_lib/portal/session.js';

type Handler = (request: any, response: any) => Promise<unknown> | unknown;
const handlers: Record<string, Handler> = {
  access: accessHandler,
  'approval-action': approvalActionHandler,
  file: fileHandler,
  login: loginHandler,
  logout: logoutHandler,
  session: sessionHandler,
};

export default async function handler(request: any, response: any) {
  const pathname = new URL(request.url, `https://${request.headers.host || 'localhost'}`).pathname;
  const route = pathname.replace(/^\/api\/portal\/?/, '').split('/')[0] || '';
  const target = handlers[route];
  if (!target) return response.status(404).json({ error: 'Rota do Portal não encontrada.' });
  return target(request, response);
}
