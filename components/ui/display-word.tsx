type DisplayWordProps = { word: string; className?: string };

export function DisplayWord({ word, className = "" }: DisplayWordProps) {
  return (
    <div aria-hidden="true" className={className}>
      <span className="display-word t-display block">{word}</span>
      {[0, 1, 2].map((echo) => <span className="echo-word t-echo block" key={echo}>{word}</span>)}
    </div>
  );
}
