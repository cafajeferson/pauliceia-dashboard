import { parseCSV } from './src/utils/csvParser.js';

const TEST_FILES = [
    '01.csv',
    'Jucar 01.csv',
    'Jucar 2025 01.csv',
    'Jucar 123 01.csv',
    'Jucar 24 10.csv',
    '2024 Jucar 01.csv',
    '2024 Jucar 02.csv'
];

const CONTENT = "produto;quantidade\nA;1";

console.log('--- Checking Filename Parsing ---');
TEST_FILES.forEach(file => {
    try {
        const { mes } = parseCSV(CONTENT, file);
        console.log(`File: "${file}" -> Month: "${mes}"`);
    } catch (e) {
        console.log(`File: "${file}" -> Error: ${e.message}`);
    }
});
