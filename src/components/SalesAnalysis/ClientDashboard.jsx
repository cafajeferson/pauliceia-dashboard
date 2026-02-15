import { useState } from 'react'
import { Doughnut, Bar, Line } from 'react-chartjs-2'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js'
import Card from '../common/Card'
import './ClientDashboard.css'

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
)

const ITEMS_PER_PAGE = 10

export default function ClientDashboard({ matrizData, vendas, cliente, ano, favoritos = [], onToggleFavorito }) {
    // Pagination states
    const [paginaQueda, setPaginaQueda] = useState(0)
    const [paginaAlta, setPaginaAlta] = useState(0)
    const [paginaParados, setPaginaParados] = useState(0)
    const [paginaEssenciais, setPaginaEssenciais] = useState(0)

    if (!matrizData || !vendas || vendas.length === 0) {
        return (
            <Card className="dashboard-empty">
                <div className="empty-state">
                    <span className="empty-icon">📊</span>
                    <h3>Nenhum dado disponível</h3>
                    <p>Importe arquivos CSV para visualizar o dashboard.</p>
                </div>
            </Card>
        )
    }

    // Calculate statistics
    const totalVendas = vendas.reduce((sum, v) => sum + v.quantidade, 0)
    const produtosUnicos = matrizData.produtos.length
    const mesesAtivos = matrizData.meses.length
    const mediaVendas = Math.round(totalVendas / mesesAtivos)

    // Top 5 products
    const top5Produtos = matrizData.produtos
        .map(p => ({
            nome: p.produto,
            total: matrizData.meses.reduce((sum, mes) => sum + (p[mes] || 0), 0)
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)

    const maxTotal = top5Produtos[0]?.total || 1

    // Sales by month for bar chart
    const vendasPorMes = matrizData.meses.map(mes => ({
        mes,
        total: matrizData.produtos.reduce((sum, p) => sum + (p[mes] || 0), 0)
    }))

    // Map vendas to aggregated values data
    const vendasAgrupadas = {}
    vendas.forEach(v => {
        const prodKey = v.produto_nome || v.produto // Use same key as matrix
        const mesKey = v.mes_ref

        if (!vendasAgrupadas[prodKey]) vendasAgrupadas[prodKey] = {}
        if (!vendasAgrupadas[prodKey][mesKey]) vendasAgrupadas[prodKey][mesKey] = { qtd: 0, valor: 0 }

        vendasAgrupadas[prodKey][mesKey].qtd += v.quantidade || 0
        vendasAgrupadas[prodKey][mesKey].valor += v.valor_total || v.valor || 0
    })

    // ===== ANÁLISE DO ANO TODO =====

    // Calcular TOTAL vendido de cada produto no ano
    const produtosComTotal = matrizData.produtos.map(p => {
        const vendasPorMesProduto = matrizData.meses.map((mes, idx) => {
            // Get from aggregated map to ensure we have values
            const dadosMes = vendasAgrupadas[p.produto]?.[mes] || { qtd: 0, valor: 0 }

            return {
                mes,
                idx,
                quantidade: dadosMes.qtd,
                valor: dadosMes.valor,
                nomeMes: mes
            }
        })

        const totalAno = vendasPorMesProduto.reduce((sum, m) => sum + m.quantidade, 0)

        // Calcular tendência (primeira metade vs segunda metade do ano)
        const metade = Math.ceil(vendasPorMesProduto.length / 2)
        const primeiraMeta = vendasPorMesProduto.slice(0, metade)
        const segundaMetade = vendasPorMesProduto.slice(metade)

        const totalPrimeiraMeta = primeiraMeta.reduce((sum, m) => sum + m.quantidade, 0)
        const totalSegundaMetade = segundaMetade.reduce((sum, m) => sum + m.quantidade, 0)

        // Média por mês em cada metade
        const mediaPrimeiraMeta = totalPrimeiraMeta / primeiraMeta.length
        const mediaSegundaMetade = totalSegundaMetade / segundaMetade.length

        // Variação percentual
        const variacao = mediaPrimeiraMeta > 0
            ? Math.round(((mediaSegundaMetade - mediaPrimeiraMeta) / mediaPrimeiraMeta) * 100)
            : (mediaSegundaMetade > 0 ? 100 : 0)

        // Últimos 3 meses venderam?
        const ultimos3Meses = vendasPorMesProduto.slice(-3)
        const vendeuUltimos3 = ultimos3Meses.some(m => m.quantidade > 0)

        // Primeiros 3 meses venderam?
        const primeiros3Meses = vendasPorMesProduto.slice(0, 3)
        const vendeuPrimeiros3 = primeiros3Meses.some(m => m.quantidade > 0)

        return {
            nome: p.produto,
            vendasPorMes: vendasPorMesProduto, // INCLUÍDO DADOS MENSAIS COM VALOR
            totalAno,
            totalPrimeiraMeta,
            totalSegundaMetade,
            mediaPrimeiraMeta: Math.round(mediaPrimeiraMeta),
            mediaSegundaMetade: Math.round(mediaSegundaMetade),
            variacao,
            vendeuUltimos3,
            vendeuPrimeiros3,
            parouDeVender: vendeuPrimeiros3 && !vendeuUltimos3 && totalPrimeiraMeta > 0,
            emQueda: variacao < -20 && totalAno > 0,
            emAlta: variacao > 20 && totalAno > 0
        }
    })

    // Filter ESSENTIALS (Favoritos) from computed products
    const produtosEssenciais = produtosComTotal.filter(p => favoritos.includes(p.nome))

    // Sort essentials by priority: Stopped > Decline > Growth
    const essenciaisOrdenados = [...produtosEssenciais].sort((a, b) => {
        if (a.parouDeVender && !b.parouDeVender) return -1
        if (!a.parouDeVender && b.parouDeVender) return 1
        if (a.emQueda && !b.emQueda) return -1
        if (!a.emQueda && b.emQueda) return 1
        return a.variacao - b.variacao // ascending variacao (most negative first)
    })

    // Pagination for Essentials
    const totalPaginasEssenciais = Math.ceil(essenciaisOrdenados.length / ITEMS_PER_PAGE)
    const essenciaisPaginados = essenciaisOrdenados.slice(paginaEssenciais * ITEMS_PER_PAGE, (paginaEssenciais + 1) * ITEMS_PER_PAGE)


    // TODOS os Produtos em QUEDA (tendência negativa ao longo do ano)
    const produtosEmQueda = produtosComTotal
        .filter(p => p.emQueda)
        .sort((a, b) => a.variacao - b.variacao)

    // TODOS os Produtos que DEIXARAM DE VENDER (vendiam no início, não vendem mais)
    const produtosParados = produtosComTotal
        .filter(p => p.parouDeVender)
        .sort((a, b) => b.totalPrimeiraMeta - a.totalPrimeiraMeta)

    // TODOS os Produtos em ALTA (tendência positiva ao longo do ano)
    const produtosEmAlta = produtosComTotal
        .filter(p => p.emAlta)
        .sort((a, b) => b.variacao - a.variacao)

    // Paginação helpers
    const totalPaginasQueda = Math.ceil(produtosEmQueda.length / ITEMS_PER_PAGE)
    const totalPaginasAlta = Math.ceil(produtosEmAlta.length / ITEMS_PER_PAGE)
    const totalPaginasParados = Math.ceil(produtosParados.length / ITEMS_PER_PAGE)

    const produtosQuedaPaginados = produtosEmQueda.slice(paginaQueda * ITEMS_PER_PAGE, (paginaQueda + 1) * ITEMS_PER_PAGE)
    const produtosAltaPaginados = produtosEmAlta.slice(paginaAlta * ITEMS_PER_PAGE, (paginaAlta + 1) * ITEMS_PER_PAGE)
    const produtosParadosPaginados = produtosParados.slice(paginaParados * ITEMS_PER_PAGE, (paginaParados + 1) * ITEMS_PER_PAGE)

    // Max para barras
    const maxQueda = produtosEmQueda.length > 0 ? Math.abs(produtosEmQueda[0]?.variacao) : 1
    const maxCrescimento = produtosEmAlta[0]?.variacao || 1

    // Tendência Geral do Ano (comparando primeiro com último mês)
    const totalPrimeiroMes = vendasPorMes[0]?.total || 0
    const totalUltimoMes = vendasPorMes[vendasPorMes.length - 1]?.total || 0
    const tendenciaGeral = totalPrimeiroMes > 0
        ? Math.round(((totalUltimoMes - totalPrimeiroMes) / totalPrimeiroMes) * 100)
        : 0

    // Alertas importantes
    const alertas = []
    if (produtosParados.length > 0) alertas.push(`⚠️ ${produtosParados.length} produtos pararam de vender`)
    if (produtosEmQueda.length > 5) alertas.push(`📉 ${produtosEmQueda.length} produtos em queda acentuada`)

    // Chart colors
    const gradientColors = [
        'rgba(59, 130, 246, 0.9)',   // Blue
        'rgba(139, 92, 246, 0.9)',   // Purple
        'rgba(6, 182, 212, 0.9)',    // Cyan
        'rgba(16, 185, 129, 0.9)',   // Emerald
        'rgba(245, 158, 11, 0.9)',
    ]

    const gradientBorders = [
        'rgba(59, 130, 246, 1)',
        'rgba(139, 92, 246, 1)',
        'rgba(6, 182, 212, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(245, 158, 11, 1)',
    ]

    // Calcular valores totais por mês para o gráfico
    const valoresPorMesMap = {}
    vendas.forEach(v => {
        const mesKey = v.mes_ref
        valoresPorMesMap[mesKey] = (valoresPorMesMap[mesKey] || 0) + (v.valor_total || v.valor || 0)
    })

    const valoresPorMes = matrizData.meses.map(mes => valoresPorMesMap[mes] || 0)

    // Doughnut Chart Data
    const doughnutData = {
        labels: top5Produtos.map(p => p.nome),
        datasets: [{
            data: top5Produtos.map(p => p.total),
            backgroundColor: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'],
            borderWidth: 0
        }]
    }

    const doughnutOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'right', labels: { color: '#fff' } }
        },
        maintainAspectRatio: false
    }

    // Bar Chart Data
    const barData = {
        labels: vendasPorMes.map((v, i) => [
            v.mes,
            (valoresPorMes[i] || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
        ]),
        datasets: [{
            label: 'Vendas Totais (Qtd)',
            data: vendasPorMes.map(v => v.total),
            backgroundColor: '#3b82f6',
            borderRadius: 4
        }]
    }

    const barOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx) => {
                        const val = valoresPorMes[ctx.dataIndex]
                        return [
                            `Quantidade: ${ctx.raw}`,
                            `Valor: ${val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
                        ]
                    }
                }
            }
        },
        scales: {
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#9ca3af' }
            },
            x: {
                grid: { display: false },
                ticks: {
                    color: '#9ca3af',
                    font: { size: 11 }
                }
            }
        },
        maintainAspectRatio: false
    }

    return (
        <div className="client-dashboard">
            {/* Header com Alertas */}
            <div className="dashboard-header">
                <div>
                    <h2>Análise Anual: {ano}</h2>
                    <p className="dashboard-subtitle">Visão geral de desempenho do cliente {cliente.nome}</p>
                </div>
                <div className="alerts-container">
                    {alertas.map((alerta, idx) => (
                        <div key={idx} className="dashboard-alert">
                            {alerta}
                        </div>
                    ))}
                </div>
            </div>

            {/* Stats Row */}
            <div className="stats-row">
                <Card className="stat-card">
                    <div className="stat-icon blue">💰</div>
                    <div className="stat-info">
                        <span className="stat-label-dash">Total Vendas</span>
                        <h3 className="stat-value-dash">{totalVendas.toLocaleString('pt-BR')}</h3>
                    </div>
                </Card>
                <Card className="stat-card">
                    <div className="stat-icon purple">📦</div>
                    <div className="stat-info">
                        <span className="stat-label-dash">Produtos</span>
                        <h3 className="stat-value-dash">{produtosUnicos}</h3>
                    </div>
                </Card>
                <Card className="stat-card">
                    <div className="stat-icon green">📅</div>
                    <div className="stat-info">
                        <span className="stat-label-dash">Média Mensal</span>
                        <h3 className="stat-value-dash">{mediaVendas.toLocaleString('pt-BR')}</h3>
                    </div>
                </Card>
                <Card className="stat-card">
                    <div className="stat-icon orange">📈</div>
                    <div className="stat-info">
                        <span className="stat-label-dash">Tendência</span>
                        <h3 className="stat-value-dash">{tendenciaGeral >= 0 ? '+' : ''}{tendenciaGeral}%</h3>
                    </div>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="charts-row">
                {/* Doughnut Chart */}
                <Card className="chart-card">
                    <h4 className="chart-title">🏆 Top 5 Produtos</h4>
                    <p className="chart-subtitle">Distribuição de vendas no período</p>
                    <div className="chart-container doughnut-container">
                        <Doughnut data={doughnutData} options={doughnutOptions} />
                    </div>
                </Card>

                {/* Bar Chart */}
                <Card className="chart-card chart-wide">
                    <h4 className="chart-title">📊 Vendas por Mês</h4>
                    <p className="chart-subtitle">Performance mensal</p>
                    <div className="chart-container bar-container">
                        <Bar data={barData} options={barOptions} />
                    </div>
                </Card>
            </div>

            {/* ⭐ ANÁLISE DE ESSENCIAIS - TABELA MÊS A MÊS */}
            <Card className="ranking-card full-width" style={{ marginTop: 'var(--space-6)', overflow: 'hidden' }}>
                <div className="ranking-header">
                    <span className="ranking-icon" style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', border: '1px solid #fbbf24' }}>⭐</span>
                    <div>
                        <h4>Análise de Produtos Essenciais (Mês a Mês)</h4>
                        <p>Acompanhamento detalhado ({essenciaisOrdenados.length} essenciais)</p>
                    </div>
                </div>

                <div className="essential-table-container">
                    <table className="essential-table">
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', paddingLeft: 'var(--space-4)' }}>PRODUTO ESSENCIAL</th>
                                {matrizData.meses.map((mes, idx) => (
                                    <th key={idx} title={mes}>{idx + 1 < 10 ? `0${idx + 1}` : idx + 1}</th>
                                ))}
                                <th>AÇÕES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {essenciaisPaginados.length > 0 ? essenciaisPaginados.map((produto, index) => (
                                <tr key={index} className={produto.parouDeVender ? 'row-stopped' : ''}>
                                    <td className="product-name-cell">
                                        <span className="essential-star">⭐</span>
                                        {produto.nome}
                                    </td>
                                    {produto.vendasPorMes.map((venda, mIndex) => {
                                        let cellClass = 'cell-default'
                                        if (venda.quantidade === 0) cellClass = 'cell-zero'
                                        else if (venda.quantidade > produto.mediaPrimeiraMeta * 1.5) cellClass = 'cell-high'
                                        else if (venda.quantidade < produto.mediaPrimeiraMeta * 0.5) cellClass = 'cell-low'

                                        // Destaque para parou de vender
                                        if (produto.parouDeVender && mIndex >= produto.vendasPorMes.length - 3 && venda.quantidade === 0) {
                                            cellClass = 'cell-stopped'
                                        }

                                        return (
                                            <td key={mIndex} className={`month-cell ${cellClass}`}>
                                                {venda.quantidade}
                                            </td>
                                        )
                                    })}
                                    <td className="actions-cell">
                                        <button
                                            className="action-btn delete"
                                            title="Remover dos favoritos"
                                            onClick={() => onToggleFavorito && onToggleFavorito(produto.nome)}
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={matrizData.meses.length + 2} className="table-empty">
                                        ⭐ Nenhum produto essencial registrado. Adicione favoritos na aba Essenciais.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPaginasEssenciais > 1 && (
                    <div className="pagination-controls">
                        <button
                            className="pagination-btn"
                            onClick={() => setPaginaEssenciais(p => Math.max(0, p - 1))}
                            disabled={paginaEssenciais === 0}
                        >
                            ← Anterior
                        </button>
                        <span className="pagination-info">
                            {paginaEssenciais + 1} / {totalPaginasEssenciais}
                        </span>
                        <button
                            className="pagination-btn"
                            onClick={() => setPaginaEssenciais(p => Math.min(totalPaginasEssenciais - 1, p + 1))}
                            disabled={paginaEssenciais >= totalPaginasEssenciais - 1}
                        >
                            Próximo →
                        </button>
                    </div>
                )}
            </Card>

            {/* ⚠️ SEÇÃO PRINCIPAL: PARADOS DE COMPRAR + EM QUEDA */}
            <div className="section-title highlight">
                <h3>⚠️ Atenção: Produtos que Precisam de Análise</h3>
                <p>Produtos que pararam de vender ou estão em queda ao longo do ano</p>
            </div>

            <div className="ranking-section">
                {/* PARARAM DE COMPRAR - MAIS IMPORTANTE */}
                <Card className="ranking-card highlight-card">
                    <div className="ranking-header">
                        <span className="ranking-icon warning">🚨</span>
                        <div>
                            <h4>Pararam de Comprar</h4>
                            <p>Vendiam no início, não vendem mais ({produtosParados.length} produtos)</p>
                        </div>
                    </div>
                    <div className="ranking-list">
                        {produtosParadosPaginados.length > 0 ? produtosParadosPaginados.map((produto, index) => (
                            <div key={index} className="ranking-item">
                                <div className="ranking-badge warning">
                                    #{paginaParados * ITEMS_PER_PAGE + index + 1}
                                </div>
                                <div className="ranking-info">
                                    <span className="ranking-name">{produto.nome}</span>
                                    <div className="ranking-bar-bg">
                                        <div
                                            className="ranking-bar warning"
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                </div>
                                <div className="ranking-stats">
                                    <span className="ranking-value warning">PAROU</span>
                                    <span className="ranking-detail">Tinha: {produto.totalPrimeiraMeta.toLocaleString('pt-BR')}</span>
                                </div>
                            </div>
                        )) : (
                            <div className="ranking-empty">✅ Todos os produtos ainda estão ativos!</div>
                        )}
                    </div>
                    {totalPaginasParados > 1 && (
                        <div className="pagination-controls">
                            <button
                                className="pagination-btn"
                                onClick={() => setPaginaParados(p => Math.max(0, p - 1))}
                                disabled={paginaParados === 0}
                            >
                                ← Anterior
                            </button>
                            <span className="pagination-info">
                                {paginaParados + 1} / {totalPaginasParados}
                            </span>
                            <button
                                className="pagination-btn"
                                onClick={() => setPaginaParados(p => Math.min(totalPaginasParados - 1, p + 1))}
                                disabled={paginaParados >= totalPaginasParados - 1}
                            >
                                Próximo →
                            </button>
                        </div>
                    )}
                </Card>

                {/* EM QUEDA */}
                <Card className="ranking-card">
                    <div className="ranking-header">
                        <span className="ranking-icon danger">📉</span>
                        <div>
                            <h4>Produtos em Queda</h4>
                            <p>Vendendo menos na 2ª metade ({produtosEmQueda.length} produtos)</p>
                        </div>
                    </div>
                    <div className="ranking-list">
                        {produtosQuedaPaginados.length > 0 ? produtosQuedaPaginados.map((produto, index) => (
                            <div key={index} className="ranking-item">
                                <div className={`ranking-badge ${index < 3 && paginaQueda === 0 ? 'top-three' : ''}`}>
                                    #{paginaQueda * ITEMS_PER_PAGE + index + 1}
                                </div>
                                <div className="ranking-info">
                                    <span className="ranking-name">{produto.nome}</span>
                                    <div className="ranking-bar-bg">
                                        <div
                                            className="ranking-bar danger"
                                            style={{ width: `${(Math.abs(produto.variacao) / maxQueda) * 100}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="ranking-stats">
                                    <span className="ranking-value danger">{produto.variacao}%</span>
                                    <span className="ranking-detail">Total: {produto.totalAno.toLocaleString('pt-BR')}</span>
                                </div>
                            </div>
                        )) : (
                            <div className="ranking-empty">✅ Nenhum produto em queda!</div>
                        )}
                    </div>
                    {totalPaginasQueda > 1 && (
                        <div className="pagination-controls">
                            <button
                                className="pagination-btn"
                                onClick={() => setPaginaQueda(p => Math.max(0, p - 1))}
                                disabled={paginaQueda === 0}
                            >
                                ← Anterior
                            </button>
                            <span className="pagination-info">
                                {paginaQueda + 1} / {totalPaginasQueda}
                            </span>
                            <button
                                className="pagination-btn"
                                onClick={() => setPaginaQueda(p => Math.min(totalPaginasQueda - 1, p + 1))}
                                disabled={paginaQueda >= totalPaginasQueda - 1}
                            >
                                Próximo →
                            </button>
                        </div>
                    )}
                </Card>
            </div>

            {/* PRODUTOS EM ALTA */}
            <div className="section-title success">
                <h3>🚀 Produtos em Alta</h3>
                <p>Crescendo vendas ao longo do ano ({produtosEmAlta.length} produtos)</p>
            </div>

            <Card className="ranking-card full-width">
                <div className="ranking-list-grid">
                    {produtosAltaPaginados.length > 0 ? produtosAltaPaginados.map((produto, index) => (
                        <div key={index} className="ranking-item">
                            <div className={`ranking-badge success ${index < 3 && paginaAlta === 0 ? 'top-three' : ''}`}>
                                #{paginaAlta * ITEMS_PER_PAGE + index + 1}
                            </div>
                            <div className="ranking-info">
                                <span className="ranking-name">{produto.nome}</span>
                                <div className="ranking-bar-bg">
                                    <div
                                        className="ranking-bar success"
                                        style={{ width: `${(produto.variacao / maxCrescimento) * 100}%` }}
                                    />
                                </div>
                            </div>
                            <div className="ranking-stats">
                                <span className="ranking-value success">+{produto.variacao}%</span>
                                <span className="ranking-detail">Total: {produto.totalAno.toLocaleString('pt-BR')}</span>
                            </div>
                        </div>
                    )) : (
                        <div className="ranking-empty">📊 Sem crescimento detectado</div>
                    )}
                </div>
                {totalPaginasAlta > 1 && (
                    <div className="pagination-controls">
                        <button
                            className="pagination-btn"
                            onClick={() => setPaginaAlta(p => Math.max(0, p - 1))}
                            disabled={paginaAlta === 0}
                        >
                            ← Anterior
                        </button>
                        <span className="pagination-info">
                            {paginaAlta + 1} / {totalPaginasAlta}
                        </span>
                        <button
                            className="pagination-btn"
                            onClick={() => setPaginaAlta(p => Math.min(totalPaginasAlta - 1, p + 1))}
                            disabled={paginaAlta >= totalPaginasAlta - 1}
                        >
                            Próximo →
                        </button>
                    </div>
                )}
            </Card>

            {/* NOVA SEÇÃO: Análise de Desempenho */}
            <div className="section-title">
                <h3>📊 Resumo do Ano</h3>
                <p>Análise comparativa da 1ª metade vs 2ª metade do ano</p>
            </div>

            <div className="analysis-row">
                {/* Produtos em Queda */}
                <Card className="analysis-card danger">
                    <div className="analysis-header">
                        <span className="analysis-icon">📉</span>
                        <div>
                            <h4>Em Queda</h4>
                            <p>Vendendo menos na 2ª metade</p>
                        </div>
                    </div>
                    <div className="analysis-list">
                        {produtosEmQueda.length > 0 ? produtosEmQueda.slice(0, 5).map((p, idx) => (
                            <div key={idx} className="analysis-item">
                                <span className="item-name">{p.nome}</span>
                                <div className="item-stats">
                                    <span className="item-change negative">{p.variacao}%</span>
                                    <span className="item-detail">{p.totalAno.toLocaleString('pt-BR')} un</span>
                                </div>
                            </div>
                        )) : (
                            <div className="no-data-small">✅ Nenhum produto em queda</div>
                        )}
                    </div>
                </Card>

                {/* Produtos Parados */}
                <Card className="analysis-card warning">
                    <div className="analysis-header">
                        <span className="analysis-icon">⚠️</span>
                        <div>
                            <h4>Pararam de Vender</h4>
                            <p>Não venderam nos últimos 3 meses</p>
                        </div>
                    </div>
                    <div className="analysis-list">
                        {produtosParados.length > 0 ? produtosParados.slice(0, 5).map((p, idx) => (
                            <div key={idx} className="analysis-item">
                                <span className="item-name">{p.nome}</span>
                                <div className="item-stats">
                                    <span className="item-change zero">PAROU</span>
                                    <span className="item-detail">Tinha: {p.totalPrimeiraMeta.toLocaleString('pt-BR')}</span>
                                </div>
                            </div>
                        )) : (
                            <div className="no-data-small">✅ Todos os produtos ativos</div>
                        )}
                    </div>
                </Card>

                {/* Produtos em Alta */}
                <Card className="analysis-card success">
                    <div className="analysis-header">
                        <span className="analysis-icon">🚀</span>
                        <div>
                            <h4>Em Alta</h4>
                            <p>Vendendo mais na 2ª metade</p>
                        </div>
                    </div>
                    <div className="analysis-list">
                        {produtosEmAlta.length > 0 ? produtosEmAlta.slice(0, 5).map((p, idx) => (
                            <div key={idx} className="analysis-item">
                                <span className="item-name">{p.nome}</span>
                                <div className="item-stats">
                                    <span className="item-change positive">+{p.variacao}%</span>
                                    <span className="item-detail">{p.totalAno.toLocaleString('pt-BR')} un</span>
                                </div>
                            </div>
                        )) : (
                            <div className="no-data-small">📊 Sem crescimento detectado</div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Observações e Insights */}
            <Card className="insights-card">
                <h4 className="chart-title">💡 Observações e Insights</h4>
                <div className="insights-grid">
                    <div className="insight-item">
                        <span className="insight-icon">📊</span>
                        <div>
                            <strong>Concentração de Vendas</strong>
                            <p>Os top 5 produtos representam {Math.round((top5Produtos.reduce((s, p) => s + p.total, 0) / totalVendas) * 100)}% do total de vendas.</p>
                        </div>
                    </div>
                    <div className="insight-item">
                        <span className="insight-icon">📈</span>
                        <div>
                            <strong>Melhor Mês</strong>
                            <p>{vendasPorMes.reduce((max, v) => v.total > max.total ? v : max, vendasPorMes[0])?.mes} com {vendasPorMes.reduce((max, v) => v.total > max.total ? v : max, vendasPorMes[0])?.total.toLocaleString('pt-BR')} peças.</p>
                        </div>
                    </div>
                    <div className="insight-item">
                        <span className="insight-icon">📉</span>
                        <div>
                            <strong>Produtos em Risco</strong>
                            <p>{produtosEmQueda.length + produtosParados.length} produtos precisam de atenção (em queda ou parados).</p>
                        </div>
                    </div>
                    <div className="insight-item">
                        <span className="insight-icon">🎯</span>
                        <div>
                            <strong>Média por Produto</strong>
                            <p>{Math.round(totalVendas / produtosUnicos)} unidades vendidas por produto em média.</p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}
