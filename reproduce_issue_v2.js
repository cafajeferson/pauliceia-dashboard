import { parseCSV } from './src/utils/csvParser.js';

// User scenario: 12 Jucar Frotas files
// Let's simulate hypothetical filenames they might have
const TEST_FILES = [
    'Jucar Frotas 01.csv',
    'Jucar Frotas 02.csv',
    'Jucar Frotas 03.csv',
    'Jucar Frotas 04.csv',
    'Jucar Frotas 05.csv',
    'Jucar Frotas 06.csv',
    'Jucar Frotas 07.csv',
    'Jucar Frotas 08.csv',
    'Jucar Frotas 09.csv',
    'Jucar Frotas 10.csv',
    'Jucar Frotas 11.csv',
    'Jucar Frotas 12.csv',
    'Jucar Frotas 2024 01.csv',
    'Vendas Janeiro.csv',
    'Vendas FEV.csv',
    'Março 2024.csv',
    'abr.csv',
    '05_maio.csv'
];

const CONTENT = "produto;quantidade\nA;1";

console.log('--- Deep Check Filename Parsing ---');
const results = {};
const summary = [];

TEST_FILES.forEach(file => {
    try {
        const { mes } = parseCSV(CONTENT, file);
        const status = results[mes] ? `COLLISION (with ${results[mes]})` : 'OK';
        summary.push({ file, mes, status });
        
        if (!results[mes]) results[mes] = file;
    } catch (e) {
        summary.push({ file, mes: 'ERROR', status: e.message });
    }
});

console.log(JSON.stringify(summary, null, 2));
