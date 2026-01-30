import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../services/supabase'
import { notesService } from '../services/notes'
import { storageService } from '../services/storage'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import Input from '../components/common/Input'
import ImageUpload from '../components/common/ImageUpload'
import ImageGallery from '../components/common/ImageGallery'
import CustomPaints from '../components/CustomPaints/CustomPaints'
import './Admin.css'

export default function Employee() {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('relatorios')
    const [loading, setLoading] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const currentUser = auth.getCurrentUser()
    const isLider = currentUser?.cargo === 'lider_colorista'

    const [relatorios, setRelatorios] = useState([])
    const [relatoriosEquipe, setRelatoriosEquipe] = useState([])
    const [formRelatorio, setFormRelatorio] = useState({
        data_relatorio: new Date().toISOString().split('T')[0],
        observacoes: '',
        texto_livre: ''
    })

    // Notes state
    const [anotacoes, setAnotacoes] = useState([])
    const [editingNote, setEditingNote] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [formNote, setFormNote] = useState({
        titulo: '',
        conteudo: ''
    })
    const [formNoteImages, setFormNoteImages] = useState([])
    const [formRelatorioImages, setFormRelatorioImages] = useState([])

    useEffect(() => {
        loadData()
    }, [activeTab])

    const loadData = async () => {
        setLoading(true)
        try {
            if (activeTab === 'relatorios') {
                // This tab is for sending reports - no need to load here
            } else if (activeTab === 'historico') {
                const myReports = await db.getRelatorios(currentUser.id)
                setRelatorios(myReports)
            } else if (activeTab === 'relatorio_admin' && isLider) {
                // Vazio, apenas formulário
            } else if (activeTab === 'relatorios_equipe' && isLider) {
                // Líder colorista (Nilton) recebe relatórios dos coloristas
                const reports = await db.getRelatorios(null, 'lider')
                setRelatoriosEquipe(reports)
            } else if (activeTab === 'anotacoes') {
                // Load notes
                const notes = await notesService.getAnotacoes(currentUser.id)
                setAnotacoes(notes)
            }
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = () => {
        auth.logout()
        navigate('/')
    }

    const handleSubmitRelatorio = async (e, destinatario) => {
        e.preventDefault()
        setLoading(true)
        try {
            console.log('📤 [Employee] Submitting report...')

            // Upload images if any
            let imageUrls = []
            if (formRelatorioImages.length > 0) {
                try {
                    console.log(`📸 [Employee] Processing ${formRelatorioImages.length} images`)

                    // Filtrar apenas novos arquivos para upload  
                    const filesToUpload = formRelatorioImages
                        .filter(item => item.file && item.isNew)
                        .map(item => item.file)

                    // Manter URLs existentes (strings puras)
                    const existingUrls = formRelatorioImages
                        .filter(item => typeof item === 'string')

                    console.log(`📤 [Employee] Uploading ${filesToUpload.length} new files, keeping ${existingUrls.length} existing`)

                    if (filesToUpload.length > 0) {
                        const newUrls = await storageService.uploadImages(
                            filesToUpload,
                            storageService.BUCKETS.REPORTS,
                            `user_${currentUser.id}`
                        )
                        imageUrls = [...existingUrls, ...newUrls]
                    } else {
                        imageUrls = existingUrls
                    }
                } catch (error) {
                    console.error('❌ [Employee] Error uploading images:', error)
                    alert(`Erro ao fazer upload de imagens: ${error.message}\n\nVerifique se o Supabase Storage está configurado.`)
                    setLoading(false)
                    return
                }
            }

            // Hierarchy: Coloristas -> Nilton (lider), Nilton -> Admin
            const destination = isLider ? 'admin' : 'lider'

            console.log('💾 [Employee] Saving report...')
            await db.createRelatorio({
                ...formRelatorio,
                usuario_id: currentUser.id,
                destinatario: destination,
                cliente_visitado: '',
                atividade_realizada: '',
                imagens: imageUrls.length > 0 ? imageUrls : null
            })

            console.log('✅ [Employee] Report saved successfully')
            alert('Relatório enviado com sucesso!')

            setShowForm(false)
            setFormRelatorio({
                data_relatorio: new Date().toISOString().split('T')[0],
                observacoes: '',
                texto_livre: ''
            })
            setFormRelatorioImages([])
            loadData()
        } catch (error) {
            console.error('❌ [Employee] Error submitting report:', error)
            alert(`Erro ao enviar relatório: ${error.message || 'Erro desconhecido'}`)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteRelatorio = async (id) => {
        if (window.confirm('Deseja realmente excluir este relatório?')) {
            try {
                await db.deleteRelatorio(id)
                loadData()
            } catch (error) {
                console.error('Error deleting report:', error)
            }
        }
    }

    const handleMarkAsRead = async (id, currentStatus) => {
        try {
            await db.updateRelatorio(id, { lido: !currentStatus })
            loadData()
        } catch (error) {
            console.error('Error updating report:', error)
        }
    }

    // Notes handlers
    const handleSaveNote = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            // Upload images if any
            let imageUrls = []
            if (formNoteImages.length > 0) {
                const filesToUpload = formNoteImages
                    .filter(item => item.file)
                    .map(item => item.file)

                if (filesToUpload.length > 0) {
                    imageUrls = await storageService.uploadImages(
                        filesToUpload,
                        storageService.BUCKETS.NOTES,
                        `user_${currentUser.id}`
                    )
                }

                // Add existing URLs (when editing)
                const existingUrls = formNoteImages
                    .filter(item => !item.file && typeof item === 'string')
                imageUrls = [...existingUrls, ...imageUrls]
            }

            if (editingNote) {
                await notesService.updateAnotacao(
                    editingNote.id,
                    formNote.titulo,
                    formNote.conteudo,
                    imageUrls
                )
            } else {
                await notesService.createAnotacao(
                    currentUser.id,
                    formNote.titulo,
                    formNote.conteudo,
                    imageUrls
                )
            }
            setFormNote({ titulo: '', conteudo: '' })
            setFormNoteImages([])
            setEditingNote(null)
            setShowForm(false)
            loadData()
        } catch (error) {
            console.error('Error saving note:', error)
            alert('Erro ao salvar anotação')
        } finally {
            setLoading(false)
        }
    }

    const handleEditNote = (note) => {
        setEditingNote(note)
        setFormNote({
            titulo: note.titulo,
            conteudo: note.conteudo
        })
        setFormNoteImages(note.imagens || [])
        setShowForm(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleDeleteNote = async (id) => {
        if (window.confirm('Deseja realmente excluir esta anotação?')) {
            try {
                await notesService.deleteAnotacao(id)
                loadData()
            } catch (error) {
                console.error('Error deleting note:', error)
            }
        }
    }

    const handleSearchNotes = async (term) => {
        setSearchTerm(term)
        if (!term.trim()) {
            loadData()
            return
        }
        try {
            const results = await notesService.searchAnotacoes(currentUser.id, term)
            setAnotacoes(results)
        } catch (error) {
            console.error('Error searching notes:', error)
        }
    }

    return (
        <div className="admin-page">
            <div className="admin-header">
                <div>
                    <h1>{isLider ? '👔 Líder Colorista' : '🎨 Colorista'}</h1>
                    <p className="admin-welcome">Bem-vindo, <strong>{currentUser?.nome}</strong></p>
                </div>
                <Button variant="ghost" onClick={handleLogout} icon={<span>🚪</span>}>
                    Sair
                </Button>
            </div>

            <div className="admin-tabs">
                <button
                    className={`admin-tab ${activeTab === 'relatorios' ? 'admin-tab--active' : ''}`}
                    onClick={() => setActiveTab('relatorios')}
                >
                    📤 {isLider ? 'Enviar Relatório' : 'Meus Relatórios'}
                </button>
                <button
                    className={`admin-tab ${activeTab === 'historico' ? 'admin-tab--active' : ''}`}
                    onClick={() => setActiveTab('historico')}
                >
                    📊 Histórico
                </button>
                {isLider && (
                    <button
                        className={`admin-tab ${activeTab === 'relatorios_equipe' ? 'admin-tab--active' : ''}`}
                        onClick={() => setActiveTab('relatorios_equipe')}
                    >
                        👥 Relatórios da Equipe
                    </button>
                )}
                <button
                    className={`admin-tab ${activeTab === 'anotacoes' ? 'admin-tab--active' : ''}`}
                    onClick={() => setActiveTab('anotacoes')}
                >
                    📝 Minhas Anotações
                </button>
                <button
                    className={`admin-tab ${activeTab === 'tintas' ? 'admin-tab--active' : ''}`}
                    onClick={() => setActiveTab('tintas')}
                >
                    🎨 Tintas Personalizadas
                </button>
            </div>

            <div className="admin-content">
                {/* Send Report Tab */}
                {activeTab === 'relatorios' && (
                    <div>
                        <div className="admin-section-header">
                            <h2>{isLider ? 'Enviar Relatório para Admin' : 'Enviar Relatório para Nilton'}</h2>
                            <Button
                                variant="primary"
                                onClick={() => setShowForm(!showForm)}
                                icon={<span>➕</span>}
                            >
                                Novo Relatório
                            </Button>
                        </div>

                        {showForm && (
                            <Card glass className="user-form animate-slide-down">
                                <h3>Novo Relatório</h3>
                                <form onSubmit={handleSubmitRelatorio} className="form-grid">
                                    <Input
                                        label="Data do Relatório"
                                        type="date"
                                        value={formRelatorio.data_relatorio}
                                        onChange={(e) => setFormRelatorio({ ...formRelatorio, data_relatorio: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Observações"
                                        value={formRelatorio.observacoes}
                                        onChange={(e) => setFormRelatorio({ ...formRelatorio, observacoes: e.target.value })}
                                        placeholder="Pontos importantes..."
                                    />
                                    <div className="input-wrapper" style={{ gridColumn: '1 / -1' }}>
                                        <label className="input-label">Detalhes do Relatório</label>
                                        <textarea
                                            className="input"
                                            style={{ padding: 'var(--space-4)', minHeight: '150px', resize: 'vertical' }}
                                            value={formRelatorio.texto_livre}
                                            onChange={(e) => setFormRelatorio({ ...formRelatorio, texto_livre: e.target.value })}
                                            placeholder="Escreva aqui os detalhes completos..."
                                            required
                                        />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <ImageUpload
                                            images={formRelatorioImages}
                                            onChange={setFormRelatorioImages}
                                            maxImages={5}
                                        />
                                    </div>
                                    <div className="form-actions">
                                        <Button type="submit" variant="primary">
                                            {isLider ? 'Enviar para Admin' : 'Enviar para Nilton'}
                                        </Button>
                                        <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
                                    </div>
                                </form>
                            </Card>
                        )}
                    </div>
                )}

                {/* History Tab */}
                {activeTab === 'historico' && (
                    <div>
                        <h2>Meu Histórico de Relatórios</h2>
                        {loading ? (
                            <div className="loading-container"><div className="loading-spinner"></div></div>
                        ) : relatorios.length === 0 ? (
                            <Card><p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Nenhum relatório enviado ainda</p></Card>
                        ) : (
                            <div className="reports-list">
                                {relatorios.map((rel) => (
                                    <Card key={rel.id} className="report-card" hover>
                                        <div className="report-header">
                                            <div>
                                                <h3>{rel.lido ? '✅' : '📅'} {rel.data_relatorio}</h3>
                                                <p className="report-author">
                                                    Para: {rel.destinatario === 'admin' ? 'Admin' : 'Nilton (Líder)'}
                                                </p>
                                            </div>
                                            <Button variant="danger" size="sm" onClick={() => handleDeleteRelatorio(rel.id)}>
                                                🗑️
                                            </Button>
                                        </div>
                                        <div className="report-content">
                                            {rel.observacoes && (
                                                <div>
                                                    <strong>Observações:</strong>
                                                    <p>{rel.observacoes}</p>
                                                </div>
                                            )}
                                            {rel.texto_livre && (
                                                <div>
                                                    <strong>Detalhes:</strong>
                                                    <p className="report-text">{rel.texto_livre}</p>
                                                </div>
                                            )}
                                            {rel.imagens && rel.imagens.length > 0 && (
                                                <ImageGallery images={rel.imagens} />
                                            )}
                                            <p className="report-date">Enviado em: {rel.criado_em}</p>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Team Reports Tab (Líder only) */}
                {activeTab === 'relatorios_equipe' && isLider && (
                    <div>
                        <h2>Relatórios da Equipe</h2>
                        {loading ? (
                            <div className="loading-container"><div className="loading-spinner"></div></div>
                        ) : relatoriosEquipe.length === 0 ? (
                            <Card><p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Nenhum relatório recebido ainda</p></Card>
                        ) : (
                            <div className="reports-list">
                                {relatoriosEquipe.map((rel) => (
                                    <Card key={rel.id} className="report-card" hover>
                                        <div className="report-header">
                                            <div>
                                                <h3>{rel.lido ? '✅' : '📅'} {rel.data_relatorio}</h3>
                                                <p className="report-author">De: {rel.usuarios?.nome || 'Desconhecido'}</p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleMarkAsRead(rel.id, rel.lido)}
                                            >
                                                {rel.lido ? 'Marcar como não lido' : 'Marcar como lido'}
                                            </Button>
                                        </div>
                                        <div className="report-content">
                                            {rel.observacoes && (
                                                <div>
                                                    <strong>Observações:</strong>
                                                    <p>{rel.observacoes}</p>
                                                </div>
                                            )}
                                            {rel.texto_livre && (
                                                <div>
                                                    <strong>Detalhes:</strong>
                                                    <p className="report-text">{rel.texto_livre}</p>
                                                </div>
                                            )}
                                            {rel.imagens && rel.imagens.length > 0 && (
                                                <ImageGallery images={rel.imagens} />
                                            )}
                                            <p className="report-date">Enviado em: {rel.criado_em}</p>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Min has Anotações Tab */}
                {activeTab === 'anotacoes' && (
                    <div>
                        <div className="admin-section-header">
                            <h2>📝 Minhas Anotações</h2>
                            <Button
                                variant="primary"
                                onClick={() => {
                                    setShowForm(!showForm)
                                    setEditingNote(null)
                                    setFormNote({ titulo: '', conteudo: '' })
                                }}
                                icon={<span>➕</span>}
                            >
                                Nova Anotação
                            </Button>
                        </div>

                        {/* Search bar */}
                        <div style={{ marginBottom: 'var(--space-6)' }}>
                            <Input
                                placeholder="🔍 Buscar por título..."
                                value={searchTerm}
                                onChange={(e) => handleSearchNotes(e.target.value)}
                            />
                        </div>

                        {/* Note Form */}
                        {showForm && (
                            <Card glass className="user-form animate-slide-down">
                                <h3>{editingNote ? 'Editar Anotação' : 'Nova Anotação'}</h3>
                                <form onSubmit={handleSaveNote} className="form-grid">
                                    <Input
                                        label="Título"
                                        value={formNote.titulo}
                                        onChange={(e) => setFormNote({ ...formNote, titulo: e.target.value })}
                                        placeholder="Ex: Fórmula Azul Oceano"
                                        required
                                    />
                                    <div className="input-wrapper" style={{ gridColumn: '1 / -1' }}>
                                        <label className="input-label">Conteúdo</label>
                                        <textarea
                                            className="input"
                                            style={{
                                                padding: 'var(--space-4)',
                                                minHeight: '300px',
                                                resize: 'vertical',
                                                fontFamily: 'monospace',
                                                fontSize: '14px',
                                                lineHeight: '1.6'
                                            }}
                                            value={formNote.conteudo}
                                            onChange={(e) => setFormNote({ ...formNote, conteudo: e.target.value })}
                                            placeholder="Digite suas anotações aqui..."
                                            required
                                        />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <ImageUpload
                                            images={formNoteImages}
                                            onChange={setFormNoteImages}
                                            maxImages={5}
                                        />
                                    </div>
                                    <div className="form-actions">
                                        <Button type="submit" variant="primary">
                                            💾 {editingNote ? 'Atualizar' : 'Salvar'} Anotação
                                        </Button>
                                        <Button type="button" variant="ghost" onClick={() => {
                                            setShowForm(false)
                                            setEditingNote(null)
                                            setFormNote({ titulo: '', conteudo: '' })
                                            setFormNoteImages([])
                                        }}>Cancelar</Button>
                                    </div>
                                </form>
                            </Card>
                        )}

                        {/* Notes List */}
                        {loading ? (
                            <div className="loading-container"><div className="loading-spinner"></div></div>
                        ) : anotacoes.length === 0 ? (
                            <Card>
                                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                    {searchTerm ? 'Nenhuma anotação encontrada' : 'Nenhuma anotação criada ainda'}
                                </p>
                            </Card>
                        ) : (
                            <div className="reports-list">
                                {anotacoes.map((note) => (
                                    <Card key={note.id} className="report-card" hover>
                                        <div className="report-header">
                                            <div>
                                                <h3>📝 {note.titulo}</h3>
                                                <p className="report-author">
                                                    Atualizado em: {new Date(note.atualizado_em).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                                <Button variant="outline" size="sm" onClick={() => handleEditNote(note)}>
                                                    ✏️ Editar
                                                </Button>
                                                <Button variant="danger" size="sm" onClick={() => handleDeleteNote(note.id)}>
                                                    🗑️
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="report-content">
                                            <pre style={{
                                                whiteSpace: 'pre-wrap',
                                                wordWrap: 'break-word',
                                                fontFamily: 'monospace',
                                                fontSize: '14px',
                                                lineHeight: '1.6',
                                                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                                padding: 'var(--space-4)',
                                                borderRadius: 'var(--radius-md)',
                                                margin: 0
                                            }}>
                                                {note.conteudo}
                                            </pre>
                                            {note.imagens && note.imagens.length > 0 && (
                                                <ImageGallery images={note.imagens} />
                                            )}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Custom Paints Tab */}
                {activeTab === 'tintas' && (
                    <CustomPaints />
                )}
            </div>
        </div>
    )
}
