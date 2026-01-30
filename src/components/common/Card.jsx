import './Card.css'

export default function Card({
    children,
    className = '',
    glass = false,
    hover = true,
    padding = 'default',
    onClick
}) {
    const baseClass = 'card'
    const glassClass = glass ? 'glass' : ''
    const hoverClass = hover ? 'card--hover' : ''
    const paddingClass = `card--padding-${padding}`
    const clickableClass = onClick ? 'card--clickable' : ''

    return (
        <div
            className={`${baseClass} ${glassClass} ${hoverClass} ${paddingClass} ${clickableClass} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    )
}
