export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return Response.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Simple validation - in production, verify against a database
    if (email && password) {
      return Response.json(
        {
          token: `token_${Date.now()}`,
          user: { email },
        },
        { status: 200 }
      );
    }

    return Response.json(
      { message: "Invalid credentials" },
      { status: 401 }
    );
  } catch (error) {
    return Response.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
