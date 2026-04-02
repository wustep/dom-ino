export type SceneElementType =
  | "heading"
  | "paragraph"
  | "button"
  | "card"
  | "image"
  | "badge"
  | "container"
  | "divider"
  | "link"
  | "input"
  | "list";

export interface SceneRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScenePoint {
  x: number;
  y: number;
}

export interface SceneElement {
  id: string;
  type: SceneElementType;
  rect: SceneRect;
  throwable: boolean;
  pinned: boolean;

  text?: string;
  fontSize?: number;
  fontWeight?: number;
  fontStyle?: "normal" | "italic" | "oblique";
  fontFamily?: string;
  lineHeight?: number;
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
  padding?: number;
  paddingVertical?: number;
  border?: string;
  imageSrc?: string;
  imageAlt?: string;
  opacity?: number;
  boxShadow?: string;
  /** e.g. blur(12px) for frosted cards over gradients */
  backdropFilter?: string;
  children?: SceneElement[];
  textAlign?: string;
  letterSpacing?: string;
  href?: string;
  zIndex?: number;
  gap?: number;
  allowWordBreaks?: boolean;
  minSegmentWidth?: number;
  /** ID of another paragraph element whose text this one continues from */
  textContinuationId?: string;
  physicsEnabled?: boolean;
  affectsTextFlow?: boolean;

  mass?: number;
  physicsShape?: "rectangle" | "circle" | "polygon";
  polygonPoints?: ScenePoint[];
  lockRotation?: boolean;
  initialVelocityX?: number;
  initialVelocityY?: number;
  friction?: number;
  frictionAir?: number;
  restitution?: number;
}

export interface SceneDescription {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
  elements: SceneElement[];
}

export interface ObstacleRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  borderRadius?: number;
  physicsShape?: "rectangle" | "circle" | "polygon";
  polygonPoints?: ScenePoint[];
}

export interface BlockedInterval {
  left: number;
  right: number;
}

export interface AvailableSegment {
  left: number;
  width: number;
}

export interface SavedElement {
  element: SceneElement;
  savedAt: number;
  sourceScene: string;
}

