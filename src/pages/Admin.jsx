import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../services/supabase'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import Input from '../components/common/Input'
import ImageGallery from '../components/common/ImageGallery'
import SalesAnalysis from '../components/SalesAnalysis/SalesAnalysis'
import CustomPaints from '../components/CustomPaints/CustomPaints'
import './Admin.css'

export default function Admin() {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('usuarios')
    const [usuarios, setUsuarios] = useState([])
    const [relatorios, setRelatorios] = useState([])
    const [loading, setLoading] = useState(true)
    const [showUserForm, setShowUserForm] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const [formData, setFormData] = useState({
        nome: '',
        login: '',
        senha: '',
        tipo: 'funcionario',
        cargo: 'colorista',

        ativo: 1
    })
    const [selectedUserForReports, setSelectedUserForReports] = useState('todos')
    const [expandedReports, setExpandedReports] = useState([])
    const [reportSubtab, setReportSubtab] = useState('active')
    const [relatoriosArquivados, setRelatoriosArquivados] = useState([])

    // New states for Devemos/Materiais
    const [devemos, setDevemos] = useState([])
    const [devemosSubtab, setDevemosSubtab] = useState('pendentes')
    const [materiais, setMateriais] = useState([])
    const [expandedDevemos, setExpandedDevemos] = useState([])
    const [expandedMateriais, setExpandedMateriais] = useState([])
    const [selectedUserFilter, setSelectedUserFilter] = useState('todos') // Replaces selectedUserForReports logic for general use

    const currentUser = auth.getCurrentUser()
    const isAdmin = currentUser?.tipo === 'admin'

    useEffect(() => {
        loadData()
    }, [activeTab])

    const loadData = async () => {
        setLoading(true)
        try {
            // Always fetch users and reports for Overview, or specifically for tabs
            // Improved logic: Fetch based on what's needed, but Overview needs counts from both

            const promises = []

            if (activeTab === 'overview') {
                // For overview, we need counts. Fetching all is easiest for this scale.
                promises.push(db.getUsuarios().then(setUsuarios))
                promises.push(db.getRelatorios(null, 'admin', false).then(setRelatorios))
                // We don't strictly need archived for overview stats yet unless we add a card for it
            } else if (activeTab === 'usuarios') {
                promises.push(db.getUsuarios().then(setUsuarios))
            } else if (activeTab === 'relatorios') {
                promises.push(db.getUsuarios().then(setUsuarios))
                promises.push(db.getRelatorios(null, 'admin', false).then(setRelatorios))
                promises.push(db.getRelatorios(null, 'admin', true).then(setRelatoriosArquivados))
            } else if (activeTab === 'devemos') {
                promises.push(db.getUsuarios().then(setUsuarios))
                promises.push(db.getDevemos(null, false).then(setDevemos)) // Pending
                promises.push(db.getDevemos(null, true).then(data => {
                    // We can just store them in same array with a property or separate. 
                    // StoreLeader uses separate arrays. Let's do that or filters.
                    // Actually supabase.js separate calls. 
                    // Let's rely on setDevemos being smart or just separate states?
                    // StoreLeader: devemos (pendentes) and devolvidos.
                    // Let's use `devemos` for pending and `devolvidos` logic? 
                    // Ah, admin might want to see all.
                    // To avoid complexity, let's fetch both and merge or use separate states?
                    // Admin might want to see history.
                    // Let's simplify: fetch all purely based on subtab?
                    // Reuse `devemos` state for currently viewable list? No, async race.
                    // Let's fetch ALL for now for simplicity in Admin or follow pattern.
                    // Let's fetch pending for now as `devemos`.
                }))
                // Wait, I need a place to store devolvidos if I want tab switching to be instant.
                // Let's add `devemosDevolvidos` state.
            } else if (activeTab === 'materiais') {
                promises.push(db.getUsuarios().then(setUsuarios))
                promises.push(db.getMateriaisEmprestados(null).then(setMateriais))
            }

            await Promise.all(promises)
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

    const handleSaveUser = async (e) => {
        e.preventDefault()
        try {
            if (editingUser) {
                await db.updateUsuario(editingUser.id, formData)
            } else {
                await db.createUsuario(formData)
            }
            setShowUserForm(false)
            setEditingUser(null)
            setFormData({
                nome: '',
                login: '',
                senha: '',
                tipo: 'funcionario',
                cargo: 'colorista',
                ativo: 1
            })
            loadData()
        } catch (error) {
            console.error('Error saving user:', error)
            alert('Erro ao salvar usuário')
        }
    }

    const handleEditUser = (user) => {
        setEditingUser(user)
        setFormData({
            nome: user.nome,
            login: user.login,
            senha: '',
            tipo: user.tipo,
            cargo: user.cargo,
            ativo: user.ativo
        })
        setShowUserForm(true)
    }

    const handleDeleteUser = async (id) => {
        if (window.confirm('Deseja realmente excluir este usuário?')) {
            try {
                await db.deleteUsuario(id)
                loadData()
            } catch (error) {
                console.error('Error deleting user:', error)
                alert('Erro ao excluir usuário')
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

    const handleDeleteReport = async (id) => {
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

    const handleArchiveReport = async (id) => {
        try {
            await db.arquivarRelatorio(id)
            loadData()
        } catch (error) {
            console.error('Error archiving report:', error)
            alert('Erro ao arquivar relatório')
        }
    }

    const handleUnarchiveReport = async (id) => {
        try {
            await db.desarquivarRelatorio(id)
            loadData()
        } catch (error) {
            console.error('Error unarchiving report:', error)
            alert('Erro ao desarquivar relatório')
        }
    }

    return (
        <div className="admin-page">
            {/* Header */}
            <div className="admin-header">
                <div>
                    <h1>Dashboard Administrativo</h1>
                    <p className="admin-welcome">Bem-vindo, <strong>{currentUser?.nome}</strong></p>
                </div>
                <Button variant="ghost" onClick={handleLogout} icon={<span>🚪</span>}>
                    Sair
                </Button>
            </div>

            {/* Tabs */}
            <div className="admin-tabs">
                <button
                    className={`admin-tab ${activeTab === 'overview' ? 'admin-tab--active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    📊 Visão Geral
                </button>
                <button
                    className={`admin-tab ${activeTab === 'usuarios' ? 'admin-tab--active' : ''}`}
                    onClick={() => setActiveTab('usuarios')}
                >
                    👥 Usuários
                </button>
                <button
                    className={`admin-tab ${activeTab === 'relatorios' ? 'admin-tab--active' : ''}`}
                    onClick={() => setActiveTab('relatorios')}
                >
                    📈 Relatórios
                </button>
                {/* Sales tab - ONLY visible to admin */}
                {isAdmin && (
                    <button
                        className={`admin-tab ${activeTab === 'vendas' ? 'admin-tab--active' : ''}`}
                        onClick={() => setActiveTab('vendas')}
                    >
                        💰 Vendas
                    </button>
                )}
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
            </div>

            {/* Content */}
            <div className="admin-content">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="admin-grid">
                        <Card className="stagger-item">
                            <div className="stat-card">
                                <span className="stat-icon">👥</span>
                                <div>
                                    <p className="stat-label">Total de Usuários</p>
                                    <h2 className="stat-value">{usuarios.length}</h2>
                                </div>
                            </div>
                        </Card>

                        <Card className="stagger-item">
                            <div className="stat-card">
                                <span className="stat-icon">📈</span>
                                <div>
                                    <p className="stat-label">Relatórios Recebidos</p>
                                    <h2 className="stat-value">{relatorios.length}</h2>
                                </div>
                            </div>
                        </Card>

                        <Card className="stagger-item">
                            <div className="stat-card">
                                <span className="stat-icon">✅</span>
                                <div>
                                    <p className="stat-label">Relatórios Lidos</p>
                                    <h2 className="stat-value">{relatorios.filter(r => r.lido).length}</h2>
                                </div>
                            </div>
                        </Card>

                        <Card className="stagger-item">
                            <div className="stat-card">
                                <span className="stat-icon">📅</span>
                                <div>
                                    <p className="stat-label">Não Lidos</p>
                                    <h2 className="stat-value">{relatorios.filter(r => !r.lido).length}</h2>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'usuarios' && (
                    <div>
                        <div className="admin-section-header">
                            <h2>Gestão de Usuários</h2>
                            <Button
                                variant="primary"
                                onClick={() => {
                                    setShowUserForm(true)
                                    setEditingUser(null)
                                    setFormData({
                                        nome: '',
                                        login: '',
                                        senha: '',
                                        tipo: 'funcionario',
                                        cargo: 'colorista',
                                        ativo: 1
                                    })
                                }}
                                icon={<span>➕</span>}
                            >
                                Novo Usuário
                            </Button>
                        </div>

                        {showUserForm && (
                            <Card glass className="user-form animate-slide-down">
                                <h3>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                                <form onSubmit={handleSaveUser} className="form-grid">
                                    <Input
                                        label="Nome"
                                        value={formData.nome}
                                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Login"
                                        value={formData.login}
                                        onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Senha"
                                        type="password"
                                        value={formData.senha}
                                        onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                                        required={!editingUser}
                                        placeholder={editingUser ? 'Deixe em branco para manter' : ''}
                                    />
                                    <div className="input-wrapper">
                                        <label className="input-label">Tipo</label>
                                        <select
                                            value={formData.tipo}
                                            onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                            className="input"
                                            style={{ padding: 'var(--space-4) var(--space-5)' }}
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="funcionario">Funcionário</option>
                                        </select>
                                    </div>
                                    <div className="input-wrapper">
                                        <label className="input-label">Cargo</label>
                                        <select
                                            value={formData.cargo}
                                            onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                                            className="input"
                                            style={{ padding: 'var(--space-4) var(--space-5)' }}
                                        >
                                            <option value="colorista">Colorista</option>
                                            <option value="lider_colorista">Líder Colorista</option>
                                            <option value="lider_loja">Líder de Loja</option>
                                        </select>
                                    </div>
                                    <div className="input-wrapper">
                                        <label className="input-label">Status</label>
                                        <select
                                            value={formData.ativo}
                                            onChange={(e) => setFormData({ ...formData, ativo: parseInt(e.target.value) })}
                                            className="input"
                                            style={{ padding: 'var(--space-4) var(--space-5)' }}
                                        >
                                            <option value={1}>Ativo</option>
                                            <option value={0}>Inativo</option>
                                        </select>
                                    </div>
                                    <div className="form-actions">
                                        <Button type="submit" variant="primary">
                                            {editingUser ? 'Atualizar' : 'Criar'}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => {
                                                setShowUserForm(false)
                                                setEditingUser(null)
                                            }}
                                        >
                                            Cancelar
                                        </Button>
                                    </div>
                                </form>
                            </Card>
                        )}

                        {loading ? (
                            <div className="loading-container">
                                <div className="loading-spinner"></div>
                            </div>
                        ) : (
                            <div className="users-list">
                                {usuarios.map((user, index) => (
                                    <Card key={user.id} className="user-card stagger-item" hover>
                                        <div className="user-card-content">
                                            <div className="user-info">
                                                <h3>{user.nome}</h3>
                                                <p>@{user.login}</p>
                                                <div className="user-badges">
                                                    <span className="badge badge--tipo">{user.tipo}</span>
                                                    <span className="badge badge--cargo">{user.cargo}</span>
                                                    <span className={`badge ${user.ativo ? 'badge--ativo' : 'badge--inativo'}`}>
                                                        {user.ativo ? 'Ativo' : 'Inativo'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="user-actions">
                                                <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                                                    ✏️ Editar
                                                </Button>
                                                <Button variant="danger" size="sm" onClick={() => handleDeleteUser(user.id)}>
                                                    🗑️ Excluir
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Reports Tab */}
                {activeTab === 'relatorios' && (
                    <div>
                        <div className="admin-section-header">
                            <h2>Relatórios Recebidos</h2>
                            <div className="input-wrapper" style={{ minWidth: '250px', marginBottom: 0 }}>
                                <select
                                    value={selectedUserForReports}
                                    onChange={(e) => setSelectedUserForReports(e.target.value)}
                                    className="input"
                                    style={{ padding: 'var(--space-2) var(--space-4)' }}
                                >
                                    <option value="todos">Todos os Funcionários</option>
                                    {usuarios.map(u => (
                                        <option key={u.id} value={u.id}>{u.nome}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Subtabs for Active/Archived */}
                        <div className="tabs-container">
                            <div className="subtabs">
                                <button
                                    className={`subtab ${reportSubtab === 'active' ? 'subtab--active' : ''}`}
                                    onClick={() => setReportSubtab('active')}
                                >
                                    📋 Ativos ({relatorios.filter(rel => selectedUserForReports === 'todos' || String(rel.usuario_id) === String(selectedUserForReports)).length})
                                </button>
                                <button
                                    className={`subtab ${reportSubtab === 'archived' ? 'subtab--active' : ''}`}
                                    onClick={() => setReportSubtab('archived')}
                                >
                                    📦 Arquivados ({relatoriosArquivados.filter(rel => selectedUserForReports === 'todos' || String(rel.usuario_id) === String(selectedUserForReports)).length})
                                </button>
                            </div>
                        </div>
                        {/* Active Reports */}
                        {reportSubtab === 'active' && (
                            loading ? (
                                <div className="loading-container">
                                    <div className="loading-spinner"></div>
                                </div>
                            ) : relatorios.filter(rel => selectedUserForReports === 'todos' || String(rel.usuario_id) === String(selectedUserForReports)).length === 0 ? (
                                <Card>
                                    <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                        Nenhum relatório ativo
                                    </p>
                                </Card>
                            ) : (
                                <div className="reports-list">
                                    {relatorios
                                        .filter(rel => selectedUserForReports === 'todos' || String(rel.usuario_id) === String(selectedUserForReports))
                                        .map((rel) => (
                                            <Card
                                                key={rel.id}
                                                className="report-card"
                                                hover
                                                onClick={() => toggleReport(rel.id)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className="report-header">
                                                    <div>
                                                        <h3>
                                                            {expandedReports.includes(rel.id) ? '🔽' : '▶️'} {rel.lido ? '✅' : '📅'} {new Date(rel.data_relatorio + 'T12:00:00').toLocaleDateString('pt-BR')}
                                                        </h3>
                                                        <p className="report-author">
                                                            De: {rel.usuarios?.nome || 'Desconhecido'}
                                                        </p>
                                                    </div>
                                                    <div className="report-actions">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleMarkAsRead(rel.id, rel.lido)
                                                            }}
                                                        >
                                                            {rel.lido ? 'Não lido' : 'Lido'}
                                                        </Button>
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleArchiveReport(rel.id)
                                                            }}
                                                        >
                                                            📦 Arquivar
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDeleteReport(rel.id)
                                                            }}
                                                        >
                                                            🗑️
                                                        </Button>
                                                    </div>
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
                                                        <p className="report-date">
                                                            Enviado em: {new Date(rel.criado_em).toLocaleDateString('pt-BR')}
                                                        </p>
                                                    </div>
                                                )}
                                            </Card>
                                        ))}
                                </div>
                            )
                        )}

                        {/* Archived Reports */}
                        {reportSubtab === 'archived' && (
                            loading ? (
                                <div className="loading-container">
                                    <div className="loading-spinner"></div>
                                </div>
                            ) : relatoriosArquivados.filter(rel => selectedUserForReports === 'todos' || String(rel.usuario_id) === String(selectedUserForReports)).length === 0 ? (
                                <Card>
                                    <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                        Nenhum relatório arquivado
                                    </p>
                                </Card>
                            ) : (
                                <div className="reports-list">
                                    {relatoriosArquivados
                                        .filter(rel => selectedUserForReports === 'todos' || String(rel.usuario_id) === String(selectedUserForReports))
                                        .map((rel) => (
                                            <Card
                                                key={rel.id}
                                                className="report-card"
                                                hover
                                                onClick={() => toggleReport(rel.id)}
                                                style={{ cursor: 'pointer', opacity: 0.8 }}
                                            >
                                                <div className="report-header">
                                                    <div>
                                                        <h3>
                                                            {expandedReports.includes(rel.id) ? '🔽' : '▶️'} 📦 {new Date(rel.data_relatorio + 'T12:00:00').toLocaleDateString('pt-BR')}
                                                        </h3>
                                                        <p className="report-author">
                                                            De: {rel.usuarios?.nome || 'Desconhecido'} • Arquivado em: {new Date(rel.data_arquivamento).toLocaleDateString('pt-BR')}
                                                        </p>
                                                    </div>
                                                    <div className="report-actions">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleUnarchiveReport(rel.id)
                                                            }}
                                                        >
                                                            ↩️ Desarquivar
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDeleteReport(rel.id)
                                                            }}
                                                        >
                                                            🗑️
                                                        </Button>
                                                    </div>
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
                                                        <p className="report-date">
                                                            Enviado em: {new Date(rel.criado_em).toLocaleDateString('pt-BR')}
                                                        </p>
                                                    </div>
                                                )}
                                            </Card>
                                        ))}
                                </div>
                            )
                        )}
                    </div>
                )}

                {/* Sales Tab - ONLY rendered if admin */}
                {activeTab === 'vendas' && isAdmin && (
                    <SalesAnalysis />
                )}

                {/* Custom Paints Tab - Everyone */}
                {activeTab === 'tintas' && (
                    <CustomPaints />
                )}

                {/* Devemos Tab (Admin View) */}
                {activeTab === 'devemos' && (
                    <div>
                        <div className="admin-section-header">
                            <h2>Contas a Pagar (Devemos)</h2>
                            <div className="input-wrapper" style={{ minWidth: '250px', marginBottom: 0 }}>
                                <select
                                    value={selectedUserFilter}
                                    onChange={(e) => setSelectedUserFilter(e.target.value)}
                                    className="input"
                                    style={{ padding: 'var(--space-2) var(--space-4)' }}
                                >
                                    <option value="todos">Todos os Funcionários</option>
                                    {usuarios
                                        .filter(u => ['Tatiany', 'Matheus'].some(name => u.nome.includes(name)))
                                        .map(u => (
                                            <option key={u.id} value={u.id}>{u.nome}</option>
                                        ))}
                                </select>
                            </div>
                        </div>

                        <div className="tabs-container">
                            <div className="subtabs">
                                <button
                                    className={`subtab ${devemosSubtab === 'pendentes' ? 'subtab--active' : ''}`}
                                    onClick={() => {
                                        setDevemosSubtab('pendentes')
                                        setLoading(true)
                                        db.getDevemos(null, false).then(data => {
                                            setDevemos(data)
                                            setLoading(false)
                                        })
                                    }}
                                >
                                    📋 Pendentes
                                </button>
                                <button
                                    className={`subtab ${devemosSubtab === 'devolvidos' ? 'subtab--active' : ''}`}
                                    onClick={() => {
                                        setDevemosSubtab('devolvidos')
                                        setLoading(true)
                                        db.getDevemos(null, true).then(data => {
                                            setDevemos(data)
                                            setLoading(false)
                                        })
                                    }}
                                >
                                    ✅ Devolvidos
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="loading-container"><div className="loading-spinner"></div></div>
                        ) : devemos.filter(item => selectedUserFilter === 'todos' || String(item.usuario_id) === String(selectedUserFilter)).length === 0 ? (
                            <Card><p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Nenhum registro encontrado</p></Card>
                        ) : (
                            <div className="users-list">
                                {devemos
                                    .filter(item => selectedUserFilter === 'todos' || String(item.usuario_id) === String(selectedUserFilter))
                                    .map(item => (
                                        <Card
                                            key={item.id}
                                            className="devemos-card"
                                            hover
                                            onClick={() => setExpandedDevemos(prev => prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id])}
                                            style={{ cursor: 'pointer', opacity: devemosSubtab === 'devolvidos' ? 0.8 : 1 }}
                                        >
                                            <div className="devemos-header">
                                                <div>
                                                    <h3>{expandedDevemos.includes(item.id) ? '🔽' : '▶️'} 🏪 {item.nome_loja}</h3>
                                                    <p className="report-author">
                                                        Responsável: {item.usuarios?.nome || 'Desconhecido'}
                                                    </p>
                                                </div>
                                                {/* Admin readonly actions for now, or maybe allow delete? Let's just view first. */}
                                                <div className="report-actions">
                                                    {/* Admin actions can go here if needed */}
                                                </div>
                                            </div>
                                            {expandedDevemos.includes(item.id) && (
                                                <div className="devemos-content animate-slide-down">
                                                    <strong>Produtos:</strong>
                                                    <p className="devemos-text">{item.produtos || '-'}</p>
                                                    <p className="report-date">
                                                        {devemosSubtab === 'pendentes' ? 'Criado em: ' : 'Devolvido em: '}
                                                        {new Date(devemosSubtab === 'pendentes' ? item.criado_em : item.data_devolucao).toLocaleDateString('pt-BR')}
                                                    </p>
                                                </div>
                                            )}
                                        </Card>
                                    ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Materiais Tab (Admin View) */}
                {activeTab === 'materiais' && (
                    <div>
                        <div className="admin-section-header">
                            <h2>Materiais Emprestados</h2>
                            <div className="input-wrapper" style={{ minWidth: '250px', marginBottom: 0 }}>
                                <select
                                    value={selectedUserFilter}
                                    onChange={(e) => setSelectedUserFilter(e.target.value)}
                                    className="input"
                                    style={{ padding: 'var(--space-2) var(--space-4)' }}
                                >
                                    <option value="todos">Todos os Funcionários</option>
                                    {usuarios
                                        .filter(u => ['Tatiany', 'Matheus'].some(name => u.nome.includes(name)))
                                        .map(u => {
                                            const count = materiais.filter(m => String(m.usuario_id) === String(u.id)).length
                                            return (
                                                <option key={u.id} value={u.id}>
                                                    {u.nome} ({count})
                                                </option>
                                            )
                                        })}
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <div className="loading-container"><div className="loading-spinner"></div></div>
                        ) : materiais.filter(item => selectedUserFilter === 'todos' || String(item.usuario_id) === String(selectedUserFilter)).length === 0 ? (
                            <Card><p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Nenhum material emprestado</p></Card>
                        ) : (
                            <div className="users-list">
                                {materiais
                                    .filter(item => selectedUserFilter === 'todos' || String(item.usuario_id) === String(selectedUserFilter))
                                    .map(item => (
                                        <Card
                                            key={item.id}
                                            className="devemos-card"
                                            hover
                                            onClick={() => setExpandedMateriais(prev => prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id])}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="devemos-header">
                                                <div>
                                                    <h3>{expandedMateriais.includes(item.id) ? '🔽' : '▶️'} 🏪 {item.nome_loja}</h3>
                                                    <p className="report-author">
                                                        Responsável: {item.usuarios?.nome || 'Desconhecido'}
                                                    </p>
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
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
