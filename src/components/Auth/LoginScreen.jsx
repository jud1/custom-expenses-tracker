import React from 'react';
import { UserCircle2, ArrowRight } from 'lucide-react';

const USERS = [
    { id: 'u1', name: 'Liin', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Liin' },
    { id: 'u2', name: 'Hose', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hose' },
];

export function LoginScreen({ onLogin }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
                        <UserCircle2 size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
                    <p className="text-gray-500 mt-2">Who is using the app today?</p>
                </div>

                <div className="space-y-4">
                    {USERS.map(user => (
                        <button
                            key={user.id}
                            onClick={() => onLogin(user)}
                            className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all group bg-gray-50 hover:bg-white"
                        >
                            <div className="flex items-center gap-4">
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-12 h-12 rounded-full bg-white shadow-sm"
                                />
                                <div className="text-left">
                                    <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors text-lg">
                                        {user.name}
                                    </h3>
                                    <p className="text-xs text-gray-500">Click to login</p>
                                </div>
                            </div>
                            <ArrowRight className="text-gray-300 group-hover:text-primary transition-colors" />
                        </button>
                    ))}
                </div>

                <p className="text-center text-xs text-gray-400 mt-8">
                    Mock Login System
                </p>
            </div>
        </div>
    );
}
