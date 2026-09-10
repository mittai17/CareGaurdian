'use client';

import { useState } from 'react';
import { User, Lock, Bell, Eye, EyeOff, CheckCircle2, Smartphone, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Password', icon: Lock },
];

export default function PatientProfilePage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-3xl bg-sky-600 text-white p-6 md:p-8 shadow-md flex items-center gap-6">
        <div className="h-20 w-20 rounded-full bg-white/20 border-4 border-white/40 flex items-center justify-center text-3xl font-black text-white flex-shrink-0">
          DS
        </div>
        <div>
          <p className="text-base font-black uppercase tracking-wider text-sky-100 mb-1">My Profile</p>
          <h1 className="text-3xl md:text-4xl font-extrabold">Devaki Sundaram</h1>
          <p className="text-xl text-sky-100 mt-1">Age 72 · Patient · Under care of Dr. Vikram Malhotra</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-3 flex-wrap">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-lg font-bold transition-all border-2',
                isActive
                  ? 'bg-sky-600 text-white border-sky-600 shadow-md'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-sky-400 hover:text-sky-700'
              )}
            >
              <Icon className="w-6 h-6" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card className="border-4 border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <CardHeader className="bg-slate-50 border-b-2 border-slate-200 p-6">
            <CardTitle className="text-2xl font-black flex items-center gap-2.5 text-slate-950">
              <User className="w-7 h-7 text-sky-600" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-lg font-bold text-slate-800">First Name</label>
                <input
                  type="text"
                  defaultValue="Devaki"
                  className="flex h-14 w-full rounded-2xl border-2 border-slate-300 bg-white px-4 text-xl font-semibold text-slate-900 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-lg font-bold text-slate-800">Last Name</label>
                <input
                  type="text"
                  defaultValue="Sundaram"
                  className="flex h-14 w-full rounded-2xl border-2 border-slate-300 bg-white px-4 text-xl font-semibold text-slate-900 focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-lg font-bold text-slate-800">Mobile Number</label>
              <input
                type="tel"
                defaultValue="+91 98401 23456"
                className="flex h-14 w-full rounded-2xl border-2 border-slate-300 bg-white px-4 text-xl font-semibold text-slate-900 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-lg font-bold text-slate-800">Email Address</label>
              <input
                type="email"
                defaultValue="devaki.sundaram@email.com"
                disabled
                className="flex h-14 w-full rounded-2xl border-2 border-slate-200 bg-slate-100 px-4 text-xl font-semibold text-slate-500 cursor-not-allowed"
              />
            </div>
            <div className="pt-2">
              <Button
                onClick={handleSave}
                className={cn(
                  'h-14 px-8 text-xl font-black rounded-2xl transition-colors',
                  saved ? 'bg-sky-500 hover:bg-sky-500' : 'bg-sky-600 hover:bg-sky-700'
                )}
              >
                {saved ? (
                  <><CheckCircle2 className="w-6 h-6 mr-2" /> Saved!</>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <Card className="border-4 border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <CardHeader className="bg-slate-50 border-b-2 border-slate-200 p-6">
            <CardTitle className="text-2xl font-black flex items-center gap-2.5 text-slate-950">
              <Bell className="w-7 h-7 text-sky-600" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y-2 divide-slate-100">
            <NotificationToggle icon={Smartphone} title="Medicine Reminders" desc="Get reminded when it's time to take your medicine." defaultChecked />
            <NotificationToggle icon={Mail} title="Doctor Messages" desc="Receive a notification when your doctor sends you a message." defaultChecked />
            <NotificationToggle icon={Bell} title="Appointment Reminders" desc="Get notified the day before your appointment." defaultChecked />
          </CardContent>
        </Card>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <Card className="border-4 border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <CardHeader className="bg-slate-50 border-b-2 border-slate-200 p-6">
            <CardTitle className="text-2xl font-black flex items-center gap-2.5 text-slate-950">
              <Lock className="w-7 h-7 text-sky-600" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-lg font-bold text-slate-800">Current Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="flex h-14 w-full rounded-2xl border-2 border-slate-300 bg-white px-4 pr-14 text-xl font-semibold text-slate-900 focus:outline-none focus:border-sky-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 text-slate-500 hover:text-slate-800"
                >
                  {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-lg font-bold text-slate-800">New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="flex h-14 w-full rounded-2xl border-2 border-slate-300 bg-white px-4 text-xl font-semibold text-slate-900 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-lg font-bold text-slate-800">Confirm New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="flex h-14 w-full rounded-2xl border-2 border-slate-300 bg-white px-4 text-xl font-semibold text-slate-900 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
            <div className="pt-2">
              <Button
                onClick={handleSave}
                className="h-14 px-8 text-xl font-black rounded-2xl bg-sky-600 hover:bg-sky-700"
              >
                Update Password
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function NotificationToggle({ icon: Icon, title, desc, defaultChecked = false }: {
  icon: React.ElementType;
  title: string;
  desc: string;
  defaultChecked?: boolean;
}) {
  const [enabled, setEnabled] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-5">
        <div className="h-14 w-14 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600 flex-shrink-0">
          <Icon className="h-7 w-7" />
        </div>
        <div>
          <h4 className="text-xl font-black text-slate-950">{title}</h4>
          <p className="text-lg font-semibold text-slate-700">{desc}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setEnabled(!enabled)}
        className={cn(
          'relative inline-flex h-8 w-16 flex-shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500',
          enabled ? 'bg-sky-600' : 'bg-slate-300'
        )}
      >
        <span
          className={cn(
            'inline-block h-7 w-7 transform rounded-full bg-white shadow transition-transform',
            enabled ? 'translate-x-8' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  );
}
