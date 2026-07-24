export default function RatingStars({ value = 0, onChange, size = 'text-lg', readOnly = false }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className={`flex gap-0.5 ${size}`}>
      {stars.map((s) => (
        <button
          key={s}
          type="button"
          disabled={readOnly}
          onClick={() => onChange && onChange(s)}
          className={`${readOnly ? 'cursor-default' : 'cursor-pointer'} ${s <= value ? 'text-amber' : 'text-ink/20'}`}
          aria-label={`${s} star`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
