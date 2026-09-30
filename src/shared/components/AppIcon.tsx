import React from 'react';
import Svg, { Path, Circle, Rect, Polyline, Line } from 'react-native-svg';

export type IconName =
  | 'camera'
  | 'sparkles'
  | 'settings'
  | 'trash'
  | 'arrow-left'
  | 'search'
  | 'close'
  | 'clock'
  | 'globe'
  | 'wifi'
  | 'user'
  | 'credit-card'
  | 'file-text'
  | 'share'
  | 'copy'
  | 'download'
  | 'flashlight'
  | 'flashlight-off'
  | 'check'
  | 'palette'
  | 'warning'
  | 'history'
  | 'sun'
  | 'moon'
  | 'smartphone'
  | 'shield'
  | 'star'
  | 'chevron-right'
  | 'image';

interface AppIconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const AppIcon: React.FC<AppIconProps> = ({
  name,
  size = 24,
  color = '#FFFFFF',
  strokeWidth = 2,
}) => {
  const commonProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'camera':
      return (
        <Svg {...commonProps}>
          <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <Circle cx="12" cy="13" r="4" />
        </Svg>
      );

    case 'sparkles':
      return (
        <Svg {...commonProps}>
          <Path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
          <Path d="M5 3v4" />
          <Path d="M19 17v4" />
          <Path d="M3 5h4" />
          <Path d="M17 19h4" />
        </Svg>
      );

    case 'settings':
      return (
        <Svg {...commonProps}>
          <Circle cx="12" cy="12" r="3" />
          <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </Svg>
      );

    case 'trash':
      return (
        <Svg {...commonProps}>
          <Polyline points="3 6 5 6 21 6" />
          <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <Line x1="10" y1="11" x2="10" y2="17" />
          <Line x1="14" y1="11" x2="14" y2="17" />
        </Svg>
      );

    case 'arrow-left':
      return (
        <Svg {...commonProps}>
          <Line x1="19" y1="12" x2="5" y2="12" />
          <Polyline points="12 19 5 12 12 5" />
        </Svg>
      );

    case 'search':
      return (
        <Svg {...commonProps}>
          <Circle cx="11" cy="11" r="8" />
          <Line x1="21" y1="21" x2="16.65" y2="16.65" />
        </Svg>
      );

    case 'close':
      return (
        <Svg {...commonProps}>
          <Line x1="18" y1="6" x2="6" y2="18" />
          <Line x1="6" y1="6" x2="18" y2="18" />
        </Svg>
      );

    case 'clock':
      return (
        <Svg {...commonProps}>
          <Circle cx="12" cy="12" r="10" />
          <Polyline points="12 6 12 12 16 14" />
        </Svg>
      );

    case 'globe':
      return (
        <Svg {...commonProps}>
          <Circle cx="12" cy="12" r="10" />
          <Line x1="2" y1="12" x2="22" y2="12" />
          <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </Svg>
      );

    case 'wifi':
      return (
        <Svg {...commonProps}>
          <Path d="M5 12.55a11 11 0 0 1 14.08 0" />
          <Path d="M1.42 9a16 16 0 0 1 21.16 0" />
          <Path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <Line x1="12" y1="20" x2="12.01" y2="20" strokeWidth={strokeWidth + 1} />
        </Svg>
      );

    case 'user':
      return (
        <Svg {...commonProps}>
          <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <Circle cx="12" cy="7" r="4" />
        </Svg>
      );

    case 'credit-card':
      return (
        <Svg {...commonProps}>
          <Rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <Line x1="1" y1="10" x2="23" y2="10" />
        </Svg>
      );

    case 'file-text':
      return (
        <Svg {...commonProps}>
          <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <Polyline points="14 2 14 8 20 8" />
          <Line x1="16" y1="13" x2="8" y2="13" />
          <Line x1="16" y1="17" x2="8" y2="17" />
          <Line x1="10" y1="9" x2="8" y2="9" />
        </Svg>
      );

    case 'share':
      return (
        <Svg {...commonProps}>
          <Circle cx="18" cy="5" r="3" />
          <Circle cx="6" cy="12" r="3" />
          <Circle cx="18" cy="19" r="3" />
          <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <Line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </Svg>
      );

    case 'copy':
      return (
        <Svg {...commonProps}>
          <Rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </Svg>
      );

    case 'download':
      return (
        <Svg {...commonProps}>
          <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <Polyline points="7 10 12 15 17 10" />
          <Line x1="12" y1="15" x2="12" y2="3" />
        </Svg>
      );

    case 'flashlight':
      return (
        <Svg {...commonProps}>
          <Path d="M18 6c0 2-2 4-2 6v8a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-8c0-2-2-4-2-6V2h12v4Z" />
          <Line x1="6" y1="6" x2="18" y2="6" />
          <Line x1="12" y1="12" x2="12" y2="12.01" strokeWidth={strokeWidth + 1} />
        </Svg>
      );

    case 'flashlight-off':
      return (
        <Svg {...commonProps}>
          <Path d="M16 16v4a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-8c0-2-2-4-2-6V2h7" />
          <Path d="M18 6V2h-3" />
          <Line x1="2" y1="2" x2="22" y2="22" />
        </Svg>
      );

    case 'check':
      return (
        <Svg {...commonProps}>
          <Polyline points="20 6 9 17 4 12" />
        </Svg>
      );

    case 'palette':
      return (
        <Svg {...commonProps}>
          <Circle cx="13.5" cy="6.5" r=".5" fill={color} />
          <Circle cx="17.5" cy="10.5" r=".5" fill={color} />
          <Circle cx="8.5" cy="7.5" r=".5" fill={color} />
          <Circle cx="6.5" cy="12.5" r=".5" fill={color} />
          <Path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
        </Svg>
      );

    case 'warning':
      return (
        <Svg {...commonProps}>
          <Path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <Line x1="12" y1="9" x2="12" y2="13" />
          <Line x1="12" y1="17" x2="12.01" y2="17" strokeWidth={strokeWidth + 1} />
        </Svg>
      );

    case 'history':
      return (
        <Svg {...commonProps}>
          <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <Path d="M3 3v5h5" />
          <Polyline points="12 7 12 12 15 15" />
        </Svg>
      );

    case 'sun':
      return (
        <Svg {...commonProps}>
          <Circle cx="12" cy="12" r="5" />
          <Line x1="12" y1="1" x2="12" y2="3" />
          <Line x1="12" y1="21" x2="12" y2="23" />
          <Line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <Line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <Line x1="1" y1="12" x2="3" y2="12" />
          <Line x1="21" y1="12" x2="23" y2="12" />
          <Line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <Line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </Svg>
      );

    case 'moon':
      return (
        <Svg {...commonProps}>
          <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </Svg>
      );

    case 'smartphone':
      return (
        <Svg {...commonProps}>
          <Rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <Line x1="12" y1="18" x2="12.01" y2="18" strokeWidth={strokeWidth + 1} />
        </Svg>
      );

    case 'shield':
      return (
        <Svg {...commonProps}>
          <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </Svg>
      );

    case 'star':
      return (
        <Svg {...commonProps}>
          <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </Svg>
      );

    case 'chevron-right':
      return (
        <Svg {...commonProps}>
          <Polyline points="9 18 15 12 9 6" />
        </Svg>
      );

    case 'image':
      return (
        <Svg {...commonProps}>
          <Rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <Circle cx="8.5" cy="8.5" r="1.5" />
          <Polyline points="21 15 16 10 5 21" />
        </Svg>
      );

    default:
      return null;
  }
};
