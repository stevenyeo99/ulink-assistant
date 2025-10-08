import './TypingDots.css';

export function TypingDots({ label = 'Assistant is typing'}) {
    return (
        <div className='typing' aria-live='polite' aria-atomic='true'>
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
            <span className="sr">{label}…</span>
        </div>
    )
}