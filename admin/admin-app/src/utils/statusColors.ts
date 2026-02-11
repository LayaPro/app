/**
 * Get color for event delivery status based on step progression
 * Uses a vibrant color progression from purple -> blue -> cyan -> orange -> green
 */
export const getStatusColor = (step: number, totalSteps: number): string => {
  if (totalSteps <= 1) return 'rgb(147, 51, 234)'; // Purple for single step
  
  // Normalize step (0 to 1)
  const progress = (step - 1) / (totalSteps - 1);
  
  // Define vibrant color stops for eye-catching progression
  const colorStops = [
    { pos: 0.0, r: 147, g: 51, b: 234 },   // Purple
    { pos: 0.25, r: 59, g: 130, b: 246 },  // Bright Blue
    { pos: 0.5, r: 6, g: 182, b: 212 },    // Cyan
    { pos: 0.75, r: 251, g: 146, b: 60 },  // Orange
    { pos: 1.0, r: 34, g: 197, b: 94 }     // Green
  ];
  
  // Find the two color stops to interpolate between
  let startStop = colorStops[0];
  let endStop = colorStops[colorStops.length - 1];
  
  for (let i = 0; i < colorStops.length - 1; i++) {
    if (progress >= colorStops[i].pos && progress <= colorStops[i + 1].pos) {
      startStop = colorStops[i];
      endStop = colorStops[i + 1];
      break;
    }
  }
  
  // Calculate local progress between the two stops
  const localProgress = (progress - startStop.pos) / (endStop.pos - startStop.pos);
  
  // Interpolate between the two colors
  const r = Math.round(startStop.r + (endStop.r - startStop.r) * localProgress);
  const g = Math.round(startStop.g + (endStop.g - startStop.g) * localProgress);
  const b = Math.round(startStop.b + (endStop.b - startStop.b) * localProgress);
  
  return `rgb(${r}, ${g}, ${b})`;
};

/**
 * Get background color with opacity for status badges
 */
export const getStatusBgColor = (step: number, totalSteps: number): string => {
  const color = getStatusColor(step, totalSteps);
  // Convert rgb to rgba with 0.1 opacity
  return color.replace('rgb', 'rgba').replace(')', ', 0.1)');
};
