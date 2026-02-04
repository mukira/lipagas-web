export async function GET() {
    return Response.json({
        "bag": {
            "items": [],
            "total": 0
        },
        "status": "success"
    });
}
