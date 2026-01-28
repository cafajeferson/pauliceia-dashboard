import './Button.css'

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = false,
    icon = null,
    onClick,
    type = 'button',
    className = ''
}) {
    const baseClass = 'btn'
    const variantClass = `btn--${variant}`
    const sizeClass = `btn--${size}`
    const widthClass = fullWidth ? 'btn--full' : ''
    const loadingClass = loading ? 'btn--loading' : ''

    return (
        <button
            type={type}
            className={`${baseClass} ${variantClass} ${sizeClass} ${widthClass} ${loadingClass} ${className}`}
            onClick={onClick}
            disabled={disabled || loading}
        >
            {loading && (
                <span className="btn__spinner">
                    <div className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                </span>
            )}
            {!loading && icon && <span className="btn__icon">{icon}</span>}
            <span className="btn__text">{children}</span>
        </button>
    )
}
