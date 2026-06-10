export function Reticle() {
  return (
    <div className="reticle" aria-hidden="true">
      <span className="reticle-line h" />
      <span className="reticle-line v" />
      <span className="reticle-corner tl" />
      <span className="reticle-corner tr" />
      <span className="reticle-corner bl" />
      <span className="reticle-corner br" />
    </div>
  );
}
