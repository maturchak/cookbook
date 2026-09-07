import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { Restaurant } from '@mui/icons-material';

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  height?: number | string;
  sx?: Record<string, unknown>;
}

export const PLACEHOLDER_IMAGE = '/placeholder-food.svg';

/**
 * Картинка с обработкой битой/недоступной ссылки:
 * вместо «сломанной» иконки браузера показывает аккуратную заглушку.
 */
export default function ImageWithFallback({
  src,
  alt,
  height = 200,
  sx,
}: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <Box
        role="img"
        aria-label={alt}
        sx={{
          height,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          bgcolor: 'action.hover',
          color: 'text.secondary',
          borderRadius: 'inherit',
          ...sx,
        }}
      >
        <Restaurant fontSize="large" />
        <Typography variant="caption">Нет фото</Typography>
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      sx={{
        display: 'block',
        width: '100%',
        height,
        objectFit: 'cover',
        bgcolor: 'action.hover',
        ...sx,
      }}
    />
  );
}
