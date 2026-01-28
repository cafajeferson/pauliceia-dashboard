import { useState } from 'react'
import './Input.css'

export default function Input({
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    error,
    icon,
    required = false,
    disabled = false,
    className = '',
    ...props
}) {
    const [isFocused, setIsFocused] = useState(false)
    const hasValue = value && value.length > 0

    return (
        <div className={`input-wrapper ${className}`}>
            {label && (
                <label className={`input-label ${isFocused || hasValue ? 'input-label--active' : ''}`}>
                    {label} {required && <span className="input-required">*</span>}
                </label>
            )}

            <div className={`input-container ${error ? 'input-container--error' : ''} ${disabled ? 'input-container--disabled' : ''}`}>
                {icon && <span className="input-icon">{icon}</span>}

                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={`input ${icon ? 'input--with-icon' : ''}`}
                    {...props}
                />
            </div>

            {error && <span className="input-error">{error}</span>}
        </div>
    )
}
