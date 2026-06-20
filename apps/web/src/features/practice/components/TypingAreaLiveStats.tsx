export function TypingAreaLiveStats({ items, ariaLabel }) {
    return (
        <div className="live-stats" aria-label={ariaLabel}>
            {items.map(({ key, className, icon: Icon, value, label, tone }) => (
                <div key={key} className={`live-stat ${className}`}>
                    <div className="live-stat__top">
                        <span className={`live-stat__icon live-stat__icon--${tone || 'default'}`} aria-hidden="true">
                            <Icon size={17} strokeWidth={2.25} />
                        </span>
                        <span className="live-stat-label">{label}</span>
                    </div>
                    <span className="live-stat-value">{value}</span>
                </div>
            ))}
        </div>
    );
}
