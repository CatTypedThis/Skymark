export default function OfflinePage() {
  return (
    <main className="offline-page">
      <div className="offline-panel">
        <span className="app-mark" aria-hidden="true" />
        <p className="eyebrow">Sky Beacon</p>
        <h1>App shell available</h1>
        <p>
          Network access is needed for account sign-in and saved beacons. Reconnect when you are ready to
          synchronize anchors.
        </p>
      </div>
    </main>
  );
}
