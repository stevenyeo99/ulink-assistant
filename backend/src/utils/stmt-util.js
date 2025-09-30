function cleanStmt(obj) {
    const out = {};

    for (const [k, v] of Object.entries(obj || {})) {
        if (v === undefined || v === null || v === "") continue; // drop empties
        out[k] = v;
    }

    return out;
}

module.exports = {
    cleanStmt
};