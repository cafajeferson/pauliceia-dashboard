import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../services/supabase'
import { storageService } from '../services/storage'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import Input from '../components/common/Input'
import ImageUpload from '../components/common/ImageUpload'
import ImageGallery from '../components/common/ImageGallery'
import CustomPaints from '../components/CustomPaints/CustomPaints'
import SalesAnalysis from '../components/SalesAnalysis/SalesAnalysis'
import './StoreLeader.css'

export default function StoreLeader() {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('relatorios')
    const [devemosSubtab, setDevemosSubtab] = useState('pendentes')
    const [loading, setLoading] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const currentUser = auth.getCurrentUser()

    // Relatórios
    const [relatorios, setRelatorios] = useState([])
    const [formRelatorio, setFormRelatorio] = useState({
        data_relatorio: new Date().toISOString().split('T')[0],
        observacoes: '',
        texto_livre: ''
    })
    const [formRelatorioImages, setFormRelatorioImages] = useState([])
    const [expandedReports, setExpandedReports] = useState([])

    // Devemos
    const [devemos, setDevemos] = useState([])
    const [devolvidos, setDevolvidos] = useState([])
    const [expandedDevemos, setExpandedDevemos] = useState([])
    const [editingDevemos, setEditingDevemos] = useState(null)
    const [formDevemos, setFormDevemos] = useState({
        nome_loja: '',
        produtos: ''
    })

    // Materiais Emprestados
    const [materiais, setMateriais] = useState([])
    const [expandedMateriais, setExpandedMateriais] = useState([])
    const [editingMaterial, setEditingMaterial] = useState(null)
    const [formMaterial, setFormMaterial] = useState({
        nome_loja: '',
        produtos: ''
    })

    useEffect(() => {
        loadData()
    }, [activeTab])

    const loadData = async () => {
        setLoading(true)
        try {
            if (activeTab === 'relatorios') {
                const reports = await db.getRelatorios(currentUser.id)
                setRelatorios(reports)
            } else if (activeTab === 'devemos') {
                const pendentes = await db.getDevemos(currentUser.id, false)
                const devolvidos = await db.getDevemos(currentUser.id, true)
                setDevemos(pendentes)
                setDevolvidos(devolvidos)
            } else if (activeTab === 'materiais') {
                const mats = await db.getMateriaisEmprestados(currentUser.id)
                setMateriais(mats)
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

    const handleSubmitRelatorio = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            console.log('📤 [StoreLeader] Submitting report...')

            // Upload images if any
            let imageUrls = []
            if (formRelatorioImages.length > 0) {
                try {
                    console.log(`📸 [StoreLeader] Processing ${formRelatorioImages.length} images`)

                    const filesToUpload = formRelatorioImages
                        .filter(item => item.file && item.isNew)
                        .map(item => item.file)

                    const existingUrls = formRelatorioImages
                        .filter(item => typeof item === 'string')

                    console.log(`📤 [StoreLeader] Uploading ${filesToUpload.length} new, keeping ${existingUrls.length} existing`)

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
                    console.error('❌ [StoreLeader] Error uploading images:', error)
                    alert(`Erro ao fazer upload de imagens: ${error.message}\n\nVerifique se o Supabase Storage está configurado.`)
                    setLoading(false)
                    return
                }
            }


            console.log('💾 [StoreLeader] Saving report...')
            await db.createRelatorio({
                ...formRelatorio,
                usuario_id: currentUser.id,
                destinatario: 'admin',
                cliente_visitado: '',
                atividade_realizada: '',
                imagens: imageUrls.length > 0 ? imageUrls : null
            })

            console.log('✅ [StoreLeader] Report saved successfully')
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
            console.error('❌ [StoreLeader] Error submitting report:', error)
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

    const toggleReport = (id) => {
        setExpandedReports(prev =>
            prev.includes(id)
                ? prev.filter(rId => rId !== id)
                : [...prev, id]
        )
    }

    const handleSubmitDevemos = async (e) => {
        e.preventDefault()
        try {
            if (editingDevemos) {
                await db.updateDevemos(editingDevemos.id, {
                    ...formDevemos
                })
            } else {
                await db.createDevemos({
                    ...formDevemos,
                    usuario_id: currentUser.id,
                    devolvido: false
                })
            }
            setShowForm(false)
            setEditingDevemos(null)
            setFormDevemos({ nome_loja: '', produtos: '' })
            loadData()
        } catch (error) {
            console.error('Error submitting devemos:', error)
            alert('Erro ao salvar registro')
        }
    }

    const handleEditDevemos = (item) => {
        setEditingDevemos(item)
        setFormDevemos({
            nome_loja: item.nome_loja,
            produtos: item.produtos
        })
        setShowForm(true)
    }

    const toggleDevemos = (id) => {
        setExpandedDevemos(prev =>
            prev.includes(id)
                ? prev.filter(itemId => itemId !== id)
                : [...prev, id]
        )
    }

    const handleMarcarDevolvido = async (id) => {
        try {
            await db.updateDevemos(id, {
                devolvido: true,
                data_devolucao: new Date().toISOString()
            })
            loadData()
        } catch (error) {
            console.error('Error updating devemos:', error)
        }
    }

    const handleReabrirDevemos = async (id) => {
        try {
            await db.updateDevemos(id, {
                devolvido: false,
                data_devolucao: null
            })
            loadData()
        } catch (error) {
            console.error('Error updating devemos:', error)
        }
    }

    const handleDeleteDevemos = async (id) => {
        if (window.confirm('Deseja realmente excluir este registro?')) {
            try {
                await db.deleteDevemos(id)
                loadData()
            } catch (error) {
                console.error('Error deleting devemos:', error)
            }
        }
    }

    const handleSubmitMaterial = async (e) => {
        e.preventDefault()
        try {
            if (editingMaterial) {
                await db.updateMaterialEmprestado(editingMaterial.id, {
                    ...formMaterial
                })
            } else {
                await db.createMaterialEmprestado({
                    ...formMaterial,
                    usuario_id: currentUser.id
                })
            }
            setShowForm(false)
            setEditingMaterial(null)
            setFormMaterial({ nome_loja: '', produtos: '' })
            loadData()
        } catch (error) {
            console.error('Error submitting material:', error)
            alert('Erro ao salvar registro')
        }
    }

    const handleEditMaterial = (item) => {
        setEditingMaterial(item)
        setFormMaterial({
            nome_loja: item.nome_loja,
            produtos: item.produtos
        })
        setShowForm(true)
    }

    const toggleMaterial = (id) => {
        setExpandedMateriais(prev =>
            prev.includes(id)
                ? prev.filter(itemId => itemId !== id)
                : [...prev, id]
        )
    }

    const handleDeleteMaterial = async (id) => {
        if (window.confirm('Deseja realmente excluir este registro?')) {
            try {
                await db.deleteMaterialEmprestado(id)
                loadData()
            } catch (error) {
                console.error('Error deleting material:', error)
            }
        }
    }

    return (
        <div className="admin-page">
            <div className="admin-header">
                <div>
                    <h1>🏪 Líder de Loja</h1>
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
                    📤 Relatórios
                </button>
                <button
                    className={`admin-tab ${activeTab === 'devemos' ? 'admin-tab--active' : ''}`}
                    onClick={() => setActiveTab('devemos')}
                >
                    💰 Devemos
                </button>
                <button
                    className={`admin-tab ${activeTab === 'materiais' ? 'admin-tab--active' : ''}`}
                    onClick={() => setActiveTab('materiais')}
                >
                    📦 Materiais Emprestados
                </button>
                <button
                    className={`admin-tab ${activeTab === 'tintas' ? 'admin-tab--active' : ''}`}
                    onClick={() => setActiveTab('tintas')}
                >
                    🎨 Tintas
                </button>
                <button
                    className={`admin-tab ${activeTab === 'vendas' ? 'admin-tab--active' : ''}`}
                    onClick={() => setActiveTab('vendas')}
                >
                    📊 Vendas
                </button>
            </div>

            <div className="admin-content">
                {/* Relatórios Tab */}
                {activeTab === 'relatorios' && (
                    <div>
                        <div className="admin-section-header">
                            <h2>Relatórios para Admin</h2>
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
                                        placeholder="Resumo do relatório..."
                                    />
                                    <div className="input-wrapper" style={{ gridColumn: '1 / -1' }}>
                                        <label className="input-label">Detalhes do Relatório</label>
                                        <textarea
                                            className="input"
                                            style={{ padding: 'var(--space-4)', minHeight: '150px', resize: 'vertical' }}
                                            value={formRelatorio.texto_livre}
                                            onChange={(e) => setFormRelatorio({ ...formRelatorio, texto_livre: e.target.value })}
                                            placeholder="Escreva aqui os detalhes completos..."
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
                                        <Button type="submit" variant="primary">Enviar</Button>
                                        <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
                                    </div>
                                </form>
                            </Card>
                        )}

                        {loading ? (
                            <div className="loading-container"><div className="loading-spinner"></div></div>
                        ) : relatorios.length === 0 ? (
                            <Card><p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Nenhum relatório enviado ainda</p></Card>
                        ) : (
                            <div className="reports-list">
                                {relatorios.map((rel) => (
                                    <Card
                                        key={rel.id}
                                        className="report-card"
                                        hover
                                        onClick={() => toggleReport(rel.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="report-header">
                                            <div>
                                                <h3>{expandedReports.includes(rel.id) ? '🔽' : '▶️'} {rel.lido ? '✅' : '📅'} {new Date(rel.data_relatorio + 'T12:00:00').toLocaleDateString('pt-BR')}</h3>
                                                <p className="report-author">Relatório para Admin</p>
                                            </div>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeleteRelatorio(rel.id)
                                                }}
                                            >
                                                🗑️ Excluir
                                            </Button>
                                        </div>
                                        {expandedReports.includes(rel.id) && (
                                            <div className="report-content animate-slide-down">
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
                                                <p className="report-date">Enviado em: {new Date(rel.criado_em).toLocaleDateString('pt-BR')}</p>
                                            </div>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Devemos Tab */}
                {activeTab === 'devemos' && (
                    <div>
                        <div className="tabs-container">
                            <div className="subtabs">
                                <button
                                    className={`subtab ${devemosSubtab === 'pendentes' ? 'subtab--active' : ''}`}
                                    onClick={() => setDevemosSubtab('pendentes')}
                                >
                                    📋 Pendentes
                                </button>
                                <button
                                    className={`subtab ${devemosSubtab === 'devolvidos' ? 'subtab--active' : ''}`}
                                    onClick={() => setDevemosSubtab('devolvidos')}
                                >
                                    ✅ Devolvidos
                                </button>
                            </div>
                        </div>

                        {/* Pending section */}
                        {devemosSubtab === 'pendentes' && (
                            <>
                                <div className="admin-section-header">
                                    <h2>Devemos (Pendentes)</h2>
                                    <Button
                                        variant="primary"
                                        onClick={() => setShowForm(!showForm)}
                                        icon={<span>➕</span>}
                                    >
                                        Novo Registro
                                    </Button>
                                </div>

                                {showForm && (
                                    <Card glass className="user-form animate-slide-down">
                                        <h3>{editingDevemos ? 'Editar Registro' : 'Novo Registro'}</h3>
                                        <form onSubmit={handleSubmitDevemos} className="form-grid">
                                            <Input
                                                label="Nome da Loja/Fornecedor"
                                                value={formDevemos.nome_loja}
                                                onChange={(e) => setFormDevemos({ ...formDevemos, nome_loja: e.target.value })}
                                                required
                                            />
                                            <div className="input-wrapper" style={{ gridColumn: '1 / -1' }}>
                                                <label className="input-label">Lista de Produtos</label>
                                                <textarea
                                                    className="input"
                                                    style={{ padding: 'var(--space-4)', minHeight: '100px', resize: 'vertical' }}
                                                    value={formDevemos.produtos}
                                                    onChange={(e) => setFormDevemos({ ...formDevemos, produtos: e.target.value })}
                                                    placeholder="Liste os produtos que devemos..."
                                                />
                                            </div>
                                            <div className="form-actions">
                                                <Button type="submit" variant="primary">Salvar</Button>
                                                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
                                            </div>
                                        </form>
                                    </Card>
                                )}

                                <div className="devemos-list">
                                    {devemos.map((item) => (
                                        <Card
                                            key={item.id}
                                            className="devemos-card"
                                            hover
                                            onClick={() => toggleDevemos(item.id)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="devemos-header">
                                                <h3>
                                                    {expandedDevemos.includes(item.id) ? '🔽' : '▶️'} 🏪 {item.nome_loja}
                                                </h3>
                                                <div className="devemos-actions">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleEditDevemos(item)
                                                        }}
                                                    >
                                                        ✏️ Editar
                                                    </Button>
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleMarcarDevolvido(item.id)
                                                        }}
                                                    >
                                                        ✅ Devolvido
                                                    </Button>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDeleteDevemos(item.id)
                                                        }}
                                                    >
                                                        🗑️
                                                    </Button>
                                                </div>
                                            </div>
                                            {expandedDevemos.includes(item.id) && (
                                                <div className="devemos-content animate-slide-down">
                                                    <strong>Produtos:</strong>
                                                    <p className="devemos-text">{item.produtos || '-'}</p>
                                                    <p className="report-date">Criado em: {new Date(item.criado_em).toLocaleDateString('pt-BR')}</p>
                                                </div>
                                            )}
                                        </Card>
                                    ))}
                                    {devemos.length === 0 && !loading && (
                                        <Card><p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Nenhum registro pendente</p></Card>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Returned section */}
                        {devemosSubtab === 'devolvidos' && (
                            <div className="devemos-list">
                                {devolvidos.map((item) => (
                                    <Card
                                        key={item.id}
                                        className="devemos-card devemos-card--devolvido"
                                        hover
                                        onClick={() => toggleDevemos(item.id)}
                                        style={{ cursor: 'pointer', opacity: 0.8 }}
                                    >
                                        <div className="devemos-header">
                                            <h3>{expandedDevemos.includes(item.id) ? '🔽' : '▶️'} 🏪 {item.nome_loja}</h3>
                                            <div className="devemos-actions">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleReabrirDevemos(item.id)
                                                    }}
                                                >
                                                    ↩️ Reabrir
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDeleteDevemos(item.id)
                                                    }}
                                                >
                                                    🗑️
                                                </Button>
                                            </div>
                                        </div>
                                        {expandedDevemos.includes(item.id) && (
                                            <div className="devemos-content animate-slide-down">
                                                <strong>Produtos:</strong>
                                                <p className="devemos-text">{item.produtos || '-'}</p>
                                                <p className="report-date">Devolvido em: {new Date(item.data_devolucao).toLocaleDateString('pt-BR')}</p>
                                            </div>
                                        )}
                                    </Card>
                                ))}
                                {devolvidos.length === 0 && !loading && (
                                    <Card><p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Nenhum item devolvido</p></Card>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Materiais Tab */}
                {activeTab === 'materiais' && (
                    <div>
                        <div className="admin-section-header">
                            <h2>Materiais Emprestados</h2>
                            <Button
                                variant="primary"
                                onClick={() => setShowForm(!showForm)}
                                icon={<span>➕</span>}
                            >
                                Novo Registro
                            </Button>
                        </div>

                        {showForm && (
                            <Card glass className="user-form animate-slide-down">
                                <h3>{editingMaterial ? 'Editar Registro' : 'Novo Registro'}</h3>
                                <form onSubmit={handleSubmitMaterial} className="form-grid">
                                    <Input
                                        label="Nome da Loja"
                                        value={formMaterial.nome_loja}
                                        onChange={(e) => setFormMaterial({ ...formMaterial, nome_loja: e.target.value })}
                                        required
                                    />
                                    <div className="input-wrapper" style={{ gridColumn: '1 / -1' }}>
                                        <label className="input-label">Lista de Materiais</label>
                                        <textarea
                                            className="input"
                                            style={{ padding: 'var(--space-4)', minHeight: '100px', resize: 'vertical' }}
                                            value={formMaterial.produtos}
                                            onChange={(e) => setFormMaterial({ ...formMaterial, produtos: e.target.value })}
                                            placeholder="Liste os materiais emprestados..."
                                        />
                                    </div>
                                    <div className="form-actions">
                                        <Button type="submit" variant="primary">Salvar</Button>
                                        <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
                                    </div>
                                </form>
                            </Card>
                        )}

                        <div className="devemos-list">
                            {materiais.map((item) => (
                                <Card
                                    key={item.id}
                                    className="devemos-card"
                                    hover
                                    onClick={() => toggleMaterial(item.id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="devemos-header">
                                        <h3>{expandedMateriais.includes(item.id) ? '🔽' : '▶️'} 🏪 {item.nome_loja}</h3>
                                        <div className="devemos-actions">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleEditMaterial(item)
                                                }}
                                            >
                                                ✏️ Editar
                                            </Button>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeleteMaterial(item.id)
                                                }}
                                            >
                                                🗑️
                                            </Button>
                                        </div>
                                    </div>
                                    {expandedMateriais.includes(item.id) && (
                                        <div className="devemos-content animate-slide-down">
                                            <strong>Materiais:</strong>
                                            <p className="devemos-text">{item.produtos || '-'}</p>
                                            <p className="report-date">Criado em: {new Date(item.criado_em).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    )}
                                </Card>
                            ))}
                            {materiais.length === 0 && !loading && (
                                <Card><p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Nenhum material registrado</p></Card>
                            )}
                        </div>
                    </div>
                )}

                {/* Custom Paints Tab */}
                {activeTab === 'tintas' && (
                    <CustomPaints />
                )}

                {/* Vendas Tab */}
                {activeTab === 'vendas' && (
                    <SalesAnalysis userId={currentUser.id} />
                )}
            </div>
        </div >
    )
}
