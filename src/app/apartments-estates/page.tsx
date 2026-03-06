export default function ApartmentsEstatesPage() {
    return (
        <iframe
            src={`/pages/apartments-estates.html?v=${Date.now()}`}
            style={{
                width: '100vw',
                height: '100vh',
                border: 'none',
                display: 'block',
            }}
            title="apartments-estates"
        />
    );
}
