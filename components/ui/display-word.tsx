type DisplayWordProps = {
  word: string;
  className?: string;
  /** SC-1 hero depth: the striped word sits in its own plane so it can move apart from its echoes. */
  planeClassName?: string;
};

export function DisplayWord({ word, className = "", planeClassName = "" }: DisplayWordProps) {
  return (
    <div aria-hidden="true" className={className}>
      <span className={`block ${planeClassName}`.trim()}><span className="display-word t-display block">{word}</span></span>
      {[0, 1, 2].map((echo) => <span className="echo-word t-echo block" key={echo}>{word}</span>)}
    </div>
  );
}
