/** Linear progress indicator (Preview → Capture → Analyze → Result). */
export function Steps({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <ol className="steps" aria-label="مراحل">
      {steps.map((label, index) => (
        <li
          key={label}
          className={`steps__item ${
            index < current ? "is-done" : index === current ? "is-current" : ""
          }`}
          aria-current={index === current ? "step" : undefined}
        >
          <span className="steps__num" aria-hidden="true">
            {index + 1}
          </span>
          {label}
        </li>
      ))}
    </ol>
  );
}
