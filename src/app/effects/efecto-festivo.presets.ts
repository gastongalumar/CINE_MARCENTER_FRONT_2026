import type { ISourceOptions } from '@tsparticles/engine';
import type { EfectoFestivo } from '../models/customizacion';

const BAT_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 32'%3E%3Cpath fill='%23111111' d='M32 18c-3-6-8-10-14-12 2 4 3 8 2 12-5-2-10-2-16 0 5 2 10 5 14 10 2-4 6-7 14-7s12 3 14 7c4-5 9-8 14-10-6-2-11-2-16 0-1-4 0-8 2-12-6 2-11 6-14 12z'/%3E%3C/svg%3E";

/** Copo clásico de 6 puntas */
const SNOWFLAKE_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='3' stroke-linecap='round'%3E%3Cpath d='M32 4v56M4 32h56M12 12l40 40M52 12L12 52'/%3E%3Cpath d='M32 14l-6 6m6-6l6 6M32 50l-6-6m6 6l6-6M14 32l6-6m-6 6l6 6M50 32l-6-6m6 6l-6 6M18 18l5 2m-2 5 2-5M46 18l-5 2m2 5-2-5M18 46l5-2m-2-5 2 5M46 46l-5-2m2-5-2 5'/%3E%3C/g%3E%3C/svg%3E";

const SNOWFLAKE_SVG_B =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cg fill='%23e8f4ff'%3E%3Ccircle cx='32' cy='32' r='3'/%3E%3C/g%3E%3Cg fill='none' stroke='%23e8f4ff' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='M32 6v52M8 32h48M14 14l36 36M50 14L14 50'/%3E%3Cpath d='M32 12l-5 8 5-2 5 2zM32 52l-5-8 5 2 5-2zM12 32l8-5-2 5 2 5zM52 32l-8-5 2 5-2 5z'/%3E%3C/g%3E%3C/svg%3E";

function baseOptions(fullScreen: boolean): ISourceOptions {
  return {
    fullScreen: { enable: fullScreen, zIndex: 5 },
    background: { color: { value: 'transparent' } },
    detectRetina: true,
    pauseOnBlur: true,
    fpsLimit: 60,
    interactivity: {
      detectsOn: 'window',
      events: {
        onHover: { enable: false },
        onClick: { enable: false },
        resize: { enable: true },
      },
    },
  };
}

function navidadOptions(fullScreen: boolean, densityFactor = 1): ISourceOptions {
  const count = Math.round(70 * densityFactor);
  return {
    ...baseOptions(fullScreen),
    particles: {
      number: {
        value: count,
        density: { enable: true, width: 1200, height: 800 },
      },
      color: { value: '#ffffff' },
      shape: {
        type: 'image',
        options: {
          image: [
            { src: SNOWFLAKE_SVG, width: 64, height: 64 },
            { src: SNOWFLAKE_SVG_B, width: 64, height: 64 },
          ],
        },
      },
      opacity: { value: { min: 0.55, max: 0.95 } },
      size: { value: { min: 6, max: 16 } },
      rotate: {
        value: { min: 0, max: 360 },
        animation: { enable: true, speed: 4, sync: false },
      },
      move: {
        enable: true,
        direction: 'bottom',
        speed: { min: 0.8, max: 2.4 },
        straight: false,
        random: true,
        outModes: { default: 'out' },
      },
      wobble: {
        enable: true,
        distance: 16,
        speed: { min: 3, max: 9 },
      },
    },
  };
}

function halloweenOptions(fullScreen: boolean, densityFactor = 1): ISourceOptions {
  const count = Math.round(42 * densityFactor);
  return {
    ...baseOptions(fullScreen),
    particles: {
      number: {
        value: count,
        density: { enable: true, width: 1200, height: 800 },
      },
      color: { value: ['#e67e22', '#6c3483', '#1a1a1a', '#9b59b6'] },
      shape: {
        type: ['circle', 'triangle', 'image'],
        options: {
          image: {
            src: BAT_SVG,
            width: 64,
            height: 32,
          },
        },
      },
      opacity: { value: { min: 0.5, max: 0.88 } },
      size: { value: { min: 4, max: 12 } },
      rotate: {
        value: { min: 0, max: 360 },
        animation: { enable: true, speed: 8, sync: false },
      },
      move: {
        enable: true,
        direction: 'bottom',
        speed: { min: 1, max: 2.8 },
        straight: false,
        random: true,
        outModes: { default: 'out' },
      },
    },
    emitters: {
      direction: 'none',
      rate: { quantity: 1, delay: 5.5 },
      size: { width: 100, height: 0 },
      position: { x: 50, y: 0 },
      life: { count: 0, duration: 0.12, delay: 0 },
      particles: {
        shape: {
          type: 'image',
          options: { image: { src: BAT_SVG, width: 64, height: 32 } },
        },
        size: { value: { min: 16, max: 26 } },
        move: {
          enable: true,
          speed: { min: 2, max: 4.5 },
          direction: 'bottom',
          outModes: { default: 'destroy' },
          straight: false,
          random: true,
        },
        life: { duration: { value: 5 }, count: 1 },
        opacity: { value: 0.88 },
      },
    },
  };
}

function anoNuevoOptions(fullScreen: boolean, densityFactor = 1): ISourceOptions {
  const count = Math.round(48 * densityFactor);
  return {
    ...baseOptions(fullScreen),
    particles: {
      number: {
        value: count,
        density: { enable: true, width: 1200, height: 800 },
      },
      color: {
        value: ['#f5c518', '#00e5ff', '#ff5c8a', '#ffffff', '#ffe066'],
      },
      shape: { type: ['square', 'circle', 'star'] },
      opacity: { value: { min: 0.5, max: 0.9 } },
      size: { value: { min: 2.5, max: 7 } },
      rotate: {
        value: { min: 0, max: 360 },
        animation: { enable: true, speed: 6, sync: false },
      },
      move: {
        enable: true,
        direction: 'bottom',
        // Sin gravedad: evita que con el tiempo se aceleren sin tope y arruinen el efecto
        speed: { min: 0.55, max: 1.6 },
        straight: false,
        random: true,
        outModes: { default: 'out' },
      },
    },
    emitters: [
      {
        direction: 'none',
        life: { count: 0, duration: 0.1, delay: 0 },
        rate: { delay: 9, quantity: 1 },
        size: { width: 0, height: 0 },
        position: { x: 25, y: 75 },
        particles: fireworkBurst(),
      },
      {
        direction: 'none',
        life: { count: 0, duration: 0.1, delay: 0 },
        rate: { delay: 12, quantity: 1 },
        size: { width: 0, height: 0 },
        position: { x: 72, y: 70 },
        particles: fireworkBurst(),
      },
    ],
  };
}

function fireworkBurst(): NonNullable<ISourceOptions['particles']> {
  return {
    color: { value: ['#f5c518', '#00e5ff', '#ff5c8a', '#ffffff'] },
    shape: { type: ['circle', 'star'] },
    opacity: {
      value: { min: 0.35, max: 1 },
      animation: {
        enable: true,
        speed: 1.2,
        sync: false,
        startValue: 'max',
        destroy: 'min',
      },
    },
    size: { value: { min: 2, max: 4 } },
    life: { duration: { value: 1.2 }, count: 1 },
    number: { value: 12 },
    move: {
      enable: true,
      speed: { min: 1.8, max: 4.5 },
      decay: 0.08,
      direction: 'none',
      outModes: { default: 'destroy' },
      // maxSpeed bajo: la gravedad no puede disparar la velocidad con el tiempo
      gravity: { enable: true, acceleration: 0.85, maxSpeed: 3.5 },
      random: true,
      straight: false,
    },
  };
}

export function optionsParaEfecto(
  efecto: Exclude<EfectoFestivo, 'ninguno'>,
  fullScreen = true
): ISourceOptions {
  switch (efecto) {
    case 'navidad':
      return navidadOptions(fullScreen, 1);
    case 'halloween':
      return halloweenOptions(fullScreen, 1);
    case 'ano-nuevo':
      return anoNuevoOptions(fullScreen, 1);
  }
}

export function optionsParaPreview(efecto: Exclude<EfectoFestivo, 'ninguno'>): ISourceOptions {
  switch (efecto) {
    case 'navidad':
      return navidadOptions(false, 0.4);
    case 'halloween':
      return halloweenOptions(false, 0.5);
    case 'ano-nuevo':
      return anoNuevoOptions(false, 0.35);
  }
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
