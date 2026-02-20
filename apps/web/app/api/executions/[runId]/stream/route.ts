export async function GET() {
    return new Response(JSON.stringify({
        error: "Execution SSE stream has been removed. Use websocket execution streaming.",
    }), {
        status: 410,
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
        },
    });
}
