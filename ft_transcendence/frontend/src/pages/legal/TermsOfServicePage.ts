import { BaseComponent } from '../../components/BaseComponent';

export default class TermsOfService extends BaseComponent 
{
    render(): string 
    {
        return `
            <div class="min-h-screen bg-gray-900 text-gray-300 py-12 px-4">
                <div class="max-w-4xl mx-auto">
                    <h1 class="text-4xl font-bold text-cyan-400 mb-8">Terms of Service</h1>
                    <p class="text-sm text-gray-500 mb-8">Last updated: January 9, 2026</p>

                    <section class="mb-8">
                        <h2 class="text-2xl font-semibold text-purple-400 mb-4">1. Acceptance of Terms</h2>
                        <p class="mb-4">
                            Welcome to ft_transcendence! By accessing or using our multiplayer gaming platform 
                            ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not 
                            agree to these Terms, do not use the Service.
                        </p>
                        <p>
                            These Terms apply to all users, including players, tournament participants, and visitors.
                        </p>
                    </section>

                    <section class="mb-8">
                        <h2 class="text-2xl font-semibold text-purple-400 mb-4">2. About ft_transcendence</h2>
                        <p class="mb-4">
                            ft_transcendence is an educational project created as part of the 42 School curriculum. 
                            The platform provides:
                        </p>
                        <ul class="list-disc list-inside space-y-2 ml-4">
                            <li>Multiplayer 3D Pong and Star Wars Pod Racing games</li>
                            <li>Real-time gameplay with remote players</li>
                            <li>Tournament systems and matchmaking</li>
                            <li>Chat and social features</li>
                            <li>User profiles and statistics tracking</li>
                            <li>AI opponents for practice</li>
                        </ul>
                    </section>

                    <section class="mb-8">
                        <h2 class="text-2xl font-semibold text-purple-400 mb-4">3. User Accounts</h2>
                        
                        <h3 class="text-xl font-semibold text-cyan-300 mb-3">3.1 Account Creation</h3>
                        <p class="mb-4">To use the Service, you must:</p>
                        <ul class="list-disc list-inside mb-4 space-y-2 ml-4">
                            <li>Be at least 13 years old</li>
                            <li>Provide accurate and complete information</li>
                            <li>Maintain the security of your account credentials</li>
                            <li>Use a valid email address</li>
                            <li>Choose a unique username</li>
                        </ul>

                        <h3 class="text-xl font-semibold text-cyan-300 mb-3">3.2 Account Responsibility</h3>
                        <p class="mb-4">You are responsible for:</p>
                        <ul class="list-disc list-inside space-y-2 ml-4">
                            <li>All activities under your account</li>
                            <li>Maintaining password confidentiality</li>
                            <li>Notifying us of unauthorized access</li>
                            <li>Compliance with these Terms</li>
                        </ul>

                        <h3 class="text-xl font-semibold text-cyan-300 mb-3">3.3 Account Termination</h3>
                        <p>
                            We reserve the right to suspend or terminate accounts that violate these Terms, 
                            engage in cheating, harassment, or other prohibited conduct.
                        </p>
                    </section>

                    <section class="mb-8">
                        <h2 class="text-2xl font-semibold text-purple-400 mb-4">4. Acceptable Use</h2>
                        
                        <h3 class="text-xl font-semibold text-cyan-300 mb-3">4.1 Permitted Use</h3>
                        <p class="mb-4">You may use the Service to:</p>
                        <ul class="list-disc list-inside space-y-2 ml-4">
                            <li>Play games and participate in online matches</li>
                            <li>Chat with other users respectfully</li>
                            <li>Customize your profile and game settings</li>
                            <li>Add friends and view leaderboards</li>
                            <li>Track your gaming statistics</li>
                        </ul>

                        <h3 class="text-xl font-semibold text-cyan-300 mb-3 mt-6">4.2 Prohibited Conduct</h3>
                        <p class="mb-4">You may NOT:</p>
                        <ul class="list-disc list-inside space-y-2 ml-4">
                            <li><strong>Cheat:</strong> Use exploits, hacks, bots, or third-party software to gain unfair advantages</li>
                            <li><strong>Harass:</strong> Engage in hate speech, bullying, threats, or toxic behavior</li>
                            <li><strong>Spam:</strong> Send unsolicited messages or repetitive content</li>
                            <li><strong>Impersonate:</strong> Pretend to be another user or administrator</li>
                            <li><strong>Exploit:</strong> Abuse bugs, glitches, or system vulnerabilities</li>
                            <li><strong>Share accounts:</strong> Allow others to use your credentials</li>
                            <li><strong>Reverse engineer:</strong> Decompile or attempt to extract source code</li>
                            <li><strong>Attack:</strong> Attempt DDoS, SQL injection, XSS, or other security attacks</li>
                            <li><strong>Manipulate:</strong> Artificially inflate statistics or rankings</li>
                            <li><strong>Violate laws:</strong> Use the Service for illegal activities</li>
                        </ul>
                    </section>

                    <section class="mb-8">
                        <h2 class="text-2xl font-semibold text-purple-400 mb-4">5. Game Rules</h2>
                        
                        <h3 class="text-xl font-semibold text-cyan-300 mb-3">5.1 Fair Play</h3>
                        <p class="mb-4">All players must:</p>
                        <ul class="list-disc list-inside space-y-2 ml-4">
                            <li>Play fairly and respect opponents</li>
                            <li>Accept match results gracefully</li>
                            <li>Report bugs instead of exploiting them</li>
                            <li>Use only legitimate game mechanics</li>
                        </ul>

                        <h3 class="text-xl font-semibold text-cyan-300 mb-3">5.2 Online Play</h3>
                        <p class="mb-4">Participants must:</p>
                        <ul class="list-disc list-inside space-y-2 ml-4">
                            <li>Register with a valid alias</li>
                            <li>Be available for scheduled matches</li>
                            <li>Comply with online-specific rules</li>
                        </ul>

                        <h3 class="text-xl font-semibold text-cyan-300 mb-3">5.3 Network Issues</h3>
                        <p>
                            We strive to provide stable connections, but we are not responsible for disconnections 
                            due to your internet connection, device issues, or network problems beyond our control.
                        </p>
                    </section>

                    <section class="mb-8">
                        <h2 class="text-2xl font-semibold text-purple-400 mb-4">6. Intellectual Property</h2>
                        
                        <h3 class="text-xl font-semibold text-cyan-300 mb-3">6.1 Our Rights</h3>
                        <p class="mb-4">
                            All content, features, and functionality (including graphics, design, code, and AI systems) 
                            are owned by the ft_transcendence team and protected by copyright and intellectual property laws.
                        </p>

                        <h3 class="text-xl font-semibold text-cyan-300 mb-3">6.2 User Content</h3>
                        <p class="mb-4">
                            You retain ownership of content you create (usernames, avatars, chat messages). By using 
                            the Service, you grant us a license to display and use this content as necessary to 
                            provide the Service.
                        </p>

                        <h3 class="text-xl font-semibold text-cyan-300 mb-3">6.3 Star Wars References</h3>
                        <p>
                            Star Wars-themed elements (Pod Racing) are used for educational purposes under fair use. 
                            All Star Wars trademarks belong to Lucasfilm Ltd./Disney.
                        </p>
                    </section>

                    <section class="mb-8">
                        <h2 class="text-2xl font-semibold text-purple-400 mb-4">7. Privacy and Data</h2>
                        <p class="mb-4">
                            Your use of the Service is also governed by our Privacy Policy, which describes:
                        </p>
                        <ul class="list-disc list-inside space-y-2 ml-4">
                            <li>What data we collect</li>
                            <li>How we use and protect your data</li>
                            <li>Your rights under GDPR</li>
                            <li>Data retention policies</li>
                        </ul>
                        <p class="mt-4">
                            Please review our <a href="/privacy-policy" data-link class="text-cyan-400 hover:text-purple-400">Privacy Policy</a> for complete details.
                        </p>
                    </section>

                    <section class="mb-8">
                        <h2 class="text-2xl font-semibold text-purple-400 mb-4">8. Disclaimers and Liability</h2>
                        
                        <h3 class="text-xl font-semibold text-cyan-300 mb-3">8.1 "As Is" Service</h3>
                        <p class="mb-4">
                            The Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind. 
                            This is an educational project, and we do not guarantee:
                        </p>
                        <ul class="list-disc list-inside space-y-2 ml-4">
                            <li>Uninterrupted or error-free operation</li>
                            <li>Accuracy of game statistics or leaderboards</li>
                            <li>Compatibility with all devices or browsers</li>
                            <li>Permanent availability of the Service</li>
                        </ul>

                        <h3 class="text-xl font-semibold text-cyan-300 mb-3 mt-6">8.2 Limitation of Liability</h3>
                        <p>
                            To the fullest extent permitted by law, ft_transcendence and its creators shall not be 
                            liable for any indirect, incidental, consequential, or punitive damages arising from 
                            your use of the Service.
                        </p>

                        <h3 class="text-xl font-semibold text-cyan-300 mb-3 mt-6">8.3 User Disputes</h3>
                        <p>
                            We are not responsible for disputes between users. Resolve conflicts respectfully or 
                            use the block/report features.
                        </p>
                    </section>

                    <section class="mb-8">
                        <h2 class="text-2xl font-semibold text-purple-400 mb-4">9. Service Modifications</h2>
                        <p>
                            We reserve the right to:
                        </p>
                        <ul class="list-disc list-inside space-y-2 ml-4">
                            <li>Modify, suspend, or discontinue the Service</li>
                            <li>Change game features, rules, or mechanics</li>
                            <li>Update these Terms at any time</li>
                            <li>Perform maintenance that may cause downtime</li>
                        </ul>
                        <p class="mt-4">
                            Significant changes will be announced through the platform or via email.
                        </p>
                    </section>

                    <section class="mb-8">
                        <h2 class="text-2xl font-semibold text-purple-400 mb-4">10. Termination</h2>
                        
                        <h3 class="text-xl font-semibold text-cyan-300 mb-3">10.1 By You</h3>
                        <p>
                            You may terminate your account at any time through account settings. Your data will be 
                            deleted according to our Privacy Policy.
                        </p>

                        <h3 class="text-xl font-semibold text-cyan-300 mb-3 mt-4">10.2 By Us</h3>
                        <p class="mb-4">We may terminate or suspend your account for:</p>
                        <ul class="list-disc list-inside space-y-2 ml-4">
                            <li>Violation of these Terms</li>
                            <li>Cheating or exploiting</li>
                            <li>Harassment or toxic behavior</li>
                            <li>Multiple reports from other users</li>
                            <li>Suspected account compromise</li>
                            <li>Extended inactivity (180+ days)</li>
                        </ul>

                        <h3 class="text-xl font-semibold text-cyan-300 mb-3 mt-4">10.3 Effect of Termination</h3>
                        <p>
                            Upon termination, you lose access to your account, game statistics, and all associated data.
                        </p>
                    </section>

                    <section class="mb-8">
                        <h2 class="text-2xl font-semibold text-purple-400 mb-4">11. Educational Nature</h2>
                        <p>
                            ft_transcendence is a student project created for the 42 School curriculum. It is:
                        </p>
                        <ul class="list-disc list-inside space-y-2 ml-4">
                            <li>Not a commercial product</li>
                            <li>Provided free of charge</li>
                            <li>Maintained by students as a learning exercise</li>
                            <li>Subject to changes based on educational requirements</li>
                        </ul>
                    </section>

                    <section class="mb-8">
                        <h2 class="text-2xl font-semibold text-purple-400 mb-4">12. Governing Law</h2>
                        <p>
                            These Terms are governed by the laws of France and the European Union, in accordance with 
                            42 School's location. Any disputes will be resolved in the courts of Paris, France.
                        </p>
                    </section>

                    <section class="mb-8">
                        <h2 class="text-2xl font-semibold text-purple-400 mb-4">13. Contact Information</h2>
                        <p class="mb-4">
                            For questions, concerns, or support regarding these Terms:
                        </p>
                        <div class="bg-gray-800 p-4 rounded-lg">
                            <p>Email: support@starcendence.dev</p>
                            <p>Website: https://starcendence.dev</p>
                            <p class="text-sm text-gray-500 mt-2">This is a 42 School educational project</p>
                        </div>
                    </section>

                    <section class="mb-8">
                        <h2 class="text-2xl font-semibold text-purple-400 mb-4">14. Changes to Terms</h2>
                        <p>
                            We may update these Terms periodically. Changes will be posted on this page with an updated 
                            "Last updated" date. Your continued use of the Service after changes constitutes acceptance 
                            of the revised Terms.
                        </p>
                    </section>

                    <section class="mb-8">
                        <h2 class="text-2xl font-semibold text-purple-400 mb-4">15. Severability</h2>
                        <p>
                            If any provision of these Terms is found to be unenforceable, the remaining provisions 
                            will remain in full effect.
                        </p>
                    </section>

                    <div class="mt-12 pt-8 border-t border-gray-700 text-center">
                        <p class="text-gray-500 mb-4">
                            By using ft_transcendence, you acknowledge that you have read, understood, and agree 
                            to these Terms of Service.
                        </p>
                        <a href="/" data-link class="text-cyan-400 hover:text-purple-400 transition-colors">
                            ← Back to Home
                        </a>
                    </div>
                </div>
            </div>
        `;
    }
}