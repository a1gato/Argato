import React, { useState, useRef, useEffect, useMemo } from 'react';

interface Option {
    label: string;
    value: string;
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    label?: string;
    placeholder?: string;
    className?: string;
    onCreate?: (name: string) => void;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
    value,
    onChange,
    options,
    label,
    placeholder = 'Select an option',
    className = '',
    onCreate
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = useMemo(() => {
        const safeOptions = (options || []).filter(opt => opt && typeof opt.label === 'string');
        if (!searchTerm) return safeOptions;
        return safeOptions.filter(opt =>
            (opt.label || '').toLowerCase().includes((searchTerm || '').toLowerCase())
        );
    }, [options, searchTerm]);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {label && (
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                    {label}
                </label>
            )}

            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full px-4 py-2.5 rounded-xl border bg-white cursor-pointer flex justify-between items-center transition-all duration-200
                    ${isOpen
                        ? 'border-blue-500 ring-4 ring-blue-500/10 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300'
                    }
                `}
            >
                <span className={`text-sm ${selectedOption ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>

                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
            </div>

            {isOpen && (
                <div className="absolute z-[110] w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top">
                    <div className="p-2 border-b border-gray-50 bg-gray-50/50">
                        <div className="relative">
                            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                ref={inputRef}
                                type="text"
                                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-400 transition-colors"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                onClick={e => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    <ul className="py-1 max-h-64 overflow-auto scrollbar-thin scrollbar-thumb-gray-200">
                        {filteredOptions.length === 0 && !onCreate ? (
                            <li className="px-4 py-8 text-center text-sm text-slate-400 italic">
                                No results found
                            </li>
                        ) : (
                            <>
                                {filteredOptions.map((option) => (
                                    <li
                                        key={option.value}
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                        }}
                                        className={`
                                        px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between
                                        ${value === option.value
                                                ? 'bg-blue-50 text-blue-700 font-semibold'
                                                : 'text-slate-600 hover:bg-gray-50 hover:text-slate-900'
                                            }
                                    `}
                                    >
                                        {option.label}
                                        {value === option.value && (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </li>
                                ))}
                                {onCreate && (searchTerm || '') && !filteredOptions.some(o => (o.label || '').toLowerCase() === (searchTerm || '').toLowerCase()) && (
                                    <li
                                        onClick={() => {
                                            onCreate(searchTerm);
                                            setIsOpen(false);
                                        }}
                                        className="px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center gap-2 text-blue-600 hover:bg-blue-50 border-t border-gray-50 font-medium"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Create "{searchTerm}"
                                    </li>
                                )}
                            </>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};
