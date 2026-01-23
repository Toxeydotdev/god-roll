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

const SUPPORT_EMAIL = "support@godroll.app";

export function SupportDrawer({
  onClose,
  theme,
}: SupportDrawerProps): React.ReactElement {
  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
    } catch {
      // Fallback for older browsers
    }
  };

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
            💬 Support
          </DrawerTitle>
        </DrawerHeader>

        <div className="space-y-4 px-4 pb-6 overflow-auto">
          {/* Contact Section */}
          <div
            className="p-4 rounded-xl text-center"
            style={{ backgroundColor: `${theme.accentColor}15` }}
          >
            <p className="text-sm mb-3" style={{ color: theme.textSecondary }}>
              Have a question or need help? Reach out to us at:
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="inline-block text-lg font-bold py-2 px-4 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                color: theme.accentColor,
                backgroundColor: `${theme.accentColor}20`,
              }}
            >
              📧 {SUPPORT_EMAIL}
            </a>
            <button
              onClick={handleCopyEmail}
              className="block mx-auto mt-2 text-xs underline"
              style={{ color: theme.textTertiary }}
            >
              Copy email address
            </button>
          </div>

          {/* FAQ Section */}
          <div className="pt-2">
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
