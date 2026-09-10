"use client";

import { useState } from 'react';
import { User, Bell, Lock, Paintbrush, Shield, HelpCircle, Smartphone, Mail, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'profile', label: 'Profile Settings', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security & Privacy', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Paintbrush },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in space-y-8">
      {/* Header section with gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 to-blue-600 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <SettingsIcon className="w-48 h-48 animate-spin-slow" />
        </div>
        <div className="relative z-10 flex items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-2xl font-bold">
            PS
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings & Preferences</h1>
            <p className="text-blue-100 mt-2 text-lg">Manage your account, preferences, and clinical settings.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="md:col-span-1 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md scale-[1.02]"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-[1.01]"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="md:col-span-3">
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in">
              <Card className="border-0 shadow-lg ring-1 ring-black/5 rounded-2xl overflow-hidden">
                <CardHeader className="bg-muted/30 border-b pb-6">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" /> Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">First Name</label>
                      <input type="text" defaultValue="Priya" className="flex h-11 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Last Name</label>
                      <input type="text" defaultValue="Sharma" className="flex h-11 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email Address</label>
                    <input type="email" defaultValue="dr.priya.sharma@careguardian.health" disabled className="flex h-11 w-full rounded-lg border border-input bg-muted px-3 py-1 text-sm opacity-70 cursor-not-allowed" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Clinical Specialty</label>
                    <input type="text" defaultValue="Internal Medicine" className="flex h-11 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
                  </div>
                  <div className="pt-4">
                    <Button className="w-full sm:w-auto">Save Changes</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-fade-in">
              <Card className="border-0 shadow-lg ring-1 ring-black/5 rounded-2xl overflow-hidden">
                <CardHeader className="bg-muted/30 border-b pb-6">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" /> Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    <NotificationToggle icon={Mail} title="Email Alerts" desc="Receive daily summaries and critical alerts via email." defaultChecked />
                    <NotificationToggle icon={Smartphone} title="Push Notifications" desc="Get instant notifications on your mobile device." defaultChecked={false} />
                    <NotificationToggle icon={User} title="Patient Updates" desc="Notify me when a patient's status changes." defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-fade-in">
              <Card className="border-0 shadow-lg ring-1 ring-black/5 rounded-2xl overflow-hidden">
                <CardHeader className="bg-muted/30 border-b pb-6">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" /> Change Password
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Current Password</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="flex h-11 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
                      <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">New Password</label>
                    <input type="password" placeholder="••••••••" className="flex h-11 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
                  </div>
                  <div className="pt-4">
                    <Button>Update Password</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-fade-in">
              <Card className="border-0 shadow-lg ring-1 ring-black/5 rounded-2xl overflow-hidden">
                <CardHeader className="bg-muted/30 border-b pb-6">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Paintbrush className="h-5 w-5 text-primary" /> Appearance
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-6">Customize the look and feel of your dashboard.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border-2 border-primary p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="h-20 bg-white rounded-lg border shadow-sm flex items-center justify-center mb-3">
                        <span className="font-semibold text-foreground">Light Mode</span>
                      </div>
                      <Badge className="w-full justify-center">Active</Badge>
                    </div>
                    <div className="rounded-xl border-2 border-transparent p-4 cursor-pointer hover:bg-muted/50 transition-colors opacity-70">
                      <div className="h-20 bg-slate-900 rounded-lg border shadow-sm flex items-center justify-center mb-3">
                        <span className="font-semibold text-white">Dark Mode</span>
                      </div>
                      <Badge variant="outline" className="w-full justify-center">Coming Soon</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function NotificationToggle({ icon: Icon, title, desc, defaultChecked = false }: any) {
  const [enabled, setEnabled] = useState(defaultChecked);
  
  return (
    <div className="flex items-center justify-between p-6 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold">{title}</h4>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
      </div>
      <button 
        onClick={() => setEnabled(!enabled)}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          enabled ? "bg-primary" : "bg-input"
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
            enabled ? "translate-x-5" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}
