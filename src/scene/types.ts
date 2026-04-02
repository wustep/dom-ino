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

/** Typography properties for text-bearing elements. */
export interface TextStyle {
  text?: string;
  fontSize?: number;
  fontWeight?: number;
  fontStyle?: "normal" | "italic" | "oblique";
  fontFamily?: string;
  lineHeight?: number;
  color?: string;
  textAlign?: string;
  letterSpacing?: string;
  allowWordBreaks?: boolean;
  minSegmentWidth?: number;
  /** ID of another paragraph element whose text this one continues from */
  textContinuationId?: string;
}

/** Visual/box-model properties that control appearance. */
export interface VisualStyle {
  backgroundColor?: string;
  borderRadius?: number;
  padding?: number;
  paddingVertical?: number;
  border?: string;
  opacity?: number;
  boxShadow?: string;
  /** e.g. blur(12px) for frosted cards over gradients */
  backdropFilter?: string;
  zIndex?: number;
}

/** Matter.js physics simulation properties. */
export interface PhysicsProperties {
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

export interface SceneElement extends TextStyle, VisualStyle, PhysicsProperties {
  id: string;
  type: SceneElementType;
  rect: SceneRect;
  throwable: boolean;
  pinned: boolean;

  imageSrc?: string;
  imageAlt?: string;
  children?: SceneElement[];
  href?: string;
  gap?: number;
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

