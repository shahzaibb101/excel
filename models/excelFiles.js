// models/ExcelFile.js

const mongoose = require('mongoose');

const excelFileSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

const ExcelFile = mongoose.model('ExcelFile', excelFileSchema);

module.exports = ExcelFile;