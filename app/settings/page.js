'use client';
import './settings.css';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../lib/AuthContext';
import { updateProfile, updateEmail, updatePassword, deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Mail, Lock, User, Save, Settings as SettingsIcon, Shield, FolderHeart, AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setUsername(user.displayName || '');
            setEmail(user.email || '');
        }
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const updates = [];
            if (username !== user.displayName) {
                updates.push(updateProfile(user, { displayName: username }));
            }
            if (email !== user.email) {
                updates.push(updateEmail(user, email));
            }
            if (newPassword) {
                updates.push(updatePassword(user, newPassword));
            }

            if (updates.length > 0) {
                await Promise.all(updates);
                toast.success("Settings updated successfully!");
                setNewPassword('');
            } else {
                toast.info("No changes to save.");
            }
        } catch (error) {
            toast.error(error.message || "Failed to update settings");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm(
            "Are you sure you want to delete your account? This will permanently erase all your saved collections and profile data. This action cannot be undone."
        );

        if (!confirmed) return;

        try {
            setIsSaving(true);
            // 1. Delete user's collections/data from Firestore
            await deleteDoc(doc(db, "users", user.uid));

            // 2. Delete the user from Firebase Auth
            await deleteUser(user);

            toast.success("Account deleted successfully.");
            router.push("/");
        } catch (error) {
            // Firebase requires a recent login to delete an account
            if (error.code === 'auth/requires-recent-login') {
                toast.error("Security requirement: Please log out and log back in before deleting your account.");
            } else {
                toast.error(error.message);
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="settings-page">
            <div className="settings-container">
                {/* Header Section */}
                <div className="settings-header">
                    <div className="header-title">
                        <SettingsIcon className="icon-large" />
                        <h1>Account Settings</h1>
                    </div>
                    <p className="header-subtitle">Manage your profile, security, and preferences.</p>
                </div>

                <div className="settings-content">
                    {/* Profile Section */}
                    <section className="settings-card glass-panel">
                        <div className="card-header">
                            <User className="icon" />
                            <h2>Profile Information</h2>
                        </div>
                        <div className="form-group">
                            <label>Display Name</label>
                            <div className="input-wrapper">
                                <User className="input-icon" />
                                <input
                                    type="text"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Email Address</label>
                            <div className="input-wrapper">
                                <Mail className="input-icon" />
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Collections Section */}
                    <section className="settings-card glass-panel">
                        <div className="card-header">
                            <FolderHeart className="icon" />
                            <h2>My Collections</h2>
                        </div>
                        <div className="form-group">
                            <p style={{ color: 'var(--text-color, inherit)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                Manage your saved wallpapers and favorites.
                            </p>
                            <button className="btn-cancel" onClick={() => router.push('/collections')} style={{ width: 'fit-content' }}>
                                View Collections
                            </button>
                        </div>
                    </section>

                    {/* Security Section */}
                    <section className="settings-card glass-panel">
                        <div className="card-header">
                            <Shield className="icon" />
                            <h2>Security</h2>
                        </div>
                        <div className="form-group">
                            <label>New Password</label>
                            <div className="input-wrapper">
                                <Lock className="input-icon" />
                                <input
                                    type="password"
                                    placeholder="Enter new password to change"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Danger Zone Section */}
                    <section className="settings-card glass-panel" style={{ border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        <div className="card-header">
                            <AlertTriangle className="icon" style={{ color: '#ef4444' }} />
                            <h2 style={{ color: '#ef4444' }}>Danger Zone</h2>
                        </div>
                        <div className="form-group">
                            <p style={{ color: 'var(--text-color, inherit)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                Once you delete your account, there is no going back. Please be certain.
                            </p>
                            <button
                                className="btn-cancel"
                                style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.5)', width: 'fit-content' }}
                                onClick={handleDeleteAccount}
                                disabled={isSaving}
                            >
                                <Trash2 size={16} />
                                Delete Account
                            </button>
                        </div>
                    </section>

                    {/* Action Buttons */}
                    <div className="settings-actions">
                        <button className="btn-cancel" onClick={() => router.back()}>Cancel</button>
                        <button className="btn-save" disabled={isSaving} onClick={handleSave}>
                            <Save className="icon-small" />
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
