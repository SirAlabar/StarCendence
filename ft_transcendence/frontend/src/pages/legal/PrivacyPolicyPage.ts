import { BaseComponent } from '../../components/BaseComponent';

export default class PrivacyPolicy extends BaseComponent 
{
    render(): string 
    {
        return `
            <div class="min-h-screen bg-gray-900 text-gray-300 py-12 px-4">
                <div class="max-w-4xl mx-auto">
                    <h1 class="text-4xl font-bold text-cyan-400 mb-8">Privacy Policy</h1>
                    <p class="text-sm text-gray-500 mb-8">Last updated: January 9, 2026</p>

                    <section class="mb-8">
                        <h2 class="text-2xl font-semibold text-purple-400 mb-4">1. Introduction</h2>
                        <p class="mb-4">
                            Welcome to ft_transcendence. This Privacy Policy explains how we collect, 
                            use, disclose, and protect your information when you use our multiplayer gaming platform, 
                            including 3D Pong and Star Wars Pod Racing games.
                        </p>
                        <p>
                            By using ft_transcendence, you agree to the collection and use of information in accordance 
                            with this policy.
                        </p>
                    </section>

                    <section class="mb-8">
                        <h2 class="text-2xl font-semibold text-purple-400 mb-4">2. Information We Collect</h2>
                        
                        <h3 class="text-xl font-semibold text-cyan-300 mb-3">2.1 Account Information</h3>
                        <p class="mb-4">When you create an account, we collect:</p>
                        <ul class="list-disc list-inside mb-4 space-y-2 ml-4">
                            <li>Email address</li>
                            <li>Username/display name</li>
                            <li>Password (encrypted and hashed)</li>
                            <li>Profile avatar (if uploaded)</li>
                            <li>OAuth provider information (if using Google Sign-in)</li>
                        </ul>

                        <h3 class="text-xl font-semibold text-cyan-300 mb-3">2.2 Gaming Data</h3>
                        <p class="mb-4">During gameplay, we collect:</p>
                        <ul class="list-disc list-inside mb-4 space-y-2 ml-4">
                            <li>Game statistics (wins, losses, scores)</li>
                            <li>Match history and tournament participation</li>
                            <li>Game preferences and customization settings</li>
                            <li>Real-time gameplay data for matchmaking</li>
                        </ul>

                        <h3 class="text-xl font-semibold text-cyan-300 mb-3">2.3 Social Features</h3>
                        <p class="mb-4">When you interact with other users:</p>
                        <ul class="list-disc list-inside mb-4 space-y-2 ml-4">
                            <li>Friend lists and connection status</li>
                            <li>Chat messages and game invitations</li>
                            <li>User interactions and reports</li>
                        </ul>

                        <h3 class="text-xl font-semibold text-cyan-300 mb-3">2.4 Technical Information</h3>
                        <ul class="list-disc list-inside mb-4 space-y-2 ml-4">
                            <li>IP address and device information</li>
                            <li>Browser type and version</li>
                            <li>Session data and cookies</li>
                            <li>WebSocket connection logs</li>
                        </ul>
                    </section>

                    <section class="mb-8">
                        <h2 class="text-2xl font-semibold text-purple-400 mb-4">3. How We Use Your Information</h2>
                        <p class="mb-4">We use the collected information for:</p>
                        <ul class="list-disc list-inside space-y-2 ml-4">
                            <li>Providing and maintaining gaming services</li>
                            <li>User authentication and account security (including 2FA)</li>
                            <li>Matchmaking and tournament organization</li>
                            <li>Displaying leaderboards and statistics</li>
                            <li>Enabling real-time multiplayer gameplay</li>
                            <li>Facilitating chat and social features</li>
                            <li>Improving our services and user experience</li>
                            <li>Detecting and preventing abuse, cheating, or violations</li>
                            <li>Sending important notifications about your account or games</li>
                        </ul>
                    </section>

                    <section class="mb-8">
                        <h2 class="text-2xl font-semibold text-purple-400 mb-4">4. Data Storage and Security</h2>
                        <p class="mb-4">
                            We implement industry-standard security measures to protect your data:
                        </p>
                        <ul class="list-disc list-inside space-y-2 ml-4">
                            <li>Passwords are encrypted using bcrypt with salt</li>
                            <li>All connections use HTTPS/WSS encryption</li>
                            <li>JWT tokens for secure authentication</li>
                            <li>Two-Factor Authentication (2FA) available</li>
                            <li>Database access is restricted and monitored</li>
                            <li>Regular security audits and updates</li>
                        </ul>
                        <p class="mt-4">
                            Data is stored in SQLite databases on secure servers with Docker containerization.
                        </p>
                    </section>

                    <section class="mb-8">
                        <h2 class="text-2xl font-semibold text-purple-400 mb-4">5. Third-Party Services</h2>
                        <p class="mb-4">We use the following third-party services:</p>
                        <ul class="list-disc list-inside space-y-2 ml-4">
                            <li><strong>Google OAuth:</strong> For authentication (subject to Google's Privacy Policy)</li>
                            <li><strong>Babylon.js:</strong> For 3D graphics rendering (client-side only)</li>
                            <li><strong>Redis:</strong> For session management and real-time features</li>
                        </ul>
                        <p class="mt-4">
                            These services may have their own privacy policies, and we encourage you to review them.
                        </p>
                    </section>

                    <section class="mb-8">
                        <h2 class="text-2xl font-semibold text-purple-400 mb-4">6. Cookies and Tracking</h2>
                        <p class="mb-4">
                            We use cookies and similar technologies for:
                        </p>
                        <ul class="list-disc list-inside space-y-2 ml-4">
                            <li>Maintaining your login session</li>
                            <li>Remembering your preferences</li>
                            <li>Analytics and performance monitoring (Prometheus/Grafana)</li>
                            <li>Security and fraud prevention</li>
                        </ul>
                        <p class="mt-4">
                            You can control cookies through your browser settings, but disabling them may affect functionality.
                        </p>
                    </section>

                    <section class="mb-8">
                        <h2 class="text-2xl font-semibold text-purple-400 mb-4">7. Your Rights (GDPR Compliance)</h2>
                        <p class="mb-4">You have the right to:</p>
                        <ul class="list-disc list-inside space-y-2 ml-4">
                            <li><strong>Access:</strong> Request a copy of your personal data</li>
                            <li><strong>Rectification:</strong> Update or correct your information</li>
                            <li><strong>Erasure:</strong> Request deletion of your account and data</li>
                            <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
                            <li><strong>Object:</strong> Opt-out of certain data processing activities</li>
                            <li><strong>Restrict:</strong> Limit how we process your data</li>
                        </ul>
                        <p class="mt-4">
                            To exercise these rights, contact us through your account settings or via email.
                        </p>
                    </section>

                    <section class="mb-8">
                        <h2 class="text-2xl font-semibold text-purple-400 mb-4">8. Data Retention</h2>
                        <p class="mb-4">
                            We retain your information for as long as your account is active. Upon account deletion:
                        </p>
                        <ul class="list-disc list-inside space-y-2 ml-4">
                            <li>Personal information is permanently deleted within 30 days</li>
                            <li>Anonymized game statistics may be retained for analytics</li>
                            <li>Chat logs are deleted or anonymized</li>
                            <li>Backups containing your data are purged within 90 days</li>
                        </ul>
                    </section>

                    <section class="mb-8">
                        <h2 class="text-2xl font-semibold text-purple-400 mb-4">9. Children's Privacy</h2>
                        <p>
                            ft_transcendence is not intended for users under 13 years of age. We do not knowingly 
                            collect information from children under 13. If we discover that a child under 13 has 
                            provided us with personal information, we will delete it immediately.
                        </p>
                    </section>

                    <section class="mb-8">
                        <h2 class="text-2xl font-semibold text-purple-400 mb-4">10. Changes to This Policy</h2>
                        <p>
                            We may update this Privacy Policy periodically. Changes will be posted on this page with 
                            an updated "Last updated" date. Continued use of the platform after changes constitutes 
                            acceptance of the revised policy.
                        </p>
                    </section>

                    <section class="mb-8">
                        <h2 class="text-2xl font-semibold text-purple-400 mb-4">11. Contact Us</h2>
                        <p class="mb-4">
                            If you have questions about this Privacy Policy or wish to exercise your rights, contact us at:
                        </p>
                        <div class="bg-gray-800 p-4 rounded-lg">
                            <p>Email: privacy@starcendence.dev</p>
                            <p>Website: https://starcendence.dev</p>
                            <p class="text-sm text-gray-500 mt-2">This is a 42 School educational project</p>
                        </div>
                    </section>

                    <div class="mt-12 pt-8 border-t border-gray-700">
                        <a href="/" data-link class="text-cyan-400 hover:text-purple-400 transition-colors">
                            ← Back to Home
                        </a>
                    </div>
                </div>
            </div>
        `;
    }
}