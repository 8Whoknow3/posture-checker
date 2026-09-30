import { useEffect, type ReactNode } from "react";
import { useApp } from "../state/AppContext";
import type { RoutePath } from "../state/useHashRoute";
import { DevMockPanel } from "./DevMockPanel";
import { Icon, type IconName } from "./Icon";
import { PawMark } from "./PawMark";
import { ThemeToggle } from "./ThemeToggle";

const NAV: Array<{
  label: string;
  to: RoutePath;
  icon: IconName;
  match: RoutePath[];
}> = [
  { label: "خانه", to: "/", icon: "home", match: ["/"] },
  {
    label: "تحلیل",
    to: "/analyze",
    icon: "image",
    match: ["/analyze", "/capture", "/result"],
  },
  { label: "زنده", to: "/live", icon: "live", match: ["/live"] },
  { label: "راهنما", to: "/help", icon: "help", match: ["/help"] },
];

const TITLES: Record<RoutePath, string> = {
  "/": "تحلیل وضعیت نشستن با دوربین",
  "/analyze": "آپلود تصویر",
  "/capture": "عکس از وبکم",
  "/live": "تحلیل زنده",
  "/result": "نتیجه",
  "/help": "راهنما",
};

export function AppShell({
  route,
  children,
}: {
  route: RoutePath;
  children: ReactNode;
}) {
  const { services } = useApp();

  useEffect(() => {
    document.title = `${TITLES[route]} | PAW`;
  }, [route]);

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        پرش به محتوای اصلی
      </a>

      {/* Sidebar on desktop; brand strip on top + tab bar at the bottom on phones. */}
      <aside className="sidebar">
        <a className="brand" href="#/" aria-label="PAW — خانه">
          <PawMark size={36} />
          <span className="brand__name">PAW</span>
        </a>
        <nav className="nav" aria-label="ناوبری اصلی">
          <ul className="nav__list">
            {NAV.map((item) => (
              <li key={item.to}>
                <a
                  className="nav__link"
                  href={`#${item.to}`}
                  aria-current={item.match.includes(route) ? "page" : undefined}
                >
                  <Icon name={item.icon} size={22} />
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <ThemeToggle />
      </aside>

      <div className="content">
        <main id="main" className="main" tabIndex={-1}>
          {children}
        </main>

        <footer className="footer">
          <div className="footer__inner">
            <p className="footer__project" dir="ltr" lang="en">
              Posture Checker — Design and Implementation of a Sitting Posture
              Detection and Assessment System Using Computer Vision
            </p>
            {services.isMock && <DevMockPanel />}
          </div>
        </footer>
      </div>
    </div>
  );
}
