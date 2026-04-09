import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function createIcon(path: ReactNode, viewBox = "0 0 24 24") {
  return function Icon(props: IconProps) {
    return (
      <svg
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox={viewBox}
        {...props}
      >
        {path}
      </svg>
    );
  };
}

export const ChevronDownIcon = createIcon(<path d="m6 9 6 6 6-6" />);

export const ChevronRightIcon = createIcon(<path d="m9 6 6 6-6 6" />);

export const FileIcon = createIcon(
  <>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
  </>,
);

export const FolderIcon = createIcon(
  <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v8A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5z" />,
);

export const HistoryIcon = createIcon(
  <>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
  </>,
);

export const MenuIcon = createIcon(
  <>
    <path d="M4 7h16" />
    <path d="M4 12h16" />
    <path d="M4 17h16" />
  </>,
);

export const MoreHorizontalIcon = createIcon(
  <>
    <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" />
  </>,
);

export const PanelRightIcon = createIcon(
  <>
    <rect height="18" rx="2" width="18" x="3" y="3" />
    <path d="M15 3v18" />
  </>,
);

export const PlusIcon = createIcon(
  <>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </>,
);

export const RefreshIcon = createIcon(
  <>
    <path d="M20 11a8 8 0 0 0-14.9-3" />
    <path d="M4 4v5h5" />
    <path d="M4 13a8 8 0 0 0 14.9 3" />
    <path d="M20 20v-5h-5" />
  </>,
);

export const SearchIcon = createIcon(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </>,
);

export const SignOutIcon = createIcon(
  <>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </>,
);

export const StructureIcon = createIcon(
  <>
    <path d="M9 6H5v4h4z" />
    <path d="M19 6h-4v4h4z" />
    <path d="M14 14H10v4h4z" />
    <path d="M7 10v2a2 2 0 0 0 2 2h1" />
    <path d="M17 10v2a2 2 0 0 1-2 2h-1" />
  </>,
);
