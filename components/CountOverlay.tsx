"use client";

export default function CountOverlay() {
  return (
    <div
      className="count-bug"
      role="status"
      aria-label="Top of 7th, 3 balls, 2 strikes, 2 outs"
    >
      <div className="count-header">
        <div className="count-mark">
          <span className="count-mark-eyebrow">Baseball League</span>
          <span className="count-mark-main">Lucky Logic</span>
        </div>
        <div className="count-inning">
          <span className="count-arrow top" aria-hidden="true" />
          <span>7TH</span>
        </div>
      </div>
      <div className="count-body">
        <div className="count-row">
          <span className="count-label">BALL</span>
          <div className="count-squares" aria-hidden="true">
            <span className="count-sq on" />
            <span className="count-sq on" />
            <span className="count-sq on" />
          </div>
        </div>
        <div className="count-row">
          <span className="count-label">STRIKE</span>
          <div className="count-squares" aria-hidden="true">
            <span className="count-sq on" />
            <span className="count-sq on" />
          </div>
        </div>
        <div className="count-row">
          <span className="count-label">OUT</span>
          <div className="count-squares" aria-hidden="true">
            <span className="count-sq on" />
            <span className="count-sq on" />
          </div>
        </div>
      </div>
    </div>
  );
}
