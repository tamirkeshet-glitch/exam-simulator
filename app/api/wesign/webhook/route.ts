export async function POST(request: Request) {
  const payload = await request.json();

  // WeSign only calls this back once a document reaches its final status
  // (signed/declined/canceled) — never on intermediate "saved" states.
  console.log("WeSign webhook received", payload);

  return Response.json({ received: true }, { status: 200 });
}
