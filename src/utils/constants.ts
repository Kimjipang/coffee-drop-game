// Physics
export const GRAVITY = 30;
export const RESTITUTION = 0.5;
export const FRICTION = 0.98;
export const CHARACTER_RADIUS = 0.5;
export const MAX_VELOCITY = 60;

// Course dimensions
export const COURSE_WIDTH = 20;
export const COURSE_DEPTH = 4;
export const COURSE_HEIGHT = 120;
export const START_Y = 55;
export const FINISH_Y = -55;

// Sections (Y positions, top to bottom)
export const SECTION_PEGS_TOP = 45;
export const SECTION_PEGS_BOTTOM = 25;
export const SECTION_SPINNERS_TOP = 25;
export const SECTION_SPINNERS_BOTTOM = 5;
export const SECTION_PLATFORMS_TOP = 5;
export const SECTION_PLATFORMS_BOTTOM = -15;
export const SECTION_FUNNEL_TOP = -15;
export const SECTION_FUNNEL_BOTTOM = -35;
export const SECTION_FINAL_TOP = -35;
export const SECTION_FINAL_BOTTOM = -50;

// Slow motion
export const SLOW_MOTION_SCALE = 0.25;
export const SLOW_MOTION_LERP = 0.05;

// Trail
export const TRAIL_LENGTH = 12;
export const TRAIL_OPACITY = 0.4;

// Camera
export const THIRD_PERSON_OFFSET_Y = 4;
export const THIRD_PERSON_OFFSET_Z = 8;
export const FIRST_PERSON_OFFSET_Y = 1.5;
export const CAMERA_LERP = 0.06;
export const SIDE_VIEW_SIZE = 65;

// Stuck detection (uses real time, suppressed during slow motion)
export const STUCK_CHECK_INTERVAL = 0.5;
export const STUCK_THRESHOLD_DIST = 0.3;
export const STUCK_GENTLE_TIME = 1.0;
export const STUCK_FORCE_TIME = 2.0;
export const STUCK_NUDGE_FORCE = 8;
export const STUCK_PUSH_FORCE = 25;

// Improved platform gap-seek
export const PLATFORM_GAP_SEEK_FORCE = 0.45;

// Breakout mode: 5초 갇힘 시 플랫폼 충돌 무시 + 강한 하향 속도
export const STUCK_BREAKOUT_TIME = 5.0;
export const BREAKOUT_DURATION = 2.0;
export const BREAKOUT_VELOCITY_Y = -45;

// Launcher
export const LAUNCHER_RADIUS = 1.0;
