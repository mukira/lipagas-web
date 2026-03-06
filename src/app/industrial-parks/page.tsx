export default function IndustrialParksPage() {
    return (
        <iframe
            src={`/pages/industrial-parks.html?v=${Date.now()}`}
            style={{
                width: '100vw',
                height: '100vh',
                border: 'none',
                display: 'block',
            }}
            title="industrial-parks"
        />
    );
}
