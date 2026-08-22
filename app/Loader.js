export default function Loader({ label = "Loading markets" }) {
  return (
    <div className="loader-wrap" role="status">
      <div className="loader-ring" />
      <p className="loader-text">{label}</p>
    </div>
  );
}