import { api } from './api.mjs';

// Native Web handler: preserves the public HTTPS URL and the raw request body.
// No listening server, filesystem writes or background jobs are required.
export async function handleVercel(request) {
  try {
    return await api(request, process.env);
  } catch {
    return Response.json(
      { error: 'Erro interno. Seus dados foram preservados.' },
      { status: 500, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } },
    );
  }
}
