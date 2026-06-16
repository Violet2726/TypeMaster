export function TypingAreaLiveStats({ items, ariaLabel }) {
    return (
        <div className="live-stats" aria-label={ariaLabel}>
            {items.map(({ key, className, icon: Icon, value, label }) => (
                <div key={key} className={`live-stat ${className}`}>
                    <span className="live-stat__icon" aria-hidden="true">
                        <Icon size={17} strokeWidth={2.25} />
                    </span>
                    <span className="live-stat-value">{value}</span>
                    <span className="live-stat-label">{label}</span>
                </div>
            ))}
        </div>
    );
}
