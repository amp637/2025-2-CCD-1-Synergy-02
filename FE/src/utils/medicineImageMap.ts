/**
 * 약품 이미지 경로 매핑
 * mdno(약품 ID)를 기반으로 pillimages 폴더의 이미지를 로드
 */

// mdno -> 이미지 경로 매핑 (1.png ~ 65.png)
const medicineImageMap: { [key: number]: any } = {
  1: require('../../assets/images/pillimages/1.png'),
  2: require('../../assets/images/pillimages/2.png'),
  3: require('../../assets/images/pillimages/3.png'),
  4: require('../../assets/images/pillimages/4.png'),
  5: require('../../assets/images/pillimages/5.png'),
  6: require('../../assets/images/pillimages/6.png'),
  7: require('../../assets/images/pillimages/7.png'),
  8: require('../../assets/images/pillimages/8.png'),
  9: require('../../assets/images/pillimages/9.png'),
  10: require('../../assets/images/pillimages/10.png'),
  11: require('../../assets/images/pillimages/11.png'),
  12: require('../../assets/images/pillimages/12.png'),
  13: require('../../assets/images/pillimages/13.png'),
  14: require('../../assets/images/pillimages/14.png'),
  15: require('../../assets/images/pillimages/15.png'),
  16: require('../../assets/images/pillimages/16.png'),
  17: require('../../assets/images/pillimages/17.png'),
  18: require('../../assets/images/pillimages/18.png'),
  19: require('../../assets/images/pillimages/19.png'),
  20: require('../../assets/images/pillimages/20.png'),
  21: require('../../assets/images/pillimages/21.png'),
  22: require('../../assets/images/pillimages/22.png'),
  23: require('../../assets/images/pillimages/23.png'),
  24: require('../../assets/images/pillimages/24.png'),
  25: require('../../assets/images/pillimages/25.png'),
  26: require('../../assets/images/pillimages/26.png'),
  27: require('../../assets/images/pillimages/27.png'),
  28: require('../../assets/images/pillimages/28.png'),
  29: require('../../assets/images/pillimages/29.png'),
  30: require('../../assets/images/pillimages/30.png'),
  31: require('../../assets/images/pillimages/31.png'),
  32: require('../../assets/images/pillimages/32.png'),
  33: require('../../assets/images/pillimages/33.png'),
  34: require('../../assets/images/pillimages/34.png'),
  35: require('../../assets/images/pillimages/35.png'),
  36: require('../../assets/images/pillimages/36.png'),
  37: require('../../assets/images/pillimages/37.png'),
  38: require('../../assets/images/pillimages/38.png'),
  39: require('../../assets/images/pillimages/39.png'),
  40: require('../../assets/images/pillimages/40.png'),
  41: require('../../assets/images/pillimages/41.png'),
  42: require('../../assets/images/pillimages/42.png'),
  43: require('../../assets/images/pillimages/43.png'),
  44: require('../../assets/images/pillimages/44.png'),
  45: require('../../assets/images/pillimages/45.png'),
  46: require('../../assets/images/pillimages/46.png'),
  47: require('../../assets/images/pillimages/47.png'),
  48: require('../../assets/images/pillimages/48.png'),
  49: require('../../assets/images/pillimages/49.png'),
  50: require('../../assets/images/pillimages/50.png'),
  51: require('../../assets/images/pillimages/51.png'),
  52: require('../../assets/images/pillimages/52.png'),
  53: require('../../assets/images/pillimages/53.png'),
  54: require('../../assets/images/pillimages/54.png'),
  55: require('../../assets/images/pillimages/55.png'),
  56: require('../../assets/images/pillimages/56.png'),
  57: require('../../assets/images/pillimages/57.png'),
  58: require('../../assets/images/pillimages/58.png'),
  59: require('../../assets/images/pillimages/59.png'),
  60: require('../../assets/images/pillimages/60.png'),
  61: require('../../assets/images/pillimages/61.png'),
  62: require('../../assets/images/pillimages/62.png'),
  63: require('../../assets/images/pillimages/63.png'),
  64: require('../../assets/images/pillimages/64.png'),
  65: require('../../assets/images/pillimages/65.png'),
};

/**
 * 약품 이미지 소스 가져오기 (mdno 기반)
 * @param mdno 약품 ID (mdno)
 * @returns require()로 로드할 이미지 소스 또는 기본 이미지
 */
export const getMedicineImageSource = (mdno: number | null | undefined): any => {
  // mdno가 없으면 기본 이미지 반환
  if (!mdno || mdno <= 0) {
    return require('../../assets/images/PillImage.png');
  }
  
  // 매핑된 이미지가 있으면 반환
  if (medicineImageMap[mdno]) {
    return medicineImageMap[mdno];
  }
  
  // 매핑되지 않은 경우 기본 이미지 반환
  return require('../../assets/images/PillImage2.png');
};

/**
 * 약품 이미지가 assets에 있는지 확인
 * @param mdno 약품 ID (mdno)
 * @returns boolean
 */
export const hasMedicineImage = (mdno: number | null | undefined): boolean => {
  if (!mdno || mdno <= 0) {
    return false;
  }
  
  return medicineImageMap[mdno] !== undefined;
};


