import { Dimensions } from "react-native";

const baseDesignScreenSize = 390;
const { width } = Dimensions.get("window");

export default function responsive(baseDesignElementSize: number): number {
  const screenRatio = width / baseDesignScreenSize;
  return baseDesignElementSize * screenRatio;
}

