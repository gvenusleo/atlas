"use client";

import {
  forwardRef,
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useRef,
} from "react";

export type VditorEditorHandle = {
  focus: () => void;
  getValue: () => string;
  renderOutline: (target: HTMLElement) => void;
  setValue: (value: string) => void;
};

type VditorEditorProps = {
  onBlur?: (value: string) => void;
  onChange?: (value: string) => void;
  onReady?: () => void;
  value: string;
};

type VditorInstance = {
  blur: () => void;
  destroy: () => void;
  focus: () => void;
  getCurrentMode: () => "ir" | "sv" | "wysiwyg";
  getValue: () => string;
  setValue: (value: string, clearStack?: boolean) => void;
  vditor: {
    currentMode: "ir" | "sv" | "wysiwyg";
    ir: {
      element: HTMLElement;
    };
    preview: {
      element: HTMLElement;
      previewElement: HTMLElement;
    };
    sv: {
      element: HTMLElement;
    };
    wysiwyg: {
      element: HTMLElement;
    };
  };
};

type VditorClass = {
  new (
    id: string | HTMLElement,
    options?: Record<string, unknown>,
  ): VditorInstance;
  outlineRender: (
    contentElement: HTMLElement,
    targetElement: HTMLElement,
    vditor: VditorInstance["vditor"],
  ) => void;
};

export const VditorEditor = forwardRef<VditorEditorHandle, VditorEditorProps>(
  function VditorEditor({ onBlur, onChange, onReady, value }, ref) {
    const hostRef = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<VditorInstance | null>(null);
    const vditorClassRef = useRef<VditorClass | null>(null);
    const initialValueRef = useRef(value);

    const handleChange = useEffectEvent((nextValue: string) => {
      onChange?.(nextValue);
    });

    const handleBlur = useEffectEvent((nextValue: string) => {
      onBlur?.(nextValue);
    });

    const handleReady = useEffectEvent(() => {
      onReady?.();
    });

    useImperativeHandle(ref, () => ({
      focus() {
        instanceRef.current?.focus();
      },
      getValue() {
        return instanceRef.current?.getValue() ?? "";
      },
      renderOutline(target: HTMLElement) {
        const instance = instanceRef.current;
        const Vditor = vditorClassRef.current;

        if (!instance || !Vditor) {
          target.innerHTML = "";
          return;
        }

        const contentElement =
          instance.vditor.preview.element.style.display === "block"
            ? instance.vditor.preview.previewElement
            : instance.vditor[instance.getCurrentMode()].element;

        Vditor.outlineRender(contentElement, target, instance.vditor);
      },
      setValue(nextValue: string) {
        const instance = instanceRef.current;

        if (!instance || instance.getValue() === nextValue) {
          return;
        }

        instance.setValue(nextValue);
      },
    }));

    useEffect(() => {
      let isDisposed = false;
      let currentInstance: VditorInstance | null = null;

      void (async () => {
        const module = await import("vditor");

        if (isDisposed || !hostRef.current) {
          return;
        }

        const Vditor = module.default as unknown as VditorClass;
        vditorClassRef.current = Vditor;
        hostRef.current.innerHTML = "";

        currentInstance = new Vditor(hostRef.current, {
          cache: {
            enable: false,
          },
          height: "100%",
          lang: "zh_CN",
          minHeight: 420,
          mode: "ir",
          outline: {
            enable: false,
            position: "right",
          },
          placeholder: "从这里开始写作",
          preview: {
            markdown: {
              autoSpace: true,
              codeBlockPreview: true,
              fixTermTypo: true,
              footnotes: true,
              gfmAutoLink: true,
              mathBlockPreview: true,
              toc: true,
            },
            math: {
              engine: "KaTeX",
              inlineDigit: true,
            },
          },
          toolbar: [
            "headings",
            "bold",
            "italic",
            "strike",
            "link",
            "|",
            "list",
            "ordered-list",
            "check",
            "quote",
            "code",
            "inline-code",
            "table",
            "|",
            "undo",
            "redo",
            "|",
            "fullscreen",
          ],
          toolbarConfig: {
            pin: true,
          },
          undoDelay: 800,
          value: initialValueRef.current,
          after() {
            instanceRef.current = currentInstance;
            handleReady();
          },
          blur(nextValue: string) {
            handleBlur(nextValue);
          },
          input(nextValue: string) {
            handleChange(nextValue);
          },
        });
      })();

      return () => {
        isDisposed = true;
        currentInstance?.destroy();
        instanceRef.current = null;
      };
    }, [handleBlur, handleChange, handleReady]);

    useEffect(() => {
      const instance = instanceRef.current;

      if (!instance || instance.getValue() === value) {
        return;
      }

      instance.setValue(value);
    }, [value]);

    return (
      <div ref={hostRef} className="atlas-vditor-host min-h-[560px] w-full" />
    );
  },
);
