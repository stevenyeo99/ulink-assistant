const fs = require('fs');
const XLSX = require('xlsx');
const OpenAI = require('openai');
const path = require('path');

const { OPENAI_KEY } = require('../../config');

console.log(OPENAI_KEY);

const client = new OpenAI({ apiKey: '' });

async function doStoreSGRecVector() {
    // 1. Convert file into CSV
    // console.log('1. Convert file into CSV');
    // const wb = XLSX.readFile(path.join(__dirname, 'Ulink Assist Dr Panel - SG - v2025.08.xlsx'));
    // const ws = wb.Sheets['Doctors'];
    // if (!ws) throw new Error('Sheet "Doctors" not found');
    // const csv = XLSX.utils.sheet_to_csv(ws);
    // fs.writeFileSync(path.join(__dirname, 'Ulink Assist Dr Panel - SG - v2025.08.csv'), csv);

    // 2. Create vector store & upload CSV
    console.log('2. Create vector store & upload PDF');
    const store = await client.vectorStores.create({ name: 'Ulink Doctors KB' });
    console.log(store);
    console.log(path.join(__dirname, 'Doctors.pdf'));
    await client.vectorStores.fileBatches.uploadAndPoll(store.id, {
        files: [fs.createReadStream(path.join(__dirname, 'Doctors.pdf'))]
    });

    const list = await client.vectorStores.list();
    console.log(list.data.map(v => ({ id: v.id, name: v.name, files: v.file_counts })));
    console.log(store);
}

module.exports = {
    doStoreSGRecVector
}