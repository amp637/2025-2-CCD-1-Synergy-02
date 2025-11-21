import { Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const BASE_WIDTH = 360;

export const scale = (size: number) => {
  const ratio = width / BASE_WIDTH;
  const safeRatio = Math.min(ratio, 1); // 360 이상에서는 커지지 않음
  return size * safeRatio;
};
