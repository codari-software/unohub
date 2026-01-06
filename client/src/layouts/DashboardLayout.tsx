import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Dashboard from '../components/Dashboard';
import Finance from '../components/Finance';
import Pomodoro from '../components/Pomodoro';
import Placeholder from '../components/Placeholder';

function DashboardLayout() {
    const [activeTab, setActiveTab] = useState('dashboard');

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <Dashboard />;
            case 'finance': return <Finance />;
            case 'pomodoro': return <Pomodoro />;
            default: return <Placeholder title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} />;
        }
    };

    return (
        <div id="root-container" className="flex h-full w-full bg-[#0f1115] text-white overflow-hidden">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <main className="flex-1 h-full overflow-y-auto overflow-x-hidden p-5 relative scroll-smooth pr-2 w-full max-w-full">
                <div className="max-w-7xl mx-auto h-full flex flex-col w-full">
                    <header className="mb-4 flex justify-between items-center py-3 bg-[#0f1115]/80 backdrop-blur-sm -mx-4 px-4">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-tight">
                            {activeTab === 'dashboard' ? 'Overview' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                        </h1>
                        <div className="flex gap-4 items-center bg-[#1e232d] p-1.5 pr-4 pl-2 rounded-full border border-white/5">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center font-bold text-white shadow-lg border border-white/10 text-sm">
                                GH
                            </div>
                            <span className="text-slate-300 font-medium text-sm">Gabriel</span>
                        </div>
                    </header>

                    <div className="animate-fade-in flex-1">
                        {renderContent()}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default DashboardLayout;
