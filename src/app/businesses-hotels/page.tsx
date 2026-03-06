export default function BusinessesHotelsPage() {
    return (
        <iframe
            src={`/pages/businesses-hotels.html?v=${Date.now()}`}
            style={{
                width: '100vw',
                height: '100vh',
                border: 'none',
                display: 'block',
            }}
            title="businesses-hotels"
        />
    );
}
