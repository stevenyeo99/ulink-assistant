const archiver = require('archiver');

function zip(src, output) {
    
    const archive = archiver('zip', {
        zlib: {
            level: 9
        }
    });

    archive.on('error', function(err) {
      throw err;
    });

    archive.pipe(output);

    archive.directory(src, false);

    archive.finalize();
}

module.exports = {
    zip
};