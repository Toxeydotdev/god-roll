import { ColorTheme } from "@/components/DiceRoller/colorThemes";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import React from "react";

interface SupportDrawerProps {
  onClose: () => void;
  theme: ColorTheme;
}

export function SupportDrawer({
  onClose,
  theme,
}: SupportDrawerProps): React.ReactElement {
  const supportLinks = [
    {
      icon: "📧",
      title: "Email Support",
      description: "Get help via email",
      action: "support@godroll.app",
      href: "mailto:support@godroll.app",
    },
    {
      icon: "🐛",
      title: "Report a Bug",
      description: "Found an issue? Let us know",
      action: "GitHub Issues",
      href: "https://github.com/Toxeydotdev/god-roll/issues",
    },
    {
      icon: "💡",
      title: "Feature Request",
      description: "Have an idea? Share it with us",
      action: "GitHub Discussions",
      href: "https://github.com/Toxeydotdev/god-roll/discussions",
    },
  ];

  return (
    <Drawer open={true} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent
        className="min-h-[50vh] max-h-[85vh] mx-auto sm:max-w-md"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}
      >
        <DrawerHeader className="text-left">
          <DrawerTitle
            className="text-2xl font-black"
            style={{ color: theme.textPrimary }}
          >
            🆘 Support
          </DrawerTitle>
        </DrawerHeader>

        <div className="space-y-4 px-4 pb-6 overflow-auto">
          {/* Welcome Message */}
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: `${theme.accentColor}15` }}
          >
            <p
              className="text-sm leading-relaxed"
              style={{ color: theme.textPrimary }}
            >
              Need help with God Roll? We're here for you! Choose an option
              below to get support or share your feedback.
            </p>
          </div>

          {/* Support Options */}
          <div className="space-y-3">
            {supportLinks.map((link) => (
              <a
                key={link.title}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: `${theme.textTertiary}15`,
                  border: `1px solid ${theme.textTertiary}30`,
                }}
              >
                <span className="text-3xl">{link.icon}</span>
                <div className="flex-1">
                  <div
                    className="font-bold"
                    style={{ color: theme.textPrimary }}
                  >
                    {link.title}
                  </div>
                  <div
                    className="text-sm"
                    style={{ color: theme.textSecondary }}
                  >
                    {link.description}
                  </div>
                </div>
                <span
                  className="text-sm font-medium"
                  style={{ color: theme.accentColor }}
                >
                  →
                </span>
              </a>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="pt-4">
            <h3
              className="font-bold text-lg mb-3"
              style={{ color: theme.textPrimary }}
            >
              ❓ Quick Help
            </h3>

            <div className="space-y-3">
              <details
                className="rounded-xl overflow-hidden"
                style={{
                  backgroundColor: `${theme.textTertiary}10`,
                  border: `1px solid ${theme.textTertiary}20`,
                }}
              >
                <summary
                  className="p-3 cursor-pointer font-medium"
                  style={{ color: theme.textPrimary }}
                >
                  How do I unlock achievements?
                </summary>
                <p
                  className="px-3 pb-3 text-sm"
                  style={{ color: theme.textSecondary }}
                >
                  Play the game and complete specific challenges! Check the
                  Achievements panel (🏆) to see all available achievements and
                  their requirements.
                </p>
              </details>

              <details
                className="rounded-xl overflow-hidden"
                style={{
                  backgroundColor: `${theme.textTertiary}10`,
                  border: `1px solid ${theme.textTertiary}20`,
                }}
              >
                <summary
                  className="p-3 cursor-pointer font-medium"
                  style={{ color: theme.textPrimary }}
                >
                  Why did I lose?
                </summary>
                <p
                  className="px-3 pb-3 text-sm"
                  style={{ color: theme.textSecondary }}
                >
                  You lose when your dice roll total is divisible by 7. For
                  example: 7, 14, 21, 28, etc. Try to avoid these totals!
                </p>
              </details>

              <details
                className="rounded-xl overflow-hidden"
                style={{
                  backgroundColor: `${theme.textTertiary}10`,
                  border: `1px solid ${theme.textTertiary}20`,
                }}
              >
                <summary
                  className="p-3 cursor-pointer font-medium"
                  style={{ color: theme.textPrimary }}
                >
                  How do I sync my progress?
                </summary>
                <p
                  className="px-3 pb-3 text-sm"
                  style={{ color: theme.textSecondary }}
                >
                  Create an account or sign in (🔑) to sync your achievements,
                  scores, and unlocks across devices.
                </p>
              </details>
            </div>
          </div>

          {/* Version Info */}
          <div
            className="text-center pt-4 text-xs"
            style={{ color: theme.textTertiary }}
          >
            God Roll v1.1 • Made with 🎲
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
