import React from 'react';
import { LayoutDashboard, CreditCard, Users, Settings, Bell, Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import { UserAvatar } from '../UserAvatar';

const SidebarItem = ({ icon: Icon, label, active }) => (
    <div className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 group",
        active ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-gray-500 hover:bg-white hover:shadow-sm"
    )}>
        <Icon size={20} className={cn(active ? "text-white" : "text-gray-400 group-hover:text-primary")} />
        <span className="font-medium">{label}</span>
    </div>
);

export function DashboardLayout({ children, currentUser }) {
    return (
        <div className="flex h-screen bg-background font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-background flex-shrink-0 flex flex-col border-r border-gray-200/50 hidden md:flex">
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <CreditCard className="text-white" size={20} />
                        </div>
                        <span className="text-xl font-bold text-gray-800">SplitCard</span>
                    </div>

                    <nav className="space-y-2">
                        <SidebarItem icon={LayoutDashboard} label="Dashboard" active />
                        <SidebarItem icon={Users} label="Friends" />
                        <SidebarItem icon={CreditCard} label="Cards" />
                        <SidebarItem icon={Settings} label="Settings" />
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Header */}
                <header className="h-20 px-8 flex items-center justify-between bg-background/50 backdrop-blur-sm z-10">
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

                    <div className="flex items-center gap-6">
                        <div className="relative hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search expenses..."
                                className="pl-10 pr-4 py-2 bg-white rounded-full border-none focus:ring-2 focus:ring-primary/20 text-sm w-64 shadow-sm"
                            />
                        </div>
                        <button className="relative p-2 rounded-full bg-white shadow-sm hover:bg-gray-50 transition-colors">
                            <Bell size={20} className="text-gray-600" />
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-danger rounded-full border-2 border-white"></span>
                        </button>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 p-[2px]">
                            <UserAvatar
                                avatar={currentUser?.avatar}
                                name={currentUser?.name}
                                size="md"
                                className="w-full h-full border-2 border-white"
                            />
                        </div>
                    </div>
                </header>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-8 pt-2">
                    <div className="max-w-6xl mx-auto space-y-8">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
