// Tour type matching the SDK's SdkTour interface
interface OnboardingTour {
  tourId: number;
  tourName: string;
  versionId: number;
  urlPattern: string | null;
  triggerType: "external";
  triggerSelector: string | null;
  isRepeatable: boolean;
  themeConfig: string | null;
  transitionPreset: string | null;
  steps: {
    id: number;
    order: number;
    title: string;
    content: string;
    targetSelector: string;
    placement: "top" | "bottom" | "left" | "right";
    transitionPreset: string | null;
  }[];
}

// IDs use negative numbers to avoid collision with real tours
export const ONBOARDING_TOUR_IDS = {
  ORIENTATION: -1,
  CREATE_APP: -2,
  BUILD_TOUR: -3,
  INSTALL_SDK: -4,
  PUBLISH: -5,
} as const;

export const orientationTour: OnboardingTour = {
  tourId: ONBOARDING_TOUR_IDS.ORIENTATION,
  tourName: "Welcome & Orientation",
  versionId: -1,
  urlPattern: null,
  triggerType: "external",
  triggerSelector: null,
  isRepeatable: true,
  themeConfig: null,
  transitionPreset: "smooth",
  steps: [
    {
      id: -1,
      order: 0,
      title: "Welcome to Geyed!",
      content:
        "Let's take a quick tour of the platform. We'll show you around, then help you create your first product tour.",
      targetSelector: "[data-onboarding='main-heading']",
      placement: "bottom",
      transitionPreset: null,
    },
    {
      id: -2,
      order: 1,
      title: "Your Sidebar",
      content:
        "This is your navigation hub. Your organisation, workspaces, and apps all live here.",
      targetSelector: "[data-onboarding='sidebar']",
      placement: "right",
      transitionPreset: null,
    },
    {
      id: -3,
      order: 2,
      title: "Workspaces",
      content:
        "Workspaces help you organise your apps. You start with a Default workspace — you can create more as you grow.",
      targetSelector: "[data-onboarding='workspace-switcher']",
      placement: "right",
      transitionPreset: null,
    },
    {
      id: -4,
      order: 3,
      title: "Apps",
      content:
        "Each app represents one of your websites or products. Let's create your first one!",
      targetSelector: "[data-onboarding='apps-nav']",
      placement: "right",
      transitionPreset: null,
    },
  ],
};

export const createAppTour: OnboardingTour = {
  tourId: ONBOARDING_TOUR_IDS.CREATE_APP,
  tourName: "Create Your First App",
  versionId: -2,
  urlPattern: null,
  triggerType: "external",
  triggerSelector: null,
  isRepeatable: true,
  themeConfig: null,
  transitionPreset: "smooth",
  steps: [
    {
      id: -10,
      order: 0,
      title: "Create Your First App",
      content:
        "Click the button below to create an app for your website. Give it a name and enter your site URL.",
      targetSelector: "[data-onboarding='create-app-button']",
      placement: "bottom",
      transitionPreset: null,
    },
  ],
};

export const buildTourTour: OnboardingTour = {
  tourId: ONBOARDING_TOUR_IDS.BUILD_TOUR,
  tourName: "Build Your First Tour",
  versionId: -3,
  urlPattern: null,
  triggerType: "external",
  triggerSelector: null,
  isRepeatable: true,
  themeConfig: null,
  transitionPreset: "smooth",
  steps: [
    {
      id: -20,
      order: 0,
      title: "Your Sample Tour",
      content:
        "We've created a sample tour with 3 steps to get you started. You can edit or add to these at any time.",
      targetSelector: "[data-onboarding='step-list']",
      placement: "right",
      transitionPreset: null,
    },
    {
      id: -21,
      order: 1,
      title: "Step Editor",
      content:
        "Click any step to edit its content. You can change the title, body text, and which element it targets.",
      targetSelector: "[data-onboarding='step-editor']",
      placement: "left",
      transitionPreset: null,
    },
    {
      id: -22,
      order: 2,
      title: "CSS Selectors",
      content:
        "Each step targets a CSS selector on your site. Use our Chrome extension to pick selectors visually — no coding required.",
      targetSelector: "[data-onboarding='selector-field']",
      placement: "top",
      transitionPreset: null,
    },
    {
      id: -23,
      order: 3,
      title: "Tour Settings",
      content:
        "Set the URL pattern, trigger type, and theme for your tour. When you're ready, we'll publish it!",
      targetSelector: "[data-onboarding='tour-settings']",
      placement: "bottom",
      transitionPreset: null,
    },
  ],
};

export const installSdkTour: OnboardingTour = {
  tourId: ONBOARDING_TOUR_IDS.INSTALL_SDK,
  tourName: "Install the SDK",
  versionId: -4,
  urlPattern: null,
  triggerType: "external",
  triggerSelector: null,
  isRepeatable: true,
  themeConfig: null,
  transitionPreset: "smooth",
  steps: [
    {
      id: -30,
      order: 0,
      title: "Your API Key",
      content:
        "Copy this API key — you'll need it to connect the SDK to your website.",
      targetSelector: "[data-onboarding='api-key']",
      placement: "bottom",
      transitionPreset: null,
    },
    {
      id: -31,
      order: 1,
      title: "Install the SDK",
      content:
        "Add this snippet to your website. You can use the CDN script tag or install via npm.",
      targetSelector: "[data-onboarding='install-snippet']",
      placement: "bottom",
      transitionPreset: null,
    },
    {
      id: -32,
      order: 2,
      title: "Verify Connection",
      content:
        "Once you've added the SDK, click 'Verify' to confirm it's working. You can also skip this and verify later.",
      targetSelector: "[data-onboarding='verify-button']",
      placement: "top",
      transitionPreset: null,
    },
  ],
};

export const publishTour: OnboardingTour = {
  tourId: ONBOARDING_TOUR_IDS.PUBLISH,
  tourName: "Publish & Celebrate",
  versionId: -5,
  urlPattern: null,
  triggerType: "external",
  triggerSelector: null,
  isRepeatable: true,
  themeConfig: null,
  transitionPreset: "smooth",
  steps: [
    {
      id: -40,
      order: 0,
      title: "Time to Go Live!",
      content:
        "Click Publish to make your tour live on your website. Your users will see it on their next visit.",
      targetSelector: "[data-onboarding='publish-button']",
      placement: "bottom",
      transitionPreset: null,
    },
  ],
};

export const allOnboardingTours = [
  orientationTour,
  createAppTour,
  buildTourTour,
  installSdkTour,
  publishTour,
];
