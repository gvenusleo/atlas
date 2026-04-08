"use client";

import { Card, Tabs } from "@heroui/react";
import { usePathname } from "next/navigation";
import {
  type TransitionEvent as ReactTransitionEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { AuthMode } from "@/lib/auth/types";
import { parseAuthMode } from "@/lib/auth/types";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";

type AuthShellProps = {
  initialMode: AuthMode;
};

const modeCopy: Record<
  AuthMode,
  {
    title: string;
    description: string;
  }
> = {
  login: {
    title: "Atlas",
    description: "使用邮箱和密码登录你的账号",
  },
  register: {
    title: "Atlas",
    description: "填写以下信息以完成注册",
  },
};

function buildAuthHref(pathname: string, mode: AuthMode) {
  if (mode === "register") {
    return `${pathname}?mode=register`;
  }

  return pathname;
}

function renderModeForm(mode: AuthMode) {
  return mode === "login" ? <LoginForm /> : <RegisterForm />;
}

export default function AuthShell({ initialMode }: AuthShellProps) {
  const pathname = usePathname();
  const stageRef = useRef<HTMLDivElement>(null);
  const incomingRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotionRef = useRef(false);
  const [selectedMode, setSelectedMode] = useState<AuthMode>(initialMode);
  const [renderMode, setRenderMode] = useState<AuthMode>(initialMode);
  const [transition, setTransition] = useState<{
    from: AuthMode;
    fromHeight: number;
    to: AuthMode;
    toHeight: number | null;
  } | null>(null);

  useEffect(() => {
    setSelectedMode(initialMode);
    setRenderMode(initialMode);
    setTransition(null);
  }, [initialMode]);

  const copy = modeCopy[selectedMode];

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => {
      prefersReducedMotionRef.current = mediaQuery.matches;
    };

    syncPreference();
    mediaQuery.addEventListener("change", syncPreference);

    return () => {
      mediaQuery.removeEventListener("change", syncPreference);
    };
  }, []);

  useLayoutEffect(() => {
    if (!transition || transition.toHeight !== null) {
      return;
    }

    const nextHeight =
      incomingRef.current?.getBoundingClientRect().height ??
      transition.fromHeight;

    if (Math.abs(nextHeight - transition.fromHeight) < 1) {
      setRenderMode(transition.to);
      setTransition(null);
      return;
    }

    setTransition((current) => {
      if (!current || current.toHeight !== null) {
        return current;
      }

      return {
        ...current,
        toHeight: nextHeight,
      };
    });
  }, [transition]);

  const handleStageTransitionEnd = (
    event: ReactTransitionEvent<HTMLDivElement>,
  ) => {
    if (!transition || transition.toHeight === null) {
      return;
    }

    if (
      event.target !== event.currentTarget ||
      event.propertyName !== "height"
    ) {
      return;
    }

    setRenderMode(transition.to);
    setTransition(null);
  };

  const selectMode = (mode: AuthMode) => {
    if (mode === selectedMode || transition) {
      return;
    }

    const currentHeight = stageRef.current?.getBoundingClientRect().height ?? 0;

    window.history.replaceState({}, "", buildAuthHref(pathname, mode));
    setSelectedMode(mode);

    if (prefersReducedMotionRef.current) {
      setRenderMode(mode);
      return;
    }

    setTransition({
      from: renderMode,
      fromHeight: currentHeight,
      to: mode,
      toHeight: null,
    });
  };

  return (
    <div className="auth-card-shell">
      <Card className="w-full">
        <Card.Header className="gap-3">
          <Card.Title className="text-2xl">{copy.title}</Card.Title>
          <Card.Description>{copy.description}</Card.Description>
        </Card.Header>
        <Card.Content>
          <Tabs
            className="w-full"
            selectedKey={selectedMode}
            onSelectionChange={(key) => selectMode(parseAuthMode(String(key)))}
          >
            <Tabs.ListContainer>
              <Tabs.List aria-label="认证模式切换">
                <Tabs.Tab id="login">
                  登录
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="register">
                  注册
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
            <Tabs.Panel id={selectedMode} className="p-0">
              <div
                ref={stageRef}
                className={
                  transition
                    ? "auth-switch-stage auth-switch-stage--animating"
                    : "auth-switch-stage"
                }
                onTransitionEnd={handleStageTransitionEnd}
                style={
                  transition
                    ? {
                        height: `${transition.toHeight ?? transition.fromHeight}px`,
                      }
                    : undefined
                }
              >
                {transition ? (
                  <>
                    <div
                      className={
                        transition.toHeight === null
                          ? "auth-switch-layer auth-switch-layer--hold"
                          : "auth-switch-layer auth-switch-layer--from"
                      }
                    >
                      {renderModeForm(transition.from)}
                    </div>
                    <div
                      ref={incomingRef}
                      className={
                        transition.toHeight === null
                          ? "auth-switch-layer auth-switch-layer--measure"
                          : "auth-switch-layer auth-switch-layer--to"
                      }
                    >
                      {renderModeForm(transition.to)}
                    </div>
                  </>
                ) : (
                  <div className="auth-switch-layer">
                    {renderModeForm(renderMode)}
                  </div>
                )}
              </div>
            </Tabs.Panel>
          </Tabs>
        </Card.Content>
      </Card>
    </div>
  );
}
