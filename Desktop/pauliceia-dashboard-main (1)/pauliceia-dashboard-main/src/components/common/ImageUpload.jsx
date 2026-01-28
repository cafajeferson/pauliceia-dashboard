import { useState } from 'react'
import './ImageUpload.css'

export default function ImageUpload({ images = [], onChange, maxImages = 5 }) {
    const [previews, setPreviews] = useState(images)
    const [isDragging, setIsDragging] = useState(false)

    const handleFileSelect = (files) => {
        const fileArray = Array.from(files)

        // Validar número máximo de imagens
        const totalImages = previews.length + fileArray.length
        if (totalImages > maxImages) {
            alert(`Máximo de ${maxImages} imagens permitidas`)
            return
        }

        // Validar tipo de arquivo
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        const invalidFiles = fileArray.filter(file => !validTypes.includes(file.type))

        if (invalidFiles.length > 0) {
            alert('Apenas imagens (JPG, PNG, GIF, WEBP) são permitidas')
            return
        }

        // Validar tamanho (5MB por imagem)
        const maxSize = 5 * 1024 * 1024 // 5MB
        const largeFiles = fileArray.filter(file => file.size > maxSize)

        if (largeFiles.length > 0) {
            alert('Imagens devem ter no máximo 5MB')
            return
        }

        console.log(`📸 [ImageUpload] Adding ${fileArray.length} new files`)

        // Criar previews
        const newPreviews = [...previews]
        let filesProcessed = 0

        fileArray.forEach(file => {
            const reader = new FileReader()
            reader.onloadend = () => {
                newPreviews.push({
                    file: file,              // O arquivo real
                    preview: reader.result,  // Base64 para preview
                    isNew: true              // Flag para identificar novos uploads
                })
                filesProcessed++

                // Só atualiza quando todos os arquivos foram processados
                if (filesProcessed === fileArray.length) {
                    console.log(`✅ [ImageUpload] Total images: ${newPreviews.length}`)
                    setPreviews([...newPreviews])
                    onChange(newPreviews)
                }
            }
            reader.onerror = () => {
                console.error('❌ [ImageUpload] Error reading file:', file.name)
                alert(`Erro ao ler arquivo: ${file.name}`)
            }
            reader.readAsDataURL(file)
        })
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setIsDragging(false)
        handleFileSelect(e.dataTransfer.files)
    }

    const handleInputChange = (e) => {
        handleFileSelect(e.target.files)
    }

    const removeImage = (index) => {
        const newPreviews = previews.filter((_, i) => i !== index)
        setPreviews(newPreviews)
        onChange(newPreviews)
    }

    return (
        <div className="image-upload">
            <label className="input-label">Imagens (opcional)</label>

            {previews.length < maxImages && (
                <div
                    className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('image-input').click()}
                >
                    <input
                        id="image-input"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleInputChange}
                        style={{ display: 'none' }}
                    />
                    <div className="upload-icon">📷</div>
                    <p>Clique ou arraste imagens aqui</p>
                    <p className="upload-hint">
                        {previews.length}/{maxImages} imagens • Máx 5MB por imagem
                    </p>
                </div>
            )}

            {previews.length > 0 && (
                <div className="image-preview-grid">
                    {previews.map((item, index) => (
                        <div key={index} className="image-preview-item">
                            <img
                                src={item.preview || item}
                                alt={`Preview ${index + 1}`}
                            />
                            <button
                                type="button"
                                className="remove-image-btn"
                                onClick={() => removeImage(index)}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
