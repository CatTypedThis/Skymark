export default function OfflinePage() {
  return (
    <main className="offline-page">
      <div className="offline-panel">
        <span className="app-mark" aria-hidden="true" />
        <p className="eyebrow">Sky Beacon</p>
        <h1>App shell available</h1>
        <p>
          Saved beacons stay on this device. Reconnect when you are ready to refresh the app shell or open a
          secure sensor session.
        </p>
      </div>
    </main>
  );
}
