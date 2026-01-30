import { useState } from 'react'
import './ImageGallery.css'

export default function ImageGallery({ images = [] }) {
    const [selectedIndex, setSelectedIndex] = useState(null)

    if (!images || images.length === 0) return null

    const openModal = (index) => {
        setSelectedIndex(index)
    }

    const closeModal = () => {
        setSelectedIndex(null)
    }

    const nextImage = () => {
        setSelectedIndex((prev) => (prev + 1) % images.length)
    }

    const prevImage = () => {
        setSelectedIndex((prev) => (prev - 1 + images.length) % images.length)
    }

    const handleKeyDown = (e) => {
        if (selectedIndex === null) return

        if (e.key === 'Escape') closeModal()
        if (e.key === 'ArrowRight') nextImage()
        if (e.key === 'ArrowLeft') prevImage()
    }

    return (
        <>
            <div className="image-gallery">
                {images.map((url, index) => (
                    <div
                        key={index}
                        className="gallery-image"
                        onClick={() => openModal(index)}
                    >
                        <img src={url} alt={`Imagem ${index + 1}`} />
                    </div>
                ))}
            </div>

            {selectedIndex !== null && (
                <div
                    className="image-modal"
                    onClick={closeModal}
                    onKeyDown={handleKeyDown}
                    tabIndex={0}
                >
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={closeModal}>
                            ✕
                        </button>

                        {images.length > 1 && (
                            <>
                                <button className="modal-nav prev" onClick={prevImage}>
                                    ‹
                                </button>
                                <button className="modal-nav next" onClick={nextImage}>
                                    ›
                                </button>
                            </>
                        )}

                        <img
                            src={images[selectedIndex]}
                            alt={`Imagem ${selectedIndex + 1}`}
                        />

                        <div className="modal-counter">
                            {selectedIndex + 1} / {images.length}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
