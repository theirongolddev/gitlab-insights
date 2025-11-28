"use client";

import { Button, HeroUIProvider } from "@heroui/react";
import { useState } from "react";

export default function TestHeroUITheme() {
  const [isDark, setIsDark] = useState(false);

  return (
    <HeroUIProvider>
      <div className={isDark ? "dark" : ""}>
        <div className="min-h-screen bg-white dark:bg-gray-900 p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-50">
                HeroUI Theme Test
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Testing custom olive theme in both light and dark modes
              </p>
            </div>

            {/* Theme Toggle */}
            <div className="flex justify-center">
              <Button
                color="default"
                variant="bordered"
                onPress={() => setIsDark(!isDark)}
              >
                Switch to {isDark ? "Light" : "Dark"} Mode
              </Button>
            </div>

            {/* Button Variants */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
                Button Variants
              </h2>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <Button color="primary" variant="solid">
                    Primary Solid
                  </Button>
                  <Button color="primary" variant="bordered">
                    Primary Bordered
                  </Button>
                  <Button color="primary" variant="light">
                    Primary Light
                  </Button>
                  <Button color="primary" variant="flat">
                    Primary Flat
                  </Button>
                  <Button color="primary" variant="ghost">
                    Primary Ghost
                  </Button>
                </div>

                <div className="flex flex-wrap gap-4">
                  <Button color="secondary" variant="solid">
                    Secondary Solid
                  </Button>
                  <Button color="default" variant="solid">
                    Default Solid
                  </Button>
                  <Button color="success" variant="solid">
                    Success Solid
                  </Button>
                  <Button color="warning" variant="solid">
                    Warning Solid
                  </Button>
                  <Button color="danger" variant="solid">
                    Danger Solid
                  </Button>
                </div>
              </div>
            </div>

            {/* Button States */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
                Button States
              </h2>

              <div className="flex flex-wrap gap-4">
                <Button color="primary" size="sm">
                  Small
                </Button>
                <Button color="primary" size="md">
                  Medium
                </Button>
                <Button color="primary" size="lg">
                  Large
                </Button>
                <Button color="primary" isDisabled>
                  Disabled
                </Button>
                <Button color="primary" isLoading>
                  Loading
                </Button>
              </div>
            </div>

            {/* Color Reference */}
            <div className="space-y-4 p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
                Expected Olive Colors
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-50">
                    Light Mode Primary:
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    hsl(68, 49%, 28%) = #5e6b24
                  </p>
                  <div className="w-24 h-12 rounded mt-2" style={{ backgroundColor: "hsl(68, 49%, 28%)" }} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-50">
                    Dark Mode Primary:
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    hsl(68, 36%, 52%) = #9DAA5F
                  </p>
                  <div className="w-24 h-12 rounded mt-2" style={{ backgroundColor: "hsl(68, 36%, 52%)" }} />
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Testing Instructions:
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-blue-800 dark:text-blue-200 text-sm">
                <li>Toggle between light and dark modes using the button above</li>
                <li>Verify primary buttons show olive color matching the reference swatches</li>
                <li>Test button interactions (hover, focus, press states)</li>
                <li>Check that all button variants and states render correctly</li>
                <li>Note: This test page will be deleted after Epic 1.5 completion</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </HeroUIProvider>
  );
}
