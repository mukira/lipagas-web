export default function HospitalsClinicsPage() {
    return (
        <iframe
            src={`/pages/hospitals-clinics.html?v=${Date.now()}`}
            style={{
                width: '100vw',
                height: '100vh',
                border: 'none',
                display: 'block',
            }}
            title="hospitals-clinics"
        />
    );
}
