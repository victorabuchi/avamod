// The Avamod mark: a clothes hanger.
export default function Mark({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 6.5a2.2 2.2 0 1 1 2.2 2.2c-1.2 0-2.2.9-2.2 2v1" />
      <path d="M12 12 3.8 18a1.2 1.2 0 0 0 .7 2.2h15a1.2 1.2 0 0 0 .7-2.2z" />
    </svg>
  );
}
