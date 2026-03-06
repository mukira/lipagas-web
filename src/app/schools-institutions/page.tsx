export default function SchoolsInstitutionsPage() {
  return (
    <iframe
      src={`/pages/schools-institutions.html?v=${Date.now()}`}
      style={{
        width: '100vw',
        height: '100vh',
        border: 'none',
        display: 'block',
      }}
      title="schools-institutions"
    />
  );
}
