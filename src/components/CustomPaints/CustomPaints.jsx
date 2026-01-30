import { useState, useEffect } from 'react'
import { auth } from '../../services/supabase'
import { paintsService } from '../../services/paints'
import { storageService } from '../../services/storage'
import Button from '../common/Button'
import Card from '../common/Card'
import Input from '../common/Input'
import ImageUpload from '../common/ImageUpload'
import ImageGallery from '../common/ImageGallery'
import './CustomPaints.css'

export default function CustomPaints() {
    const [tintas, setTintas] = useState([])
    const [filteredTintas, setFilteredTintas] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editingTinta, setEditingTinta] = useState(null)
    const [expandedComments, setExpandedComments] = useState({})
    const [comentarios, setComentarios] = useState({})
    const [newComment, setNewComment] = useState({})

    const [formData, setFormData] = useState({
        nome: '',
        descricao: ''
    })
    const [formImages, setFormImages] = useState([])

    const currentUser = auth.getCurrentUser()

    useEffect(() => {
        loadTintas()
    }, [])

    useEffect(() => {
        filterTintas()
    }, [searchTerm, tintas])

    const loadTintas = async () => {
        setLoading(true)
        try {
            const data = await paintsService.getTintas()
            setTintas(data)
        } catch (error) {
            console.error('Error loading paints:', error)
        } finally {
            setLoading(false)
        }
    }

    const filterTintas = () => {
        let filtered = tintas

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            filtered = filtered.filter(t =>
                t.nome.toLowerCase().includes(term) ||
                t.descricao?.toLowerCase().includes(term)
            )
        }

        setFilteredTintas(filtered)
    }

    const handleSaveTinta = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            // Upload de imagens se houver
            let imageUrls = []
            if (formImages.length > 0) {
                const filesToUpload = formImages
                    .filter(item => item.file)
                    .map(item => item.file)

                if (filesToUpload.length > 0) {
                    imageUrls = await storageService.uploadImages(
                        filesToUpload,
                        storageService.BUCKETS.PAINTS,
                        `user_${currentUser.id}`
                    )
                }

                // Adicionar URLs já existentes (ao editar)
                const existingUrls = formImages
                    .filter(item => !item.file && typeof item === 'string')
                imageUrls = [...existingUrls, ...imageUrls]
            }

            const tintaData = {
                nome: formData.nome,
                descricao: formData.descricao || '',
                formula: '',
                codigo: '',
                categoria: null,
                tags: null,
                imagens: imageUrls.length > 0 ? imageUrls : null,
                usuario_id: currentUser.id
            }

            console.log('Salvando tinta:', tintaData)

            if (editingTinta) {
                await paintsService.updateTinta(editingTinta.id, tintaData)
            } else {
                await paintsService.createTinta(tintaData)
            }

            setShowForm(false)
            setEditingTinta(null)
            setFormData({
                nome: '',
                descricao: ''
            })
            setFormImages([])
            loadTintas()
        } catch (error) {
            console.error('Error saving paint:', error)
            console.error('Error details:', error.message, error.hint)
            alert(`Erro ao salvar tinta: ${error.message || 'Erro desconhecido'}`)
        } finally {
            setLoading(false)
        }
    }

    const handleEditTinta = (tinta) => {
        setEditingTinta(tinta)
        setFormData({
            nome: tinta.nome,
            descricao: tinta.descricao || ''
        })
        setFormImages(tinta.imagens || [])
        setShowForm(true)
    }

    const handleDeleteTinta = async (id) => {
        if (window.confirm('Deseja realmente excluir esta tinta?')) {
            try {
                await paintsService.deleteTinta(id)
                loadTintas()
            } catch (error) {
                console.error('Error deleting paint:', error)
                alert('Erro ao excluir tinta')
            }
        }
    }

    const toggleComments = async (tintaId) => {
        if (expandedComments[tintaId]) {
            setExpandedComments({ ...expandedComments, [tintaId]: false })
        } else {
            setExpandedComments({ ...expandedComments, [tintaId]: true })
            if (!comentarios[tintaId]) {
                loadComentarios(tintaId)
            }
        }
    }

    const loadComentarios = async (tintaId) => {
        try {
            const comments = await paintsService.getComentarios(tintaId)
            setComentarios({ ...comentarios, [tintaId]: comments })
        } catch (error) {
            console.error('Error loading comments:', error)
        }
    }

    const handleAddComment = async (tintaId) => {
        if (!newComment[tintaId]?.trim()) return

        try {
            await paintsService.createComentario(tintaId, newComment[tintaId], currentUser.id)
            setNewComment({ ...newComment, [tintaId]: '' })
            loadComentarios(tintaId)
        } catch (error) {
            console.error('Error adding comment:', error)
            alert('Erro ao adicionar comentário')
        }
    }

    const handleDeleteComment = async (tintaId, commentId) => {
        if (window.confirm('Deseja excluir este comentário?')) {
            try {
                await paintsService.deleteComentario(commentId)
                loadComentarios(tintaId)
            } catch (error) {
                console.error('Error deleting comment:', error)
            }
        }
    }

    return (
        <div className="custom-paints">
            <div className="paints-header">
                <div>
                    <h2>🎨 Tintas Personalizadas</h2>
                    <p className="paints-subtitle">Compartilhe e descubra fórmulas personalizadas</p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => {
                        setShowForm(true)
                        setEditingTinta(null)
                        setFormData({
                            nome: '',
                            descricao: ''
                        })
                        setFormImages([])
                    }}
                    icon={<span>➕</span>}
                >
                    Nova Tinta
                </Button>
            </div>

            {showForm && (
                <Card glass className="paint-form animate-slide-down" style={{ marginBottom: 'var(--space-6)' }}>
                    <h3>{editingTinta ? 'Editar Tinta' : 'Nova Tinta'}</h3>
                    <form onSubmit={handleSaveTinta} className="form-grid">
                        <Input
                            label="Nome da Cor"
                            value={formData.nome}
                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                            required
                            placeholder="Ex: Azul Oceano Premium"
                        />
                        <div className="input-wrapper">
                            <label className="input-label">Descrição</label>
                            <textarea
                                className="input"
                                style={{ padding: 'var(--space-4)', minHeight: '120px', resize: 'vertical' }}
                                value={formData.descricao}
                                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                placeholder="Descreva a aplicação e características..."
                            />
                        </div>
                        <ImageUpload
                            images={formImages}
                            onChange={setFormImages}
                            maxImages={5}
                        />
                        <div className="form-actions">
                            <Button type="submit" variant="primary">
                                {editingTinta ? 'Atualizar' : 'Criar'} Tinta
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    setShowForm(false)
                                    setEditingTinta(null)
                                }}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            <div className="paints-controls">
                <div className="paints-search">
                    <Input
                        placeholder="Buscar tintas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={<span>🔍</span>}
                    />
                </div>

            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                </div>
            ) : filteredTintas.length === 0 ? (
                <Card>
                    <div className="empty-state">
                        <div className="empty-state-icon">🎨</div>
                        <p>{searchTerm
                            ? 'Nenhuma tinta encontrada'
                            : 'Ainda não há tintas personalizadas. Seja o primeiro a criar!'
                        }</p>
                    </div>
                </Card>
            ) : (
                <div className="paints-grid">
                    {filteredTintas.map((tinta) => (
                        <Card key={tinta.id} className="paint-card" hover>
                            <div className="paint-card-header">
                                <div>
                                    <h3 className="paint-title">{tinta.nome}</h3>
                                    {tinta.codigo && <p className="paint-code">#{tinta.codigo}</p>}
                                </div>
                                {currentUser.id === tinta.usuario_id && (
                                    <div className="paint-actions">
                                        <Button variant="ghost" size="sm" onClick={() => handleEditTinta(tinta)}>
                                            ✏️
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteTinta(tinta.id)}>
                                            🗑️
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {tinta.descricao && (
                                <p className="paint-description">{tinta.descricao}</p>
                            )}

                            <div className="paint-formula">
                                <h4>📋 Fórmula</h4>
                                <pre>{tinta.formula}</pre>
                            </div>

                            {tinta.tags && tinta.tags.length > 0 && (
                                <div className="paint-tags">
                                    {tinta.tags.map((tag, idx) => (
                                        <span key={idx} className="paint-tag">#{tag}</span>
                                    ))}
                                </div>
                            )}

                            {tinta.imagens && tinta.imagens.length > 0 && (
                                <ImageGallery images={tinta.imagens} />
                            )}

                            <div className="paint-meta">
                                <div className="paint-author">
                                    <div className="paint-author-avatar">
                                        {tinta.usuarios?.nome?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <span>{tinta.usuarios?.nome || 'Desconhecido'}</span>
                                </div>
                                <span>{new Date(tinta.criado_em).toLocaleDateString('pt-BR')}</span>
                            </div>

                            <div className="comments-section">
                                <div className="comments-header">
                                    <h5>
                                        💬 Comentários ({comentarios[tinta.id]?.length || 0})
                                    </h5>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleComments(tinta.id)}
                                    >
                                        {expandedComments[tinta.id] ? 'Fechar' : 'Ver'}
                                    </Button>
                                </div>

                                {expandedComments[tinta.id] && (
                                    <>
                                        {comentarios[tinta.id]?.length > 0 && (
                                            <div className="comments-list">
                                                {comentarios[tinta.id].map((comment) => (
                                                    <div key={comment.id} className="comment-item">
                                                        <div className="comment-header">
                                                            <span className="comment-author">
                                                                {comment.usuarios?.nome || 'Anônimo'}
                                                            </span>
                                                            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                                                                <span className="comment-date">
                                                                    {new Date(comment.criado_em).toLocaleDateString('pt-BR')}
                                                                </span>
                                                                {currentUser.id === comment.usuario_id && (
                                                                    <button
                                                                        onClick={() => handleDeleteComment(tinta.id, comment.id)}
                                                                        style={{
                                                                            background: 'none',
                                                                            border: 'none',
                                                                            cursor: 'pointer',
                                                                            fontSize: 'var(--font-size-sm)',
                                                                            opacity: 0.6
                                                                        }}
                                                                    >
                                                                        🗑️
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="comment-text">{comment.comentario}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="comment-form">
                                            <input
                                                type="text"
                                                className="input comment-input"
                                                placeholder="Adicionar comentário..."
                                                value={newComment[tinta.id] || ''}
                                                onChange={(e) => setNewComment({ ...newComment, [tinta.id]: e.target.value })}
                                                onKeyPress={(e) => e.key === 'Enter' && handleAddComment(tinta.id)}
                                            />
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => handleAddComment(tinta.id)}
                                            >
                                                Enviar
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
