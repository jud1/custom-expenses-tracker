import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, Check, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';
import { UserAvatar } from '../UserAvatar';
import { cn } from '../../lib/utils';

export function ImportExpensesModal({ isOpen, onClose, account, onImport }) {
    const [expenses, setExpenses] = useState(null);
    const [error, setError] = useState(null);
    const [fileName, setFileName] = useState(null);
    const [isImporting, setIsImporting] = useState(false);

    if (!isOpen) return null;

    const excelDateToJSDate = (serial) => {
        const utc_days = Math.floor(serial - 25569);
        const utc_value = utc_days * 86400;
        const date_info = new Date(utc_value * 1000);

        const day = date_info.getDate().toString().padStart(2, '0');
        const month = (date_info.getMonth() + 1).toString().padStart(2, '0');
        const year = date_info.getFullYear();

        return `${day}-${month}-${year}`;
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.xlsx')) {
            setError('Please upload a valid Excel file (.xlsx)');
            return;
        }

        setFileName(file.name);
        setError(null);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const workbook = XLSX.read(bstr, { type: 'binary' });
                const wsname = workbook.SheetNames[0];
                const ws = workbook.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                // Map and format data
                const mappedData = data.map((row, index) => ({
                    id: index,
                    date: excelDateToJSDate(row['FECHA']),
                    title: row['DESCRIPCION'],
                    amount: row[' MONTO'] || row['MONTO'], // Handle potential leading space
                    selected: true,
                    participants: account?.members.map(m => m.id) || []
                }));

                setExpenses(mappedData);
            } catch (err) {
                console.error("Error parsing file:", err);
                setError('Failed to parse the file. Please ensure it is a valid Excel file.');
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleClose = () => {
        setExpenses(null);
        setError(null);
        setFileName(null);
        setIsImporting(false);
        onClose();
    };

    const toggleExpenseSelection = (id) => {
        setExpenses(prev => prev.map(exp =>
            exp.id === id ? { ...exp, selected: !exp.selected } : exp
        ));
    };

    const toggleParticipant = (expenseId, userId) => {
        setExpenses(prev => prev.map(exp => {
            if (exp.id !== expenseId) return exp;

            const newParticipants = exp.participants.includes(userId)
                ? exp.participants.filter(id => id !== userId)
                : [...exp.participants, userId];

            return { ...exp, participants: newParticipants };
        }));
    };

    const handleImport = async () => {
        const selectedExpenses = expenses.filter(e => e.selected);
        if (selectedExpenses.length === 0) return;

        setIsImporting(true);
        try {
            await onImport(selectedExpenses);
        } catch (err) {
            console.error("Import error:", err);
            setError("Failed to import expenses.");
            setIsImporting(false);
        }
    };

    const formatCLP = (amount) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl scale-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                            <FileSpreadsheet className="text-green-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Import Expenses</h2>
                            {expenses && <p className="text-sm text-gray-500">{expenses.filter(e => e.selected).length} selected</p>}
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
                    {!expenses ? (
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 flex flex-col items-center justify-center text-center hover:border-primary/50 hover:bg-white transition-all cursor-pointer relative bg-white">
                            <input
                                type="file"
                                accept=".xlsx"
                                onChange={handleFileUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="bg-indigo-50 p-4 rounded-full mb-4">
                                <Upload className="text-primary" size={32} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Upload Excel File</h3>
                            <p className="text-gray-500 text-sm max-w-xs">
                                Drag and drop your .xlsx file here or click to browse
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {expenses.map((expense) => (
                                <div
                                    key={expense.id}
                                    className={cn(
                                        "bg-white rounded-xl p-4 shadow-sm border transition-all flex flex-col md:flex-row md:items-center gap-4",
                                        expense.selected ? "border-gray-200" : "border-transparent opacity-60 bg-gray-50"
                                    )}
                                >
                                    {/* Participants (Left) */}
                                    <div className="flex items-center gap-1 md:w-1/4">
                                        {account?.members.map(member => {
                                            const isSelected = expense.participants.includes(member.id);
                                            return (
                                                <button
                                                    key={member.id}
                                                    onClick={() => toggleParticipant(expense.id, member.id)}
                                                    disabled={!expense.selected}
                                                    className={cn(
                                                        "relative transition-all rounded-full border-2",
                                                        isSelected
                                                            ? "border-primary scale-100 opacity-100"
                                                            : "border-transparent scale-90 opacity-40 grayscale hover:opacity-70"
                                                    )}
                                                    title={member.name}
                                                >
                                                    <UserAvatar avatar={member.avatar} name={member.name} size="sm" />
                                                    {isSelected && (
                                                        <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-0.5 border border-white">
                                                            <Check size={8} />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Details (Center) */}
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                                        <div className="md:col-span-3 flex items-center gap-2 text-sm text-gray-500">
                                            <Calendar size={14} />
                                            <span>{expense.date}</span>
                                        </div>
                                        <div className="md:col-span-6 font-medium text-gray-900 truncate" title={expense.title}>
                                            {expense.title}
                                        </div>
                                        <div className="md:col-span-3 font-bold text-gray-900 md:text-right">
                                            {formatCLP(expense.amount)}
                                        </div>
                                    </div>

                                    {/* Checkbox (Right) */}
                                    <div className="flex items-center justify-end md:w-12 border-l pl-4 border-gray-100">
                                        <input
                                            type="checkbox"
                                            checked={expense.selected}
                                            onChange={() => toggleExpenseSelection(expense.id)}
                                            className="w-5 h-5 rounded text-primary focus:ring-primary border-gray-300 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0 bg-white rounded-b-2xl">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={!expenses || expenses.filter(e => e.selected).length === 0 || isImporting}
                        className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/30"
                    >
                        {isImporting ? 'Importing...' : `Import ${expenses ? `(${expenses.filter(e => e.selected).length})` : ''}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
