import 'react-native-get-random-values';
import { v7 as uuidv7 } from 'uuid';

export const generateId = (): string => {
  return uuidv7();
};
