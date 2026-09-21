const ONBOARDING_KEY = "investor_onboarding_complete";
const DARK_KEY = "investor_dark_mode";
const GOAL_KEY = "investor_goal";
const RISK_KEY = "investor_risk";

export function isOnboardingComplete(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(ONBOARDING_KEY) === "1";
}

export function completeOnboarding(): void {
  localStorage.setItem(ONBOARDING_KEY, "1");
}

export function resetOnboarding(): void {
  localStorage.removeItem(ONBOARDING_KEY);
}

export function getDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DARK_KEY) === "1";
}

export function setDarkMode(on: boolean): void {
  localStorage.setItem(DARK_KEY, on ? "1" : "0");
  document.body.classList.toggle("dark", on);
}

export function saveOnboardingChoices(goal: string, risk: string): void {
  localStorage.setItem(GOAL_KEY, goal);
  localStorage.setItem(RISK_KEY, risk);
}

export function getOnboardingChoices(): { goal: string; risk: string } {
  if (typeof window === "undefined") {
    return { goal: "emeklilik", risk: "dengeli" };
  }
  return {
    goal: localStorage.getItem(GOAL_KEY) || "emeklilik",
    risk: localStorage.getItem(RISK_KEY) || "dengeli",
  };
}
