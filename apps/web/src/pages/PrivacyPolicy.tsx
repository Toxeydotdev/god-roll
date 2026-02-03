import { Link } from "react-router-dom";

export function PrivacyPolicy() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          to="/"
          className="inline-flex items-center text-green-400 hover:text-green-300 mb-6"
        >
          ← Back to Game
        </Link>

        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-gray-400 mb-8">Last updated: February 2, 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Introduction</h2>
          <p className="text-gray-300 leading-relaxed">
            Welcome to God Roll. We respect your privacy and are committed to
            protecting your personal data. This privacy policy explains how we
            collect, use, and safeguard your information when you use our game.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Information We Collect</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>
              <strong>Display Name:</strong> If you choose to participate in the
              online leaderboard, we collect the display name you provide.
            </li>
            <li>
              <strong>Game Scores:</strong> We store your high scores if you
              submit them to our leaderboard.
            </li>
            <li>
              <strong>Device Information:</strong> We may collect basic device
              information for game optimization and crash reporting.
            </li>
            <li>
              <strong>Local Storage:</strong> We use browser local storage to
              save your preferences (theme, sound settings) and achievements
              locally on your device.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">
            How We Use Your Information
          </h2>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>To display your scores on the public leaderboard</li>
            <li>To remember your game preferences</li>
            <li>To track your achievements and progress</li>
            <li>To improve game performance and fix bugs</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Data Storage</h2>
          <p className="text-gray-300 leading-relaxed">
            Your game preferences and local achievements are stored only on your
            device using browser local storage. Leaderboard data is stored
            securely on our servers using Supabase, a trusted cloud database
            provider.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Third-Party Services</h2>
          <p className="text-gray-300 leading-relaxed mb-3">
            We use the following third-party services:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>
              <strong>Supabase:</strong> For secure database storage and
              authentication
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Your Rights</h2>
          <p className="text-gray-300 leading-relaxed">
            You have the right to:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 mt-2">
            <li>Request access to your personal data</li>
            <li>Request deletion of your data from our leaderboard</li>
            <li>
              Clear your local storage data at any time through your browser
            </li>
            <li>Play the game without submitting scores to the leaderboard</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Children's Privacy</h2>
          <p className="text-gray-300 leading-relaxed">
            God Roll is suitable for all ages. We do not knowingly collect
            personal information from children under 13 without parental
            consent. If you believe we have collected information from a child
            under 13, please contact us.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Changes to This Policy</h2>
          <p className="text-gray-300 leading-relaxed">
            We may update this privacy policy from time to time. We will notify
            you of any changes by posting the new policy on this page and
            updating the "Last updated" date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
          <p className="text-gray-300 leading-relaxed">
            If you have any questions about this privacy policy or your data,
            please contact us through the in-game support feature.
          </p>
        </section>

        <footer className="border-t border-gray-700 pt-6 mt-8">
          <Link
            to="/"
            className="inline-flex items-center text-green-400 hover:text-green-300"
          >
            ← Back to Game
          </Link>
        </footer>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
