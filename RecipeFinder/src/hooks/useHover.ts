
import { useState, useMemo } from 'react';
import { Platform } from 'react-native';

export const useHover = () => {
  if (Platform.OS !== 'web') {
    return { hoverProps: {}, isHovered: false };
  }

  const [isHovered, setIsHovered] = useState(false);

  const hoverProps = useMemo(() => ({
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
    // @ts-ignore-next-line
    style: { cursor: 'pointer' },
  }), []);

  return { hoverProps, isHovered };
};
