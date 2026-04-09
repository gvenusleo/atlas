"use client";

import { usePathname } from "next/navigation";
import {
  type TransitionEvent as ReactTransitionEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    description: string;
    title: string;
  }
> = {
  login: {
    title: "Atlas",
    description: "使用邮箱和密码继续进入你的工作台",
  },
  register: {
    title: "Atlas",
    description: "创建账号后立即开始记录和整理你的 Markdown 文档",
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

  const copy = modeCopy[selectedMode];

  return (
    <div className="auth-card-shell">
      <Card className="w-full gap-0">
        <CardHeader className="gap-3 pb-2">
          <div className="space-y-3">
            <CardTitle className="text-3xl sm:text-4xl">{copy.title}</CardTitle>
            <CardDescription className="max-w-sm text-sm leading-6">
              {copy.description}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-1">
          <Tabs
            className="w-full"
            onValueChange={(value) => selectMode(parseAuthMode(String(value)))}
            value={selectedMode}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">登录</TabsTrigger>
              <TabsTrigger value="register">注册</TabsTrigger>
            </TabsList>
            <TabsContent className="mt-6" value={selectedMode}>
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
