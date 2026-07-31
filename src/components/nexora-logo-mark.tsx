/* The supplied brand asset is a JPEG with generous white margins.
 * Its image is enlarged inside a clipped wrapper so the mark stays crisp
 * without altering the original artwork. */

type NexoraLogoMarkProps = {
  className?: string;
};

export default function NexoraLogoMark({
  className,
}: NexoraLogoMarkProps) {
  return (
    <span className={className} aria-hidden="true">
      <img
        className="nexora-logo-image"
        src="/nexora-logo-icon.jpg"
        alt=""
        draggable={false}
      />
    </span>
  );
}
