export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { method } = req;
  
  if (method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Only POST allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { year, month, day } = body;

    // Simple test response
    return new Response(JSON.stringify({
      success: true,
      message: 'Edge Function working!',
      input: { year, month, day }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}