export async function GET() {
    return Response.json({
        "credit": {
            "value": 0,
            "currency": "USD"
        },
        "status": "success"
    });
}
